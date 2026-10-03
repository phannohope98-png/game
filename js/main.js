/* =========================================================
 * main.js – Khởi động game
 * ========================================================= */
(function () {
  function boot() {
    Save.load();
    const s = Save.data.settings;
    AudioSys.musicOn = s.music;
    AudioSys.soundOn = s.sound;
    Game.init();
    UI.init();

    // Chặn nhấn đúp để phóng to & kéo trang trên iOS
    document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
    document.addEventListener('gesturestart', e => e.preventDefault());

    // PWA: đăng ký service worker (chỉ chạy qua http/https, không chạy file://)
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('service-worker.js').catch(err => console.warn('SW lỗi:', err));
    }
  }

  window.addEventListener('error', e => console.error('Lỗi game:', e.message));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
