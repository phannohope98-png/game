/* =========================================================
 * art-towers.js – 4 loại trụ × 3 cấp (hình dạng đổi khi nâng cấp)
 * Gốc toạ độ = tâm bệ đá trên mặt đất, y âm = hướng lên.
 *   static(ctx, tier)        phần tĩnh → được vẽ sẵn vào canvas phụ
 *   fx(ctx, tier, t, st, env) phần động: cờ, lửa, quả cầu phép, xạ thủ...
 * ========================================================= */
(function () {
  const K = ArtKit, shade = K.shade, alpha = K.alpha;
  const TAU = Math.PI * 2;

  /* ---------------- Khối cơ bản ---------------- */
  function cylPath(ctx, cx, yb, rx, ry, h) {
    ctx.beginPath(); ctx.moveTo(cx - rx, yb - h); ctx.lineTo(cx - rx, yb);
    ctx.ellipse(cx, yb, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + rx, yb - h);
    ctx.ellipse(cx, yb - h, rx, ry, 0, 0, Math.PI, false);
    ctx.closePath();
  }
  function hgrad(ctx, x0, x1, base, hi, mid, lo) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, shade(base, hi === undefined ? 0.26 : hi));
    g.addColorStop(0.38, shade(base, mid === undefined ? 0.04 : mid));
    g.addColorStop(1, shade(base, lo === undefined ? -0.42 : lo));
    return g;
  }
  /** Gạch bo theo mặt trụ */
  function bricksWrap(ctx, cx, yb, rx, ry, h, rowH, jointCol) {
    const rows = Math.floor(h / rowH), n = Math.max(4, Math.round(rx * 2 / 9));
    ctx.save(); ctx.lineWidth = 0.9; ctx.strokeStyle = jointCol || 'rgba(25,12,36,0.30)';
    for (let r = 0; r < rows; r++) {
      const y = yb - r * rowH;
      if (r > 0) { ctx.beginPath(); ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI); ctx.stroke(); }
      for (let k = 0; k <= n; k++) {
        const phi = (k + (r % 2) * 0.5) * Math.PI / n;
        if (phi > Math.PI) continue;
        const x = cx + rx * Math.cos(phi), yy = y + ry * Math.sin(phi);
        ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy - rowH); ctx.stroke();
      }
    }
    ctx.restore();
  }
  /** Thân trụ tròn: gạch + đổ sáng + mặt trên. o: {ry, rowH, top:false, topCol, merlons, band} */
  function cyl(ctx, cx, yb, w, h, base, o) {
    o = o || {};
    const rx = w / 2, ry = o.ry || Math.max(3.5, w * 0.17);
    if (o.merlons) merlons(ctx, cx, yb - h, rx, ry, base, 'back', o.merlons);
    cylPath(ctx, cx, yb, rx, ry, h);
    ctx.fillStyle = o.fill || hgrad(ctx, cx - rx, cx + rx, base, o.hi, o.mid, o.lo); ctx.fill();
    if (o.bricks !== false) { ctx.save(); cylPath(ctx, cx, yb, rx, ry, h); ctx.clip(); bricksWrap(ctx, cx, yb, rx, ry, h, o.rowH || 7, o.joint); 
      const sg = ctx.createLinearGradient(0, yb - h, 0, yb + ry); sg.addColorStop(0, 'rgba(255,240,210,0.18)'); sg.addColorStop(0.5, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(10,0,20,0.28)');
      ctx.fillStyle = sg; ctx.fillRect(cx - rx, yb - h - ry, w, h + ry * 2); ctx.restore(); }
    cylPath(ctx, cx, yb, rx, ry, h); ctx.strokeStyle = shade(base, -0.62); ctx.lineWidth = K.lw; ctx.lineJoin = 'round'; ctx.stroke();
    if (o.top !== false) {
      ctx.beginPath(); ctx.ellipse(cx, yb - h, rx, ry, 0, 0, TAU);
      ctx.fillStyle = o.topCol || shade(base, 0.14); ctx.fill(); ctx.strokeStyle = shade(base, -0.55); ctx.lineWidth = K.lw; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, yb - h + 0.5, rx * 0.78, ry * 0.7, 0, 0, TAU); ctx.fillStyle = shade(base, -0.18); ctx.fill();
    }
    if (o.merlons) merlons(ctx, cx, yb - h, rx, ry, base, 'front', o.merlons);
  }
  function merlons(ctx, cx, yt, rx, ry, base, pass, n) {
    n = n === true ? Math.max(6, Math.round(rx * 2 / 6.5)) : n;
    const mw = rx * TAU / n * 0.52, mh = 6.5;
    for (let k = 0; k < n; k++) {
      const phi = (k + 0.5) * TAU / n, sn = Math.sin(phi), cs = Math.cos(phi);
      if ((pass === 'front') !== (sn >= 0)) continue;
      const x = cx + rx * cs, y = yt + ry * sn;
      const c = shade(base, -cs * 0.16 + (pass === 'back' ? -0.12 : 0.04));
      K.rr(ctx, x - mw / 2, y - mh, mw, mh + 2.5, 1);
      const g = ctx.createLinearGradient(x - mw / 2, 0, x + mw / 2, 0); g.addColorStop(0, shade(c, 0.18)); g.addColorStop(1, shade(c, -0.22));
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = shade(base, -0.62); ctx.lineWidth = 0.9; ctx.stroke();
    }
  }
  /** Mái nón. o: {ry, tilt, ribs, stripe, trim} */
  function cone(ctx, cx, yb, rx, h, base, o) {
    o = o || {}; const ry = o.ry || rx * 0.3, tilt = o.tilt || 0, ax = cx + tilt, ay = yb - h;
    ctx.beginPath(); ctx.moveTo(cx - rx, yb);
    ctx.quadraticCurveTo(cx - rx * 0.55 + tilt * 0.3, yb - h * 0.55, ax, ay);
    ctx.quadraticCurveTo(cx + rx * 0.55 + tilt * 0.3, yb - h * 0.55, cx + rx, yb);
    ctx.ellipse(cx, yb, rx, ry, 0, 0, Math.PI, false); ctx.closePath();
    ctx.fillStyle = hgrad(ctx, cx - rx, cx + rx, base, o.hi === undefined ? 0.3 : o.hi, 0.02, -0.46); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(20,6,30,0.28)'; ctx.lineWidth = 0.9;
    const rows = o.rows || 5;
    for (let i = 1; i < rows; i++) { const f = i / rows; ctx.beginPath(); ctx.ellipse(cx + tilt * f * 0.9, yb - h * f * 0.97, rx * (1 - f), ry * (1 - f), 0, 0, Math.PI); ctx.stroke(); }
    for (let i = 0; i <= 8; i++) {
      const x = cx - rx + (rx * 2) * i / 8; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(x, yb + ry * Math.sin(Math.acos(K.clamp((x - cx) / rx, -1, 1)))); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,245,220,0.14)'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(cx - rx, yb); ctx.lineTo(cx - rx * 0.3, yb + ry * 0.9); ctx.closePath(); ctx.fill();
    if (o.stripe) { ctx.strokeStyle = o.stripe; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx + tilt * 0.45, yb - h * 0.5, rx * 0.5, ry * 0.5, 0, 0.05, Math.PI - 0.05); ctx.stroke(); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(cx - rx, yb);
    ctx.quadraticCurveTo(cx - rx * 0.55 + tilt * 0.3, yb - h * 0.55, ax, ay);
    ctx.quadraticCurveTo(cx + rx * 0.55 + tilt * 0.3, yb - h * 0.55, cx + rx, yb);
    ctx.ellipse(cx, yb, rx, ry, 0, 0, Math.PI, false); ctx.closePath();
    ctx.strokeStyle = shade(base, -0.62); ctx.lineWidth = K.lw; ctx.lineJoin = 'round'; ctx.stroke();
    // viền mái
    ctx.beginPath(); ctx.ellipse(cx, yb, rx, ry, 0, 0, Math.PI); ctx.strokeStyle = o.trim || shade(base, -0.3); ctx.lineWidth = 2.4; ctx.stroke();
    ctx.strokeStyle = shade(base, -0.62); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(cx, yb + 1.2, rx, ry, 0, 0.05, Math.PI - 0.05); ctx.stroke();
    return { x: ax, y: ay };
  }
  /** Bệ đá tròn dưới chân trụ */
  function pad(ctx, rx, ry, top, kind) {
    K.shadow(ctx, 3, 8, rx * 1.3, ry * 1.4, 0.5);
    const th = 8;
    cylPath(ctx, 0, th, rx, ry, th); ctx.fillStyle = hgrad(ctx, -rx, rx, top, 0.05, -0.1, -0.5); ctx.fill();
    ctx.strokeStyle = shade(top, -0.65); ctx.lineWidth = K.lw; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    const g = ctx.createRadialGradient(-rx * 0.3, -ry * 0.4, 2, 0, 0, rx); g.addColorStop(0, shade(top, 0.22)); g.addColorStop(1, shade(top, -0.12));
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = shade(top, -0.6); ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(20,10,30,0.22)'; ctx.lineWidth = 0.9;
    for (const f of [0.52, 0.8]) { ctx.beginPath(); ctx.ellipse(0, 0, rx * f, ry * f, 0, 0, TAU); ctx.stroke(); }
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; ctx.beginPath(); ctx.moveTo(Math.cos(a) * rx * 0.52, Math.sin(a) * ry * 0.52); ctx.lineTo(Math.cos(a) * rx, Math.sin(a) * ry); ctx.stroke(); }
    if (kind === 'moss') { ctx.fillStyle = 'rgba(90,160,70,0.5)'; for (const [x, y, r] of [[-22, 3, 7], [18, 7, 6], [-6, 11, 5], [26, -2, 5]]) { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.5, 0, 0, TAU); ctx.fill(); } }
    ctx.restore();
  }
  function archDoor(ctx, x, yb, w, h, wood, frame) {
    ctx.beginPath(); ctx.moveTo(x - w / 2, yb); ctx.lineTo(x - w / 2, yb - h + w / 2); ctx.arc(x, yb - h + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w / 2, yb); ctx.closePath();
    const g = ctx.createLinearGradient(0, yb - h, 0, yb); g.addColorStop(0, shade(wood, 0.1)); g.addColorStop(1, shade(wood, -0.35));
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = frame || shade(wood, -0.7); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = shade(wood, -0.6); ctx.lineWidth = 0.9;
    for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + w * i / 3, yb - h + w / 2 - 2); ctx.lineTo(x - w / 2 + w * i / 3, yb); ctx.stroke(); }
    ctx.strokeStyle = '#4a4e5a'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x - w / 2, yb - h * 0.55); ctx.lineTo(x + w / 2, yb - h * 0.55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - w / 2, yb - h * 0.2); ctx.lineTo(x + w / 2, yb - h * 0.2); ctx.stroke();
    K.dot(ctx, x + w * 0.22, yb - h * 0.4, 1, '#e4b95a');
  }
  function slit(ctx, x, y, w, h, glowCol) {
    K.rr(ctx, x - w / 2, y - h / 2, w, h, w / 2); ctx.fillStyle = glowCol || '#1a1226'; ctx.fill(); ctx.strokeStyle = 'rgba(20,10,30,0.75)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function arcWindow(ctx, x, y, w, h, glowCol, frame) {
    ctx.beginPath(); ctx.moveTo(x - w / 2, y + h / 2); ctx.lineTo(x - w / 2, y - h / 2 + w / 2); ctx.arc(x, y - h / 2 + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w / 2, y + h / 2); ctx.closePath();
    const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, shade(glowCol, 0.4)); g.addColorStop(1, glowCol);
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = frame || '#2a1c30'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.lineTo(x, y + h / 2); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineWidth = 0.9; ctx.stroke();
  }
  function pennant(ctx, x, y, len, hgt, col, t, dir) {
    dir = dir || 1;
    K.line(ctx, x, y + 3, x, y - len, '#5a3a22', 2);
    K.dot(ctx, x, y - len, 1.7, '#e4b95a');
    const w = 15, ph = t * 4.5;
    ctx.beginPath(); ctx.moveTo(x, y - len + 1);
    for (let i = 0; i <= 6; i++) { const f = i / 6; ctx.lineTo(x + dir * f * w, y - len + 1 + Math.sin(ph + f * 3.4) * 2.2 * f - f * 1.5); }
    for (let i = 6; i >= 0; i--) { const f = i / 6; ctx.lineTo(x + dir * f * w * (1 - 0.16 * f), y - len + hgt + Math.sin(ph + f * 3.4 + 0.4) * 2.2 * f); }
    ctx.closePath(); K.paint(ctx, col, [x, y - len, x + w, y - len + hgt], { dir: 'h', hi: 0.2, lo: -0.28, lw: 1 });
  }
  function hangBanner(ctx, x, y, w, h, col, trim, t, emblem) {
    const sw = Math.sin((t || 0) * 2.4 + x) * 1.2;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w / 2 + sw, y + h - 5); ctx.lineTo(x + sw, y + h); ctx.lineTo(x - w / 2 + sw, y + h - 5); ctx.closePath();
    K.paint(ctx, col, [x - w / 2, y, x + w / 2, y + h], { dir: 'v', hi: 0.22, lo: -0.3, lw: 1 });
    K.rect(ctx, x - w / 2 - 1, y - 1.5, w + 2, 2.6, trim || '#e4b95a', 1, { lw: 0.7 });
    if (emblem) emblem(ctx, x + sw * 0.5, y + h * 0.42, w * 0.3);
  }
  function flame(ctx, x, y, s, t, seed) {
    const f = Math.sin(t * 9 + seed) * 0.5 + Math.sin(t * 14 + seed * 2) * 0.3;
    K.glow(ctx, x, y - 3 * s, 11 * s, '#ff8a2a', 0.8);
    ctx.beginPath(); ctx.moveTo(x - 3.2 * s, y); ctx.quadraticCurveTo(x - 4 * s, y - 6 * s, x + f * s, y - 12 * s - f * 2 * s); ctx.quadraticCurveTo(x + 4 * s, y - 6 * s, x + 3.2 * s, y); ctx.closePath();
    ctx.fillStyle = '#ff7a1a'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 1.8 * s, y); ctx.quadraticCurveTo(x - 2 * s, y - 4 * s, x + f * 0.5 * s, y - 7.5 * s); ctx.quadraticCurveTo(x + 2 * s, y - 4 * s, x + 1.8 * s, y); ctx.closePath();
    ctx.fillStyle = '#ffd85a'; ctx.fill();
  }
  function sparkle(ctx, x, y, r, col) {
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fillStyle = col; ctx.fill();
  }

  /* =====================================================
   *  TRỤ NGƯỜI – doanh trại hiệp sĩ (đá xám + xanh dương + vàng)
   * ===================================================== */
  const ST = '#a8a398', BLUE = '#3f78c4', GOLD = '#e4b95a';
  function shieldEmblem(ctx, x, y, r) {
    ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y - r); ctx.lineTo(x + r, y + r * 0.3); ctx.quadraticCurveTo(x + r * 0.8, y + r * 1.1, x, y + r * 1.4); ctx.quadraticCurveTo(x - r * 0.8, y + r * 1.1, x - r, y + r * 0.3); ctx.closePath();
    K.paint(ctx, '#3a6fb8', [x - r, y - r, x + r, y + r * 1.4], { lw: 0.9 });
    K.flat(ctx, [x - r * 0.18, y - r * 0.8, x + r * 0.18, y - r * 0.8, x + r * 0.18, y + r * 0.9, x - r * 0.18, y + r * 0.9], GOLD);
    K.flat(ctx, [x - r * 0.7, y - r * 0.15, x + r * 0.7, y - r * 0.15, x + r * 0.7, y + r * 0.2, x - r * 0.7, y + r * 0.2], GOLD);
  }
  function humanStatic(ctx, tier) {
    pad(ctx, 36, 17, '#938e86');
    if (tier === 1) {
      cyl(ctx, 0, -2, 40, 44, ST, { ry: 7, merlons: 9 });
      // dải xanh + cửa + khe tên
      ctx.save(); cylPath(ctx, 0, -2, 20, 7, 44); ctx.clip();
      ctx.strokeStyle = BLUE; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, -33, 20, 7, 0, 0.02, Math.PI - 0.02); ctx.stroke();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, -36, 20, 7, 0, 0.02, Math.PI - 0.02); ctx.stroke(); ctx.restore();
      slit(ctx, -9, -24, 3, 9); slit(ctx, 9, -24, 3, 9);
      archDoor(ctx, 0, 5, 14, 19, '#7a5230');
      // chòi gỗ bên cạnh + rào
      for (let i = 0; i < 3; i++) { const x = 24 + i * 5; K.rect(ctx, x - 1.8, 0 + i, 3.6, -9, '#8a6238', 1, { lw: 0.8 }); K.flat(ctx, [x - 1.8, -9 + i, x, -12 + i, x + 1.8, -9 + i], '#a07646'); }
    } else if (tier === 2) {
      // hai tháp phụ phía sau
      for (const s of [-1, 1]) {
        cyl(ctx, s * 27, -8, 21, 40, ST, { ry: 4.5, top: false, rowH: 6.5 });
        cone(ctx, s * 27, -48, 14, 26, BLUE, { ry: 4.6, trim: GOLD, rows: 4 });
        K.dot(ctx, s * 27, -76, 1.8, GOLD);
        slit(ctx, s * 27 + s * 1, -30, 2.6, 8);
      }
      // tường nối
      K.rect(ctx, -26, -22, 52, 18, '#9a9589', 1);
      cyl(ctx, 0, -3, 42, 38, ST, { ry: 7.5 });
      cyl(ctx, 0, -41, 34, 22, shade(ST, 0.04), { ry: 6, merlons: 8 });
      ctx.save(); cylPath(ctx, 0, -3, 21, 7.5, 38); ctx.clip();
      ctx.strokeStyle = BLUE; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, -34, 21, 7.5, 0, 0.02, Math.PI - 0.02); ctx.stroke(); ctx.restore();
      shieldEmblem(ctx, 0, -22, 6.5);
      arcWindow(ctx, 0, -50, 7, 11, '#ffd98a');
      archDoor(ctx, 0, 6, 16, 20, '#7a5230');
    } else {
      // tháp phụ lớn
      for (const s of [-1, 1]) {
        cyl(ctx, s * 30, -9, 24, 56, ST, { ry: 5, top: false, rowH: 6.5 });
        K.rect(ctx, s * 30 - 12.5, -41, 25, 3.2, GOLD, 1, { lw: 0.8 });
        cone(ctx, s * 30, -65, 16, 32, BLUE, { ry: 5.2, trim: GOLD, stripe: GOLD, rows: 5 });
        K.line(ctx, s * 30, -97, s * 30, -104, '#5a3a22', 1.6); K.dot(ctx, s * 30, -105, 2.2, GOLD);
        arcWindow(ctx, s * 30 + s * 1, -40, 5, 9, '#ffd98a');
      }
      K.rect(ctx, -30, -26, 60, 22, '#9a9589', 1);
      cyl(ctx, 0, -3, 46, 36, ST, { ry: 8 });
      cyl(ctx, 0, -39, 38, 28, shade(ST, 0.05), { ry: 6.6, top: false });
      K.rect(ctx, -19.4, -40, 38.8, 3.4, GOLD, 1, { lw: 0.8 });
      cone(ctx, 0, -67, 25, 40, BLUE, { ry: 7.5, trim: GOLD, stripe: GOLD, rows: 6 });
      K.line(ctx, 0, -107, 0, -118, '#5a3a22', 2); K.dot(ctx, 0, -119, 3, GOLD);
      ctx.save(); cylPath(ctx, 0, -3, 23, 8, 36); ctx.clip();
      ctx.strokeStyle = BLUE; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, -30, 23, 8, 0, 0.02, Math.PI - 0.02); ctx.stroke();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, -33.5, 23, 8, 0, 0.02, Math.PI - 0.02); ctx.beginPath(); ctx.ellipse(0, -26.5, 23, 8, 0, 0.02, Math.PI - 0.02); ctx.stroke(); ctx.restore();
      arcWindow(ctx, 0, -53, 8, 13, '#ffd98a', '#c9a24a');
      arcWindow(ctx, -13, -50, 5, 9, '#ffd98a'); arcWindow(ctx, 13, -50, 5, 9, '#ffd98a');
      shieldEmblem(ctx, 0, -19, 7.5);
      archDoor(ctx, 0, 7, 18, 22, '#6e4828', '#c9a24a');
      // bậc thềm vàng
      K.rect(ctx, -12, 6, 24, 3, '#c4bdae', 1, { lw: 0.8 });
    }
  }
  function humanFx(ctx, tier, t, st) {
    if (tier === 1) pennant(ctx, 14, -50, 22, 11, BLUE, t);
    else if (tier === 2) { pennant(ctx, 0, -63, 18, 11, BLUE, t); }
    else {
      pennant(ctx, 0, -118, 0, 13, '#2f62b0', t);
      hangBanner(ctx, -17, -34, 9, 24, BLUE, GOLD, t, shieldEmblem);
      hangBanner(ctx, 17, -34, 9, 24, BLUE, GOLD, t, shieldEmblem);
      for (const s of [-1, 1]) { K.line(ctx, s * 9.5, 1, s * 9.5, -10, '#4a3220', 2); flame(ctx, s * 9.5, -10, 0.7, t, s * 3); }
    }
    if (st && st.door > 0) { K.glow(ctx, 0, tier === 3 ? 0 : -2, 20, '#ffd98a', st.door); }
  }

  /* =====================================================
   *  TRỤ ELF – cây thần (vỏ gỗ + lá xanh, cấp cao ánh bạc-vàng)
   * ===================================================== */
  function trunk(ctx, h, w0, w1, bark, tw) {
    ctx.beginPath(); ctx.moveTo(-w0 / 2 - 7, 3);
    ctx.quadraticCurveTo(-w0 / 2 - 1, -4, -w0 / 2 + 1, -14);
    ctx.bezierCurveTo(-w0 / 2 + 2 - tw, -h * 0.4, -w1 / 2 + tw, -h * 0.7, -w1 / 2, -h);
    ctx.lineTo(w1 / 2, -h);
    ctx.bezierCurveTo(w1 / 2 + tw, -h * 0.7, w0 / 2 - 2 - tw, -h * 0.4, w0 / 2 - 1, -14);
    ctx.quadraticCurveTo(w0 / 2 + 1, -4, w0 / 2 + 7, 3);
    ctx.quadraticCurveTo(0, 8, -w0 / 2 - 7, 3); ctx.closePath();
    ctx.fillStyle = hgrad(ctx, -w0 / 2, w0 / 2, bark, 0.3, 0.02, -0.5); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(30,14,6,0.32)'; ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 4.2, 4); ctx.bezierCurveTo(i * 3.4 + 2, -h * 0.3, i * 3 - 2, -h * 0.65, i * 2.2, -h); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = shade(bark, -0.65); ctx.lineWidth = K.lw; ctx.stroke();
  }
  function leafBlob(ctx, x, y, r, base, lite) {
    K.circ(ctx, x, y, r, base, { hi: 0.32, lo: -0.34 });
    const rnd = K.seeded(Math.floor(x * 7 + y * 13 + r));
    ctx.fillStyle = alpha(lite || shade(base, 0.35), 0.5);
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x - r * 0.45 + rnd() * r * 0.6, y - r * 0.5 + rnd() * r * 0.5, r * 0.22, r * 0.13, -0.5, 0, TAU); ctx.fill(); }
  }
  function woodPlatform(ctx, y, rx, wood, gold) {
    const ry = rx * 0.38, th = 5;
    cylPath(ctx, 0, y + th, rx, ry, th); ctx.fillStyle = hgrad(ctx, -rx, rx, wood, 0.1, -0.1, -0.5); ctx.fill(); ctx.strokeStyle = shade(wood, -0.7); ctx.lineWidth = K.lw; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, y, rx, ry, 0, 0, TAU); const g = ctx.createRadialGradient(-rx * 0.3, y - ry * 0.4, 2, 0, y, rx); g.addColorStop(0, shade(wood, 0.3)); g.addColorStop(1, shade(wood, -0.05));
    ctx.fillStyle = g; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(30,14,6,0.3)'; ctx.lineWidth = 0.9;
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * rx / 4.2, y - ry); ctx.lineTo(i * rx / 4.2 * 1.0, y + ry); ctx.stroke(); }
    ctx.restore();
    if (gold) { ctx.strokeStyle = gold; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, y + th, rx, ry, 0, 0.05, Math.PI - 0.05); ctx.stroke(); }
  }
  function railing(ctx, y, rx, wood, rope) {
    const ry = rx * 0.38; const n = 9;
    for (let i = 0; i <= n; i++) {
      const phi = Math.PI * i / n, x = Math.cos(phi) * rx * 0.96, yy = y + Math.sin(phi) * ry * 0.96;
      K.rect(ctx, x - 1.1, yy - 9, 2.2, 9.5, wood, 0.8, { lw: 0.7 });
    }
    ctx.strokeStyle = rope; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.ellipse(0, y - 8, rx * 0.96, ry * 0.96, 0, 0.02, Math.PI - 0.02); ctx.stroke();
    ctx.strokeStyle = shade(rope, -0.5); ctx.lineWidth = 0.7; ctx.stroke();
  }
  function elfStatic(ctx, tier) {
    const WOOD = '#8b5f38', DW = '#6b4528';
    pad(ctx, 36, 17, '#6e8a4c', 'moss');
    if (tier === 1) {
      trunk(ctx, 52, 24, 18, WOOD, 3);
      // rễ
      for (const [x, s] of [[-13, -1], [13, 1], [0, 0.3]]) { ctx.beginPath(); ctx.moveTo(x - s * 3, -4); ctx.quadraticCurveTo(x + s * 8, 0, x + s * 15, 6); ctx.quadraticCurveTo(x + s * 6, 5, x - s * 3, 3); ctx.closePath(); K.paint(ctx, WOOD, [x - 5, -4, x + 15, 6], { lw: 1 }); }
      for (const [x, y, r, c] of [[-20, -66, 15, '#3f8a3e'], [20, -68, 14, '#3f8a3e'], [0, -80, 18, '#4f9a4a'], [-10, -74, 15, '#58aa52'], [11, -76, 14, '#58aa52']]) leafBlob(ctx, x, y, r, c);
      woodPlatform(ctx, -48, 25, WOOD); railing(ctx, -48, 25, DW, '#d9c28a');
      // lồng đèn
      K.line(ctx, -20, -54, -20, -60, '#4a3220', 1); K.rect(ctx, -22.5, -52.5, 5, 6, '#e6f5b0', 2, { lw: 0.9 });
      for (const [x, y, r, c] of [[-28, -58, 9, '#5fb858'], [27, -60, 9, '#5fb858'], [8, -92, 12, '#6cc05a']]) leafBlob(ctx, x, y, r, c);
    } else if (tier === 2) {
      trunk(ctx, 62, 28, 20, WOOD, 4);
      for (const [x, s] of [[-15, -1], [15, 1], [0, 0.3]]) { ctx.beginPath(); ctx.moveTo(x - s * 3, -4); ctx.quadraticCurveTo(x + s * 9, 0, x + s * 17, 7); ctx.quadraticCurveTo(x + s * 6, 5, x - s * 3, 3); ctx.closePath(); K.paint(ctx, WOOD, [x - 5, -4, x + 17, 7], { lw: 1 }); }
      // thang xoắn quanh thân
      ctx.strokeStyle = DW; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(14, -5); ctx.bezierCurveTo(22, -16, 4, -22, 12, -34); ctx.bezierCurveTo(18, -42, 4, -46, 8, -54); ctx.stroke();
      ctx.strokeStyle = '#b68a56'; ctx.lineWidth = 1.6; ctx.stroke();
      // tán lá lớn
      for (const [x, y, r, c] of [[-26, -74, 17, '#3a8a46'], [26, -76, 16, '#3a8a46'], [0, -92, 21, '#4a9a50'], [-14, -84, 17, '#58aa56'], [14, -86, 16, '#58aa56'], [0, -74, 14, '#3f8f48']]) leafBlob(ctx, x, y, r, c);
      woodPlatform(ctx, -56, 28, WOOD, '#e4b95a'); railing(ctx, -56, 28, DW, '#e8d8a0');
      // hoa
      for (const [x, y] of [[-22, -88], [18, -96], [-6, -102], [26, -84], [-30, -78]]) { K.dot(ctx, x, y, 2.6, '#f7c6d9'); K.dot(ctx, x, y, 1, '#fff2a0'); }
      // pha lê xanh
      for (const [x, y, s] of [[-28, -4, 1], [30, -2, 0.8]]) { K.poly(ctx, [x - 3 * s, y, x, y - 12 * s, x + 3 * s, y], '#7fe8d0', { lw: 0.9 }); K.poly(ctx, [x + 3 * s, y, x + 6 * s, y - 7 * s, x + 7 * s, y], '#5fd0c0', { lw: 0.9 }); }
      hangBanner(ctx, -20, -52, 8, 18, '#3f9a52', '#e4b95a', 0);
      hangBanner(ctx, 20, -52, 8, 18, '#3f9a52', '#e4b95a', 0);
      for (const [x, y, r, c] of [[-32, -62, 10, '#5fb858'], [32, -62, 10, '#5fb858']]) leafBlob(ctx, x, y, r, c);
    } else {
      // cây cổ thụ vỏ bạc, lá vàng
      const BARK = '#cfc4a8';
      trunk(ctx, 70, 34, 24, BARK, 5);
      for (const [x, s] of [[-18, -1], [18, 1], [0, 0.3], [-26, -1.4], [27, 1.4]]) { ctx.beginPath(); ctx.moveTo(x - s * 3, -4); ctx.quadraticCurveTo(x + s * 9, 0, x + s * 17, 7); ctx.quadraticCurveTo(x + s * 6, 5, x - s * 3, 3); ctx.closePath(); K.paint(ctx, BARK, [x - 5, -4, x + 17, 7], { lw: 1 }); }
      // thân có hoa văn vàng
      ctx.strokeStyle = 'rgba(228,185,90,0.8)'; ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-8, -14 - i * 14); ctx.quadraticCurveTo(0, -22 - i * 14, 8, -14 - i * 14); ctx.stroke(); }
      for (const [x, y, r, c] of [[-34, -84, 19, '#6ea83a'], [34, -86, 18, '#6ea83a'], [0, -106, 24, '#86bd42'], [-20, -98, 19, '#98c94a'], [20, -100, 18, '#98c94a'], [0, -86, 17, '#7ab33e'], [-40, -70, 12, '#6ea83a'], [40, -72, 12, '#6ea83a']]) leafBlob(ctx, x, y, r, c, '#fff0a0');
      for (const [x, y, r] of [[-12, -112, 8], [14, -108, 7], [-30, -92, 6], [30, -94, 6], [0, -122, 6]]) { K.circ(ctx, x, y, r, '#f2d36a', { hi: 0.5, lo: -0.2 }); }
      woodPlatform(ctx, -64, 31, '#a67c4a', '#e4b95a'); railing(ctx, -64, 31, '#7a5530', '#f2e2a8');
      // pha lê + cổng
      for (const [x, y, s] of [[-32, -2, 1.2], [34, 0, 1], [-38, 4, 0.7]]) { K.poly(ctx, [x - 3 * s, y, x, y - 14 * s, x + 3 * s, y], '#8ff0dc', { lw: 0.9 }); K.poly(ctx, [x + 3 * s, y, x + 6 * s, y - 8 * s, x + 7 * s, y], '#62d8c6', { lw: 0.9 }); }
      hangBanner(ctx, -22, -60, 9, 24, '#3f9a52', '#f2d36a', 0);
      hangBanner(ctx, 22, -60, 9, 24, '#3f9a52', '#f2d36a', 0);
      ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(-6, -10); ctx.arc(0, -10, 6, Math.PI, 0); ctx.lineTo(6, 2); ctx.closePath(); ctx.fillStyle = '#2a1a10'; ctx.fill(); ctx.strokeStyle = '#e4b95a'; ctx.lineWidth = 1.3; ctx.stroke();
    }
  }
  function elfFx(ctx, tier, t, st, env) {
    const py = tier === 1 ? -48 : tier === 2 ? -56 : -64;
    const face = st && st.face ? st.face : 1, a = st && st.a !== undefined ? st.a : -1;
    if (tier === 3) { env.char('elfArcher', -11, py + 1, face, a >= 0 && st.k % 2 === 0 ? a : -1, t); env.char('elfArcher', 11, py + 2, face, a >= 0 && st.k % 2 === 1 ? a : -1, t + 1); }
    else env.char('elfArcher', 0, py + 2, face, a, t);
    // lá bay
    const n = tier === 1 ? 3 : tier === 2 ? 5 : 7;
    for (let i = 0; i < n; i++) {
      const ph = (t * 0.35 + i / n) % 1, x = Math.sin(ph * 6 + i * 2) * (26 + i * 2), y = -py * 0 + (-60 - tier * 8) + ph * 70;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ph * 8 + i); ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.9;
      ctx.beginPath(); ctx.ellipse(0, 0, 3, 1.5, 0, 0, TAU); ctx.fillStyle = tier === 3 ? '#f2d36a' : '#8fd66a'; ctx.fill(); ctx.restore();
    }
    if (tier >= 2) { for (let i = 0; i < 3; i++) { const p = (t * 0.6 + i * 0.33) % 1; ctx.globalAlpha = Math.sin(p * Math.PI); sparkle(ctx, (i - 1) * 22, -4 - p * 26, 2.2, '#bfffee'); } ctx.globalAlpha = 1; }
    if (tier === 1) K.glow(ctx, -20, -49, 9, '#e6f5b0', 0.6 + Math.sin(t * 3) * 0.15);
    if (tier === 3) K.glow(ctx, 0, -100, 40, '#fff0a0', 0.22 + Math.sin(t * 2) * 0.06);
  }

  /* =====================================================
   *  TRỤ PHÙ THỦY – tháp huyền bí (tím + ánh sáng ma thuật)
   * ===================================================== */
  const WST = '#8e7fae', WDK = '#4a2a78', WROOF = '#5b2e9a';
  function cauldron(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (const lx of [-6, 6]) K.poly(ctx, [lx - 1.6, 0, lx + 1.6, 0, lx + 0.8, 5, lx - 0.8, 5], '#2a2230', { lw: 0.8 });
    ctx.beginPath(); ctx.ellipse(0, -5, 9.5, 8, 0, 0, TAU); K.paint(ctx, '#3b3446', [-9, -13, 9, 3], { dir: 'd' });
    ctx.beginPath(); ctx.ellipse(0, -11, 8.5, 3, 0, 0, TAU); ctx.fillStyle = '#6ae04a'; ctx.fill(); ctx.strokeStyle = '#1b1214'; ctx.lineWidth = 1; ctx.stroke();
    K.rect(ctx, -10, -13, 20, 2.5, '#59506a', 1, { lw: 0.8 });
    ctx.restore();
  }
  function crescent(ctx, x, y, r, col) {
    ctx.beginPath(); ctx.arc(x, y, r, 0.5, TAU - 0.5); ctx.arc(x + r * 0.45, y - r * 0.1, r * 0.78, TAU - 0.7, 0.7, true); ctx.closePath();
    K.paint(ctx, col, [x - r, y - r, x + r, y + r], { lw: 0.8 });
  }
  /** Thông số đài phép theo cấp: đỉnh thân (top), bán kính sàn, chiều cao cột, mái */
  const WG = {
    1: { top: -40, rx: 17, ph: 44, roof: 22, rh: 30 },
    2: { top: -52, rx: 18, ph: 46, roof: 24, rh: 36 },
    3: { top: -66, rx: 19, ph: 46, roof: 26, rh: 38 }
  };
  function gazeboBack(ctx, tier) {
    const G = WG[tier], y0 = G.top, y1 = y0 - G.ph;
    // sàn chòi
    ctx.beginPath(); ctx.ellipse(0, y0, G.rx + 3, (G.rx + 3) * 0.32, 0, 0, TAU); K.paint(ctx, '#6a5690', [-G.rx, y0 - 6, G.rx, y0 + 6], { dir: 'v' });
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(220,170,255,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, y0, G.rx * 0.65, G.rx * 0.2, 0, 0, TAU); ctx.stroke(); ctx.restore();
    // cột sau
    for (const s of [-1, 1]) { K.rect(ctx, s * G.rx * 0.55 - 1.6, y1, 3.2, G.ph - 2, shade('#4a2a78', -0.15), 1, { lw: 0.8 }); }
    // 2 cột hai bên
    for (const s of [-1, 1]) {
      K.rect(ctx, s * G.rx - 2.4, y1, 4.8, G.ph, '#8e7fae', 1.2, { lw: 1 });
      K.rect(ctx, s * G.rx - 3.4, y0 - 4, 6.8, 4, '#5a4478', 1, { lw: 0.8 });
      K.rect(ctx, s * G.rx - 3.4, y1, 6.8, 3.5, '#e4b95a', 1, { lw: 0.8 });
    }
    // mái
    K.rect(ctx, -G.rx - 5, y1 - 3, (G.rx + 5) * 2, 4, '#3c2260', 1.5, { lw: 0.9 });
    const tip = cone(ctx, 0, y1 - 1, G.roof, G.rh, WROOF, { ry: G.roof * 0.3, tilt: 5, trim: '#e4b95a', stripe: '#e4b95a', rows: 5 });
    ctx.beginPath(); ctx.moveTo(tip.x - 1, tip.y + 2); ctx.quadraticCurveTo(tip.x + 6, tip.y - 6, tip.x + 13, tip.y - 2); ctx.quadraticCurveTo(tip.x + 6, tip.y - 3, tip.x + 1, tip.y + 4); ctx.closePath(); K.paint(ctx, WROOF, [tip.x, tip.y - 6, tip.x + 13, tip.y + 4], { lw: 0.9 });
    K.dot(ctx, tip.x + 13, tip.y - 2, 1.8, '#e4b95a');
  }
  function witchStatic(ctx, tier) {
    pad(ctx, 36, 17, '#5d4d78');
    ctx.save(); ctx.strokeStyle = 'rgba(200,140,255,0.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0, 0, 29, 11.5, 0, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + 0.2; K.dot(ctx, Math.cos(a) * 29, Math.sin(a) * 11.5, 1.2, 'rgba(220,170,255,0.8)'); }
    ctx.restore();
    if (tier === 1) {
      cyl(ctx, 0, -2, 34, 38, WST, { ry: 6.4, top: false, rowH: 6.5 });
      K.rect(ctx, -19, -42, 38, 4, WDK, 1, { lw: 0.9 });
      gazeboBack(ctx, 1);
      arcWindow(ctx, 0, -24, 7, 11, '#c8f08a', '#2a1c40');
      archDoor(ctx, 0, 5, 12, 15, '#4a3060', '#2a1c40');
      cauldron(ctx, -27, 6, 0.9);
    } else if (tier === 2) {
      cyl(ctx, 0, -2, 40, 30, WST, { ry: 7.2, rowH: 6.5 });
      K.rect(ctx, -21.5, -33, 43, 4, WDK, 1, { lw: 0.9 });
      cyl(ctx, 0, -30, 32, 22, shade(WST, 0.04), { ry: 5.6, top: false, rowH: 6.5 });
      K.rect(ctx, -18, -54, 36, 4, WDK, 1, { lw: 0.9 });
      gazeboBack(ctx, 2);
      crescent(ctx, 0, -41, 5, '#f3e6a0');
      arcWindow(ctx, -9, -17, 6, 10, '#c8f08a', '#2a1c40'); arcWindow(ctx, 9, -17, 6, 10, '#c8f08a', '#2a1c40');
      archDoor(ctx, 0, 6, 14, 16, '#4a3060', '#2a1c40');
      for (const s of [-1, 1]) { K.poly(ctx, [s * 31 - 3, 5, s * 31, -9, s * 31 + 3, 5], '#b88aff', { lw: 0.9 }); K.poly(ctx, [s * 31 + 3, 5, s * 31 + 6, -3, s * 31 + 7, 5], '#8e5de0', { lw: 0.9 }); }
      cauldron(ctx, -29, 7, 1);
    } else {
      // tháp đá có hai tháp nhọn phụ
      for (const s of [-1, 1]) {
        cyl(ctx, s * 27, -6, 16, 44, shade(WST, -0.05), { ry: 3.6, top: false, rowH: 6 });
        cone(ctx, s * 27, -50, 11, 26, WROOF, { ry: 3.4, tilt: s * 3, trim: '#e4b95a', rows: 4 });
        arcWindow(ctx, s * 27, -30, 4, 8, '#d9a6ff', '#2a1c40');
      }
      cyl(ctx, 0, -2, 44, 34, WST, { ry: 8, rowH: 7 });
      K.rect(ctx, -23, -37, 46, 4.5, WDK, 1, { lw: 0.9 });
      cyl(ctx, 0, -34, 34, 30, shade(WST, 0.05), { ry: 6.4, top: false, rowH: 6.5 });
      K.rect(ctx, -19, -68, 38, 4.5, WDK, 1, { lw: 0.9 });
      K.rect(ctx, -19, -66.5, 38, 1.5, '#e4b95a', 0.5, { lw: 0 });
      gazeboBack(ctx, 3);
      arcWindow(ctx, 0, -50, 8, 13, '#d9a6ff', '#2a1c40');
      arcWindow(ctx, -12, -18, 6, 10, '#d9a6ff', '#2a1c40'); arcWindow(ctx, 12, -18, 6, 10, '#d9a6ff', '#2a1c40');
      archDoor(ctx, 0, 7, 16, 18, '#3a2450', '#e4b95a');
      for (const [x, y, s] of [[-36, 6, 1.3], [37, 7, 1.1], [-20, 15, 0.8], [22, 16, 0.8]]) { K.poly(ctx, [x - 3.5 * s, y, x, y - 15 * s, x + 3.5 * s, y], '#c79aff', { lw: 0.9 }); K.poly(ctx, [x + 3.5 * s, y, x + 7 * s, y - 8 * s, x + 8 * s, y], '#9a62ee', { lw: 0.9 }); }
      cauldron(ctx, -31, 9, 1.05);
    }
  }
  function witchFx(ctx, tier, t, st, env) {
    const G = WG[tier], cast = st && st.a >= 0 ? Math.sin(Math.min(1, st.a) * Math.PI) : 0;
    K.glow(ctx, 0, G.top - 18, 24, '#c77dff', 0.25 + cast * 0.5);
    env.char('witch', 0, G.top + 1, st && st.face ? st.face : 1, st && st.a !== undefined ? st.a : -1, t);
    // lan can phía trước
    ctx.strokeStyle = '#2a1c40'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(0, G.top - 5, G.rx + 2, (G.rx + 2) * 0.32, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.strokeStyle = '#e4b95a'; ctx.lineWidth = 1; ctx.stroke();
    for (let i = 1; i < 6; i++) { const ph = Math.PI * i / 6, x = Math.cos(ph) * (G.rx + 2), y = G.top + Math.sin(ph) * (G.rx + 2) * 0.32; K.line(ctx, x, y, x, y - 5, '#2a1c40', 1.4); }
    // nồi sủi bọt
    const cx = tier === 1 ? -27 : tier === 2 ? -29 : -31, cy = tier === 1 ? -5 : tier === 2 ? -4 : -2;
    for (let i = 0; i < 3; i++) { const p = (t * 0.7 + i / 3) % 1; ctx.globalAlpha = (1 - p) * 0.85; K.dot(ctx, cx + Math.sin(p * 7 + i) * 4, cy - 10 - p * 22, 1.6 + p * 2.6, '#9af06a'); }
    ctx.globalAlpha = 1;
    if (tier >= 2) for (const s of [-1, 1]) K.glow(ctx, s * (tier === 3 ? 36 : 31), 0, 12, '#c79aff', 0.45 + Math.sin(t * 3 + s) * 0.15);
    const roofTop = G.top - G.ph - G.rh;
    if (tier === 3) {
      const y = roofTop - 16 + Math.sin(t * 2) * 3, r = 8 + cast * 3;
      K.glow(ctx, 5, y, 30, '#d58bff', 0.65 + cast * 0.45);
      ctx.save(); ctx.translate(5, y);
      for (let i = 0; i < 2; i++) { ctx.save(); ctx.rotate(t * (i ? -1.1 : 1.4) + i); ctx.scale(1, 0.34 + i * 0.12); ctx.strokeStyle = i ? 'rgba(243,230,160,0.9)' : 'rgba(255,200,255,0.9)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, 16 + i * 3, 0, TAU); ctx.stroke(); ctx.restore(); }
      K.circ(ctx, 0, 0, r, '#c77dff', { hi: 0.6, lo: -0.25, lw: 1.1 }); K.dot(ctx, -2.5, -2.5, 2.6, 'rgba(255,255,255,0.8)');
      ctx.restore();
      for (let i = 0; i < 2; i++) { const a = t * 1.1 + i * 3.1, bx = Math.cos(a) * 40, by2 = roofTop + 10 + Math.sin(a * 1.7) * 14, f = Math.sin(t * 14 + i) * 3; ctx.fillStyle = '#251833'; ctx.beginPath(); ctx.moveTo(bx, by2); ctx.quadraticCurveTo(bx - 5, by2 - 4 - f, bx - 9, by2 - 1); ctx.quadraticCurveTo(bx - 5, by2 + 1, bx, by2 + 2); ctx.quadraticCurveTo(bx + 5, by2 + 1, bx + 9, by2 - 1); ctx.quadraticCurveTo(bx + 5, by2 - 4 - f, bx, by2); ctx.fill(); }
    } else if (tier === 2) {
      const y = roofTop - 10 + Math.sin(t * 2) * 2.5; K.glow(ctx, 6, y, 14, '#e0b0ff', 0.7 + cast * 0.4);
      K.poly(ctx, [6, y - 7, 10.5, y, 6, y + 7, 1.5, y], '#e3b9ff', { lw: 1 }); K.flat(ctx, [6, y - 7, 1.5, y, 6, y - 1], 'rgba(255,255,255,0.45)');
    }
    for (let i = 0; i < tier + 1; i++) { const p = (t * 0.5 + i / (tier + 1)) % 1; ctx.globalAlpha = Math.sin(p * Math.PI) * 0.9; sparkle(ctx, Math.sin(i * 2.1 + p * 3) * 26, -10 - p * (50 + tier * 14), 2, '#f0d0ff'); }
    ctx.globalAlpha = 1;
  }

  /* =====================================================
   *  TRỤ ORC – trại chiến binh (gỗ, da thú, xương, lửa)
   * ===================================================== */
  const OW = '#8a5a34', OD = '#5c3b22', HIDE = '#b88a58', BONE = '#eadfc2', RED = '#c23a2a';
  function skull(ctx, x, y, s, eye) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    K.circ(ctx, 0, -2, 6.6, BONE, { lw: 1.1 });
    K.poly(ctx, [-3.6, 3, 3.6, 3, 3, 7.5, -3, 7.5], '#d9ccaa', { lw: 1 });
    K.ell(ctx, -2.6, -2, 1.9, 2.3, '#1a1226', { lw: 0 }); K.ell(ctx, 2.6, -2, 1.9, 2.3, '#1a1226', { lw: 0 });
    if (eye) { K.dot(ctx, -2.6, -2, 1, eye); K.dot(ctx, 2.6, -2, 1, eye); }
    ctx.restore();
  }
  function logWall(ctx, cx, yb, w, h, spike) {
    const rx = w / 2, ry = Math.max(4, w * 0.17);
    cylPath(ctx, cx, yb, rx, ry, h); ctx.fillStyle = hgrad(ctx, cx - rx, cx + rx, OW, 0.26, 0.02, -0.46); ctx.fill();
    ctx.save(); cylPath(ctx, cx, yb, rx, ry, h); ctx.clip();
    const n = Math.round(w / 5.4);
    for (let k = 0; k <= n; k++) { const phi = Math.PI * k / n, x = cx + rx * Math.cos(phi); ctx.strokeStyle = 'rgba(25,10,4,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, yb - h - ry); ctx.lineTo(x, yb + ry); ctx.stroke(); }
    ctx.restore();
    cylPath(ctx, cx, yb, rx, ry, h); ctx.strokeStyle = shade(OW, -0.7); ctx.lineWidth = K.lw; ctx.stroke();
    // đai sắt
    for (const f of [0.28, 0.72]) { ctx.beginPath(); ctx.ellipse(cx, yb - h * f, rx, ry, 0, 0.0, Math.PI); ctx.strokeStyle = '#4a4e5a'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = '#8a8f9c'; ctx.lineWidth = 0.8; ctx.stroke(); }
    // đầu cọc nhọn
    if (spike) {
      const m = Math.round(w / 6);
      for (let k = 0; k < m; k++) {
        const phi = Math.PI * (k + 0.5) / m, x = cx + rx * Math.cos(phi), y = yb - h + ry * Math.sin(phi);
        K.poly(ctx, [x - 3, y + 1, x - 2.4, y - 8 - (k % 2) * 3, x, y - 13 - (k % 2) * 3, x + 2.4, y - 8 - (k % 2) * 3, x + 3, y + 1], k % 2 ? OW : shade(OW, 0.1), { lw: 0.9 });
      }
    }
  }
  function orcStatic(ctx, tier) {
    pad(ctx, 36, 17, '#85684a');
    // xương rải
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 36, 17, 0, 0, TAU); ctx.clip();
    for (const [x, y, a] of [[-24, 7, 0.4], [22, 9, -0.6], [-8, 12, 0.1]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); K.line(ctx, -5, 0, 5, 0, '#3a2a1a', 3.4); K.line(ctx, -5, 0, 5, 0, BONE, 2); ctx.restore(); }
    ctx.restore();
    if (tier === 1) {
      // lều da thú
      const ap = cone(ctx, 0, -2, 28, 50, HIDE, { ry: 9, rows: 4, trim: '#6b4529', hi: 0.34 });
      // cửa lều
      ctx.beginPath(); ctx.moveTo(-8, 7); ctx.quadraticCurveTo(-5, -14, 0, -22); ctx.quadraticCurveTo(5, -14, 8, 7); ctx.closePath(); K.paint(ctx, '#2a1810', [-8, -22, 8, 7], { dir: 'v', lw: 1.1 });
      K.flat(ctx, [-8, 7, -3, 4, -5, -8, -2, -17, -6, -6], '#6b4529');
      // vết da đỏ
      K.line(ctx, -16, -12, -10, -26, RED, 2.4); K.line(ctx, 15, -12, 10, -26, RED, 2.4);
      // xương chéo trên đỉnh
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(0, -52); ctx.rotate(s * 0.42); K.limb(ctx, 0, 12, 0, -11, 3.2, BONE); K.circ(ctx, 0, -12, 2.4, BONE, { lw: 0.8 }); ctx.restore(); }
      // cọc rào + sọ
      for (let i = 0; i < 3; i++) { const x = -34 + i * 6; K.poly(ctx, [x - 2.6, 4 + i * 1.2, x - 2.2, -10 + i, x, -16 + i, x + 2.2, -10 + i, x + 2.6, 4 + i * 1.2], i % 2 ? OW : shade(OW, 0.1), { lw: 0.9 }); }
      K.limb(ctx, 31, 6, 31, -26, 3.2, OD); skull(ctx, 31, -30, 0.9, '#ff4a2a');
    } else if (tier === 2) {
      logWall(ctx, 0, -2, 46, 34, true);
      // mái da trên sàn cao phía sau
      K.rect(ctx, -3, -62, 6, 28, OD, 1, { lw: 0.9 });
      cone(ctx, 0, -50, 22, 26, HIDE, { ry: 7, rows: 3, trim: '#6b4529', hi: 0.3 });
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 1, -76); ctx.rotate(s * 0.4); K.limb(ctx, 0, 8, 0, -8, 3, BONE); ctx.restore(); }
      // cổng + sọ lớn
      archDoor(ctx, 0, 6, 16, 20, '#4a2e1a', '#2a1810');
      skull(ctx, 0, -27, 1.4, '#ff4a2a');
      // sừng nanh hai bên
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 17, -30); ctx.quadraticCurveTo(s * 31, -36, s * 27, -52); ctx.quadraticCurveTo(s * 24, -40, s * 15, -34); ctx.closePath(); K.paint(ctx, BONE, [s * 31, -52, s * 15, -30], { lw: 1 }); }
      // cờ vải đỏ
      hangBanner(ctx, -19, -36, 8, 20, RED, '#6b4529', 0);
      hangBanner(ctx, 19, -36, 8, 20, RED, '#6b4529', 0);
      // lò lửa
      K.rect(ctx, 25, -4, 12, 7, '#4a4e5a', 2); K.rect(ctx, -37, -4, 12, 7, '#4a4e5a', 2);
    } else {
      // chiến thành: hai tháp gỗ cao + sảnh chính
      for (const s of [-1, 1]) {
        logWall(ctx, s * 32, -8, 20, 62, true);
        K.rect(ctx, s * 32 - 12, -50, 24, 3.4, '#8a8f9c', 1, { lw: 0.8 });
        cone(ctx, s * 32, -72, 14, 20, HIDE, { ry: 4.6, rows: 3, trim: '#6b4529' });
        skull(ctx, s * 32, -38, 0.75, '#ff4a2a');
      }
      logWall(ctx, 0, -2, 54, 42, true);
      // mái da cao + sừng khổng lồ
      cone(ctx, 0, -56, 28, 40, HIDE, { ry: 8.4, rows: 4, trim: '#6b4529', stripe: RED });
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 10, -66); ctx.quadraticCurveTo(s * 34, -70, s * 30, -100); ctx.quadraticCurveTo(s * 22, -78, s * 7, -72); ctx.closePath(); K.paint(ctx, BONE, [s * 34, -100, s * 7, -66], { lw: 1.1 }); }
      // cổng sọ khổng lồ
      ctx.beginPath(); ctx.moveTo(-10, 7); ctx.lineTo(-10, -12); ctx.arc(0, -12, 10, Math.PI, 0); ctx.lineTo(10, 7); ctx.closePath(); ctx.fillStyle = '#1a0c08'; ctx.fill(); ctx.strokeStyle = '#2a1810'; ctx.lineWidth = 1.5; ctx.stroke();
      for (let i = -3; i <= 3; i++) K.poly(ctx, [i * 2.8 - 1.2, -22 + Math.abs(i), i * 2.8, -14 + Math.abs(i), i * 2.8 + 1.2, -22 + Math.abs(i)], BONE, { lw: 0.6 });
      skull(ctx, 0, -32, 1.8, '#ff4a2a');
      hangBanner(ctx, -20, -38, 9, 26, RED, '#e4b95a', 0);
      hangBanner(ctx, 20, -38, 9, 26, RED, '#e4b95a', 0);
    }
  }
  function orcFx(ctx, tier, t, st) {
    if (tier === 1) { flame(ctx, 24, 5, 1.1, t, 1); pennant(ctx, 31, -30, 6, 10, RED, t); }
    else if (tier === 2) { flame(ctx, 31, -3, 0.95, t, 1); flame(ctx, -31, -3, 0.95, t, 2); pennant(ctx, 0, -76, 8, 11, RED, t); }
    else { flame(ctx, 0, 6 + 0, 0.01, t, 0); for (const s of [-1, 1]) { K.rect(ctx, s * 15 - 4, -6, 8, 6, '#4a4e5a', 2); flame(ctx, s * 15, -6, 1.1, t, s); K.glow(ctx, s * 32, -38, 12, '#ff3a2a', 0.5 + Math.sin(t * 5) * 0.2); } pennant(ctx, -32, -92, 8, 12, RED, t); pennant(ctx, 32, -92, 8, 12, RED, t, 1); }
    if (st && st.door > 0) K.glow(ctx, 0, -4, 18, '#ff9a4a', st.door);
  }

  window.ArtTowers = {
    human: { static: humanStatic, fx: humanFx, box: [130, 168, 65, 142] },
    elf:   { static: elfStatic,   fx: elfFx,   box: [130, 184, 65, 158] },
    witch: { static: witchStatic, fx: witchFx, box: [130, 226, 65, 200] },
    orc:   { static: orcStatic,   fx: orcFx,   box: [130, 158, 65, 132] },
    _kit: { flame, sparkle, pennant }
  };
})();
