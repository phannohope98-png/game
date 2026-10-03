/* =========================================================
 * art-towers.js – 5 loại trụ × 4 cấp theo concept 5 chủng tộc
 * Gốc = tâm nền trụ trên mặt đất (nhìn 3/4 từ trên xuống).
 * static() vẽ sẵn vào bộ đệm, fx() vẽ mỗi khung (người, cờ, phép).
 *   archer – Tháp cung Elf     barracks – Doanh trại
 *   mage   – Tháp Pháp sư       artillery – Pháo Người Lùn
 * ARCH_TOP / MAGE_TOP / ART_Y: độ cao sàn đứng (towers.js dùng cho nòng bắn).
 * ========================================================= */
(function () {
  const K = ArtKit, shade = K.shade, mix = K.mix, TAU = Math.PI * 2;
  const INKC = '#1c1028', inkOf = c => mix(c, INKC, 0.72);
  const GOLD = '#f2c14e';

  function F(g, build, col, o) {
    o = o || {};
    K.cel(g, build, col, { s: o.s === undefined ? 2.4 : o.s, h: o.h === undefined ? 1.1 : o.h, lw: o.lw === undefined ? 1.5 : o.lw,
      ink: o.ink || inkOf(col), animeHeavy: true, noRim: o.noRim, dark: o.dark, light: o.light });
  }
  const P = K.P;
  function line(g, x1, y1, x2, y2, col, w) { g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
  function dot(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  /** Tô dải màu ngang (sáng trái – tối phải) theo kiểu nền anime + viền */
  function shaded(g, build, col, x0, x1, o) {
    o = o || {};
    g.save(); g.beginPath(); build(g);
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, shade(col, 0.28)); gr.addColorStop(0.35, col); gr.addColorStop(0.78, shade(col, -0.18)); gr.addColorStop(1, shade(col, -0.42));
    g.fillStyle = gr; g.fill();
    if (o.inner) { g.clip(); o.inner(g); }
    g.restore();
    g.beginPath(); build(g); g.lineJoin = 'round'; g.strokeStyle = o.ink || inkOf(col); g.lineWidth = o.lw || 1.5; g.stroke();
  }

  /* ---------------- Khối kiến trúc ---------------- */
  const cylP = (cx, yb, rx, ry, h, tp) => c => { c.moveTo(cx - rx, yb); c.lineTo(cx - rx + tp, yb - h); c.ellipse(cx, yb - h, rx - tp, ry * (rx - tp) / rx, 0, Math.PI, 0, true); c.lineTo(cx + rx, yb); c.ellipse(cx, yb, rx, ry, 0, 0, Math.PI); c.closePath(); };
  /** Thân tháp tròn: gạch đá + dải tối/sáng */
  function cyl(g, cx, yb, rx, h, col, o) {
    o = o || {};
    const ry = o.ry || rx * 0.36, tp = o.taper || 0;
    shaded(g, cylP(cx, yb, rx, ry, h, tp), col, cx - rx, cx + rx, { inner: o.bricks === false ? null : g2 => {
      const rh = o.rowH || 7, ink = K.alpha(shade(col, -0.55), 0.45);
      g2.strokeStyle = ink; g2.lineWidth = 0.9;
      for (let y = yb - rh, i = 0; y > yb - h - 1; y -= rh, i++) {
        const k = (yb - y) / h, w = rx - tp * k, ryy = ry * w / rx;
        g2.beginPath(); g2.ellipse(cx, y, w, ryy, 0, 0, Math.PI); g2.stroke();
        for (let j = -3; j <= 3; j++) { const xx = cx + (j + (i % 2) * 0.5) * w * 0.3; if (Math.abs(xx - cx) < w - 1.5) { const yy = y + ryy * Math.sqrt(Math.max(0, 1 - ((xx - cx) / w) ** 2)); g2.beginPath(); g2.moveTo(xx, yy); g2.lineTo(xx, yy + rh); g2.stroke(); } }
      }
      // vệt nắng dọc thân
      g2.fillStyle = 'rgba(255,248,225,0.18)'; g2.fillRect(cx - rx * 0.62, yb - h - 4, rx * 0.16, h + 8);
    } });
    if (o.top !== false) {
      const tw = rx - tp;
      F(g, P.ell(cx, yb - h, tw, ry * tw / rx), o.topCol || shade(col, 0.1), { s: 0, h: 0, lw: 1.4 });
    }
  }
  /** Mái nón lợp ngói vảy cá */
  function cone(g, cx, yb, rx, h, col, o) {
    o = o || {};
    const ry = rx * 0.36, tilt = o.tilt || 0, tipX = cx + tilt, tipY = yb - h;
    const path = c => { c.moveTo(cx - rx, yb); c.quadraticCurveTo(cx - rx * 0.42, yb - h * 0.42, tipX, tipY); c.quadraticCurveTo(cx + rx * 0.42, yb - h * 0.42, cx + rx, yb); c.ellipse(cx, yb, rx, ry, 0, 0, Math.PI); c.closePath(); };
    shaded(g, path, col, cx - rx, cx + rx, { inner: g2 => {
      g2.strokeStyle = K.alpha(shade(col, -0.5), 0.55); g2.lineWidth = 0.9;
      for (let i = 1; i < 6; i++) { const f = i / 6, y = yb - h * (1 - f) * 0.92, w = rx * f, n = Math.max(3, Math.round(w / 3.4));
        for (let j = 0; j < n; j++) { const a0 = j / n * Math.PI, a1 = (j + 1) / n * Math.PI; g2.beginPath(); g2.ellipse(cx + tilt * (1 - f), y, w, ry * f, 0, a0, a1); g2.stroke(); } }
      g2.fillStyle = 'rgba(255,250,230,0.22)'; g2.beginPath(); g2.moveTo(tipX, tipY); g2.quadraticCurveTo(cx - rx * 0.4, yb - h * 0.4, cx - rx * 0.62, yb + ry * 0.4); g2.lineTo(cx - rx * 0.4, yb + ry * 0.7); g2.quadraticCurveTo(cx - rx * 0.15, yb - h * 0.4, tipX, tipY); g2.fill();
    } });
    if (o.trim) { g.strokeStyle = inkOf(o.trim); g.lineWidth = 3.6; g.beginPath(); g.ellipse(cx, yb, rx, ry, 0, 0.05, Math.PI - 0.05); g.stroke(); g.strokeStyle = o.trim; g.lineWidth = 2; g.stroke(); }
    return { x: tipX, y: tipY };
  }
  /** Mái dốc 2 mặt (nhìn chính diện) */
  function gable(g, cx, yb, w, h, col, o) {
    o = o || {};
    const path = c => { c.moveTo(cx - w / 2 - 4, yb); c.lineTo(cx, yb - h); c.lineTo(cx + w / 2 + 4, yb); c.lineTo(cx + w / 2, yb + 3); c.lineTo(cx - w / 2, yb + 3); c.closePath(); };
    shaded(g, path, col, cx - w / 2, cx + w / 2, { inner: g2 => {
      g2.strokeStyle = K.alpha(shade(col, -0.5), 0.5); g2.lineWidth = 0.9;
      for (let i = 1; i < 5; i++) { const f = i / 5, y = yb - h * (1 - f); g2.beginPath(); g2.moveTo(cx - (w / 2 + 4) * f, y); g2.lineTo(cx + (w / 2 + 4) * f, y); g2.stroke(); }
      if (o.thatch) { g2.strokeStyle = K.alpha(shade(col, 0.4), 0.6); for (let x = -w / 2; x < w / 2; x += 3) { g2.beginPath(); g2.moveTo(cx + x, yb + 2); g2.lineTo(cx + x * 0.6, yb - h * 0.55); g2.stroke(); } }
    } });
  }
  function battlements(g, cx, y, rx, col, n) {
    const ry = rx * 0.36; n = n || 8;
    for (const front of [false, true]) for (let i = 0; i < n; i++) {
      const a = (i + 0.5) / n * TAU, sn = Math.sin(a);
      if ((sn > 0) !== front) continue;
      const x = cx + Math.cos(a) * rx, yy = y + sn * ry, w = rx * 0.4;
      F(g, P.rr(x - w / 2, yy - 7, w, 9, 1.6), shade(col, front ? 0.06 : -0.16), { s: 1.6, h: 0.8, lw: 1.3 });
    }
  }
  function foundation(g, rx, col, grassy) {
    K.shadow(g, 3, 7, rx * 1.3, rx * 0.5, 0.5);
    const ry = rx * 0.38;
    cyl(g, 0, 6, rx, 8, col, { ry, top: false, rowH: 8 });
    F(g, P.ell(0, -2, rx, ry), shade(col, 0.16), { s: 0, h: 0, lw: 1.4 });
    g.save(); g.beginPath(); g.ellipse(0, -2, rx, ry, 0, 0, TAU); g.clip();
    g.strokeStyle = K.alpha(shade(col, -0.5), 0.35); g.lineWidth = 0.9;
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * rx * 0.5, -2 + Math.sin(a) * ry * 0.5); g.lineTo(Math.cos(a) * rx, -2 + Math.sin(a) * ry); g.stroke(); }
    g.beginPath(); g.ellipse(0, -2, rx * 0.5, ry * 0.5, 0, 0, TAU); g.stroke();
    g.restore();
    if (grassy) { // cỏ mọc quanh chân bệ
      const r = K.seeded(rx * 7);
      for (let i = 0; i < 14; i++) { const a = 0.15 + r() * (Math.PI - 0.3), x = Math.cos(a) * rx * 1.02, y = 6 + Math.sin(a) * ry; tuft(g, x, y + 1, 3 + r() * 2.5, grassy); }
    }
  }
  function tuft(g, x, y, h, col) {
    g.fillStyle = col; g.strokeStyle = inkOf(col); g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(x - 3, y); g.quadraticCurveTo(x - 2.4, y - h * 0.6, x - 3.6, y - h); g.quadraticCurveTo(x - 1, y - h * 0.5, x, y - h * 1.15); g.quadraticCurveTo(x + 0.8, y - h * 0.5, x + 3.4, y - h * 0.9); g.quadraticCurveTo(x + 2.2, y - h * 0.4, x + 3, y); g.closePath(); g.fill(); g.stroke();
  }
  function door(g, x, yb, w, h, wood, frame) {
    const p = c => { c.moveTo(x - w / 2, yb); c.lineTo(x - w / 2, yb - h + w / 2); c.arc(x, yb - h + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w / 2, yb); c.closePath(); };
    if (frame) F(g, c => { c.moveTo(x - w / 2 - 2.4, yb); c.lineTo(x - w / 2 - 2.4, yb - h + w / 2); c.arc(x, yb - h + w / 2, w / 2 + 2.4, Math.PI, 0); c.lineTo(x + w / 2 + 2.4, yb); c.closePath(); }, frame, { s: 1, h: 0.6, lw: 1.2 });
    F(g, p, wood || '#7a4a26', { s: 1.4, h: 0.6, lw: 1.3 });
    g.save(); g.beginPath(); p(g); g.clip(); g.strokeStyle = K.alpha(INKC, 0.45); g.lineWidth = 0.8;
    for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(x - w / 2 + w * i / 3, yb - h); g.lineTo(x - w / 2 + w * i / 3, yb); g.stroke(); }
    g.fillStyle = '#50545e'; g.fillRect(x - w / 2, yb - h * 0.62, w, 1.4); g.fillRect(x - w / 2, yb - h * 0.26, w, 1.4); g.restore();
    dot(g, x + w * 0.28, yb - h * 0.42, 0.9, GOLD);
  }
  function win(g, x, y, w, h, glow, o) {
    o = o || {};
    K.glow(g, x, y, w * 2.6, glow || '#ffd070', 0.55);
    const p = c => { c.moveTo(x - w / 2, y + h / 2); c.lineTo(x - w / 2, y - h / 2 + w / 2); c.arc(x, y - h / 2 + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w / 2, y + h / 2); c.closePath(); };
    g.save(); g.beginPath(); p(g); const gr = g.createLinearGradient(0, y - h / 2, 0, y + h / 2); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(1, glow || '#ffd070'); g.fillStyle = gr; g.fill(); g.restore();
    g.beginPath(); p(g); g.strokeStyle = inkOf(o.frame || '#6a5a4a'); g.lineWidth = 1.3; g.stroke();
    if (!o.noBar) { line(g, x, y - h / 2 + 1, x, y + h / 2, K.alpha(INKC, 0.55), 0.8); line(g, x - w / 2, y + h * 0.08, x + w / 2, y + h * 0.08, K.alpha(INKC, 0.55), 0.8); }
  }
  function planks(g, x, yb, w, h, col, vertical) {
    shaded(g, P.rr(x - w / 2, yb - h, w, h, 1.6), col, x - w / 2, x + w / 2, { lw: 1.4, inner: g2 => {
      g2.strokeStyle = K.alpha(INKC, 0.4); g2.lineWidth = 0.8;
      if (vertical) for (let xx = x - w / 2 + 5; xx < x + w / 2 - 1; xx += 5) { g2.beginPath(); g2.moveTo(xx, yb - h); g2.lineTo(xx, yb); g2.stroke(); }
      else for (let yy = yb - h + 5; yy < yb - 1; yy += 5) { g2.beginPath(); g2.moveTo(x - w / 2, yy); g2.lineTo(x + w / 2, yy); g2.stroke(); }
    } });
  }
  function post(g, x1, y1, x2, y2, w, col) {
    g.lineCap = 'round'; g.strokeStyle = inkOf(col || '#8a5a32'); g.lineWidth = w + 2.4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = col || '#8a5a32'; g.lineWidth = w; g.stroke();
    g.strokeStyle = shade(col || '#8a5a32', 0.3); g.lineWidth = w * 0.3; g.beginPath(); g.moveTo(x1 - w * 0.22, y1); g.lineTo(x2 - w * 0.22, y2); g.stroke();
  }
  function flag(g, x, y, len, col, t, dir, size) {
    dir = dir || 1; size = size || 1;
    post(g, x, y, x, y - len, 1.6, '#6b4426');
    F(g, P.circ(x, y - len - 1.4, 1.8), GOLD, { s: 0.4, h: 0.4, lw: 1 });
    const ph = t * 5, fw = 15 * size, fh = 9 * size;
    F(g, c => {
      c.moveTo(x, y - len + 1);
      for (let i = 1; i <= 6; i++) { const f = i / 6; c.lineTo(x + dir * fw * f, y - len + 1 + Math.sin(ph + f * 3) * 2 * f); }
      c.lineTo(x + dir * fw * 0.8, y - len + 1 + fh * 0.5 + Math.sin(ph + 2.6) * 1.6);
      for (let i = 6; i >= 0; i--) { const f = i / 6; c.lineTo(x + dir * fw * f, y - len + fh + 1 + Math.sin(ph + f * 3 + 0.5) * 2 * f); }
      c.closePath();
    }, col, { s: 1.4, h: 0.6, lw: 1.2 });
  }
  function banner(g, x, y, w, h, col, mark) {
    F(g, c => { c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(x + w / 2, y + h - 3); c.lineTo(x, y + h); c.lineTo(x - w / 2, y + h - 3); c.closePath(); }, col, { s: 1.6, h: 0.7, lw: 1.2 });
    F(g, P.rr(x - w / 2 - 1.5, y - 2, w + 3, 2.8, 1.2), GOLD, { s: 0.4, h: 0.3, lw: 1 });
    if (mark) mark(g, x, y + h * 0.45);
  }
  const markLeaf = (g, x, y) => F(g, P.ell(x, y, 2.2, 4, 0.5), '#f6eaa8', { s: 0, h: 0, lw: 0.8 });
  const markTree = (g, x, y) => { dot(g, x, y - 1.4, 2.4, '#f4f1e6'); line(g, x, y, x, y + 4.4, '#f4f1e6', 1.3); };
  const markStar = (g, x, y) => { g.fillStyle = '#fff0b0'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 1.2 : 3; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); };
  const markHammer = (g, x, y) => { line(g, x, y - 1, x, y + 4.6, '#f4e6c0', 1.3); F(g, P.rr(x - 3.2, y - 3.6, 6.4, 3, 0.8), '#f4e6c0', { s: 0, h: 0, lw: 0.7 }); };
  function leafy(g, x, y, r, col) {
    F(g, P.blob([x - r, y + r * 0.1, x - r * 0.75, y - r * 0.75, x, y - r, x + r * 0.8, y - r * 0.7, x + r, y + r * 0.1, x + r * 0.55, y + r * 0.7, x - r * 0.5, y + r * 0.65]), col, { s: r * 0.32, h: r * 0.14, lw: 1.3 });
    dot(g, x - r * 0.35, y - r * 0.4, r * 0.18, K.alpha('#fffbe0', 0.45));
  }
  function crystal(g, x, y, s, col) {
    F(g, P.poly([x, y - 14 * s, x + 4.6 * s, y - 6 * s, x + 3 * s, y, x - 3 * s, y, x - 4.6 * s, y - 6 * s]), col, { s: 1.4 * s, h: 0.9 * s, lw: 1.2, light: '#ffffff' });
    line(g, x - 1 * s, y - 11 * s, x - 2 * s, y - 3 * s, 'rgba(255,255,255,0.75)', 1);
  }
  function rail(g, w, y, col, post2) {
    for (let i = 0; i <= 6; i++) { const x = -w + (2 * w) * i / 6; F(g, P.rr(x - 1.3, y - 7, 2.6, 8, 0.8), post2 || col, { s: 0.5, h: 0.3, lw: 1 }); }
    F(g, P.rr(-w - 1, y - 8, 2 * w + 2, 2.8, 1.2), col, { s: 0.6, h: 0.3, lw: 1.2 });
  }

  /* ---------------- Bộ phận dùng chung (bản concept 5 chủng tộc) ---------------- */
  function star(g, x, y, r, col, ink) {
    const p = c => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.44 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); };
    F(g, c => { c.moveTo(x, y - r); p(c); }, col, { s: 0, h: r * 0.15, lw: ink === false ? 0 : 0.9, light: '#fffbe0' });
  }
  /** Huy hiệu loài người: khiên xanh, chữ thập vàng, sao trắng */
  function crest(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    F(g, c => { c.moveTo(-6, -7); c.quadraticCurveTo(0, -9, 6, -7); c.lineTo(6, 0); c.quadraticCurveTo(5, 7, 0, 10.5); c.quadraticCurveTo(-5, 7, -6, 0); c.closePath(); }, '#2a55b8', { s: 1.4, h: 0.7, lw: 1.2 });
    g.strokeStyle = GOLD; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-4.6, -5.6); g.quadraticCurveTo(0, -7.2, 4.6, -5.6); g.lineTo(4.6, 0); g.quadraticCurveTo(3.8, 5.6, 0, 8.6); g.quadraticCurveTo(-3.8, 5.6, -4.6, 0); g.closePath(); g.stroke();
    line(g, 0, -5, 0, 6.5, GOLD, 1.8); line(g, -3.6, -1, 3.6, -1, GOLD, 1.8); star(g, 0, -1, 1.9, '#fff6d0', false);
    g.restore();
  }
  /** Dải lỗ châu mai phẳng (nhìn chính diện) */
  function merlons(g, x0, x1, y, col, n) {
    const w = x1 - x0, k = n || Math.max(3, Math.round(w / 9)), mw = w / (k * 2 - 1);
    for (let i = 0; i < k; i++) F(g, P.rr(x0 + i * mw * 2, y - 6, mw, 7, 1), shade(col, 0.04), { s: 1.2, h: 0.6, lw: 1.2 });
  }
  /** Tường đá phẳng có mạch gạch */
  function wall(g, x, yb, w, h, col, o) {
    o = o || {};
    shaded(g, P.rr(x - w / 2, yb - h, w, h, 2), col, x - w / 2, x + w / 2, { inner: g2 => {
      g2.strokeStyle = K.alpha(shade(col, -0.55), 0.35); g2.lineWidth = 0.8;
      for (let y = yb - 6, r = 0; y > yb - h; y -= 6.5, r++) { g2.beginPath(); g2.moveTo(x - w / 2, y); g2.lineTo(x + w / 2, y); g2.stroke();
        for (let xx = x - w / 2 + (r % 2) * 5; xx < x + w / 2; xx += 10) { g2.beginPath(); g2.moveTo(xx, y); g2.lineTo(xx, y - 6.5); g2.stroke(); } }
      g2.fillStyle = 'rgba(255,248,225,0.16)'; g2.fillRect(x - w / 2 + 2, yb - h, w * 0.12, h);
    } });
    if (o.band) { g.strokeStyle = inkOf(o.band); g.lineWidth = 3.4; g.beginPath(); g.moveTo(x - w / 2, yb - h + 2); g.lineTo(x + w / 2, yb - h + 2); g.stroke(); g.strokeStyle = o.band; g.lineWidth = 1.8; g.stroke(); }
  }
  /** Chóp mái: cột vàng + quả cầu */
  function spire(g, x, y, h) { post(g, x, y, x, y - h, 1.4, GOLD); F(g, P.circ(x, y - h, 1.9), GOLD, { s: 0.4, h: 0.4, lw: 1 }); }
  function goldBand(g, cx, y, rx, ry, w) { g.strokeStyle = INKC; g.lineWidth = (w || 2) + 2; g.beginPath(); g.ellipse(cx, y, rx, ry, 0, 0.06, Math.PI - 0.06); g.stroke(); g.strokeStyle = GOLD; g.lineWidth = w || 2; g.stroke(); }
  function crystalCluster(g, x, y, s, col) {
    crystal(g, x - 4.2 * s, y + 1 * s, 0.55 * s, shade(col, -0.1));
    crystal(g, x + 4.4 * s, y + 1.2 * s, 0.62 * s, shade(col, -0.05));
    crystal(g, x, y, 0.95 * s, col);
  }
  function smoke(g, x, y, t, n, col, rise) {
    for (let i = 0; i < n; i++) { const p = (t * 0.45 + i / n) % 1; g.save(); g.globalAlpha = (1 - p) * 0.55; F(g, P.circ(x + p * 7 + Math.sin(p * 6 + i) * 2, y - p * (rise || 26), 2.6 + p * 5), col || '#c8c0b8', { s: 0, h: 0, lw: 0 }); g.restore(); }
  }
  function fire(g, x, y, s, t, seed) {
    const f = Math.sin(t * 13 + (seed || 0)) * 0.12 + Math.sin(t * 7.3 + (seed || 0) * 2) * 0.1;
    K.glow(g, x, y - 5 * s, 16 * s, '#ff8a2a', 0.7 + f);
    const fl = (w, h, col) => F(g, c => { c.moveTo(x - w * s, y); c.quadraticCurveTo(x - w * s * 1.1, y - h * s * 0.5, x + f * 6 * s, y - h * s * (1 + f)); c.quadraticCurveTo(x + w * s * 1.1, y - h * s * 0.5, x + w * s, y); c.closePath(); }, col, { s: 0, h: 0, lw: 0.9, ink: '#8a2a10' });
    fl(4.2, 11, '#ff6a2a'); fl(2.6, 7.5, '#ffb84a'); fl(1.2, 4, '#fff0b0');
  }

  /* =====================================================
   * TRỤ CUNG – THÁP CÂY ELF (cây cổ thụ sống, sàn gỗ chạm, tán lá, phù văn lục)
   * ===================================================== */
  const ARCH_TOP = [0, -44, -54, -62, -70];
  function mound(g, rx, col) {
    K.shadow(g, 3, 7, rx * 1.3, rx * 0.5, 0.45);
    const ry = rx * 0.38;
    F(g, c => { c.moveTo(-rx, 2); c.quadraticCurveTo(-rx, -ry - 2, 0, -ry - 3); c.quadraticCurveTo(rx, -ry - 2, rx, 2); c.quadraticCurveTo(rx * 0.92, ry + 6, 0, ry + 6); c.quadraticCurveTo(-rx * 0.92, ry + 6, -rx, 2); c.closePath(); }, col, { s: 3, h: 1.2 });
    const r = K.seeded(rx * 3);
    for (let i = 0; i < 14; i++) { const a = 0.12 + r() * (Math.PI - 0.24); tuft(g, Math.cos(a) * rx * 0.98, 3 + Math.sin(a) * (ry + 2), 3 + r() * 3, shade(col, 0.1)); }
    for (let i = 0; i < 7; i++) { const a = r() * TAU, x = Math.cos(a) * rx * 0.75, y = -1 + Math.sin(a) * ry * 0.7; dot(g, x, y, 1.3, i % 3 ? '#fff8e8' : '#ffb0c8'); dot(g, x, y, 0.5, '#ffd84a'); }
  }
  function trunk(g, h, wb, wt, col, o) {
    o = o || {};
    const path = c => {
      c.moveTo(-wb - 11, 5); c.quadraticCurveTo(-wb - 2, 1, -wb, -7);
      c.quadraticCurveTo(-wt - 3, -h * 0.45, -wt, -h); c.lineTo(wt, -h);
      c.quadraticCurveTo(wt + 3, -h * 0.45, wb, -7); c.quadraticCurveTo(wb + 2, 1, wb + 11, 5);
      c.quadraticCurveTo(wb + 2, 6, wb * 0.55, 3); c.quadraticCurveTo(wb * 0.4, 8, 5, 9);
      c.quadraticCurveTo(0, 11, -5, 9); c.quadraticCurveTo(-wb * 0.45, 7.5, -wb * 0.6, 3);
      c.quadraticCurveTo(-wb - 2, 7, -wb - 11, 5); c.closePath();
    };
    shaded(g, path, col, -wb, wb, { lw: 1.6, inner: g2 => {
      g2.strokeStyle = K.alpha(shade(col, -0.6), 0.45); g2.lineWidth = 0.9;
      for (let i = -3; i <= 3; i++) { const x = i * wb * 0.26; g2.beginPath(); g2.moveTo(x * 1.1, 6); for (let y = 0; y > -h; y -= 6) g2.lineTo(x * (1 - (-y / h) * (1 - wt / wb)) + Math.sin(y * 0.4 + i) * 1.2, y); g2.stroke(); }
      if (o.vine) { g2.strokeStyle = inkOf(o.vine); g2.lineWidth = 2.6; const sp = () => { g2.beginPath(); for (let y = 2; y > -h; y -= 1.5) { const k = -y / h, w = wb - (wb - wt) * k; g2.lineTo(Math.sin(y * 0.16) * w * 0.95, y + Math.cos(y * 0.16) * 1.5); } }; sp(); g2.stroke(); g2.strokeStyle = o.vine; g2.lineWidth = 1.3; sp(); g2.stroke(); }
      if (o.rune) { g2.save(); g2.globalCompositeOperation = 'lighter'; g2.strokeStyle = K.alpha(o.rune, 0.85); g2.lineWidth = 1.1;
        for (const [x, y] of [[-wb * 0.35, -h * 0.35], [wb * 0.3, -h * 0.62]]) { g2.beginPath(); g2.arc(x, y, 2.4, 0, TAU); g2.moveTo(x, y - 4.5); g2.lineTo(x, y + 4.5); g2.moveTo(x - 3.5, y - 2); g2.lineTo(x + 3.5, y + 2); g2.stroke(); }
        g2.restore(); }
      g2.fillStyle = 'rgba(255,248,225,0.18)'; g2.fillRect(-wb * 0.7, -h, wb * 0.2, h + 6);
    } });
  }
  /** Sàn gỗ tròn trên ngọn cây */
  function deck(g, y, rx, col, trim) {
    const ry = rx * 0.36;
    for (const s of [-1, 1]) post(g, s * rx * 0.3, y + 16, s * rx * 0.85, y + 4, 2.6, shade(col, -0.15));
    cyl(g, 0, y + 5, rx, 5, col, { ry, top: false, bricks: false });
    F(g, P.ell(0, y, rx, ry), shade(col, 0.12), { s: 0, h: 0, lw: 1.4 });
    g.save(); g.beginPath(); g.ellipse(0, y, rx, ry, 0, 0, TAU); g.clip(); g.strokeStyle = K.alpha(INKC, 0.3); g.lineWidth = 0.8;
    for (let x = -rx + 5; x < rx; x += 5) { g.beginPath(); g.moveTo(x, y - ry); g.lineTo(x, y + ry); g.stroke(); } g.restore();
    if (trim) goldBand(g, 0, y + 2.6, rx, ry, 1.6);
  }
  function elfRail(g, rx, y, col, top) {
    const ry = rx * 0.36;
    for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI, x = Math.cos(a) * rx, yy = y + Math.sin(a) * ry; F(g, P.rr(x - 1.1, yy - 7.5, 2.2, 8, 0.8), col, { s: 0.4, h: 0.3, lw: 0.9 }); }
    g.strokeStyle = inkOf(top); g.lineWidth = 3.6; g.beginPath(); g.ellipse(0, y - 7, rx, ry, 0, 0.02, Math.PI - 0.02); g.stroke();
    g.strokeStyle = top; g.lineWidth = 2; g.stroke();
    // nhánh uốn vòng giữa các cột
    g.strokeStyle = K.alpha(top, 0.9); g.lineWidth = 0.9;
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI, x = Math.cos(a) * rx, yy = y + Math.sin(a) * ry; g.beginPath(); g.arc(x, yy - 3.4, 2.2, 0, TAU); g.stroke(); }
  }
  function leaves(g, x, y, r, col, n, seed) {
    const rr = K.seeded(seed || 7);
    for (let i = 0; i < (n || 3); i++) leafy(g, x + (rr() - 0.5) * r * 1.6, y + (rr() - 0.5) * r * 0.8, r * (0.65 + rr() * 0.35), i % 2 ? shade(col, -0.08) : col);
  }
  function lantern(g, x, y, col) { line(g, x, y - 5, x, y, '#5a3a22', 0.8); K.glow(g, x, y + 3, 7, col, 0.7); F(g, P.rr(x - 2, y, 4, 5.5, 1.4), col, { s: 0, h: 0.6, lw: 0.9, light: '#ffffff' }); F(g, P.rr(x - 2.6, y - 0.8, 5.2, 1.6, 0.6), GOLD, { s: 0, h: 0, lw: 0.7 }); }

  function archerStatic(g, tier) {
    const top = ARCH_TOP[tier];
    if (tier === 1) {
      mound(g, 28, '#5f9a3e');
      trunk(g, -top - 4, 11, 7.5, '#8a5a36');
      leaves(g, -20, top + 14, 7, '#5aaa52', 2, 3); leaves(g, 20, top + 12, 7, '#4f9a48', 2, 5);
      deck(g, top, 24, '#b07a48');
    } else if (tier === 2) {
      mound(g, 30, '#5f9a3e');
      trunk(g, -top - 4, 14, 9, '#86553a');
      door(g, 0, 5, 10, 15, '#3f6a34', '#6a4a2a'); K.glow(g, 0, -2, 9, '#bfffb0', 0.4);
      leaves(g, -24, top + 15, 8.5, '#5aaa52', 3, 11); leaves(g, 24, top + 13, 8.5, '#4f9a48', 3, 13);
      deck(g, top, 27, '#b07a48');
      lantern(g, -18, top + 9, '#c8ffb0'); lantern(g, 18, top + 9, '#c8ffb0');
      banner(g, 10, -24, 8, 14, '#2f7a44', markLeaf);
    } else if (tier === 3) {
      mound(g, 32, '#5aa040');
      trunk(g, -top - 4, 16, 10.5, '#7e4e34', { vine: '#7ac860', rune: '#9affc0' });
      door(g, 0, 5, 11, 17, '#2f6a3a', GOLD); K.glow(g, 0, -2, 11, '#bfffd0', 0.5);
      win(g, -8, -36, 4.2, 7, '#c8ffd8', { frame: GOLD }); win(g, 8, -42, 4.2, 7, '#c8ffd8', { frame: GOLD });
      leaves(g, -27, top + 17, 9.5, '#5aaa52', 3, 17); leaves(g, 27, top + 15, 9.5, '#4f9a48', 3, 19);
      deck(g, top, 28, '#a8743e', true);
      lantern(g, -20, top + 10, '#bfffd8'); lantern(g, 20, top + 10, '#bfffd8');
    } else {
      mound(g, 34, '#5aa040');
      for (const s of [-1, 1]) crystal(g, s * 30, 4, 0.7, '#9ff0d0');
      trunk(g, -top - 4, 18, 11.5, '#efe4cc', { vine: GOLD, rune: '#7affb8' });
      door(g, 0, 5, 12, 18, '#2f7a4a', GOLD); K.glow(g, 0, -3, 13, '#bfffe0', 0.6);
      win(g, -8, -40, 4.4, 8, '#c8ffe4', { frame: GOLD }); win(g, 9, -48, 4.4, 8, '#c8ffe4', { frame: GOLD });
      leaves(g, -30, top + 18, 10.5, '#6ab85a', 3, 23); leaves(g, 30, top + 16, 10.5, '#5aaa52', 3, 29);
      deck(g, top, 30, '#f2e8d0', true);
      lantern(g, -22, top + 10, '#c8ffe8'); lantern(g, 22, top + 10, '#c8ffe8');
    }
  }
  function archerFx(g, tier, t, st, env) {
    const top = ARCH_TOP[tier];
    if (tier >= 2) { // tán lá vòm phía sau xạ thủ
      const hh = [0, 0, 30, 40, 50][tier], rx = [0, 0, 26, 28, 31][tier], col = tier === 4 ? '#7acb6a' : '#5aaa52';
      for (let i = 0; i <= 6; i++) { const a = Math.PI + i / 6 * Math.PI, x = Math.cos(a) * rx, y = top - 2 + Math.sin(a) * hh; leafy(g, x, y, (tier === 2 ? 7 : 8.5) + (i % 2) * 1.5, i % 2 ? shade(col, -0.1) : col); }
      if (tier === 4) {
        const y = top - hh - 12 + Math.sin(t * 2) * 2;
        K.glow(g, 0, y, 18, '#bfffe0', 0.7 + Math.sin(t * 3) * 0.2);
        crystal(g, 0, y + 7, 0.85, '#9ff0d0');
      }
    }
    const face = st.face || 1, k = st.k || 0, a = st.a === undefined ? -1 : st.a;
    env.char('elf' + tier, -9, top, face, k % 2 === 0 ? a : -1, t);
    env.char('elf' + tier, 9, top + 1, face, k % 2 === 1 ? a : -1, t + 0.9);
    const rx = [0, 24, 27, 28, 30][tier];
    elfRail(g, rx - 1, top + 1, tier >= 3 ? '#f4f1e6' : '#8a5a32', tier >= 3 ? GOLD : '#a87444');
    if (tier === 1) flag(g, 21, top - 4, 16, '#3a8a4a', t);
    if (tier >= 3) for (let i = 0; i < tier; i++) { const p = (t * 0.32 + i / tier) % 1; g.save(); g.globalAlpha = Math.sin(p * Math.PI) * 0.9; g.translate(Math.sin(i * 2.2 + p * 5) * 28, top + 8 - p * 46); g.rotate(p * 6 + i); F(g, P.ell(0, 0, 2.4, 1.2), i % 2 ? '#bff0a0' : '#e8ffb0', { s: 0, h: 0, lw: 0.6 }); g.restore(); }
  }

  /* =====================================================
   * TRỤ THÀNH – LÂU ĐÀI LOÀI NGƯỜI (đá trắng, mái xanh lam, viền vàng)
   * ===================================================== */
  const STONE = '#e4e1ea', ROOF = '#2c55b8';
  function barracksStatic(g, tier) {
    if (tier === 1) {
      foundation(g, 32, '#9a948a', '#6aa84a');
      wall(g, -2, 3, 36, 26, '#d8d4dc');
      gable(g, -2, -22, 40, 20, ROOF);
      door(g, -2, 4, 12, 16, '#6a3e20', '#a09a8e');
      win(g, -13, -11, 4.4, 7);
      cyl(g, 22, 2, 8.5, 30, STONE, { ry: 3, top: false, rowH: 6 });
      cone(g, 22, -28, 10.5, 18, ROOF, { trim: GOLD });
      win(g, 22, -14, 3.6, 6.5);
      for (let i = 0; i < 3; i++) { const x = -32 + i * 4.6; F(g, P.poly([x - 2, 7, x - 2, -5, x, -9, x + 2, -5, x + 2, 7]), '#a87444', { s: 0.6, h: 0.3, lw: 1 }); }
    } else if (tier === 2) {
      foundation(g, 34, '#9a948a', '#6aa84a');
      cyl(g, -23, -2, 11, 44, STONE, { ry: 4, top: false, rowH: 6.5 });
      wall(g, 6, 3, 40, 32, '#dcd8e2');
      merlons(g, -14, 26, -29, '#dcd8e2', 4);
      cone(g, -23, -46, 13.5, 24, ROOF, { trim: GOLD });
      win(g, -23, -26, 4.4, 8); win(g, 16, -14, 4.6, 8);
      door(g, 4, 4, 14, 19, '#6a3e20', GOLD);
      banner(g, 18, -27, 8, 14, '#2a55b8', (c, x, y) => { line(c, x, y - 3.4, x, y + 3.6, GOLD, 1.3); line(c, x - 2.6, y - 0.8, x + 2.6, y - 0.8, GOLD, 1.3); });
    } else if (tier === 3) {
      foundation(g, 36, '#9a948a', '#6aa84a');
      for (const s of [-1, 1]) cyl(g, s * 25, -3, 12, 44, STONE, { ry: 4.4, top: false, rowH: 6.5 });
      wall(g, 0, 4, 40, 38, '#dcd8e2', { band: GOLD });
      merlons(g, -20, 20, -34, '#dcd8e2', 4);
      for (const s of [-1, 1]) { F(g, P.rr(s * 25 - 13, -50, 26, 4.5, 2), GOLD, { s: 0.6, h: 0.4 }); cone(g, s * 25, -48, 14.5, 26, ROOF, { trim: GOLD }); win(g, s * 25, -28, 4.4, 8); }
      door(g, 0, 5, 16, 22, '#5a3418', GOLD);
      g.save(); g.beginPath(); g.rect(-8, -17, 16, 22); g.clip(); g.strokeStyle = K.alpha('#2a2a34', 0.55); g.lineWidth = 1; for (let x = -6; x < 8; x += 3.2) { g.beginPath(); g.moveTo(x, -17); g.lineTo(x, -7); g.stroke(); } g.restore();
      banner(g, -12, -30, 8, 16, '#2a55b8', (c, x, y) => crest(c, x, y, 0.42)); banner(g, 12, -30, 8, 16, '#2a55b8', (c, x, y) => crest(c, x, y, 0.42));
    } else {
      foundation(g, 38, '#d8d2c4', '#5aa84a');
      cyl(g, 0, -20, 14, 48, STONE, { ry: 5, top: false, rowH: 6.5 });
      for (const s of [-1, 1]) cyl(g, s * 28, -3, 13, 54, STONE, { ry: 4.7, top: false, rowH: 6.5 });
      wall(g, 0, 5, 44, 40, '#e8e4ee', { band: GOLD });
      merlons(g, -22, 22, -35, '#e8e4ee', 5);
      F(g, P.rr(-16, -71, 32, 5, 2), GOLD, { s: 0.6, h: 0.4 });
      cone(g, 0, -68, 17, 40, ROOF, { trim: GOLD });
      win(g, 0, -55, 5, 9, '#ffe8a0', { frame: GOLD });
      for (const s of [-1, 1]) { F(g, P.rr(s * 28 - 14.5, -60, 29, 5, 2), GOLD, { s: 1, h: 0.5 }); cone(g, s * 28, -58, 15.5, 30, ROOF, { trim: GOLD }); win(g, s * 28, -36, 4.6, 9); win(g, s * 28, -18, 4.2, 7); }
      door(g, 0, 6, 17, 24, '#5a3418', GOLD);
      crest(g, 0, -27, 0.95);
      banner(g, -15, -31, 8, 20, '#2a55b8', (c, x, y) => crest(c, x, y, 0.42)); banner(g, 15, -31, 8, 20, '#2a55b8', (c, x, y) => crest(c, x, y, 0.42));
    }
  }
  function barracksFx(g, tier, t, st) {
    if (tier === 1) flag(g, 22, -46, 12, '#2a55b8', t);
    else if (tier === 2) flag(g, -23, -70, 13, '#2a55b8', t);
    else if (tier === 3) { flag(g, -25, -74, 12, '#2a55b8', t); flag(g, 25, -74, 12, '#2a55b8', t); }
    else { spire(g, 0, -108, 6); flag(g, 0, -114, 16, '#f4f1e6', t, 1, 1.1); flag(g, -28, -88, 11, '#2a55b8', t); flag(g, 28, -88, 11, '#2a55b8', t); }
    if (st.door > 0) K.glow(g, 0, -6, 20, '#ffd070', st.door);
  }

  /* =====================================================
   * TRỤ PHÁP – THÁP PHÙ THỦY (đá tím than, pha lê tím, quả cầu phép)
   * ===================================================== */
  const MAGE_TOP = [0, -44, -52, -62, -70];
  function mageStatic(g, tier) {
    const top = MAGE_TOP[tier], col = ['', '#7a7498', '#716a96', '#665c92', '#5c4f8e'][tier], gc = tier > 2 ? '#d8a8ff' : '#b98cff';
    foundation(g, 32, '#5e5a74', '#6aa84a');
    // vòng phù văn dưới nền
    g.save(); g.globalAlpha = 0.6; g.strokeStyle = gc; g.lineWidth = 1.1; g.beginPath(); g.ellipse(0, -2, 24, 8.6, 0, 0, TAU); g.stroke();
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; g.beginPath(); g.arc(Math.cos(a) * 27.5, -2 + Math.sin(a) * 10, 1, 0, TAU); g.stroke(); } g.restore();
    if (tier >= 2) for (const s of [-1, 1]) crystalCluster(g, s * 27, 2, tier > 2 ? 1.05 : 0.85, gc);
    const rb = 22 - tier * 0.4, tp = 3 + tier;
    // tinh thể sau đỉnh (vương miện pha lê) – vẽ trước thân để nằm phía sau nhân vật
    if (tier >= 3) for (const [x, s] of [[-15, 1.0], [-7, 1.45], [7, 1.35], [15, 0.95]]) crystal(g, x, top - 2, s * (tier === 4 ? 1.45 : 1.1), shade(gc, -0.08));
    cyl(g, 0, -1, rb, -(top + 2), col, { ry: 8.4, top: false, taper: tp, rowH: 7.5 });
    const tw = rb - tp;
    F(g, P.ell(0, top, tw + 3, (tw + 3) * 0.36), shade(col, 0.16), { s: 0, h: 0, lw: 1.4 });
    if (tier >= 2) goldBand(g, 0, top + 4, tw + 2.5, (tw + 2.5) * 0.36, 1.8);
    if (tier >= 3) goldBand(g, 0, -16, rb - 1.5, (rb - 1.5) * 0.36, 1.6);
    door(g, 0, 5, 11, 15, '#2a2058', tier > 2 ? GOLD : '#8a86a0');
    win(g, 0, top + 18, 5.5, 9, '#d8b8ff', { frame: tier > 2 ? GOLD : '#6a5a4a' });
    if (tier === 4) { win(g, -9, -27, 4, 8, '#e0b8ff', { frame: GOLD }); win(g, 9, -27, 4, 8, '#e0b8ff', { frame: GOLD }); }
    // lỗ châu mai kiểu mũi nhọn
    const n = 7; for (let i = 0; i < n; i++) { const a = Math.PI * (i + 0.5) / n, x = Math.cos(a) * (tw + 2.5), y = top + Math.sin(a) * (tw + 2.5) * 0.36;
      F(g, P.poly([x - 2.2, y + 1, x, y - 5.5, x + 2.2, y + 1]), shade(col, 0.05), { s: 0.6, h: 0.3, lw: 1 }); }
  }
  function mageFx(g, tier, t, st, env) {
    const top = MAGE_TOP[tier], cast = st.a >= 0 ? Math.sin(Math.min(1, st.a) * Math.PI) : 0;
    const gc = tier > 2 ? '#d8a8ff' : '#b98cff';
    if (tier >= 2) for (const s of [-1, 1]) K.glow(g, s * 27, -6, 12, gc, 0.45 + Math.sin(t * 3 + s) * 0.2);
    if (tier >= 3) for (const x of [-10, 10]) K.glow(g, x, top - 8, 10, gc, 0.35 + Math.sin(t * 2.5 + x) * 0.15);
    if (tier >= 3) {
      g.save(); g.translate(0, top - 16); g.scale(1, 0.34); g.rotate(t * 1.1);
      g.strokeStyle = K.alpha(gc, 0.85); g.lineWidth = 2.2; g.setLineDash([7, 5]); g.beginPath(); g.arc(0, 0, 30, 0, TAU); g.stroke(); g.setLineDash([]);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; dot(g, Math.cos(a) * 30, Math.sin(a) * 30, 2.4, '#ffffff'); }
      g.restore();
    }
    K.glow(g, 0, top - 18, 22, gc, 0.22 + cast * 0.6);
    env.char('mage' + tier, -2, top + 1, st.face || 1, st.a === undefined ? -1 : st.a, t);
    if (tier === 4) {
      const y = top - 64 + Math.sin(t * 2) * 3;
      K.glow(g, 0, y, 30, '#c890ff', 0.75 + cast * 0.4);
      g.save(); g.translate(0, y); g.scale(1, 0.38); g.rotate(-t * 1.6); g.strokeStyle = K.alpha('#f0d8ff', 0.8); g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, 15, 0, TAU); g.stroke(); g.restore();
      F(g, P.circ(0, y, 8.5), '#9a5aff', { s: 2.2, h: 1.6, lw: 1.4, light: '#f0d8ff' }); dot(g, -2.6, y - 2.8, 2, '#fff');
      for (let i = 0; i < 3; i++) { const a = t * 2 + i * TAU / 3; crystal(g, Math.cos(a) * 20, y + Math.sin(a) * 7 + 6, 0.5, '#e6d0ff'); }
    }
    for (let i = 0; i < tier + 2; i++) { const p = (t * 0.45 + i / (tier + 2)) % 1; g.save(); g.globalAlpha = Math.sin(p * Math.PI); const x = Math.sin(i * 2 + p * 4) * 24, y = top + 8 - p * 54; if (i % 3 === 0) star(g, x, y, 1.8, '#fff0ff', false); else dot(g, x, y, 1.3, i % 2 ? '#ffffff' : gc); g.restore(); }
  }

  /* =====================================================
   * TRỤ PHÁO – LÒ RÈN PHÁO NGƯỜI LÙN (sắt đen, đồng thau, lò lửa)
   * ===================================================== */
  const ART_Y = [0, -10, -18, -24, -28];
  const CANNON = [null, { s: 1.0, col: '#5a5e6a', band: '#a8743a' }, { s: 1.15, col: '#c8903a', band: '#7a4a1a' }, { s: 1.3, col: '#b87a3a', band: '#3a3040' }, { s: 1.45, col: '#e0a83e', band: '#2e2a36' }];
  const CANNON_ANG = -0.42;
  function cannon(g, x, y, tier, recoil, face) {
    const C = CANNON[tier], s = C.s;
    g.save(); g.translate(x, y); g.scale(s * face, s);
    // bệ xe pháo
    F(g, P.poly([-12, 1, -8, -8, 6, -9, 10, 1]), tier > 2 ? '#4a4652' : '#6b4426', { s: 1.2, h: 0.6, lw: 1.2 });
    for (const wx of [-7.5, 6.5]) { F(g, P.circ(wx, 1.5, 4.6), tier > 2 ? '#3a3640' : '#5a3a22', { s: 1, h: 0.5, lw: 1.2 }); F(g, P.circ(wx, 1.5, 1.6), C.band, { s: 0, h: 0, lw: 0.7 });
      g.strokeStyle = K.alpha(INKC, 0.5); g.lineWidth = 0.8; for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI; g.beginPath(); g.moveTo(wx + Math.cos(a) * 4.2, 1.5 + Math.sin(a) * 4.2); g.lineTo(wx - Math.cos(a) * 4.2, 1.5 - Math.sin(a) * 4.2); g.stroke(); } }
    g.translate(-1 - recoil * 3, -7); g.rotate(CANNON_ANG + recoil * 0.06);
    // nòng: chuôi tròn → miệng loe
    F(g, P.circ(-6, 0, 5.4), shade(C.col, -0.05), { s: 1.4, h: 0.8, lw: 1.2 });
    F(g, c => { c.moveTo(-6, -5.6); c.lineTo(18, -4.2); c.lineTo(18, 4.2); c.lineTo(-6, 5.6); c.closePath(); }, C.col, { s: 2, h: 1.1, lw: 1.3 });
    for (const bx of [-1, 7, 14]) { g.strokeStyle = inkOf(C.band); g.lineWidth = 3.4; g.beginPath(); g.moveTo(bx, -5.4 + bx * 0.06); g.lineTo(bx, 5.4 - bx * 0.06); g.stroke(); g.strokeStyle = C.band; g.lineWidth = 2; g.stroke(); }
    F(g, P.rr(17, -6, 5, 12, 1.6), C.band, { s: 0.8, h: 0.5, lw: 1.2 });
    F(g, P.ell(22, 0, 1.6, 4.2), '#1a1220', { s: 0, h: 0, lw: 0.8 });
    if (tier >= 3) { F(g, P.circ(3, -0.2, 3.6), C.band, { s: 0, h: 0.3, lw: 0.9 }); star(g, 3, -0.2, 2.6, tier === 4 ? '#fff0b0' : GOLD); }
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-4, -3.6, 21, 1.1);
    if (recoil > 0.05) { K.glow(g, 26, 0, 16 * recoil + 4, '#ffb84a', recoil); }
    g.restore();
  }
  /** Toạ độ miệng nòng (đơn vị trụ, chưa nhân mặt) – towers.js dùng để bắn */
  function cannonMuzzle(tier) {
    const C = CANNON[tier], s = C.s, a = CANNON_ANG, px = 6 - 1, py = ART_Y[tier] + 2 - 7 * s;
    return { x: px * s + Math.cos(a) * 22 * s + 6, y: py + Math.sin(a) * 22 * s };
  }
  function sandbags(g, x, y, n) { for (let i = 0; i < n; i++) F(g, P.ell(x + (i % 3) * 7 - (i > 2 ? -3.5 : 0), y - Math.floor(i / 3) * 4.6, 4.4, 2.8), '#c8a870', { s: 1, h: 0.5, lw: 1 }); }
  function barrel(g, x, y, col) { F(g, P.rr(x - 4.5, y - 11, 9, 11, 3), col || '#8a5a32', { s: 1.2, h: 0.6, lw: 1.1 }); for (const yy of [-8.5, -2.5]) line(g, x - 4.4, y + yy, x + 4.4, y + yy, '#50545e', 1.3); F(g, P.ell(x, y - 11, 4.5, 1.6), shade(col || '#8a5a32', 0.15), { s: 0, h: 0, lw: 0.9 }); }
  function rivets(g, cx, y, rx, ry) { for (let i = -3; i <= 3; i++) { const x = i * rx * 0.27; dot(g, cx + x, y + ry * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2)), 1.1, '#e8d8a8'); } }
  function artilleryStatic(g, tier) {
    if (tier === 1) {
      foundation(g, 32, '#9a8a72', '#6aa84a');
      planks(g, 0, -1, 58, 9, '#b07a48');
      sandbags(g, -26, -2, 5); barrel(g, 25, -3, '#8a5a32');
      F(g, P.circ(30, -2, 2.8), '#3a3a46', { s: 0.6, h: 0.5, lw: 1, light: '#8a8a98' }); F(g, P.circ(26.5, 0, 2.8), '#3a3a46', { s: 0.6, h: 0.5, lw: 1, light: '#8a8a98' });
    } else if (tier === 2) {
      foundation(g, 34, '#9a948a', '#6aa84a');
      cyl(g, 0, -1, 32, 16, '#b4a898', { ry: 11.5, top: false, rowH: 7 });
      goldBand(g, 0, -6, 32, 11.5, 2.2);
      F(g, P.ell(0, -17, 32, 11.5), '#9a8e7e', { s: 0, h: 0, lw: 1.3 });
      battlements(g, 0, -17, 30, '#b4a898', 9);
      barrel(g, 26, -18, '#8a5a32');
      banner(g, -27, -13, 8, 13, '#b8402a', markHammer);
    } else if (tier === 3) {
      foundation(g, 35, '#7a7480', '#6aa84a');
      cyl(g, 0, -1, 33, 22, '#6a6670', { ry: 12, top: false, rowH: 7.5 });
      for (const y of [-6, -16]) { goldBand(g, 0, y, 33, 12, 2.4); rivets(g, 0, y, 33, 12); }
      for (let i = 0; i < 3; i++) { const x = -16 + i * 16, yy = -1 + 12 * Math.sqrt(1 - (x / 33) ** 2); K.glow(g, x, yy - 4, 7, '#ff8a2a', 0.75); F(g, P.rr(x - 3, yy - 8, 6, 5, 1), '#ffb84a', { s: 0, h: 0.6, lw: 1, light: '#fff0b0' }); }
      F(g, P.ell(0, -23, 33, 12), '#58545e', { s: 0, h: 0, lw: 1.3 });
      battlements(g, 0, -23, 31, '#6a6670', 9);
      cyl(g, -27, -26, 5.5, 20, '#4a4652', { ry: 2, bricks: false }); goldBand(g, -27, -38, 5.5, 2, 1.4);
      F(g, P.ell(-27, -46, 3.6, 1.3), '#1a1220', { s: 0, h: 0, lw: 0.8 });
      banner(g, 27, -21, 8, 15, '#b8402a', markHammer);
    } else {
      foundation(g, 37, '#5e5a66', '#5aa84a');
      cyl(g, 0, -1, 35, 26, '#4a4652', { ry: 12.6, top: false, rowH: 7.5 });
      goldBand(g, 0, -4, 35, 12.6, 3); goldBand(g, 0, -20, 35, 12.6, 2.4); rivets(g, 0, -20, 35, 12.6);
      for (let i = 0; i < 5; i++) { const x = -24 + i * 12, yy = -2 + 12 * Math.sqrt(1 - (x / 35) ** 2); K.glow(g, x, yy - 4, 7, '#ff7a1a', 0.85); F(g, P.rr(x - 2.2, yy - 9, 4.4, 6, 1), '#ffb84a', { s: 0, h: 0.6, lw: 0.9, light: '#fff0b0' }); }
      F(g, P.ell(0, -27, 35, 12.6), '#3e3a46', { s: 0, h: 0, lw: 1.3 });
      battlements(g, 0, -27, 33, '#4a4652', 10);
      for (const s of [-1, 1]) { cyl(g, s * 29, -29, 6, 24, '#3a3640', { ry: 2.2, bricks: false }); goldBand(g, s * 29, -44, 6, 2.2, 1.6); F(g, P.ell(s * 29, -53, 4, 1.5), '#1a1220', { s: 0, h: 0, lw: 0.8 }); }
      F(g, P.circ(0, -8, 7.5), '#2e2a36', { s: 1, h: 0.6, lw: 1.3 }); star(g, 0, -8, 5, GOLD);
    }
  }
  function artilleryFx(g, tier, t, st, env) {
    const recoil = st.a >= 0 ? Math.max(0, Math.sin(Math.min(1, st.a * 1.6) * Math.PI)) : 0;
    const y = ART_Y[tier], f = st.face || 1;
    env.char('dwarf', -21 * f, y - 2, f, -1, t);
    cannon(g, 6 * f, y + 2, tier, recoil, f);
    if (tier === 4) { K.glow(g, 0, -10, 30, '#ff8a2a', 0.2 + Math.sin(t * 3) * 0.08); }
    if (tier === 3) smoke(g, -27, -48, t, 3);
    if (tier === 4) { smoke(g, -29, -55, t, 3, '#a8a0a0'); smoke(g, 29, -55, t + 0.5, 3, '#a8a0a0'); for (let i = 0; i < 3; i++) { const p = (t * 0.8 + i / 3) % 1; g.save(); g.globalAlpha = Math.sin(p * Math.PI); dot(g, -29 + Math.sin(i * 3 + p * 6) * 3, -55 - p * 20, 1, '#ffb84a'); g.restore(); } }
  }

  /* =====================================================
   * TRỤ THÚ – TRẠI CHIẾN ORC (lều da đỏ, hàng rào cọc nhọn, ngà, đầu lâu, lửa)
   * ===================================================== */
  function dirtBase(g, rx) {
    K.shadow(g, 3, 7, rx * 1.3, rx * 0.5, 0.48);
    const ry = rx * 0.38;
    cyl(g, 0, 5, rx, 6, '#7a5a3a', { ry, top: false, bricks: false });
    F(g, P.ell(0, -1, rx, ry), '#9a7650', { s: 0, h: 0, lw: 1.4 });
    const r = K.seeded(rx * 5);
    g.save(); g.beginPath(); g.ellipse(0, -1, rx, ry, 0, 0, TAU); g.clip();
    for (let i = 0; i < 26; i++) K.dot(g, (r() - 0.5) * rx * 1.9, -1 + (r() - 0.5) * ry * 1.9, 0.8 + r() * 1.6, r() < 0.5 ? 'rgba(60,30,10,0.3)' : 'rgba(255,230,180,0.22)');
    g.restore();
    for (let i = 0; i < 8; i++) { const a = 0.2 + r() * (Math.PI - 0.4); tuft(g, Math.cos(a) * rx, 6 + Math.sin(a) * ry, 2.5 + r() * 2.5, '#6a9a3a'); }
  }
  function stake(g, x, y, h, col, metal) {
    F(g, P.poly([x - 2.4, y, x - 2.4, y - h + 4, x, y - h - (metal ? 0 : 1), x + 2.4, y - h + 4, x + 2.4, y]), col, { s: 0.8, h: 0.4, lw: 1.1 });
    if (metal) F(g, P.poly([x - 2.6, y - h + 5, x, y - h - 4, x + 2.6, y - h + 5]), '#a8acb8', { s: 0.4, h: 0.3, lw: 1 });
    line(g, x - 2.4, y - h * 0.4, x + 2.4, y - h * 0.4 + 1, '#5a3a22', 1);
  }
  function palisade(g, rx, h, metal) {
    const ry = rx * 0.38, n = 9;
    for (let i = 0; i <= n; i++) { const a = Math.PI + i / n * Math.PI, x = Math.cos(a) * rx, y = Math.sin(a) * ry - 1; stake(g, x, y + 2, h * (0.85 + (i % 2) * 0.2), i % 2 ? '#8a5a32' : '#7a4c2a', metal); }
  }
  function tusk(g, x, y, s, dir) {
    F(g, c => { c.moveTo(x, y); c.quadraticCurveTo(x + dir * 12 * s, y - 6 * s, x + dir * 6 * s, y - 26 * s); c.quadraticCurveTo(x + dir * 3 * s, y - 10 * s, x - dir * 4 * s, y - 1 * s); c.closePath(); }, '#f2e8d0', { s: 1.2, h: 0.6, lw: 1.2 });
    for (let i = 1; i < 3; i++) line(g, x + dir * (5 - i) * s, y - i * 6 * s, x + dir * (9 - i * 1.5) * s, y - i * 6 * s - 2 * s, '#b8a888', 0.8);
  }
  function skull(g, x, y, s, horned) {
    if (horned) for (const d of [-1, 1]) F(g, c => { c.moveTo(x + d * 3 * s, y - 2 * s); c.quadraticCurveTo(x + d * 11 * s, y - 3 * s, x + d * 10 * s, y - 12 * s); c.quadraticCurveTo(x + d * 7 * s, y - 6 * s, x + d * 2 * s, y - 5 * s); c.closePath(); }, '#e8dcc0', { s: 0.6, h: 0.4, lw: 1 });
    F(g, c => { c.moveTo(x - 4.4 * s, y + 1 * s); c.quadraticCurveTo(x - 5 * s, y - 6.5 * s, x, y - 6.6 * s); c.quadraticCurveTo(x + 5 * s, y - 6.5 * s, x + 4.4 * s, y + 1 * s); c.lineTo(x + 2.6 * s, y + 4 * s); c.lineTo(x - 2.6 * s, y + 4 * s); c.closePath(); }, '#efe6d0', { s: 1, h: 0.5, lw: 1 });
    dot(g, x - 1.8 * s, y - 1.6 * s, 1.3 * s, '#2a1418'); dot(g, x + 1.8 * s, y - 1.6 * s, 1.3 * s, '#2a1418');
    F(g, P.poly([x - 0.7 * s, y + 1.4 * s, x, y + 0.2 * s, x + 0.7 * s, y + 1.4 * s]), '#2a1418', { s: 0, h: 0, lw: 0 });
  }
  function brazier(g, x, y) {
    for (const d of [-1, 1]) post(g, x + d * 1.5, y - 7, x + d * 4.5, y + 1, 1.2, '#3a3640');
    F(g, c => { c.moveTo(x - 6, y - 9); c.lineTo(x + 6, y - 9); c.quadraticCurveTo(x + 5, y - 4, x, y - 4); c.quadraticCurveTo(x - 5, y - 4, x - 6, y - 9); c.closePath(); }, '#4a4652', { s: 0.8, h: 0.5, lw: 1.1 });
  }
  /** Lều da hình nón (nhìn chính diện) */
  function tent(g, cx, yb, w, h, col, stripe, o) {
    o = o || {};
    const path = c => { c.moveTo(cx - w / 2, yb); c.quadraticCurveTo(cx - w * 0.2, yb - h * 0.45, cx, yb - h); c.quadraticCurveTo(cx + w * 0.2, yb - h * 0.45, cx + w / 2, yb); c.quadraticCurveTo(cx, yb + w * 0.16, cx - w / 2, yb); c.closePath(); };
    for (const d of [-1, 1]) post(g, cx + d * 1.2, yb - h + 2, cx + d * 5, yb - h - 9, 1.6, '#6b4426');
    shaded(g, path, col, cx - w / 2, cx + w / 2, { lw: 1.6, inner: g2 => {
      if (stripe) { g2.fillStyle = stripe; for (let i = -2; i <= 2; i++) { if (i % 2) continue; const x0 = cx + i * w * 0.14; g2.beginPath(); g2.moveTo(cx, yb - h); g2.lineTo(x0 - w * 0.06, yb + 8); g2.lineTo(x0 + w * 0.06, yb + 8); g2.closePath(); g2.fill(); } }
      if (o.band) { g2.fillStyle = o.band; g2.fillRect(cx - w / 2, yb - h * 0.34, w, 3); g2.fillRect(cx - w / 2, yb - 4, w, 3); }
      if (o.patch) { g2.fillStyle = shade(col, -0.2); g2.fillRect(cx - w * 0.3, yb - h * 0.45, 7, 6); g2.fillRect(cx + w * 0.12, yb - h * 0.25, 6, 5);
        g2.strokeStyle = '#3a2418'; g2.lineWidth = 0.7; for (const [px, py, pw] of [[cx - w * 0.3, yb - h * 0.45, 7], [cx + w * 0.12, yb - h * 0.25, 6]]) for (let k = 1; k < pw; k += 2) { g2.beginPath(); g2.moveTo(px + k, py - 1); g2.lineTo(px + k, py + 1); g2.stroke(); } }
      g2.fillStyle = 'rgba(255,240,210,0.15)'; g2.beginPath(); g2.moveTo(cx, yb - h); g2.lineTo(cx - w * 0.42, yb); g2.lineTo(cx - w * 0.3, yb); g2.closePath(); g2.fill();
    } });
    // cửa lều
    const dw = o.door || w * 0.26, dh = h * 0.48;
    F(g, c => { c.moveTo(cx - dw / 2, yb + 2); c.quadraticCurveTo(cx - dw * 0.2, yb - dh * 0.5, cx, yb - dh); c.quadraticCurveTo(cx + dw * 0.2, yb - dh * 0.5, cx + dw / 2, yb + 2); c.closePath(); }, '#2a1418', { s: 0, h: 0, lw: 1.2 });
    K.glow(g, cx, yb - dh * 0.3, dw, '#ff8a3a', 0.35);
    F(g, c => { c.moveTo(cx - dw / 2, yb + 2); c.quadraticCurveTo(cx - dw * 0.3, yb - dh * 0.5, cx, yb - dh); c.lineTo(cx - dw * 0.15, yb - dh * 0.4); c.quadraticCurveTo(cx - dw * 0.55, yb - dh * 0.1, cx - dw * 0.75, yb + 2); c.closePath(); }, shade(col, -0.1), { s: 0.6, h: 0.3, lw: 1 });
  }
  const markOrc = (g, x, y) => { line(g, x - 3, y - 4, x + 3, y + 3.6, '#1a1418', 1.6); line(g, x + 3, y - 4, x - 3, y + 3.6, '#1a1418', 1.6); F(g, P.ell(x - 3.4, y - 3.6, 1.8, 1.2, -0.7), '#1a1418', { s: 0, h: 0, lw: 0 }); F(g, P.ell(x + 3.4, y - 3.6, 1.8, 1.2, 0.7), '#1a1418', { s: 0, h: 0, lw: 0 }); };
  function warBanner(g, x, y, w, h, col) {
    F(g, c => { c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.lineTo(x + w / 4, y + h - 3); c.lineTo(x, y + h + 1); c.lineTo(x - w / 4, y + h - 3); c.lineTo(x - w / 2, y + h); c.closePath(); }, col, { s: 1.4, h: 0.6, lw: 1.2 });
    post(g, x - w / 2 - 2, y - 1, x + w / 2 + 2, y - 1, 1.6, '#5a3a22');
    markOrc(g, x, y + h * 0.45);
  }
  function beastStatic(g, tier) {
    if (tier === 1) {
      dirtBase(g, 30);
      for (const [x, y] of [[-26, -4], [-18, -9], [24, -5]]) stake(g, x, y, 16, '#8a5a32');
      tent(g, 0, 3, 40, 34, '#a07850', null, { patch: true });
      skull(g, -24, 4, 0.8, false);
      F(g, P.ell(19, 5, 4.2, 1.4), '#efe6d0', { s: 0, h: 0, lw: 0.8 }); F(g, P.ell(23, 3, 3.6, 1.2, 0.6), '#efe6d0', { s: 0, h: 0, lw: 0.8 });
    } else if (tier === 2) {
      dirtBase(g, 32);
      palisade(g, 31, 22, false);
      tent(g, 0, 3, 46, 42, '#9a3024', '#6a1e18');
      tusk(g, -14, 6, 0.75, -1); tusk(g, 14, 6, 0.75, 1);
      skull(g, 0, -27, 0.7, false);
      brazier(g, 25, 6);
    } else if (tier === 3) {
      dirtBase(g, 34);
      palisade(g, 33, 26, true);
      tent(g, 0, 3, 52, 48, '#a8302a', '#2a1a1a', { band: GOLD });
      tusk(g, -16, 7, 0.9, -1); tusk(g, 16, 7, 0.9, 1);
      skull(g, 0, -30, 0.85, true);
      post(g, -28, 8, -28, -34, 2.6, '#6b4426'); skull(g, -28, -36, 0.75, true);
      brazier(g, 27, 7);
    } else {
      dirtBase(g, 37);
      palisade(g, 36, 30, true);
      // vách lều tròn + mái nón sọc đỏ – đen – vàng
      cyl(g, 0, 3, 28, 16, '#7a2620', { ry: 10, top: false, bricks: false });
      goldBand(g, 0, -1, 28, 10, 2.2);
      for (let i = -2; i <= 2; i++) { const x = i * 11; stake(g, x, 7 + 10 * Math.sqrt(1 - (x / 28) ** 2) - 3, 6, '#e8dcc0'); }
      tent(g, 0, -12, 64, 46, '#b8322a', '#1e1414', { band: GOLD, door: 14 });
      post(g, 0, -58, 0, -70, 2, '#3a3640'); F(g, P.poly([-2.4, -70, 0, -78, 2.4, -70]), '#c8ccd6', { s: 0.4, h: 0.3, lw: 1 });
      F(g, c => { c.moveTo(-9, 4); c.quadraticCurveTo(-9, -16, 0, -17); c.quadraticCurveTo(9, -16, 9, 4); c.closePath(); }, '#2a1418', { s: 0, h: 0, lw: 1.3 });
      K.glow(g, 0, -4, 12, '#ff8a3a', 0.45);
      tusk(g, -12, 8, 1.1, -1); tusk(g, 12, 8, 1.1, 1);
      skull(g, 0, -21, 1.05, true);
      post(g, -31, 9, -31, -40, 2.8, '#6b4426'); skull(g, -31, -42, 0.85, true);
      brazier(g, -20, 10); brazier(g, 28, 8);
    }
  }
  function beastFx(g, tier, t, st) {
    if (tier === 1) flag(g, 26, -10, 18, '#9a2a22', t);
    if (tier === 2) { fire(g, 25, -3, 0.8, t, 1); flag(g, -28, -18, 16, '#9a2a22', t, -1); }
    if (tier === 3) { fire(g, 27, -2, 0.9, t, 2); warBanner(g, 28, -42, 10, 16, '#9a2a22'); }
    if (tier === 4) { fire(g, -20, 1, 0.95, t, 3); fire(g, 28, -1, 0.95, t, 5); warBanner(g, 31, -46, 11, 18, '#9a2a22'); smoke(g, 0, -80, t, 2, '#9a9090', 18); }
    if (st.door > 0) K.glow(g, 0, -6, 22, '#ff9a4a', st.door);
  }

  window.ArtTowers = {
    archer:    { static: archerStatic,    fx: archerFx,    box: [130, 200, 65, 160] },
    barracks:  { static: barracksStatic,  fx: barracksFx,  box: [130, 180, 65, 140] },
    mage:      { static: mageStatic,      fx: mageFx,      box: [130, 220, 65, 180] },
    artillery: { static: artilleryStatic, fx: artilleryFx, box: [130, 130, 65, 90] },
    beast:     { static: beastStatic,     fx: beastFx,     box: [140, 140, 70, 100] },
    /** chiều cao hình (đv trụ) để căn chân dung giao diện */
    HEIGHT: { archer: [0, 82, 100, 114, 140], barracks: [0, 56, 76, 82, 124], mage: [0, 86, 96, 110, 150], artillery: [0, 46, 52, 60, 66], beast: [0, 52, 58, 62, 80] },
    ARCH_TOP, MAGE_TOP, ART_Y, cannonMuzzle
  };
})();
