/* =========================================================
 * service-worker.js – Cho phép chơi offline
 * Mỗi lần sửa code, hãy TĂNG số phiên bản CACHE_NAME
 * để điện thoại tải bản mới.
 * ========================================================= */
const CACHE_NAME = 'canh-cong-v2';
const ASSETS = [
  './', './index.html', './style.css', './manifest.json',
  './js/config.js', './js/save.js', './js/player.js', './js/audio.js', './js/icons.js', './js/sprites.js', './js/art.js',
  './js/effects.js', './js/map.js', './js/gate.js', './js/combat.js', './js/enemies.js',
  './js/units.js', './js/buildings.js', './js/waves.js', './js/game.js', './js/ui.js', './js/main.js',
  './assets/fonts/AlegreyaSC-Black.woff2', './assets/fonts/AlegreyaSans-Bold.woff2', './assets/fonts/AlegreyaSans-ExtraBold.woff2',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Ưu tiên cache, không có thì tải mạng rồi lưu lại (kể cả ảnh/âm thanh thêm sau)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
    })
  );
});
