/* =========================================================
 * sprites.js – Dùng ảnh PNG thật cho nhân vật & trụ (nếu có)
 * Thả ảnh vào:
 *   assets/characters/<tên>.png   (nhân vật, quay mặt sang PHẢI, đứng thẳng)
 *   assets/buildings/<tên>.png    (trụ, đã gồm cả lính đứng trên trụ)
 * Ảnh nào chưa có → game tự dùng hình vẽ bằng code như cũ.
 * Nền trong suốt là tốt nhất; nếu ảnh có nền MỘT MÀU, game tự xoá nền.
 * Game tự cắt bỏ khoảng trống thừa quanh nhân vật.
 * ========================================================= */
(function () {
  const TAU = Math.PI * 2;
  /* tên file → khoá trong game */
  const CHAR_FILES = {
    'linh-1': 'soldier1', 'linh-2': 'soldier2', 'linh-3': 'soldier3', 'linh-4': 'soldier4',
    'anh-hung': 'hero',
    'orc-soi-1': 'orcRider1', 'orc-soi-2': 'orcRider2', 'orc-soi-3': 'orcRider3', 'orc-soi-4': 'orcRider4',
    'quai-yeu-tinh': 'goblin', 'quai-orc': 'orc', 'quai-orc-cung': 'orcArcher', 'quai-soi': 'warg', 'quai-bong-ma': 'wraith',
    'quai-hac-orc': 'blackOrc', 'quai-troll': 'troll', 'quai-vua-troll': 'trollKing'
  };
  const TOWER_FILES = { thanh: 'barracks', cung: 'archer', phap: 'mage', phao: 'artillery', thu: 'beast' };

  /* Tinh chỉnh từng hình nếu cần: scale (to/nhỏ), dx/dy (dịch, đv thế giới), flip (ảnh quay trái thì đặt true) */
  const TUNE = {
    // 'linh-1': { scale: 1.1 },
    // 'cung-4': { scale: 0.95, dy: 4 },
  };
  const TOWER_W = [0, 92, 98, 104, 112]; // bề ngang trụ theo cấp (đv thế giới)

  const S = { chars: {}, towers: {}, loaded: 0, missing: [], done: false };

  function load(src) {
    return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src + '?v=' + (window.SPRITE_VER || 1); });
  }
  /** Xoá nền một màu (loang từ mép ảnh) + cắt khung vừa khít */
  function prepare(im) {
    const MAX = 1024, k = Math.min(1, MAX / Math.max(im.width, im.height));
    const w = Math.round(im.width * k), h = Math.round(im.height * k);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, w, h);
    let data; try { data = g.getImageData(0, 0, w, h); } catch (e) { return { img: c, w, h }; }
    const p = data.data, A = i => p[i * 4 + 3];
    const corners = [0, w - 1, (h - 1) * w, h * w - 1];
    if (corners.every(i => A(i) > 250)) { // ảnh có nền → loang xoá
      // nền có thể là màu phẳng hoặc chuyển sắc nhẹ: loang theo độ chênh giữa 2 điểm kề nhau
      const avg = [0, 1, 2].map(ch => corners.reduce((a, i) => a + p[i * 4 + ch], 0) / 4);
      const spread = corners.reduce((m, i) => Math.max(m, Math.abs(p[i * 4] - avg[0]) + Math.abs(p[i * 4 + 1] - avg[1]) + Math.abs(p[i * 4 + 2] - avg[2])), 0);
      if (spread < 150) {
        const STEP = 22, FAR = 150, seen = new Uint8Array(w * h), st = [];
        const diff = (i, j) => Math.abs(p[i * 4] - p[j * 4]) + Math.abs(p[i * 4 + 1] - p[j * 4 + 1]) + Math.abs(p[i * 4 + 2] - p[j * 4 + 2]);
        const far = i => Math.abs(p[i * 4] - avg[0]) + Math.abs(p[i * 4 + 1] - avg[1]) + Math.abs(p[i * 4 + 2] - avg[2]);
        for (let x = 0; x < w; x++) st.push(x, x, (h - 1) * w + x, (h - 1) * w + x);
        for (let y = 0; y < h; y++) st.push(y * w, y * w, y * w + w - 1, y * w + w - 1);
        while (st.length) {
          const from = st.pop(), i = st.pop();
          if (seen[i] || diff(i, from) > STEP || far(i) > FAR) continue; seen[i] = 1;
          const x = i % w, y = (i / w) | 0;
          if (x > 0) st.push(i - 1, i); if (x < w - 1) st.push(i + 1, i); if (y > 0) st.push(i - w, i); if (y < h - 1) st.push(i + w, i);
        }
        for (let i = 0; i < w * h; i++) if (seen[i]) p[i * 4 + 3] = 0;
        // làm mềm viền: điểm sát nền giảm độ đậm
        for (let i = 0; i < w * h; i++) if (!seen[i] && p[i * 4 + 3] > 0) { const x = i % w, y = (i / w) | 0;
          if ((x > 0 && seen[i - 1]) || (x < w - 1 && seen[i + 1]) || (y > 0 && seen[i - w]) || (y < h - 1 && seen[i + w])) p[i * 4 + 3] = 150; }
        g.putImageData(data, 0, 0);
      }
    }
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (p[(y * w + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null;
    const tw = x1 - x0 + 1, th = y1 - y0 + 1, t = document.createElement('canvas'); t.width = tw; t.height = th;
    t.getContext('2d').drawImage(c, x0, y0, tw, th, 0, 0, tw, th);
    return { img: t, w: tw, h: th, cache: {} };
  }
  /** Bản thu nhỏ đẹp theo chiều cao pixel cần vẽ (thu nhỏ từng nấc ½ để không răng cưa) */
  function scaled(rec, hpx) {
    const b = Math.max(8, Math.min(rec.h, Math.round(Math.pow(2, Math.ceil(Math.log2(hpx) * 4) / 4))));
    let c = rec.cache[b]; if (c) return c;
    let src = rec.img, sw = rec.w, sh = rec.h;
    while (sh / 2 > b) { const n = document.createElement('canvas'); n.width = Math.max(1, sw >> 1); n.height = Math.max(1, sh >> 1); n.getContext('2d').drawImage(src, 0, 0, n.width, n.height); src = n; sw = n.width; sh = n.height; }
    c = document.createElement('canvas'); c.height = b; c.width = Math.max(1, Math.round(b * rec.w / rec.h));
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, c.width, c.height);
    rec.cache[b] = c; return c;
  }
  function pixelScale(ctx) { const m = ctx.getTransform(); return Math.hypot(m.a, m.b) || 1; }

  S.has = key => !!S.chars[key];
  /** Vẽ nhân vật bằng ảnh. Trả về false nếu chưa có ảnh. */
  S.char = function (ctx, key, x, y, scale, face, mode, phase) {
    const rec = S.chars[key]; if (!rec) return false;
    const d = window.ArtChars && ArtChars[key], o = rec.tune;
    const H = (d ? d.tall : 44) * scale * (o.scale || 1) * 1.08, W = H * rec.w / rec.h;
    let rot = 0, dx = 0, dy = 0, sx = 1, sy = 1;
    if (mode === 'walk') { const a = (phase % 1) * TAU; dy = -Math.abs(Math.sin(a)) * H * 0.045; rot = Math.sin(a) * 0.045; }
    else if (mode === 'atk') { const p = Math.max(0, Math.min(1, phase));
      if (p < 0.4) { const k = p / 0.4; rot = -0.1 * k; dx = -H * 0.03 * k; sy = 1 + 0.03 * k; }
      else if (p < 0.6) { const k = (p - 0.4) / 0.2; rot = -0.1 + 0.28 * k; dx = -H * 0.03 + H * 0.13 * k; sy = 1.03 - 0.07 * k; }
      else { const k = (p - 0.6) / 0.4; rot = 0.18 * (1 - k); dx = H * 0.1 * (1 - k); sy = 0.96 + 0.04 * k; } }
    else { const b = Math.sin((phase || 0) * 2.4); sy = 1 + b * 0.018; sx = 1 - b * 0.008; }
    ctx.save(); ctx.translate(x + (o.dx || 0) * scale, y + (o.dy || 0) * scale);
    ArtKit.shadow(ctx, 0, 0, W * 0.34, W * 0.1, 0.32);
    if (face < 0) ctx.scale(-1, 1); if (o.flip) ctx.scale(-1, 1);
    ctx.translate(dx, dy); ctx.rotate(rot); ctx.scale(sx, sy);
    ctx.drawImage(scaled(rec, H * pixelScale(ctx)), -W / 2, -H, W, H);
    ctx.restore(); return true;
  };
  S.tower = function (ctx, type, tier, x, y, scale, t, st) {
    const rec = S.towers[type + tier]; if (!rec) return false;
    const o = rec.tune; st = st || {};
    let W = TOWER_W[tier] * scale * (o.scale || 1), H = W * rec.h / rec.w;
    const maxH = 190 * scale * (o.scale || 1); if (H > maxH) { H = maxH; W = H * rec.w / rec.h; }
    const atk = st.a >= 0 ? Math.sin(Math.min(1, st.a) * Math.PI) : 0;
    ctx.save(); ctx.translate(x + (o.dx || 0) * scale, y + (16 + (o.dy || 0)) * scale);
    ctx.scale(1 + atk * 0.015, 1 - atk * 0.025);
    ctx.drawImage(scaled(rec, H * pixelScale(ctx)), -W / 2, -H, W, H);
    ctx.restore();
    // hiệu ứng nhẹ phủ lên ảnh
    if (atk > 0 && type === 'mage') ArtKit.glow(ctx, x, y - H * 0.8, 26 * scale, '#c890ff', atk);
    if (atk > 0 && type === 'artillery') { const m = ArtTowers.cannonMuzzle(tier); ArtKit.glow(ctx, x + m.x * (st.face || 1) * scale, y + m.y * scale, 18 * scale, '#ffb84a', atk); }
    if (st.door > 0) ArtKit.glow(ctx, x, y - 4 * scale, 22 * scale, type === 'beast' ? '#ff9a4a' : '#ffd070', st.door);
    return true;
  };
  /** Chân dung giao diện từ ảnh: toàn thân hoặc cận mặt */
  S.portrait = function (canvas, rec, head, fit) {
    const g = canvas.getContext('2d'), cw = canvas.width, ch = canvas.height; g.clearRect(0, 0, cw, ch);
    if (head) { const sh = rec.h * 0.42, sw = Math.min(rec.w, sh * cw / ch), sx = (rec.w - sw) / 2; g.drawImage(rec.img, sx, 0, sw, sh, 0, ch * 0.06, cw, cw * sh / sw); return; }
    const f = fit || 0.9, k = Math.min(cw * f / rec.w, ch * f / rec.h), w = rec.w * k, h = rec.h * k;
    g.drawImage(scaled(rec, h), (cw - w) / 2, (ch - h) / 2, w, h);
  };

  S.load = async function () {
    const jobs = [];
    for (const f in CHAR_FILES) jobs.push(load('assets/characters/' + f + '.png').then(im => {
      const r = im && prepare(im); if (r) { r.tune = TUNE[f] || {}; S.chars[CHAR_FILES[f]] = r; S.loaded++; } else S.missing.push('characters/' + f + '.png'); }));
    for (const f in TOWER_FILES) for (let i = 1; i <= 4; i++) jobs.push(load('assets/buildings/' + f + '-' + i + '.png').then(im => {
      const r = im && prepare(im); if (r) { r.tune = TUNE[f + '-' + i] || {}; S.towers[TOWER_FILES[f] + i] = r; S.loaded++; } else S.missing.push('buildings/' + f + '-' + i + '.png'); }));
    await Promise.all(jobs);
    S.done = true;
    if (S.loaded) {
      if (window.Painter) Painter.clear();
      try { if (window.UI && document.getElementById('screen-menu').classList.contains('active')) UI.paintMenu(); } catch (e) {}
    }
    if (S.onReady) S.onReady();
  };
  S.FILES = { CHAR_FILES, TOWER_FILES };
  window.Sprites = S;
  S.load();
})();
