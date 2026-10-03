/* =========================================================
 * art.js – Đồ hoạ vẽ bằng code (không dùng emoji)
 * Mỗi nhân vật được thiết kế ở hệ toạ độ cục bộ (bán kính 16),
 * rồi phóng to theo bán kính thật. Muốn dùng ảnh PNG thật thì
 * khai báo sprite.image trong config – Sprites sẽ ưu tiên ảnh.
 * ========================================================= */
(function () {
  const OUT = '#17110f';
  const SKIN = '#d6a27a';

  function begin(ctx, x, y, s, face) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (face || 1), s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  }
  function poly(ctx, pts, fill, stroke) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke !== false) ctx.stroke();
  }
  function circ(ctx, x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke !== false) ctx.stroke();
  }
  function ell(ctx, x, y, rx, ry, fill, stroke) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke !== false) ctx.stroke();
  }
  function line(ctx, x1, y1, x2, y2, color, w) {
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  }
  function legs(ctx, t, moving, color, spread, top, len, w) {
    const sw = moving ? Math.sin(t * 12) * 3 : 0;
    ctx.fillStyle = color;
    ctx.fillRect(-spread - w / 2 + sw, top, w, len); ctx.strokeRect(-spread - w / 2 + sw, top, w, len);
    ctx.fillRect(spread - w / 2 - sw, top, w, len); ctx.strokeRect(spread - w / 2 - sw, top, w, len);
  }
  function glow(ctx, x, y, r, color, a) {
    ctx.globalAlpha = a; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }

  /* ===================== LÍNH PHE TA ===================== */
  const UNITS = {
    archer(ctx, t, att, mov) {
      // ống tên sau lưng
      ctx.fillStyle = '#5a3a1e'; ctx.fillRect(-12, -12, 5, 15); ctx.strokeRect(-12, -12, 5, 15);
      line(ctx, -10.5, -12, -12, -17, '#cfc6b0', 1.5); line(ctx, -8.5, -12, -8, -17, '#cfc6b0', 1.5);
      legs(ctx, t, mov, '#3a2a1e', 4, 6, 9, 4);
      poly(ctx, [-10, 10, 10, 10, 7, -7, -7, -7], '#2e5b88');
      poly(ctx, [-3, 10, 3, 10, 2, -6, -2, -6], '#1e3d5e', false);
      line(ctx, -8, 2, 8, 2, '#6b4a2b', 2.5);
      circ(ctx, 0, -13, 8, '#244a70');
      circ(ctx, 3, -12, 4.6, SKIN, false);
      circ(ctx, 5, -13, 1, OUT, false);
      // cung
      const pull = att ? 5 : 0;
      ctx.strokeStyle = '#7a4b22'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(4, -2, 13, -1.15, 1.15); ctx.stroke();
      const ax = 4 + Math.cos(1.15) * 13, ay = Math.sin(1.15) * 13;
      ctx.strokeStyle = '#e8e0cc'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ax, -2 - ay); ctx.lineTo(ax - pull, -2); ctx.lineTo(ax, -2 + ay); ctx.stroke();
      ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    },
    mage(ctx, t, att, mov) {
      legs(ctx, t, mov, '#2a1a30', 4, 8, 6, 4);
      poly(ctx, [-11, 12, 11, 12, 5, -6, -5, -6], '#4a2a6e');
      line(ctx, -10, 11, 10, 11, '#c9a24a', 2);
      line(ctx, 0, -5, 0, 11, '#c9a24a', 1.5);
      circ(ctx, 1, -10, 5, SKIN, false);
      poly(ctx, [-3, -8, 5, -8, 1, 0], '#d9d4ca');
      ell(ctx, 0, -13, 11, 3, '#33194f');
      poly(ctx, [-8, -13, 8, -13, 3, -31], '#3a1f57');
      // gậy phép
      line(ctx, 9, 12, 12, -17, '#6b4a2b', 3);
      const pulse = att ? 0.7 : 0.35 + Math.sin(t * 5) * 0.1;
      glow(ctx, 12, -20, att ? 10 : 7, '#c77dff', pulse);
      circ(ctx, 12, -20, 4, '#d9a6ff');
      circ(ctx, 12, -20, 1.6, '#ffffff', false);
    },
    orc(ctx, t, att, mov) {
      legs(ctx, t, mov, '#3a2a1e', 6, 6, 9, 6);
      ell(ctx, 0, 0, 13, 12, '#5b7f3a');
      poly(ctx, [-12, -4, 12, -4, 11, 4, -11, 4], '#4a3424');
      poly(ctx, [-14, -10, -6, -12, -5, -4, -14, -3], '#7a756d');
      circ(ctx, 2, -13, 8, '#5b7f3a');
      line(ctx, -2, -16, 7, -15, '#2a3a1a', 2.5);
      circ(ctx, 5, -13, 1.3, '#ffd23f', false);
      poly(ctx, [0, -8, 1.5, -12, 3, -8], '#f2ecdc', false);
      poly(ctx, [6, -8, 7.5, -12, 9, -8], '#f2ecdc', false);
      // rìu
      ctx.save(); ctx.translate(10, 4); ctx.rotate(att ? 1.0 : -0.25);
      line(ctx, 0, 6, 0, -22, '#6b4a2b', 3.5);
      poly(ctx, [0, -22, 9, -27, 11, -16, 0, -14], '#b8bcc4');
      ctx.restore();
    }
  };

  /* ===================== QUÁI ===================== */
  const ENEMIES = {
    goblin(ctx, t, att, mov) {
      legs(ctx, t, mov, '#3b3020', 4, 6, 7, 4);
      poly(ctx, [-8, 10, 8, 10, 6, -3, -6, -3], '#5a4430');
      poly(ctx, [-8, 10, -5, 13, -2, 10, 1, 13, 4, 10, 7, 13, 8, 10], '#5a4430', false);
      poly(ctx, [-5, -11, -15, -16, -5, -5], '#7d8f4e');
      poly(ctx, [7, -11, 16, -16, 7, -5], '#7d8f4e');
      circ(ctx, 1, -9, 7.5, '#7d8f4e');
      glow(ctx, 1, -10, 6, '#ff2a1a', 0.25);
      circ(ctx, -2, -10, 1.7, '#ff3b2f', false); circ(ctx, 4, -10, 1.7, '#ff3b2f', false);
      line(ctx, -1, -5, 4, -5, OUT, 1.5);
      ctx.save(); ctx.translate(8, 2); ctx.rotate(att ? 0.9 : -0.3);
      line(ctx, 0, 0, 0, -11, '#a9adb5', 2.5); line(ctx, -2.5, 0, 2.5, 0, '#5a3a1e', 2);
      ctx.restore();
    },
    skeleton(ctx, t, att, mov) {
      const B = '#e3dccb';
      const sw = mov ? Math.sin(t * 12) * 3 : 0;
      line(ctx, -3 + sw, 4, -4 + sw, 14, B, 3); line(ctx, 3 - sw, 4, 4 - sw, 14, B, 3);
      ell(ctx, 0, 4, 5, 2.5, B);
      line(ctx, 0, 4, 0, -6, B, 2.5);
      ctx.strokeStyle = B; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, -4 + i * 3, 6 - i, 1.5, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = OUT;
      line(ctx, -6, -5, -9, 4, B, 2.5);
      circ(ctx, 1, -12, 7, B);
      circ(ctx, -1.5, -12, 2.2, '#241c22', false); circ(ctx, 4, -12, 2.2, '#241c22', false);
      glow(ctx, 1.2, -12, 5, '#7ad0ff', 0.25);
      ctx.fillStyle = B; ctx.fillRect(-2, -7, 6, 3); ctx.strokeRect(-2, -7, 6, 3);
      ctx.save(); ctx.translate(7, 0); ctx.rotate(att ? 1.0 : -0.2);
      line(ctx, 0, 0, 0, -17, '#8a7a6a', 3); line(ctx, -3.5, 0, 3.5, 0, '#5a4a3a', 2.5);
      ctx.restore();
      line(ctx, 6, -5, 7, 0, B, 2.5);
    },
    orc(ctx, t, att, mov) {
      legs(ctx, t, mov, '#2a1c18', 6, 6, 9, 6);
      ell(ctx, 0, 0, 13, 12, '#4f5e33');
      poly(ctx, [-12, -6, 12, -6, 10, 8, -10, 8], '#4a2a24');
      poly(ctx, [-13, -11, -5, -13, -4, -5, -13, -4], '#6e6a66');
      poly(ctx, [13, -11, 5, -13, 4, -5, 13, -4], '#6e6a66');
      circ(ctx, 1, -13, 8, '#4f5e33');
      poly(ctx, [-7, -15, 9, -15, 7, -22, -5, -22], '#55504a');
      poly(ctx, [-7, -19, -12, -27, -4, -21], '#d9cfb8'); poly(ctx, [9, -19, 14, -27, 6, -21], '#d9cfb8');
      line(ctx, -2, -12, 2, -10, '#9e2b25', 2); 
      circ(ctx, 4, -12, 1.5, '#ff3b2f', false); circ(ctx, -2, -12, 1.5, '#ff3b2f', false);
      poly(ctx, [-1, -7, 0.5, -10.5, 2, -7], '#f2ecdc', false); poly(ctx, [4, -7, 5.5, -10.5, 7, -7], '#f2ecdc', false);
      ctx.save(); ctx.translate(11, 4); ctx.rotate(att ? 1.0 : -0.3);
      line(ctx, 0, 4, 0, -18, '#5a3a1e', 4);
      ell(ctx, 0, -20, 4.5, 6, '#4a3424');
      ctx.fillStyle = '#a9adb5';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(i % 2 ? 4 : -4, -24 + i * 4, 1.4, 0, 7); ctx.fill(); }
      ctx.restore();
    },
    giant(ctx, t, att, mov) {
      const R = '#7a7470', D = '#5d5753';
      const sw = mov ? Math.sin(t * 6) * 2 : 0;
      ctx.fillStyle = D;
      ctx.fillRect(-9 + sw, 6, 7, 9); ctx.strokeRect(-9 + sw, 6, 7, 9);
      ctx.fillRect(2 - sw, 6, 7, 9); ctx.strokeRect(2 - sw, 6, 7, 9);
      poly(ctx, [-14, 8, -16, -6, -9, -15, 9, -15, 16, -6, 14, 8], R);
      poly(ctx, [-6, -2, -2, -10, 4, -4, 1, 4], D, false);
      line(ctx, -10, -4, -6, 2, '#3e3a37', 1.5); line(ctx, 8, -10, 11, -2, '#3e3a37', 1.5);
      glow(ctx, 0, -2, 7, '#ff8a3d', 0.35 + Math.sin(t * 4) * 0.1);
      circ(ctx, 0, -2, 3, '#ffb36b');
      // tay đá
      const lift = att ? -8 : 0;
      ell(ctx, -18, 0 + lift, 6, 7, R); ell(ctx, 18, 0 + lift, 6, 7, R);
      poly(ctx, [-7, -15, 7, -15, 6, -23, -6, -23], R);
      circ(ctx, -3, -19, 1.6, '#ffa040', false); circ(ctx, 3, -19, 1.6, '#ffa040', false);
    },
    boss(ctx, t, att, mov) {
      // áo choàng
      const flap = Math.sin(t * 3) * 2;
      poly(ctx, [-12, -10, 12, -10, 16 + flap, 15, -16 - flap, 15], '#3b0f1a');
      legs(ctx, t, mov, '#1e1418', 5, 6, 9, 5);
      poly(ctx, [-11, 8, 11, 8, 12, -9, -12, -9], '#2a1a20');
      poly(ctx, [-6, 6, 6, 6, 7, -7, -7, -7], '#7a1d26');
      poly(ctx, [-14, -12, -6, -13, -6, -6, -15, -5], '#3a2a30');
      poly(ctx, [14, -12, 6, -13, 6, -6, 15, -5], '#3a2a30');
      circ(ctx, 0, -15, 7, '#7a1d26');
      // sừng
      ctx.fillStyle = '#d9cfb8';
      ctx.beginPath(); ctx.moveTo(-5, -19); ctx.quadraticCurveTo(-14, -22, -12, -31); ctx.quadraticCurveTo(-9, -24, -2, -21); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, -19); ctx.quadraticCurveTo(14, -22, 12, -31); ctx.quadraticCurveTo(9, -24, 2, -21); ctx.closePath(); ctx.fill(); ctx.stroke();
      glow(ctx, 0, -15, 6, '#ffcc33', 0.3);
      circ(ctx, -2.5, -15, 1.6, '#ffdd55', false); circ(ctx, 2.5, -15, 1.6, '#ffdd55', false);
      // đại kiếm
      ctx.save(); ctx.translate(12, 2); ctx.rotate(att ? 1.1 : -0.35);
      poly(ctx, [-2, 0, 2, 0, 2.5, -26, 0, -30, -2.5, -26], '#2e2a30');
      line(ctx, 0, -2, 0, -26, '#d9483b', 1);
      line(ctx, -5, 0, 5, 0, '#c9a24a', 3);
      ctx.restore();
    }
  };

  /* ===================== CÔNG TRÌNH ===================== */
  function stoneBlocks(ctx, x0, y0, w, h, rowH) {
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    for (let y = y0 + rowH, i = 0; y < y0 + h; y += rowH, i++) {
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
      for (let x = x0 + (i % 2 ? 6 : 12); x < x0 + w; x += 12) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + rowH); ctx.stroke(); }
    }
    ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  }

  const BUILDINGS = {
    archerBarracks(ctx, t) {
      ctx.fillStyle = '#8a8378'; ctx.fillRect(-18, -14, 36, 38); ctx.strokeRect(-18, -14, 36, 38);
      stoneBlocks(ctx, -18, -14, 36, 38, 7);
      ctx.fillStyle = '#6e685f'; ctx.fillRect(-23, -22, 46, 9); ctx.strokeRect(-23, -22, 46, 9);
      ctx.fillStyle = '#8a8378';
      for (let i = 0; i < 4; i++) { ctx.fillRect(-23 + i * 13, -30, 7, 8); ctx.strokeRect(-23 + i * 13, -30, 7, 8); }
      ctx.fillStyle = '#1a1418'; ctx.fillRect(-2, -6, 4, 12);
      ctx.fillStyle = '#3a2a1e'; ctx.fillRect(-6, 12, 12, 12); ctx.strokeRect(-6, 12, 12, 12);
      line(ctx, 14, -30, 14, -50, '#4b3a28', 2);
      const w = Math.sin(t * 4) * 2;
      poly(ctx, [14, -50, 30, -46 + w, 14, -40], '#2e5b88');
    },
    mageTower(ctx, t) {
      ctx.fillStyle = '#6f6585'; ctx.fillRect(-14, -18, 28, 42); ctx.strokeRect(-14, -18, 28, 42);
      stoneBlocks(ctx, -14, -18, 28, 42, 7);
      ctx.fillStyle = '#ffd98a'; ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.2;
      ctx.fillRect(-3, -8, 6, 9); ctx.globalAlpha = 1; ctx.strokeRect(-3, -8, 6, 9);
      ctx.fillStyle = '#2a1a30'; ctx.fillRect(-5, 12, 10, 12); ctx.strokeRect(-5, 12, 10, 12);
      poly(ctx, [-20, -18, 20, -18, 0, -50], '#3a1f57');
      line(ctx, -14, -24, 14, -24, '#c9a24a', 1.5);
      const bob = Math.sin(t * 2.5) * 2;
      glow(ctx, 0, -58 + bob, 10, '#c77dff', 0.35);
      poly(ctx, [0, -66 + bob, 5, -58 + bob, 0, -50 + bob, -5, -58 + bob], '#d9a6ff');
    },
    orcBarracks(ctx, t) {
      ctx.fillStyle = '#6b4a2b';
      for (let i = -3; i <= 3; i++) {
        const x = i * 8;
        ctx.beginPath(); ctx.moveTo(x - 3.5, 24); ctx.lineTo(x - 3.5, -2); ctx.lineTo(x, -8); ctx.lineTo(x + 3.5, -2); ctx.lineTo(x + 3.5, 24); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      poly(ctx, [-20, 4, 20, 4, 16, -16, -16, -16], '#7a5634');
      poly(ctx, [-24, -14, 24, -14, 0, -38], '#5b4a2a');
      line(ctx, -14, -22, 14, -22, '#3e3220', 1.5); line(ctx, -8, -30, 8, -30, '#3e3220', 1.5);
      ctx.fillStyle = '#1a1418'; ctx.fillRect(-5, -6, 10, 10);
      line(ctx, -22, -38, -22, -14, '#4b3a28', 2);
      const w = Math.sin(t * 4) * 2;
      poly(ctx, [-22, -38, -8, -34 + w, -22, -28], '#4f7a2e');
      circ(ctx, 0, -40, 4, '#e3dccb');
    },
    goldMine(ctx, t) {
      poly(ctx, [-28, 24, -24, 0, -12, -16, 6, -20, 22, -8, 28, 24], '#6e6258');
      poly(ctx, [-14, 24, -14, 4, 0, -8, 14, 4, 14, 24], '#1a1418');
      ctx.strokeStyle = '#7a5634'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-13, 24); ctx.lineTo(-13, 3); ctx.lineTo(13, 3); ctx.lineTo(13, 24); ctx.stroke();
      ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      poly(ctx, [-26, 26, -26, 16, -10, 16, -12, 26], '#5a3a1e');
      const g = 0.6 + Math.sin(t * 5) * 0.4;
      ctx.fillStyle = '#e2b45a';
      [[-22, 14], [-17, 13], [-13, 15], [-19, 11]].forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, 7); ctx.fill(); });
      ctx.globalAlpha = g; ctx.fillStyle = '#fff4c8'; ctx.fillRect(-18, 10, 1.6, 1.6); ctx.globalAlpha = 1;
      [[-20, -6], [10, -10], [18, 6]].forEach(p => { ctx.fillStyle = '#e2b45a'; ctx.fillRect(p[0], p[1], 3, 3); });
    }
  };

  // Bốn mẫu trụ mới dùng nền tảng nét vẽ fantasy hiện có, phối lại theo phe.
  BUILDINGS.humanTower = BUILDINGS.archerBarracks;
  BUILDINGS.elfTower = BUILDINGS.archerBarracks;
  BUILDINGS.orcTower = BUILDINGS.orcBarracks;

  /* ===================== TRANG TRÍ ===================== */
  const DECOR = {
    tree(g, th) {
      g.fillStyle = '#4a3424'; g.fillRect(-3, 2, 6, 12); g.strokeRect(-3, 2, 6, 12);
      circ(g, -6, -4, 9, th.leaf2); circ(g, 6, -4, 9, th.leaf2); circ(g, 0, -11, 10, th.leaf);
      if (th.snow) { g.fillStyle = '#f2f6fa'; g.beginPath(); g.ellipse(0, -17, 7, 3, 0, 0, 7); g.fill(); }
    },
    pine(g, th) {
      g.fillStyle = '#4a3424'; g.fillRect(-2.5, 8, 5, 7); g.strokeRect(-2.5, 8, 5, 7);
      poly(g, [-12, 10, 12, 10, 0, -6], th.leaf2);
      poly(g, [-9, 1, 9, 1, 0, -14], th.leaf);
      poly(g, [-6, -8, 6, -8, 0, -21], th.leaf);
      if (th.snow) poly(g, [-3.5, -14, 3.5, -14, 0, -21], '#f2f6fa', false);
    },
    rock(g, th) {
      poly(g, [-12, 8, -10, -2, -3, -8, 7, -6, 12, 2, 9, 8], th.rock);
      poly(g, [-8, -1, -3, -6, 4, -5, 0, 0], 'rgba(255,255,255,0.18)', false);
    },
    bush(g, th) { circ(g, -6, 2, 6, th.leaf2); circ(g, 6, 2, 6, th.leaf2); circ(g, 0, -3, 7, th.leaf); },
    deadtree(g) {
      g.strokeStyle = '#3a2c24'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(0, 14); g.lineTo(0, -6); g.lineTo(-8, -16); g.moveTo(0, -2); g.lineTo(9, -12); g.lineTo(13, -11); g.moveTo(-3, -9); g.lineTo(-9, -8); g.stroke();
      g.strokeStyle = OUT; g.lineWidth = 2;
    },
    cactus(g, th) {
      g.fillStyle = th.leaf;
      g.beginPath(); g.roundRect ? g.roundRect(-4, -16, 8, 30, 4) : g.rect(-4, -16, 8, 30); g.fill(); g.stroke();
      g.beginPath(); g.roundRect ? g.roundRect(-12, -8, 6, 12, 3) : g.rect(-12, -8, 6, 12); g.fill(); g.stroke();
      g.beginPath(); g.roundRect ? g.roundRect(6, -12, 6, 12, 3) : g.rect(6, -12, 6, 12); g.fill(); g.stroke();
    },
    bones(g) {
      line(g, -8, 4, 8, -2, '#e3dccb', 3); line(g, -6, -3, 6, 5, '#e3dccb', 3);
      circ(g, 9, 6, 4, '#e3dccb');
    },
    crystal(g) {
      poly(g, [-6, 10, -8, -2, -3, -12, 2, 10], '#8a5adf');
      poly(g, [0, 10, 3, -6, 8, -2, 7, 10], '#b38aff');
    }
  };

  const Painter = {
    unit(ctx, type, x, y, r, face, t, att, mov) {
      const fn = UNITS[type] || (type === 'wolfrider' ? UNITS.orc : UNITS.archer);
      begin(ctx, x, y, r / 16, face); fn(ctx, t, att, mov); ctx.restore();
    },
    enemy(ctx, type, x, y, r, face, t, att, mov) {
      const fn = ENEMIES[type] || ENEMIES.goblin;
      begin(ctx, x, y, r / 16, face); fn(ctx, t, att, mov); ctx.restore();
    },
    building(ctx, type, x, y, scale, t) {
      const fn = BUILDINGS[type]; if (!fn) return;
      begin(ctx, x, y, scale, 1); fn(ctx, t); ctx.restore();
    },
    decor(g, kind, x, y, s, theme) {
      const fn = DECOR[kind]; if (!fn) return;
      g.fillStyle = 'rgba(0,0,0,0.22)';
      g.beginPath(); g.ellipse(x, y + 13 * s, 11 * s, 4 * s, 0, 0, 7); g.fill();
      begin(g, x, y, s, 1); fn(g, theme); g.restore();
    },
    /** Ô nền đá để xây nhà */
    plot(ctx, x, y, size, state, t) {
      const h = size / 2;
      if (state === 'empty' || state === 'highlight') {
        const hi = state === 'highlight';
        ctx.fillStyle = hi ? 'rgba(226,180,90,0.22)' : 'rgba(20,16,18,0.22)';
        ctx.fillRect(x - h, y - h, size, size);
        ctx.strokeStyle = hi ? `rgba(243,210,138,${0.7 + Math.sin(t * 6) * 0.3})` : 'rgba(255,255,255,0.22)';
        ctx.lineWidth = hi ? 3 : 2;
        ctx.setLineDash(hi ? [] : [8, 6]);
        ctx.strokeRect(x - h + 2, y - h + 2, size - 4, size - 4);
        ctx.setLineDash([]);
        // dấu góc
        ctx.strokeStyle = hi ? '#f3d28a' : 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3;
        const c = 10;
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
          const cx = x + sx * (h - 2), cy = y + sy * (h - 2);
          ctx.beginPath(); ctx.moveTo(cx - sx * c, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy - sy * c); ctx.stroke();
        });
        return;
      }
      // nền đá có công trình
      ctx.fillStyle = '#4a4440'; ctx.fillRect(x - h, y - h, size, size);
      ctx.fillStyle = '#5a534e'; ctx.fillRect(x - h + 3, y - h + 3, size - 6, size - 6);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - h + 3, y); ctx.lineTo(x + h - 3, y); ctx.moveTo(x, y - h + 3); ctx.lineTo(x, y + h - 3); ctx.stroke();
      ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.strokeRect(x - h, y - h, size, size);
    }
  };

  window.Painter = Painter;
})();
