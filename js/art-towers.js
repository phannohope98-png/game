/* =========================================================
 * art-towers.js – 4 loại trụ × 4 cấp, phong cách anime fantasy
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

  /* =====================================================
   * THÁP CUNG ELF
   * ===================================================== */
  const ARCH_TOP = [0, -40, -50, -58, -66];
  function archerStatic(g, tier) {
    const top = ARCH_TOP[tier];
    if (tier === 1) {
      foundation(g, 30, '#9a948a', '#6aa84a');
      for (const [x1, x2] of [[-20, -14], [20, 14]]) post(g, x1, 2, x2, top + 6, 4.4);
      post(g, -18, -10, 16, -26, 2.6); post(g, 18, -10, -16, -26, 2.6);
      for (const [x1, x2] of [[-9, -7], [9, 7]]) post(g, x1, 4, x2, top + 6, 4);
      planks(g, 0, top + 7, 46, 8, '#b07a48');
    } else if (tier === 2) {
      foundation(g, 32, '#a49e94', '#6aa84a');
      cyl(g, 0, -1, 26, 22, '#b4aea2', { ry: 9, top: false });
      for (const x of [-17, 17]) post(g, x, -22, x * 0.86, top + 6, 4.4);
      post(g, -15, -26, 14, top + 12, 2.6); post(g, 15, -26, -14, top + 12, 2.6);
      planks(g, 0, top + 7, 52, 9, '#b07a48');
      door(g, 0, 4, 11, 15, '#7a4a26', '#9a948a');
      banner(g, -15, -26, 9, 16, '#3a8a4a', markLeaf);
    } else if (tier === 3) {
      foundation(g, 33, '#cfc8b8', '#5aa84a');
      cyl(g, 0, -1, 28, -(top + 9), '#f0eadc', { ry: 10, top: false, taper: 6 });
      F(g, P.rr(-27, top + 3, 54, 8, 3), '#4a9a5a', { s: 1.6, h: 0.8 });
      line(g, -25, top + 5.5, 25, top + 5.5, GOLD, 1.2);
      win(g, -9, -30, 5.5, 10, '#bfffd8'); win(g, 9, -30, 5.5, 10, '#bfffd8');
      door(g, 0, 5, 12, 17, '#4a8a4a', GOLD);
      g.strokeStyle = GOLD; g.lineWidth = 1.8; g.beginPath(); g.ellipse(0, -16, 26, 9, 0, 0.08, Math.PI - 0.08); g.stroke();
      for (const s of [-1, 1]) leafy(g, s * 30, top + 13, 8.5, '#5aaa52');
    } else {
      foundation(g, 35, '#e0dacc', '#5aa84a');
      cyl(g, 0, -1, 31, -(top + 9), '#fbf7ec', { ry: 11, top: false, taper: 8 });
      g.strokeStyle = GOLD; g.lineWidth = 2;
      for (const y of [-18, -42]) { g.beginPath(); g.ellipse(0, y, 29 - (-y) * 0.09, 10, 0, 0.08, Math.PI - 0.08); g.stroke(); }
      win(g, 0, -31, 7, 13, '#c8ffe4'); win(g, -14, -28, 4.6, 9, '#c8ffe4'); win(g, 14, -28, 4.6, 9, '#c8ffe4');
      door(g, 0, 5, 13, 18, '#2f7a4a', GOLD);
      F(g, P.rr(-30, top + 2, 60, 9, 3.4), GOLD, { s: 1.8, h: 0.9 });
      for (const s of [-1, 1]) { leafy(g, s * 33, top + 12, 10, '#6ab85a'); leafy(g, s * 26, -8, 7.5, '#5aaa52'); }
    }
  }
  function archerFx(g, tier, t, st, env) {
    const top = ARCH_TOP[tier];
    if (tier >= 3) { // vòm lá phía sau xạ thủ
      const col = tier === 4 ? '#eef6e6' : '#5aaa52', hh = 40 + (tier - 3) * 12;
      F(g, c => { c.moveTo(-26, top + 2); c.quadraticCurveTo(-31, top - hh * 0.7, 0, top - hh); c.quadraticCurveTo(31, top - hh * 0.7, 26, top + 2); c.quadraticCurveTo(0, top - hh * 0.42, -26, top + 2); c.closePath(); }, col, { s: 2.4, h: 1 });
      if (tier === 4) {
        g.strokeStyle = GOLD; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-22, top - 2); g.quadraticCurveTo(-26, top - hh * 0.66, 0, top - hh * 0.92); g.quadraticCurveTo(26, top - hh * 0.66, 22, top - 2); g.stroke();
        const y = top - hh - 10 + Math.sin(t * 2) * 2;
        K.glow(g, 0, y, 16, '#bfffe0', 0.7 + Math.sin(t * 3) * 0.2);
        crystal(g, 0, y + 7, 0.8, '#9ff0d0');
        for (let i = 0; i < 4; i++) { const p = (t * 0.35 + i / 4) % 1; g.save(); g.globalAlpha = Math.sin(p * Math.PI) * 0.9; g.translate(Math.sin(i * 2.2 + p * 5) * 26, top - 4 - p * 50); g.rotate(p * 6 + i); F(g, P.ell(0, 0, 2.4, 1.2), '#bff0a0', { s: 0, h: 0, lw: 0.6 }); g.restore(); }
      }
    }
    const face = st.face || 1, k = st.k || 0, a = st.a === undefined ? -1 : st.a;
    env.char('elf' + tier, -9, top, face, k % 2 === 0 ? a : -1, t);
    env.char('elf' + tier, 9, top + 1, face, k % 2 === 1 ? a : -1, t + 0.9);
    const w = tier === 1 ? 23 : tier === 2 ? 26 : tier === 3 ? 26 : 29;
    rail(g, w, top, tier >= 3 ? GOLD : '#a87444', tier >= 3 ? '#f4f1e6' : '#8a5a32');
    if (tier === 1) flag(g, 20, top - 6, 18, '#3a8a4a', t);
    if (tier === 2) flag(g, -22, top - 6, 20, '#3a8a4a', t, -1);
  }

  /* =====================================================
   * DOANH TRẠI
   * ===================================================== */
  function barracksStatic(g, tier) {
    if (tier === 1) {
      foundation(g, 34, '#9a948a', '#6aa84a');
      planks(g, 0, 2, 46, 24, '#b07a48', true);
      gable(g, 0, -20, 50, 24, '#d8b25a', { thatch: true });
      door(g, 0, 3, 13, 16, '#6a3e20');
      for (let i = 0; i < 4; i++) { const x = -36 + i * 4.6; F(g, P.poly([x - 2, 7, x - 2, -6, x, -10, x + 2, -6, x + 2, 7]), '#a87444', { s: 0.6, h: 0.3, lw: 1 }); }
      F(g, P.rr(24, -6, 11, 10, 2), '#9a6a3a', { s: 1.2, h: 0.6, lw: 1.2 });
    } else if (tier === 2) {
      foundation(g, 35, '#9a948a', '#6aa84a');
      shaded(g, P.rr(-26, -24, 52, 28, 2), '#cbc4b6', -26, 26, { inner: g2 => { g2.strokeStyle = K.alpha(INKC, 0.25); g2.lineWidth = 0.8; for (let y = -17, r = 0; y < 4; y += 7, r++) { g2.beginPath(); g2.moveTo(-26, y); g2.lineTo(26, y); g2.stroke(); for (let x = -26 + (r % 2) * 6; x < 26; x += 12) { g2.beginPath(); g2.moveTo(x, y); g2.lineTo(x, y + 7); g2.stroke(); } } } });
      gable(g, 0, -22, 56, 26, '#c8503a');
      door(g, 0, 4, 14, 18, '#6a3e20', '#a09a8e');
      win(g, -15, -11, 6, 8); win(g, 15, -11, 6, 8);
      F(g, P.rr(14, -48, 7, 14, 1.4), '#a09a8e', { s: 1, h: 0.5, lw: 1.2 });
    } else if (tier === 3) {
      foundation(g, 36, '#9a948a', '#6aa84a');
      for (const s of [-1, 1]) { cyl(g, s * 25, -4, 12, 38, '#c6c0b4', { ry: 4.4, top: false, rowH: 6.5 }); cone(g, s * 25, -42, 14.5, 24, '#3d6fc0', { trim: GOLD }); win(g, s * 25, -24, 4.4, 8); }
      shaded(g, P.rr(-20, -32, 40, 36, 2), '#d6d0c4', -20, 20);
      battlements(g, 0, -32, 19, '#d6d0c4', 6);
      door(g, 0, 5, 16, 21, '#6a3e20', GOLD);
      banner(g, -11, -26, 8, 15, '#3d6fc0', markTree); banner(g, 11, -26, 8, 15, '#3d6fc0', markTree);
    } else {
      foundation(g, 38, '#d8d2c4', '#5aa84a');
      for (const s of [-1, 1]) { cyl(g, s * 27, -4, 13, 50, '#f4f0e6', { ry: 4.7, top: false, rowH: 6.5 }); F(g, P.rr(s * 27 - 14.5, -58, 29, 5, 2), GOLD, { s: 1, h: 0.5 }); cone(g, s * 27, -56, 15.5, 30, '#2f5cc0', { trim: GOLD }); win(g, s * 27, -34, 4.6, 9); }
      shaded(g, P.rr(-22, -40, 44, 44, 3), '#f6f2ea', -22, 22);
      gable(g, 0, -38, 44, 26, '#2f5cc0');
      F(g, P.rr(-25, -41, 50, 4, 2), GOLD, { s: 0.6, h: 0.4 });
      F(g, P.circ(0, -48, 5), '#f4f1e6', { s: 0.8, h: 0.5 }); markTree(g, 0, -48);
      door(g, 0, 5, 17, 23, '#5a3418', GOLD);
      banner(g, -13, -34, 8, 19, '#f4f1e6', (c, x, y) => { line(c, x, y - 4, x, y + 4, '#2f5cc0', 1.5); line(c, x - 3, y - 1, x + 3, y - 1, '#2f5cc0', 1.5); });
      banner(g, 13, -34, 8, 19, '#f4f1e6', (c, x, y) => { line(c, x, y - 4, x, y + 4, '#2f5cc0', 1.5); line(c, x - 3, y - 1, x + 3, y - 1, '#2f5cc0', 1.5); });
    }
  }
  function barracksFx(g, tier, t, st) {
    if (tier === 1) flag(g, 0, -44, 14, '#3d6fc0', t);
    else if (tier === 2) { flag(g, 0, -48, 16, '#3d6fc0', t); for (let i = 0; i < 2; i++) { const p = (t * 0.4 + i / 2) % 1; g.save(); g.globalAlpha = (1 - p) * 0.5; dot(g, 17.5 + p * 6, -50 - p * 22, 2.4 + p * 4, '#d8d0c8'); g.restore(); } }
    else if (tier === 3) { flag(g, -25, -66, 12, '#3d6fc0', t); flag(g, 25, -66, 12, '#3d6fc0', t); }
    else { flag(g, 0, -64, 18, '#f4f1e6', t, 1, 1.1); flag(g, -27, -86, 10, '#2f5cc0', t); flag(g, 27, -86, 10, '#2f5cc0', t); }
    if (st.door > 0) K.glow(g, 0, -6, 20, '#ffd070', st.door);
  }

  /* =====================================================
   * THÁP PHÁP SƯ
   * ===================================================== */
  const MAGE_TOP = [0, -40, -48, -58, -66];
  function mageStatic(g, tier) {
    const top = MAGE_TOP[tier], col = ['', '#a8a8c4', '#9ea0c4', '#9a90c8', '#a69ad6'][tier];
    foundation(g, 32, '#8f8aa4', '#6aa84a');
    cyl(g, 0, -1, 25 - tier * 0.6, -(top + 2), col, { ry: 9, top: false, taper: 4 + tier, rowH: 7.5 });
    const tw = 25 - tier * 0.6 - (4 + tier);
    F(g, P.ell(0, top, tw + 3, (tw + 3) * 0.36), shade(col, 0.18), { s: 0, h: 0, lw: 1.4 });
    g.strokeStyle = GOLD; g.lineWidth = 1.8; g.beginPath(); g.ellipse(0, top + 4, tw + 2, (tw + 2) * 0.36, 0, 0.08, Math.PI - 0.08); g.stroke();
    door(g, 0, 5, 11, 15, '#3a3070', tier > 2 ? GOLD : '#8a86a0');
    win(g, 0, top + 17, 5.5, 9, '#a8e4ff');
    if (tier >= 2) for (const s of [-1, 1]) { F(g, P.rr(s * 29 - 3, -13, 6, 15, 1.6), '#7a7692', { s: 1, h: 0.5, lw: 1.1 }); crystal(g, s * 29, -13, 0.85, tier > 2 ? '#d0a8ff' : '#8fd8ff'); }
    if (tier === 4) { win(g, -9, -24, 4, 8, '#e0b8ff'); win(g, 9, -24, 4, 8, '#e0b8ff'); }
    // vòng phù văn trên nền
    g.save(); g.globalAlpha = 0.55; g.strokeStyle = tier > 2 ? '#c8a0ff' : '#8fd8ff'; g.lineWidth = 1.1;
    g.beginPath(); g.ellipse(0, -2, 22, 8, 0, 0, TAU); g.stroke();
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.arc(Math.cos(a) * 26, -2 + Math.sin(a) * 9.6, 1, 0, TAU); g.stroke(); }
    g.restore();
  }
  function mageFx(g, tier, t, st, env) {
    const top = MAGE_TOP[tier], cast = st.a >= 0 ? Math.sin(Math.min(1, st.a) * Math.PI) : 0;
    const gc = tier > 2 ? '#c8a0ff' : '#8fd8ff';
    if (tier >= 2) for (const s of [-1, 1]) K.glow(g, s * 29, -20, 11, gc, 0.5 + Math.sin(t * 3 + s) * 0.2);
    if (tier >= 3) {
      g.save(); g.translate(0, top - 16); g.scale(1, 0.34); g.rotate(t * 1.1);
      g.strokeStyle = K.alpha(gc, 0.85); g.lineWidth = 2.2; g.setLineDash([7, 5]); g.beginPath(); g.arc(0, 0, 30, 0, TAU); g.stroke(); g.setLineDash([]);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; dot(g, Math.cos(a) * 30, Math.sin(a) * 30, 2.6, '#ffffff'); }
      g.restore();
    }
    K.glow(g, 0, top - 18, 22, gc, 0.22 + cast * 0.6);
    env.char('mage' + tier, -2, top + 1, st.face || 1, st.a === undefined ? -1 : st.a, t);
    if (tier === 4) {
      const y = top - 60 + Math.sin(t * 2) * 3;
      K.glow(g, 0, y, 26, '#d8b0ff', 0.7 + cast * 0.4);
      F(g, P.circ(0, y, 7.5), '#c8a0ff', { s: 1.8, h: 1.4, lw: 1.4, light: '#ffffff' }); dot(g, -2.2, y - 2.4, 1.8, '#fff');
      for (let i = 0; i < 3; i++) { const a = t * 2 + i * TAU / 3; crystal(g, Math.cos(a) * 18, y + Math.sin(a) * 6 + 6, 0.48, '#e6d0ff'); }
    }
    for (let i = 0; i < tier + 1; i++) { const p = (t * 0.45 + i / (tier + 1)) % 1; g.save(); g.globalAlpha = Math.sin(p * Math.PI); dot(g, Math.sin(i * 2 + p * 4) * 22, top + 8 - p * 52, 1.4, i % 2 ? '#ffffff' : gc); g.restore(); }
  }

  /* =====================================================
   * PHÁO NGƯỜI LÙN
   * ===================================================== */
  function artilleryStatic(g, tier) {
    if (tier === 1) {
      foundation(g, 33, '#9a8a72', '#6aa84a');
      planks(g, 0, -1, 60, 9, '#b07a48');
      for (const x of [-25, 25]) F(g, P.rr(x - 3.5, -11, 7, 11, 1.6), '#8a5a32', { s: 1.2, h: 0.6 });
      F(g, P.rr(-33, -17, 11, 13, 3.4), '#9a6a3a', { s: 1.4, h: 0.7 }); line(g, -33, -12.5, -22, -12.5, '#50545e', 1.4);
      for (const [x, y] of [[24, -13], [29.5, -9.5], [26.5, -17]]) F(g, P.circ(x, y, 3.2), '#4a4a56', { s: 0.8, h: 0.5, lw: 1.1, light: '#9a9aa8' });
    } else if (tier === 2) {
      foundation(g, 34, '#9a948a', '#6aa84a');
      cyl(g, 0, -1, 32, 14, '#bdb5a5', { ry: 11.5, top: false, rowH: 7 });
      F(g, P.ell(0, -15, 32, 11.5), '#a8a090', { s: 0, h: 0, lw: 1.3 });
      battlements(g, 0, -15, 30, '#bdb5a5', 9);
      for (const [x, y] of [[24, -21], [29, -18]]) F(g, P.circ(x, y, 3.2), '#4a4a56', { s: 0.8, h: 0.5, lw: 1.1, light: '#9a9aa8' });
      banner(g, -27, -13, 8, 13, '#b8402a', markHammer);
    } else if (tier === 3) {
      foundation(g, 35, '#8a8478', '#6aa84a');
      cyl(g, 0, -1, 33, 20, '#948e84', { ry: 12, top: false, rowH: 7 });
      for (const y of [-7, -16]) { g.strokeStyle = INKC; g.lineWidth = 4.4; g.beginPath(); g.ellipse(0, y, 33, 12, 0, 0.08, Math.PI - 0.08); g.stroke(); g.strokeStyle = '#80848e'; g.lineWidth = 2.6; g.stroke(); for (let i = -2; i <= 2; i++) dot(g, i * 12, y + 11.6 * Math.sqrt(1 - (i * 12 / 33) ** 2), 1.2, '#c8ccd6'); }
      F(g, P.ell(0, -21, 33, 12), '#7e786e', { s: 0, h: 0, lw: 1.3 });
      battlements(g, 0, -21, 31, '#948e84', 9);
      cyl(g, -27, -24, 5.5, 18, '#5a5a64', { ry: 2, bricks: false });
      F(g, P.ell(-27, -42, 3.6, 1.3), '#1a1220', { s: 0, h: 0, lw: 0.8 });
      banner(g, 27, -19, 8, 15, '#b8402a', markHammer);
    } else {
      foundation(g, 37, '#6e6a76', '#5aa84a');
      cyl(g, 0, -1, 35, 24, '#76727e', { ry: 12.6, top: false, rowH: 7 });
      g.strokeStyle = INKC; g.lineWidth = 5; g.beginPath(); g.ellipse(0, -12, 35, 12.6, 0, 0.08, Math.PI - 0.08); g.stroke();
      g.strokeStyle = GOLD; g.lineWidth = 3; g.stroke();
      // khe lò rèn phát sáng
      for (let i = 0; i < 5; i++) { const x = -22 + i * 11, yy = -4 + 11 * Math.sqrt(1 - (x / 35) ** 2); K.glow(g, x, yy - 3, 6, '#ff8a2a', 0.8); F(g, P.rr(x - 2, yy - 6, 4, 5, 1), '#ffb84a', { s: 0, h: 0.6, lw: 0.9, light: '#fff0b0' }); }
      F(g, P.ell(0, -25, 35, 12.6), '#605c68', { s: 0, h: 0, lw: 1.3 });
      battlements(g, 0, -25, 33, '#76727e', 10);
      for (const s of [-1, 1]) { cyl(g, s * 29, -27, 6, 22, '#4a4a54', { ry: 2.2, bricks: false }); F(g, P.ell(s * 29, -49, 4, 1.5), '#1a1220', { s: 0, h: 0, lw: 0.8 }); }
      banner(g, 0, -22, 10, 16, '#b8402a', (c, x, y) => { line(c, x, y - 4, x, y + 4, '#ffd8a0', 1.3); line(c, x - 3, y - 1, x + 3, y + 2, '#ffd8a0', 1.3); });
    }
  }
  function mortar(g, x, y, s, col, recoil, face, tier) {
    g.save(); g.translate(x, y + recoil * 2); g.scale(s * (face || 1), s);
    F(g, P.rr(-11, -6, 22, 8, 2.6), '#6b4426', { s: 1.2, h: 0.6, lw: 1.2 });
    for (const wx of [-8.5, 8.5]) { F(g, P.circ(wx, 3, 4.2), '#5a3a22', { s: 1, h: 0.5, lw: 1.2 }); F(g, P.circ(wx, 3, 1.4), GOLD, { s: 0, h: 0, lw: 0.7 }); }
    g.rotate(0.5 - recoil * 0.16);
    F(g, c => { c.moveTo(-7.5, -2); c.lineTo(-8.6, -20); c.lineTo(8.6, -20); c.lineTo(7.5, -2); c.quadraticCurveTo(0, 4, -7.5, -2); c.closePath(); }, col, { s: 2.6, h: 1.2, lw: 1.3 });
    F(g, P.ell(0, -20, 9.4, 3.4), shade(col, 0.18), { s: 0, h: 0, lw: 1.2 });
    F(g, P.ell(0, -20, 6.2, 2.1), '#1a1220', { s: 0, h: 0, lw: 0.9 });
    g.strokeStyle = inkOf(col); g.lineWidth = 3.8; g.beginPath(); g.moveTo(-8.3, -12); g.lineTo(8.3, -12); g.stroke();
    g.strokeStyle = tier >= 2 ? GOLD : shade(col, 0.3); g.lineWidth = 2; g.stroke();
    g.restore();
  }
  const ART_Y = [0, -10, -18, -24, -28];
  function artilleryFx(g, tier, t, st, env) {
    const recoil = st.a >= 0 ? Math.max(0, Math.sin(Math.min(1, st.a * 1.6) * Math.PI)) : 0;
    const col = ['', '#7a7e8a', '#c8903a', '#5a5e6a', '#3a3a46'][tier], sc = [0, 1, 1.1, 1.2, 1.32][tier];
    const y = ART_Y[tier], f = st.face || 1;
    env.char('dwarf', -22 * f, y - 2, f, -1, t);
    mortar(g, 6 * f, y + 2, sc, col, recoil, f, tier);
    if (tier === 4) { g.save(); g.globalAlpha = 0.6 + Math.sin(t * 4) * 0.3; g.strokeStyle = '#ff9a3a'; g.lineWidth = 1.6; g.beginPath(); g.arc(6 * f, y - 14, 10, -2.4, -0.8); g.stroke(); g.restore(); }
    if (tier >= 3) for (let i = 0; i < 3; i++) {
      const p = (t * 0.45 + i / 3) % 1, sx = tier === 4 ? (i % 2 ? 29 : -29) : -27, sy = tier === 4 ? -50 : -43;
      g.save(); g.globalAlpha = (1 - p) * 0.55; F(g, P.circ(sx + p * 7, sy - p * 26, 2.6 + p * 5), '#c8c0b8', { s: 0, h: 0, lw: 0 }); g.restore();
    }
    if (tier === 4) K.glow(g, 0, -6, 30, '#ff8a2a', 0.22 + Math.sin(t * 3) * 0.08);
  }

  window.ArtTowers = {
    archer:    { static: archerStatic,    fx: archerFx,    box: [130, 200, 65, 160] },
    barracks:  { static: barracksStatic,  fx: barracksFx,  box: [130, 150, 65, 110] },
    mage:      { static: mageStatic,      fx: mageFx,      box: [130, 210, 65, 170] },
    artillery: { static: artilleryStatic, fx: artilleryFx, box: [130, 120, 65, 80] },
    ARCH_TOP, MAGE_TOP, ART_Y
  };
})();
