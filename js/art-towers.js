/* =========================================================
 * art-towers.js – 4 loại trụ × 4 cấp, phong cách hoạt hình
 * Gốc = tâm nền trụ trên mặt đất. static() vẽ sẵn, fx() vẽ mỗi khung.
 *   archer  – Tháp cung Elf      barracks – Doanh trại
 *   mage    – Tháp Pháp sư        artillery – Pháo Người Lùn
 * ========================================================= */
(function () {
  const K = ArtKit, shade = K.shade, TAU = Math.PI * 2;

  /* ---------------- Khối dựng ---------------- */
  // Thân trụ tròn nhìn 3/4: mặt bên + mép dưới cong
  const cylP = (cx, yb, rx, ry, h, taper) => c => {
    const t = taper || 0;
    c.moveTo(cx - rx, yb); c.lineTo(cx - rx + t, yb - h); c.lineTo(cx + rx - t, yb - h); c.lineTo(cx + rx, yb);
    c.ellipse(cx, yb, rx, ry, 0, 0, Math.PI); c.closePath();
  };
  function cyl(ctx, cx, yb, rx, h, col, o) {
    o = o || {};
    const ry = o.ry || rx * 0.32, t = o.taper || 0;
    K.cel(ctx, cylP(cx, yb, rx, ry, h, t), col, { s: rx * 0.34, h: rx * 0.14 });
    if (o.bricks !== false) {
      ctx.save(); ctx.beginPath(); cylP(cx, yb, rx, ry, h, t)(ctx); ctx.clip();
      ctx.strokeStyle = K.alpha(shade(col, -0.5), 0.5); ctx.lineWidth = 1.1;
      const rh = o.rowH || 8;
      for (let y = yb - rh, i = 0; y > yb - h; y -= rh, i++) {
        const k = (yb - y) / h, w = rx - t * k;
        ctx.beginPath(); ctx.ellipse(cx, y, w, ry, 0, 0, Math.PI); ctx.stroke();
        for (let j = -2; j <= 2; j++) { const xx = cx + (j + (i % 2) * 0.5) * w * 0.38; if (Math.abs(xx - cx) < w - 2) { ctx.beginPath(); ctx.moveTo(xx, y + ry * Math.sqrt(Math.max(0, 1 - ((xx - cx) / w) ** 2))); ctx.lineTo(xx, y + rh + ry * Math.sqrt(Math.max(0, 1 - ((xx - cx) / w) ** 2))); ctx.stroke(); } }
      }
      ctx.restore();
    }
    if (o.top !== false) {
      const tw = rx - t;
      K.cel(ctx, K.P.ell(cx, yb - h, tw, ry), o.topCol || shade(col, 0.12), { s: 0, h: 0, lw: K.lw });
      if (o.hole) K.cel(ctx, K.P.ell(cx, yb - h + 0.5, tw * 0.74, ry * 0.68), shade(col, -0.35), { s: 0, h: 0, lw: 1.4 });
    }
  }
  function battlements(ctx, cx, y, rx, col, n) {
    const ry = rx * 0.32; n = n || 8;
    for (const front of [false, true]) for (let i = 0; i < n; i++) {
      const a = (i + 0.5) / n * TAU, sn = Math.sin(a);
      if ((sn > 0) !== front) continue;
      const x = cx + Math.cos(a) * rx, yy = y + sn * ry, w = rx * 0.42;
      K.rr(ctx, x - w / 2, yy - 8, w, 10, 2, shade(col, front ? 0.05 : -0.15), { s: 2, h: 1, lw: 1.8 });
    }
  }
  function cone(ctx, cx, yb, rx, h, col, o) {
    o = o || {};
    const ry = rx * 0.32, tilt = o.tilt || 0;
    const path = c => { c.moveTo(cx - rx, yb); c.quadraticCurveTo(cx - rx * 0.5, yb - h * 0.45, cx + tilt, yb - h); c.quadraticCurveTo(cx + rx * 0.5, yb - h * 0.45, cx + rx, yb); c.ellipse(cx, yb, rx, ry, 0, 0, Math.PI); c.closePath(); };
    K.cel(ctx, path, col, { s: rx * 0.4, h: rx * 0.16 });
    ctx.save(); ctx.beginPath(); path(ctx); ctx.clip();
    ctx.strokeStyle = K.alpha(shade(col, -0.5), 0.45); ctx.lineWidth = 1.2;
    for (let i = 1; i < 5; i++) { const f = i / 5; ctx.beginPath(); ctx.ellipse(cx + tilt * f, yb - h * f * 0.95, rx * (1 - f), ry * (1 - f), 0, 0, Math.PI); ctx.stroke(); }
    ctx.restore();
    if (o.trim) { ctx.strokeStyle = K.INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(cx, yb, rx, ry, 0, 0.05, Math.PI - 0.05); ctx.stroke(); ctx.strokeStyle = o.trim; ctx.lineWidth = 2.6; ctx.stroke(); }
    return { x: cx + tilt, y: yb - h };
  }
  function foundation(ctx, rx, col) {
    K.shadow(ctx, 4, 8, rx * 1.25, rx * 0.48, 0.45);
    cyl(ctx, 0, 6, rx, 9, col || '#9a948a', { bricks: false, top: false });
    K.cel(ctx, K.P.ell(0, -3, rx, rx * 0.32), shade(col || '#9a948a', 0.18), { s: 0, h: 0 });
    ctx.save(); ctx.strokeStyle = 'rgba(40,20,40,0.25)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * rx * 0.55, -3 + Math.sin(a) * rx * 0.55 * 0.32); ctx.lineTo(Math.cos(a) * rx, -3 + Math.sin(a) * rx * 0.32); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, -3, rx * 0.55, rx * 0.55 * 0.32, 0, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function door(ctx, x, yb, w, h, wood, frame) {
    const p = c => { c.moveTo(x - w / 2, yb); c.lineTo(x - w / 2, yb - h + w / 2); c.arc(x, yb - h + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w / 2, yb); c.closePath(); };
    K.cel(ctx, p, wood || '#7a4a26', { s: 1.6, h: 0.8 });
    ctx.save(); ctx.beginPath(); p(ctx); ctx.clip(); ctx.strokeStyle = K.alpha(K.INK, 0.5); ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + w * i / 3, yb - h); ctx.lineTo(x - w / 2 + w * i / 3, yb); ctx.stroke(); }
    ctx.fillStyle = '#4a4e5a'; ctx.fillRect(x - w / 2, yb - h * 0.6, w, 1.8); ctx.fillRect(x - w / 2, yb - h * 0.25, w, 1.8); ctx.restore();
    if (frame) { ctx.strokeStyle = frame; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, yb - h + w / 2, w / 2 + 1.4, Math.PI, 0); ctx.stroke(); }
  }
  function win(ctx, x, y, w, h, glow) {
    K.glow(ctx, x, y, w * 2.2, glow || '#ffd070', 0.45);
    K.cel(ctx, c => { c.moveTo(x - w / 2, y + h / 2); c.lineTo(x - w / 2, y - h / 2 + w / 2); c.arc(x, y - h / 2 + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w / 2, y + h / 2); c.closePath(); }, glow || '#ffd070', { s: 0, h: w * 0.25, light: '#fff6c0', lw: 1.8 });
  }
  function planks(ctx, x, yb, w, h, col, vertical) {
    K.rr(ctx, x - w / 2, yb - h, w, h, 2, col, { s: 2.6, h: 1.2 });
    ctx.save(); ctx.strokeStyle = K.alpha(K.INK, 0.45); ctx.lineWidth = 1;
    if (vertical) for (let xx = x - w / 2 + 6; xx < x + w / 2 - 2; xx += 6) { ctx.beginPath(); ctx.moveTo(xx, yb - h + 1); ctx.lineTo(xx, yb - 1); ctx.stroke(); }
    else for (let yy = yb - h + 6; yy < yb - 2; yy += 6) { ctx.beginPath(); ctx.moveTo(x - w / 2 + 1, yy); ctx.lineTo(x + w / 2 - 1, yy); ctx.stroke(); }
    ctx.restore();
  }
  function log(ctx, x1, y1, x2, y2, w) { K.limb(ctx, x1, y1, x2, y2, w, '#8a5a32'); }
  function flag(ctx, x, y, len, col, t, dir) {
    dir = dir || 1;
    K.limb(ctx, x, y, x, y - len, 2, '#6b4426');
    K.circ(ctx, x, y - len - 1, 2, '#f2c14e', { lw: 1.2 });
    const ph = t * 5, fw = 16;
    K.cel(ctx, c => {
      c.moveTo(x, y - len + 1);
      for (let i = 1; i <= 6; i++) { const f = i / 6; c.lineTo(x + dir * fw * f, y - len + 1 + Math.sin(ph + f * 3) * 2 * f); }
      for (let i = 6; i >= 0; i--) { const f = i / 6; c.lineTo(x + dir * fw * f * (1 - (i === 6 ? 0.25 : 0)), y - len + 10 + Math.sin(ph + f * 3 + 0.5) * 2 * f); }
      c.closePath();
    }, col, { s: 1.6, h: 0.8, lw: 1.8 });
  }
  function banner(ctx, x, y, w, h, col, trim, mark) {
    K.cel(ctx, c => { c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(x + w / 2, y + h - 4); c.lineTo(x, y + h); c.lineTo(x - w / 2, y + h - 4); c.closePath(); }, col, { s: 2, h: 1 });
    K.rr(ctx, x - w / 2 - 1.5, y - 2, w + 3, 3, 1.4, trim || '#f2c14e', { s: 0.6, h: 0.4, lw: 1.4 });
    if (mark) mark(ctx, x, y + h * 0.42);
  }
  const markTree = (ctx, x, y) => { K.dot(ctx, x, y - 1.5, 2.6, '#f4f1e6'); K.line(ctx, x, y, x, y + 5, '#f4f1e6', 1.4); };
  const markLeaf = (ctx, x, y) => K.cel(ctx, K.P.ell(x, y, 2.4, 4.4, 0.5), '#f2e6a0', { s: 0, h: 0, lw: 1 });
  const markRune = (ctx, x, y) => { K.line(ctx, x, y - 4, x, y + 4, '#bff0ff', 1.4); K.line(ctx, x - 3, y - 1, x + 3, y + 2, '#bff0ff', 1.4); };
  const markHammer = (ctx, x, y) => { K.line(ctx, x, y - 1, x, y + 5, '#f4e6c0', 1.4); K.rr(ctx, x - 3.4, y - 4, 6.8, 3.4, 1, '#f4e6c0', { s: 0, h: 0, lw: 1 }); };
  function leafy(ctx, x, y, r, col) { K.blob(ctx, [x - r, y, x - r * 0.7, y - r * 0.8, x, y - r, x + r * 0.8, y - r * 0.7, x + r, y + r * 0.1, x + r * 0.5, y + r * 0.7, x - r * 0.5, y + r * 0.6], col, { s: r * 0.35, h: r * 0.15 }); }

  /* =====================================================
   *  THÁP CUNG ELF
   * ===================================================== */
  const ARCH_TOP = [0, -44, -54, -62, -74];
  function archerStatic(ctx, tier) {
    foundation(ctx, 36, tier > 2 ? '#c8c2b4' : '#9a948a');
    const top = ARCH_TOP[tier];
    if (tier === 1) {
      for (const [x1, x2] of [[-22, -16], [22, 16], [-10, -8], [10, 8]]) log(ctx, x1, 2, x2, top + 6, 5);
      log(ctx, -20, -14, 20, -26, 3.4); log(ctx, 20, -14, -20, -26, 3.4);
      planks(ctx, 0, top + 6, 48, 9, '#a87444');
    } else if (tier === 2) {
      cyl(ctx, 0, -2, 28, 26, '#a49e94', { ry: 9, top: false });
      for (const x of [-18, 18]) log(ctx, x, -26, x * 0.85, top + 6, 5);
      log(ctx, -16, -30, 16, -46, 3.2); log(ctx, 16, -30, -16, -46, 3.2);
      planks(ctx, 0, top + 6, 54, 10, '#a87444');
      door(ctx, 0, 4, 12, 16, '#7a4a26');
      banner(ctx, -15, -30, 10, 18, '#3a8a4a', '#f2c14e', markLeaf);
    } else if (tier === 3) {
      cyl(ctx, 0, -2, 30, top + 12 > 0 ? 0 : -(top + 8), '#e6e0d0', { ry: 9.6, top: false, taper: 6 });
      K.rr(ctx, -27, top + 4, 54, 7, 3, '#4a9a5a', { s: 2.4, h: 1.2 });
      win(ctx, -9, -30, 6, 10, '#bfffd0'); win(ctx, 9, -30, 6, 10, '#bfffd0');
      door(ctx, 0, 5, 13, 18, '#5a8a4a', '#f2c14e');
      ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -18, 27, 8.6, 0, 0.05, Math.PI - 0.05); ctx.stroke();
      for (const s of [-1, 1]) leafy(ctx, s * 31, top + 14, 9, '#5aaa52');
    } else {
      cyl(ctx, 0, -2, 33, -(top + 8), '#f2ede0', { ry: 10.6, top: false, taper: 8 });
      ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 2.4;
      for (const y of [-20, -46]) { ctx.beginPath(); ctx.ellipse(0, y, 30 - (-y) * 0.06, 9.4, 0, 0.05, Math.PI - 0.05); ctx.stroke(); }
      win(ctx, 0, -34, 8, 14, '#bfffd0'); win(ctx, -14, -30, 5, 9, '#bfffd0'); win(ctx, 14, -30, 5, 9, '#bfffd0');
      door(ctx, 0, 5, 14, 19, '#3a7a4a', '#f2c14e');
      K.rr(ctx, -30, top + 3, 60, 8, 3, '#f2c14e', { s: 2.4, h: 1.2 });
      for (const s of [-1, 1]) { leafy(ctx, s * 34, top + 12, 11, '#6ab85a'); leafy(ctx, s * 26, -10, 8, '#5aaa52'); }
      // vòm lá bạc phía sau xạ thủ được vẽ ở fx (trước/sau)
    }
  }
  function archerFx(ctx, tier, t, st, env) {
    const top = ARCH_TOP[tier];
    // phần sau lưng xạ thủ
    if (tier >= 3) {
      const col = tier === 4 ? '#e8f0e0' : '#5aaa52';
      ctx.save(); K.cel(ctx, c => { c.moveTo(-26, top + 2); c.quadraticCurveTo(-30, top - 30, 0, top - 44 - (tier - 3) * 10); c.quadraticCurveTo(30, top - 30, 26, top + 2); c.quadraticCurveTo(0, top - 18, -26, top + 2); c.closePath(); }, col, { s: 3, h: 1.4 }); ctx.restore();
      if (tier === 4) { K.glow(ctx, 0, top - 46, 12, '#bfffe0', 0.7 + Math.sin(t * 3) * 0.2); K.poly(ctx, [0, top - 58, 4, top - 50, 0, top - 42, -4, top - 50], '#9ff0d0', { s: 1, h: 0.8, lw: 1.6 }); }
    }
    const face = st.face || 1, k = st.k || 0, a = st.a === undefined ? -1 : st.a;
    env.char('elf' + tier, -9, top, face, k % 2 === 0 ? a : -1, t);
    env.char('elf' + tier, 9, top + 1, face, k % 2 === 1 ? a : -1, t + 0.7);
    // lan can phía trước
    const w = tier === 1 ? 24 : tier === 2 ? 27 : tier === 3 ? 27 : 30;
    ctx.save();
    for (let i = 0; i <= 6; i++) { const x = -w + (2 * w) * i / 6; K.rr(ctx, x - 1.4, top - 7, 2.8, 9, 1, tier >= 3 ? '#f2c14e' : '#8a5a32', { s: 0.6, h: 0.3, lw: 1.3 }); }
    K.rr(ctx, -w - 1, top - 8, 2 * w + 2, 3, 1.4, tier >= 3 ? '#f2c14e' : '#a87444', { s: 0.8, h: 0.4, lw: 1.6 });
    ctx.restore();
    if (tier === 1) flag(ctx, 20, top - 6, 18, '#3a8a4a', t);
  }

  /* =====================================================
   *  DOANH TRẠI (lính người)
   * ===================================================== */
  function barracksStatic(ctx, tier) {
    foundation(ctx, 38, '#9a948a');
    if (tier === 1) {
      planks(ctx, 0, 2, 50, 26, '#a87444', true);
      K.cel(ctx, c => { c.moveTo(-32, -22); c.lineTo(0, -46); c.lineTo(32, -22); c.lineTo(28, -18); c.lineTo(-28, -18); c.closePath(); }, '#d8b25a', { s: 3, h: 1.4 });
      ctx.save(); ctx.strokeStyle = K.alpha(K.INK, 0.35); ctx.lineWidth = 1; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-32 + i * 8, -22 - i * 6); ctx.lineTo(32 - i * 8, -22 - i * 6); ctx.stroke(); } ctx.restore();
      door(ctx, 0, 3, 14, 17, '#6a3e20');
      for (let i = 0; i < 4; i++) { const x = -38 + i * 5; K.poly(ctx, [x - 2.2, 6, x - 2.2, -6, x, -10, x + 2.2, -6, x + 2.2, 6], '#a87444', { s: 0.8, h: 0.4, lw: 1.4 }); }
    } else if (tier === 2) {
      K.rr(ctx, -27, -26, 54, 30, 3, '#b0aa9e', { s: 4, h: 1.6 });
      ctx.save(); ctx.strokeStyle = K.alpha(K.INK, 0.3); ctx.lineWidth = 1; for (let y = -18; y < 2; y += 8) { ctx.beginPath(); ctx.moveTo(-26, y); ctx.lineTo(26, y); ctx.stroke(); } ctx.restore();
      K.cel(ctx, c => { c.moveTo(-33, -24); c.lineTo(-20, -48); c.lineTo(20, -48); c.lineTo(33, -24); c.closePath(); }, '#c0503a', { s: 4, h: 1.6 });
      ctx.save(); ctx.strokeStyle = K.alpha(K.INK, 0.35); ctx.lineWidth = 1; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-33 + i * 3.2, -24 - i * 6); ctx.lineTo(33 - i * 3.2, -24 - i * 6); ctx.stroke(); } ctx.restore();
      door(ctx, 0, 4, 15, 19, '#6a3e20');
      win(ctx, -15, -12, 6, 8); win(ctx, 15, -12, 6, 8);
      banner(ctx, 0, -46, 0.01, 0, '#3d6fc0');
    } else if (tier === 3) {
      for (const s of [-1, 1]) { cyl(ctx, s * 26, -6, 13, 40, '#b8b2a6', { ry: 4.2, top: false, rowH: 7 }); cone(ctx, s * 26, -46, 15, 22, '#3d6fc0', { trim: '#f2c14e' }); }
      K.rr(ctx, -22, -32, 44, 36, 3, '#c4beb2', { s: 4, h: 1.6 });
      battlements(ctx, 0, -32, 21, '#c4beb2', 6);
      door(ctx, 0, 5, 17, 22, '#6a3e20', '#f2c14e');
      banner(ctx, -11, -28, 9, 16, '#3d6fc0', '#f2c14e', markTree); banner(ctx, 11, -28, 9, 16, '#3d6fc0', '#f2c14e', markTree);
    } else {
      for (const s of [-1, 1]) { cyl(ctx, s * 28, -6, 14, 52, '#eae6dc', { ry: 4.5, top: false, rowH: 7 }); K.rr(ctx, s * 28 - 15, -60, 30, 5, 2, '#f2c14e', { s: 1.4, h: 0.8 }); cone(ctx, s * 28, -60, 16, 28, '#3060c0', { trim: '#f2c14e' }); win(ctx, s * 28, -36, 5, 9); }
      K.rr(ctx, -24, -40, 48, 44, 4, '#eeeae0', { s: 5, h: 2 });
      K.cel(ctx, c => { c.moveTo(-28, -38); c.lineTo(0, -64); c.lineTo(28, -38); c.closePath(); }, '#3060c0', { s: 4, h: 1.6 });
      K.rr(ctx, -27, -41, 54, 4, 2, '#f2c14e', { s: 1, h: 0.6 });
      K.circ(ctx, 0, -48, 5, '#f4f1e6', { lw: 1.6 }); markTree(ctx, 0, -48);
      door(ctx, 0, 5, 18, 24, '#5a3418', '#f2c14e');
      banner(ctx, -14, -34, 9, 20, '#f4f1e6', '#f2c14e', (c, x, y) => { K.line(c, x, y - 4, x, y + 4, '#3060c0', 1.6); K.line(c, x - 3, y - 1, x + 3, y - 1, '#3060c0', 1.6); });
      banner(ctx, 14, -34, 9, 20, '#f4f1e6', '#f2c14e', (c, x, y) => { K.line(c, x, y - 4, x, y + 4, '#3060c0', 1.6); K.line(c, x - 3, y - 1, x + 3, y - 1, '#3060c0', 1.6); });
    }
  }
  function barracksFx(ctx, tier, t, st) {
    if (tier === 1) flag(ctx, 0, -46, 14, '#3d6fc0', t);
    else if (tier === 2) flag(ctx, 0, -48, 16, '#3d6fc0', t);
    else if (tier === 3) { flag(ctx, -26, -68, 12, '#3d6fc0', t); flag(ctx, 26, -68, 12, '#3d6fc0', t); }
    else { flag(ctx, 0, -64, 18, '#f4f1e6', t); flag(ctx, -28, -88, 10, '#3060c0', t); flag(ctx, 28, -88, 10, '#3060c0', t); }
    if (st.door > 0) K.glow(ctx, 0, -6, 20, '#ffd070', st.door);
  }

  /* =====================================================
   *  THÁP PHÁP SƯ
   * ===================================================== */
  const MAGE_TOP = [0, -40, -50, -62, -74];
  function crystal(ctx, x, y, s, col) {
    K.poly(ctx, [x, y - 14 * s, x + 4.5 * s, y - 6 * s, x + 3 * s, y, x - 3 * s, y, x - 4.5 * s, y - 6 * s], col, { s: 1.6 * s, h: 1 * s, lw: 1.6 });
    K.line(ctx, x - 1 * s, y - 11 * s, x - 2 * s, y - 3 * s, 'rgba(255,255,255,0.7)', 1.2);
  }
  function mageStatic(ctx, tier) {
    const top = MAGE_TOP[tier], col = ['', '#9aa2b8', '#8f98b4', '#8a84b4', '#9a8ec8'][tier];
    foundation(ctx, 35, '#8a8698');
    cyl(ctx, 0, -2, 26 - tier, -(top + 2), col, { ry: 8.6, top: false, taper: 4 + tier, rowH: 8 });
    K.cel(ctx, K.P.ell(0, top, 24 - tier * 0.5, 7.6), shade(col, 0.15), { s: 0, h: 0 });
    ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(0, top + 4, 22 - tier * 0.5, 7, 0, 0.05, Math.PI - 0.05); ctx.stroke();
    door(ctx, 0, 5, 12, 16, '#3a3060', tier > 2 ? '#f2c14e' : null);
    win(ctx, 0, top + 18, 6, 10, '#9fe0ff');
    if (tier >= 2) for (const s of [-1, 1]) { K.rr(ctx, s * 30 - 3, -14, 6, 16, 2, '#7a7690', { s: 1.4, h: 0.6 }); crystal(ctx, s * 30, -14, 0.9, tier > 2 ? '#c8a0ff' : '#8fd8ff'); }
    if (tier === 4) { win(ctx, -10, -24, 4, 8, '#d8b0ff'); win(ctx, 10, -24, 4, 8, '#d8b0ff'); }
  }
  function mageFx(ctx, tier, t, st, env) {
    const top = MAGE_TOP[tier], cast = st.a >= 0 ? Math.sin(Math.min(1, st.a) * Math.PI) : 0;
    const gc = tier > 2 ? '#c8a0ff' : '#8fd8ff';
    if (tier >= 2) for (const s of [-1, 1]) K.glow(ctx, s * 30, -22, 12, gc, 0.5 + Math.sin(t * 3 + s) * 0.2);
    if (tier >= 3) { // vòng phép xoay quanh
      ctx.save(); ctx.translate(0, top - 18); ctx.scale(1, 0.32); ctx.rotate(t * 1.2);
      ctx.strokeStyle = K.alpha(gc, 0.8); ctx.lineWidth = 2.4; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }
    K.glow(ctx, 0, top - 16, 22, gc, 0.25 + cast * 0.6);
    env.char('mage' + tier, -2, top + 1, st.face || 1, st.a === undefined ? -1 : st.a, t);
    if (tier === 4) {
      const y = top - 64 + Math.sin(t * 2) * 3;
      K.glow(ctx, 0, y, 26, '#d8b0ff', 0.7 + cast * 0.4);
      K.circ(ctx, 0, y, 8, '#c8a0ff', { s: 2, h: 1.6, lw: 1.8 }); K.dot(ctx, -2.4, y - 2.4, 2, '#fff');
      for (let i = 0; i < 3; i++) { const a = t * 2 + i * TAU / 3; crystal(ctx, Math.cos(a) * 18, y + Math.sin(a) * 6 + 6, 0.5, '#e0c8ff'); }
    }
    for (let i = 0; i < tier; i++) { const p = (t * 0.5 + i / tier) % 1; ctx.globalAlpha = Math.sin(p * Math.PI); K.dot(ctx, Math.sin(i * 2 + p * 4) * 22, top + 10 - p * 50, 1.6, '#e8f6ff'); }
    ctx.globalAlpha = 1;
  }

  /* =====================================================
   *  PHÁO NGƯỜI LÙN
   * ===================================================== */
  function artilleryStatic(ctx, tier) {
    if (tier === 1) {
      foundation(ctx, 36, '#9a8a72');
      planks(ctx, 0, -2, 64, 10, '#a87444');
      for (const x of [-26, 26]) K.rr(ctx, x - 4, -12, 8, 12, 2, '#8a5a32', { s: 1.6, h: 0.8 });
      // thùng thuốc súng
      K.rr(ctx, -34, -18, 12, 14, 4, '#9a6a3a', { s: 2, h: 1 }); K.line(ctx, -34, -13, -22, -13, '#4a4e5a', 1.6);
      for (const [x, y] of [[24, -14], [30, -10], [27, -18]]) K.circ(ctx, x, y, 3.6, '#4a4a56', { lw: 1.6 });
    } else if (tier === 2) {
      foundation(ctx, 37, '#9a948a');
      cyl(ctx, 0, -2, 34, 16, '#b0a898', { ry: 11, top: false, rowH: 8 });
      battlements(ctx, 0, -18, 32, '#b0a898', 9);
      for (const [x, y] of [[26, -24], [31, -21]]) K.circ(ctx, x, y, 3.6, '#4a4a56', { lw: 1.6 });
      banner(ctx, -28, -16, 9, 14, '#b8402a', '#f2c14e', markHammer);
    } else if (tier === 3) {
      foundation(ctx, 38, '#8a8478');
      cyl(ctx, 0, -2, 35, 22, '#8a8478', { ry: 11.2, top: false, rowH: 8 });
      ctx.strokeStyle = K.INK; ctx.lineWidth = 5; for (const y of [-8, -18]) { ctx.beginPath(); ctx.ellipse(0, y, 35, 11.2, 0, 0.05, Math.PI - 0.05); ctx.stroke(); }
      ctx.strokeStyle = '#7a7e8a'; ctx.lineWidth = 3; for (const y of [-8, -18]) { ctx.beginPath(); ctx.ellipse(0, y, 35, 11.2, 0, 0.05, Math.PI - 0.05); ctx.stroke(); }
      battlements(ctx, 0, -24, 33, '#8a8478', 9);
      cyl(ctx, -28, -26, 6, 20, '#5a5a62', { ry: 2, bricks: false, hole: true });
      banner(ctx, 28, -22, 9, 16, '#b8402a', '#f2c14e', markHammer);
    } else {
      foundation(ctx, 40, '#6a6670');
      cyl(ctx, 0, -2, 37, 26, '#6e6a74', { ry: 12, top: false, rowH: 8 });
      ctx.strokeStyle = K.INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, -14, 37, 12, 0, 0.05, Math.PI - 0.05); ctx.stroke();
      ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 3.4; ctx.stroke();
      for (let i = 0; i < 5; i++) { const x = -24 + i * 12; K.dot(ctx, x, -4 + Math.abs(x) * -0.05, 2, '#ff9a3a'); }
      battlements(ctx, 0, -28, 35, '#6e6a74', 10);
      for (const s of [-1, 1]) cyl(ctx, s * 30, -28, 6.5, 26, '#4a4a52', { ry: 2.2, bricks: false, hole: true });
      banner(ctx, 0, -24, 11, 18, '#b8402a', '#f2c14e', markRune);
    }
  }
  function mortar(ctx, x, y, s, col, recoil, face) {
    ctx.save(); ctx.translate(x, y + recoil * 2); ctx.scale(s * (face || 1), s);
    K.rr(ctx, -12, -6, 24, 8, 3, '#6b4426', { s: 1.6, h: 0.8 });
    K.circ(ctx, -9, 3, 4.4, '#5a3a22', { lw: 1.6 }); K.circ(ctx, 9, 3, 4.4, '#5a3a22', { lw: 1.6 });
    ctx.rotate(0.5 - recoil * 0.15);
    K.cel(ctx, c => { c.moveTo(-8, -2); c.lineTo(-9, -20); c.lineTo(9, -20); c.lineTo(8, -2); c.quadraticCurveTo(0, 4, -8, -2); c.closePath(); }, col, { s: 3, h: 1.4 });
    K.cel(ctx, K.P.ell(0, -20, 9.6, 3.6), shade(col, 0.15), { s: 0, h: 0 });
    K.cel(ctx, K.P.ell(0, -20, 6.4, 2.2), '#1a1220', { s: 0, h: 0, lw: 1.2 });
    ctx.strokeStyle = K.INK; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(-8.6, -12); ctx.lineTo(8.6, -12); ctx.stroke();
    ctx.strokeStyle = shade(col, 0.3); ctx.lineWidth = 2.2; ctx.stroke();
    ctx.restore();
  }
  const ART_Y = [0, -12, -22, -28, -34];
  function artilleryFx(ctx, tier, t, st, env) {
    const recoil = st.a >= 0 ? Math.max(0, Math.sin(Math.min(1, st.a * 1.6) * Math.PI)) : 0;
    const col = ['', '#7a7e8a', '#c8903a', '#5a5e6a', '#3a3a44'][tier], sc = [0, 1, 1.15, 1.3, 1.45][tier];
    const y = ART_Y[tier];
    const f = st.face || 1;
    env.char('dwarf', -24 * f, y - 4, f, -1, t);
    mortar(ctx, 6 * f, y + 2, sc * 1.2, col, recoil, f);
    if (tier === 4) { ctx.strokeStyle = '#ff9a3a'; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.3; ctx.beginPath(); ctx.arc(6, y - 14, 10, -2.4, -0.8); ctx.stroke(); ctx.globalAlpha = 1; }
    // khói ống khói
    if (tier >= 3) for (let i = 0; i < 3; i++) {
      const p = (t * 0.45 + i / 3) % 1, sx = tier === 4 ? (i % 2 ? 30 : -30) : -28;
      ctx.globalAlpha = (1 - p) * 0.55; K.circ(ctx, sx + p * 8, y - 18 - p * 30, 3 + p * 6, '#b8b0a8', { s: 0, h: 0, lw: 0 }); ctx.globalAlpha = 1;
    }
    if (tier === 4) K.glow(ctx, 0, -6, 28, '#ff8a2a', 0.25 + Math.sin(t * 3) * 0.08);
  }

  window.ArtTowers = {
    archer:    { static: archerStatic,    fx: archerFx,    box: [140, 200, 70, 168] },
    barracks:  { static: barracksStatic,  fx: barracksFx,  box: [140, 180, 70, 148] },
    mage:      { static: mageStatic,      fx: mageFx,      box: [140, 230, 70, 198] },
    artillery: { static: artilleryStatic, fx: artilleryFx, box: [140, 150, 70, 118] },
    ARCH_TOP, MAGE_TOP, ART_Y
  };
})();
