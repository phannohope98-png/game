/* =========================================================
 * art-chars.js – Nhân vật phong cách chibi hoạt hình
 * Gốc toạ độ = chân, nhìn sang PHẢI. Cao chuẩn ~48 đơn vị.
 * P = { w: pha bước 0..1 (-1 = đứng), a: tiến độ đòn 0..1 (-1), t: giây }
 * Hầu hết nhân vật dựng từ humanoid(spec) để đồng bộ phong cách.
 * ========================================================= */
(function () {
  const K = ArtKit, shade = K.shade, lerp = K.lerp, TAU = Math.PI * 2;

  /* ---------------- Vũ khí ---------------- */
  const WEAPON = {
    sword(ctx, col, L) {
      L = L || 20;
      K.rr(ctx, -1.6, -2, 3.2, 7, 1.2, '#6b4426', { s: 0.8, h: 0.4, lw: 1.6 });
      K.poly(ctx, [-2.6, -3, -2.6, -L + 3, 0, -L - 1, 2.6, -L + 3, 2.6, -3], col, { s: 1.2, h: 0.8, lw: 1.8 });
      K.line(ctx, 0, -4, 0, -L + 2, shade(col, 0.45), 0.9);
      K.rr(ctx, -5.5, -4.6, 11, 3, 1.4, '#f2c14e', { s: 0.8, h: 0.5, lw: 1.6 });
    },
    bigsword(ctx, col) {
      K.rr(ctx, -2, -2, 4, 9, 1.4, '#5a3420', { s: 1, h: 0.4, lw: 1.8 });
      K.poly(ctx, [-3.6, -3, -3.6, -26, 0, -32, 3.6, -26, 3.6, -3], col, { s: 1.6, h: 1, lw: 2 });
      K.line(ctx, 0, -5, 0, -27, shade(col, 0.5), 1.2);
      K.rr(ctx, -8, -5.5, 16, 3.6, 1.8, '#f2c14e', { s: 1, h: 0.6, lw: 1.8 });
      K.circ(ctx, 0, 8, 2.4, '#f2c14e', { lw: 1.4 });
    },
    axe(ctx, col) {
      K.limb(ctx, 0, 6, 0, -20, 3, '#7a4c2a');
      K.blob(ctx, [0, -22, 9, -27, 12, -18, 9, -10, 0, -14], col, { s: 1.8, h: 1 });
      K.line(ctx, 3, -24, 10, -18, shade(col, 0.5), 1);
    },
    cleaver(ctx, col) {
      K.limb(ctx, 0, 5, 0, -6, 3, '#5a3a22');
      K.poly(ctx, [-2, -6, 7, -8, 9, -22, 1, -24, -2, -16], col, { s: 1.6, h: 0.8 });
      K.dot(ctx, 5, -19, 1.2, K.INK);
    },
    dagger(ctx, col) {
      K.limb(ctx, 0, 4, 0, -2, 2.6, '#5a3a22');
      K.poly(ctx, [-2, -2, 0, -13, 2, -2], col, { s: 1, h: 0.6, lw: 1.6 });
    },
    club(ctx, col) {
      K.blob(ctx, [-2, 6, 2, 6, 6, -14, 5, -26, -1, -28, -6, -22, -4, -10], col, { s: 3, h: 1.4 });
      for (const [x, y] of [[-3, -20], [3, -16], [0, -24], [-2, -12]]) K.poly(ctx, [x - 1.5, y, x, y - 3.4, x + 1.5, y], '#d8ccb0', { s: 0, h: 0, lw: 1.2 });
    },
    spear(ctx, col) {
      K.limb(ctx, 0, 10, 0, -30, 2.4, '#7a4c2a');
      K.poly(ctx, [-2.6, -29, 0, -38, 2.6, -29], col, { s: 1, h: 0.6, lw: 1.6 });
    },
    staff(ctx, col, glowA) {
      K.limb(ctx, 0, 12, 0, -28, 2.6, '#7a4c2a');
      K.glow(ctx, 0, -32, 10 + (glowA || 0) * 10, col, 0.6 + (glowA || 0) * 0.4);
      K.poly(ctx, [0, -38, 4, -32, 0, -26, -4, -32], col, { s: 1.4, h: 1, lw: 1.6 });
      K.dot(ctx, -1, -34, 1.1, '#fff');
    }
  };

  /* ---------------- Mũ / tóc ---------------- */
  function headgear(ctx, H, sp, t) {
    const x = 2, y = H, r = sp.headR;
    switch (sp.head) {
      case 'helmet': { // mũ sắt có tấm che mũi
        K.cel(ctx, c => { c.moveTo(x - r - 1, y + 1); c.arc(x, y, r + 1, Math.PI, 0); c.lineTo(x + r + 1, y + 2); c.lineTo(x - r - 1, y + 2); c.closePath(); }, sp.helmCol, { s: 2.2, h: 1.2 });
        K.rr(ctx, x - r - 1.5, y + 0.5, r * 2 + 3, 3, 1.4, shade(sp.helmCol, -0.1), { s: 0.8, h: 0.5, lw: 1.6 });
        if (sp.plume) K.blob(ctx, [x - 2, y - r - 1, x - 7, y - r - 8, x - 14, y - r - 5, x - 16, y - r + 3, x - 9, y - r + 1], sp.plume, { s: 2, h: 1 });
        if (sp.crest) K.rr(ctx, x - 1.2, y - r - 2, 2.4, r, 1.2, sp.crest, { s: 0.6, h: 0.4, lw: 1.4 });
        break;
      }
      case 'horned': {
        for (const s of [-1, 1]) K.cel(ctx, c => { c.moveTo(x + s * (r - 2), y - 3); c.quadraticCurveTo(x + s * (r + 7), y - 4, x + s * (r + 6), y - r - 6); c.quadraticCurveTo(x + s * (r + 2), y - 6, x + s * (r - 4), y - 6); c.closePath(); }, '#efe3c4', { s: 1.4, h: 0.8 });
        K.cel(ctx, c => { c.moveTo(x - r - 1, y + 1); c.arc(x, y, r + 1, Math.PI, 0); c.closePath(); }, sp.helmCol, { s: 2.2, h: 1.2 });
        K.rr(ctx, x - r - 1.5, y - 0.5, r * 2 + 3, 3, 1.4, shade(sp.helmCol, -0.12), { s: 0.8, h: 0.5, lw: 1.6 });
        break;
      }
      case 'hood': {
        K.cel(ctx, c => { c.moveTo(x - r - 2, y + 6); c.quadraticCurveTo(x - r - 3, y - r - 2, x + 1, y - r - 3); c.quadraticCurveTo(x + r + 3, y - r, x + r + 2, y - 1); c.lineTo(x + r - 2, y - 2); c.quadraticCurveTo(x, y - r + 2, x - r + 3, y + 1); c.lineTo(x - r + 1, y + 6); c.closePath(); }, sp.hoodCol, { s: 2.2, h: 1.2 });
        break;
      }
      case 'wizard': {
        K.ell(ctx, x, y - r * 0.55, r + 6, 3.4, sp.hatCol, { s: 1.4 });
        K.cel(ctx, c => { c.moveTo(x - r + 1, y - r * 0.6); c.quadraticCurveTo(x - 2, y - r - 10, x + 6, y - r - 18 + Math.sin(t * 2) * 0.8); c.quadraticCurveTo(x + 4, y - r - 6, x + r - 1, y - r * 0.6); c.closePath(); }, sp.hatCol, { s: 2.2, h: 1.2 });
        K.rr(ctx, x - r + 0.5, y - r * 0.6 - 3.4, r * 2 - 1, 3, 1.2, '#f2c14e', { s: 0.6, h: 0.4, lw: 1.4 });
        K.dot(ctx, x + 1, y - r - 6, 1.3, '#fff3b0');
        break;
      }
      case 'crown': {
        K.poly(ctx, [x - r + 1, y - r + 3, x - r - 1, y - r - 6, x - r * 0.4, y - r - 1, x, y - r - 8, x + r * 0.4, y - r - 1, x + r + 1, y - r - 6, x + r - 1, y - r + 3], '#f2c14e', { s: 1.4, h: 0.8 });
        K.dot(ctx, x, y - r - 1, 1.5, '#d43b3b');
        break;
      }
      case 'hair': {
        K.blob(ctx, [x - r - 1, y + 4, x - r - 2, y - r * 0.6, x - 2, y - r - 2, x + r + 1, y - r * 0.5, x + r - 2, y - 3, x - 1, y - r * 0.5, x - r + 3, y + 1], sp.hairCol, { s: 2, h: 1 });
        break;
      }
      case 'bandana': {
        K.cel(ctx, c => { c.moveTo(x - r, y - 2); c.arc(x, y - 1, r, Math.PI, 0); c.closePath(); }, sp.hoodCol, { s: 1.8, h: 1 });
        K.poly(ctx, [x - r, y - 3, x - r - 7, y - 1 + Math.sin(t * 6), x - r - 6, y + 4, x - r + 1, y], sp.hoodCol, { s: 1, h: 0.6, lw: 1.6 });
        break;
      }
    }
  }

  /* ---------------- Khung người chibi ---------------- */
  function humanoid(ctx, P, sp) {
    const mv = P.w >= 0, ph = mv ? P.w * TAU : 0, sw = Math.sin(ph), cw = Math.cos(ph);
    const t = P.t || 0, bob = mv ? -Math.abs(cw) * 1.6 : Math.sin(t * 2.4) * 0.5;
    const sg = K.swing(P.a), bk = sp.bulk || 1, R = sp.headR = sp.headR || 10.5;
    const hipY = -11 * (sp.tall || 1) + bob, chestY = -24 * (sp.tall || 1) + bob, headY = chestY - R * 0.9;
    K.shadow(ctx, 0, 0, 13 * bk, 4.2 * bk);
    // chân sau
    const leg = (side, col) => {
      const a = (side ? sw : -sw) * 0.55, lift = Math.max(0, side ? cw : -cw) * 2.6;
      const fx = (side ? -3 : 3) * bk + Math.sin(a) * 10, fy = -lift;
      K.limb(ctx, (side ? -3 : 3) * bk, hipY, fx, fy - 3, 4.6 * Math.min(bk, 1.5), col);
      K.ell(ctx, fx + 1.6, fy - 1.6, 4.2 * bk, 2.6, sp.boots, { s: 1, h: 0.5, lw: 1.8 });
    };
    leg(1, shade(sp.legs, -0.15));
    // áo choàng sau lưng
    if (sp.cape) {
      const fl = mv ? sw * 2.5 : Math.sin(t * 2) * 0.8;
      K.blob(ctx, [-3, chestY + 2, -11 - fl, chestY + 9, -14 - fl, -3, -6, -2, -2, hipY], sp.cape, { s: 2.6, h: 0 });
    }
    // tay sau (cầm khiên / tay trống)
    if (sp.backArm !== false) K.limb(ctx, -5 * bk, chestY + 3, -7 * bk, hipY + 1, 3.6 * bk, sp.sleeve || sp.torso);
    leg(0, sp.legs);
    // thân
    const tw = 8.5 * bk;
    K.blob(ctx, [-tw, hipY + 2, -tw - 1, chestY + 6, -tw + 2, chestY - 1, tw - 2, chestY - 1, tw + 1, chestY + 6, tw, hipY + 2, 0, hipY + 4], sp.torso, { s: 3, h: 1.4 });
    if (sp.tabard) K.poly(ctx, [-3.6, chestY + 1, 3.6, chestY + 1, 4.2, hipY + 6, 0, hipY + 8, -4.2, hipY + 6], sp.tabard, { s: 1.2, h: 0.6, lw: 1.6 });
    if (sp.emblem) K.circ(ctx, 0, chestY + 7, 2, sp.emblem, { lw: 1.2 });
    K.rr(ctx, -tw, hipY - 1.5, tw * 2, 3.4, 1.6, sp.belt || '#6b4426', { s: 1, h: 0.5, lw: 1.6 });
    K.rr(ctx, -1.6, hipY - 2, 3.2, 4.4, 1, '#f2c14e', { s: 0.6, h: 0.4, lw: 1.2 });
    if (sp.pauldron) for (const s of [-1, 1]) K.ell(ctx, s * (tw - 1), chestY + 1.6, 4.6 * bk, 3.6 * bk, sp.pauldron, { s: 1.6, h: 0.8 });
    // khiên (phía trước thân)
    if (sp.shield) {
      const sx = 5 * bk, sy = chestY + 9;
      if (sp.shield.kite) K.cel(ctx, c => { c.moveTo(sx - 6, sy - 7); c.lineTo(sx + 6, sy - 7); c.lineTo(sx + 6, sy + 1); c.quadraticCurveTo(sx + 5, sy + 8, sx, sy + 11); c.quadraticCurveTo(sx - 5, sy + 8, sx - 6, sy + 1); c.closePath(); }, sp.shield.col, { s: 2.2, h: 1.1 });
      else K.circ(ctx, sx, sy, 7.2, sp.shield.col);
      if (sp.shield.rim) { ctx.strokeStyle = sp.shield.rim; ctx.lineWidth = 1.6; ctx.beginPath(); if (sp.shield.kite) { ctx.moveTo(sx - 4, sy - 5); ctx.lineTo(sx + 4, sy - 5); ctx.lineTo(sx + 4, sy + 1); ctx.quadraticCurveTo(sx + 3.4, sy + 6, sx, sy + 8); ctx.quadraticCurveTo(sx - 3.4, sy + 6, sx - 4, sy + 1); ctx.closePath(); } else ctx.arc(sx, sy, 5, 0, TAU); ctx.stroke(); }
      if (sp.shield.mark) sp.shield.mark(ctx, sx, sy);
    }
    // đầu
    const hx = 2, hy = headY;
    if (sp.ears === 'elf') for (const s of [1]) K.poly(ctx, [hx + 4, hy - 1, hx + 15, hy - 6, hx + 6, hy + 3], sp.skin, { s: 1, h: 0.6, lw: 1.6 });
    if (sp.ears === 'goblin') { K.poly(ctx, [hx - 6, hy - 2, hx - 19, hy - 6, hx - 7, hy + 4], sp.skin, { s: 1.4, h: 0.6 }); K.poly(ctx, [hx + 6, hy - 2, hx + 19, hy - 8, hx + 8, hy + 4], sp.skin, { s: 1.4, h: 0.6 }); }
    if (sp.head === 'hood' || sp.head === 'hair') headgearBack(ctx, hx, hy, R, sp);
    K.circ(ctx, hx, hy, R, sp.skin, { s: R * 0.28, h: R * 0.12 });
    // mặt
    const ey = hy + (sp.eyeY || 0.5), ex1 = hx + 2.6, ex2 = hx + 7.4;
    if (sp.face === 'skull') {
      K.dot(ctx, ex1, ey, 2.4, '#20142a'); K.dot(ctx, ex2, ey, 2.2, '#20142a');
      K.glow(ctx, ex1, ey, 4, sp.eyeCol || '#6fe0ff', 0.9); K.glow(ctx, ex2, ey, 4, sp.eyeCol || '#6fe0ff', 0.9);
      for (let i = 0; i < 3; i++) K.line(ctx, hx + 2 + i * 2.2, hy + 6, hx + 2 + i * 2.2, hy + 8.4, '#20142a', 0.9);
    } else {
      if (sp.eyeCol) { K.glow(ctx, ex1, ey, 4.4, sp.eyeCol, 0.7); K.glow(ctx, ex2, ey, 4.4, sp.eyeCol, 0.7); }
      ctx.fillStyle = sp.eyeCol || '#20142a';
      ctx.beginPath(); ctx.ellipse(ex1, ey, 1.3, 1.9, 0, 0, TAU); ctx.ellipse(ex2, ey, 1.3, 1.9, 0, 0, TAU); ctx.fill();
      if (!sp.eyeCol) { K.dot(ctx, ex1 + 0.4, ey - 0.8, 0.55, '#fff'); K.dot(ctx, ex2 + 0.4, ey - 0.8, 0.55, '#fff'); }
      if (sp.brow) { K.line(ctx, ex1 - 1.6, ey - 3.6, ex1 + 1.4, ey - 2.4, '#20142a', 1.3); K.line(ctx, ex2 - 1.2, ey - 2.4, ex2 + 1.8, ey - 3.6, '#20142a', 1.3); }
      if (sp.blush) { K.dot(ctx, ex1 - 1.2, ey + 3, 1.4, 'rgba(240,120,120,0.45)'); K.dot(ctx, ex2 + 1.5, ey + 3, 1.4, 'rgba(240,120,120,0.45)'); }
      if (sp.tusks) { K.poly(ctx, [hx + 3, hy + 6, hx + 4, hy + 2.4, hx + 5, hy + 6], '#fff6dc', { s: 0, h: 0, lw: 1 }); K.poly(ctx, [hx + 7.5, hy + 6, hx + 8.5, hy + 2.6, hx + 9.5, hy + 6], '#fff6dc', { s: 0, h: 0, lw: 1 }); }
      else if (sp.mouth !== false) K.line(ctx, hx + 4, hy + 6, hx + 7, hy + 5.6, '#7a3a3a', 1);
      if (sp.nose) K.poly(ctx, [hx + 8, hy + 1, hx + 13, hy + 3.6, hx + 8.6, hy + 4.4], shade(sp.skin, -0.08), { s: 0.6, h: 0, lw: 1.4 });
    }
    if (sp.beard) K.blob(ctx, [hx - 3, hy + 2, hx + 10, hy + 2, hx + 9, hy + 10, hx + 4, hy + 15, hx - 1, hy + 10], sp.beard, { s: 2, h: 1 });
    headgear(ctx, hy, sp, t);
    // tay trước + vũ khí
    const sx = 5 * bk, sy = chestY + 3;
    if (sp.weapon === 'bow') { bowArms(ctx, P, sp, sx, sy); return; }
    if (sp.weapon === 'staff') {
      const c = P.a >= 0 ? Math.sin(Math.min(1, P.a) * Math.PI) : 0, hx2 = sx + 6, hy2 = sy + 5 - c * 6;
      K.limb(ctx, sx, sy, hx2, hy2, 3.6 * bk, sp.sleeve || sp.torso);
      ctx.save(); ctx.translate(hx2, hy2 + 2); WEAPON.staff(ctx, sp.weaponCol || '#7fd4ff', c); ctx.restore();
      K.circ(ctx, hx2, hy2, 2.3, sp.skin, { lw: 1.4 });
      return;
    }
    const A = sg < 0 ? lerp(0.9, 3.0, -sg) : lerp(0.9, 1.7, sg);
    const phi = sg < 0 ? lerp(0.5, -0.5, -sg) : lerp(0.5, 2.1, sg);
    const L = 10 * (sp.armLen || 1) * bk;
    const hx2 = sx + Math.sin(A) * L, hy2 = sy + Math.cos(A) * L;
    K.limb(ctx, sx, sy, hx2, hy2, 3.8 * bk, sp.sleeve || sp.torso);
    ctx.save(); ctx.translate(hx2, hy2); ctx.rotate(phi); ctx.scale(sp.wScale || 1, sp.wScale || 1);
    WEAPON[sp.weapon](ctx, sp.weaponCol || '#d8dee8'); ctx.restore();
    K.circ(ctx, hx2, hy2, 2.5 * bk, sp.glove || sp.skin, { lw: 1.4 });
    if (P.a >= 0.42 && P.a < 0.72) {
      ctx.save(); ctx.globalAlpha = 0.45 * (1 - (P.a - 0.42) / 0.3); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(sx, sy + 2, (L + 18) * (sp.wScale || 1), -1.2, 1.1); ctx.stroke(); ctx.restore();
    }
  }
  function headgearBack(ctx, hx, hy, R, sp) {
    if (sp.head === 'hood') K.ell(ctx, hx - 3, hy + 3, R + 2, R + 1, shade(sp.hoodCol, -0.12), { s: 1.6, h: 0 });
    if (sp.head === 'hair') K.blob(ctx, [hx - R + 1, hy - 2, hx - R - 4, hy + 8, hx - R - 1, hy + 14, hx - 3, hy + 9, hx - 2, hy], sp.hairCol, { s: 2, h: 0.8 });
  }
  function bowArms(ctx, P, sp, sx, sy) {
    const a = P.a, draw = a < 0 ? 0 : (a < 0.5 ? a / 0.5 : Math.max(0, 1 - (a - 0.5) / 0.12));
    const bx = sx + 10, by = sy + 1;
    K.limb(ctx, sx, sy, bx, by, 3.4, sp.sleeve || sp.torso);
    // cung
    K.stroke(ctx, c => c.arc(bx - 4, by, 13, -1.1, 1.1), sp.weaponCol || '#9a6a36', 2.6);
    const ax = bx - 4 + Math.cos(1.1) * 13, ay = Math.sin(1.1) * 13, px = bx - 11 - draw * 6;
    ctx.strokeStyle = '#f6efd8'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(ax, by - ay); ctx.lineTo(px, by); ctx.lineTo(ax, by + ay); ctx.stroke();
    if (draw > 0.05 && a < 0.5) { K.line(ctx, px, by, bx + 8, by, '#d9b878', 1.4); K.flat(ctx, [bx + 8, by - 2, bx + 12, by, bx + 8, by + 2], '#e8edf2'); }
    K.limb(ctx, sx - 1, sy + 1, px + 1, by, 3.2, shade(sp.sleeve || sp.torso, -0.06));
    K.circ(ctx, bx, by, 1.9, sp.skin, { lw: 1.2 });
    K.circ(ctx, px, by, 1.8, sp.skin, { lw: 1.2 });
  }

  /* ---------------- Định nghĩa nhân vật ---------------- */
  const crossMark = (ctx, x, y) => { K.line(ctx, x, y - 3.4, x, y + 3.4, '#f2c14e', 1.6); K.line(ctx, x - 3, y - 0.6, x + 3, y - 0.6, '#f2c14e', 1.6); };
  const treeMark = (ctx, x, y) => { K.dot(ctx, x, y - 1, 2.2, '#f4f1e6'); K.line(ctx, x, y, x, y + 4, '#f4f1e6', 1.2); };
  const SOLDIER = [
    { skin: '#f1c39a', legs: '#5a4a3a', boots: '#4a3020', torso: '#8a6a4a', sleeve: '#7a5a3a', head: 'helmet', helmCol: '#9aa3b2', weapon: 'sword', shield: { col: '#a8743e', rim: '#6b4426' }, blush: true },
    { skin: '#f1c39a', legs: '#3d4a66', boots: '#4a3020', torso: '#9aa3b2', tabard: '#3d6fc0', sleeve: '#8892a4', head: 'helmet', helmCol: '#aab3c2', weapon: 'sword', shield: { col: '#3d6fc0', rim: '#d8dee8', mark: treeMark }, blush: true },
    { skin: '#f1c39a', legs: '#2f3d5c', boots: '#3a2a1c', torso: '#b4bccb', tabard: '#3060b8', sleeve: '#a0a9ba', head: 'helmet', helmCol: '#c2c9d6', crest: '#d8dee8', pauldron: '#c2c9d6', weapon: 'sword', shield: { col: '#3060b8', rim: '#f2c14e', kite: true, mark: treeMark }, blush: true },
    { skin: '#f1c39a', legs: '#2a3550', boots: '#2a1e18', torso: '#d6dce6', tabard: '#f4f1e6', emblem: '#f2c14e', sleeve: '#c2c9d6', head: 'helmet', helmCol: '#e2e6ee', plume: '#e04848', pauldron: '#f2c14e', weapon: 'sword', weaponCol: '#eef2f8', shield: { col: '#f4f1e6', rim: '#f2c14e', kite: true, mark: crossMark }, bulk: 1.06, blush: true }
  ];
  const ELF = (tier) => ({ skin: '#f6d4b4', legs: tier > 2 ? '#e8e2cc' : '#4a6a3a', boots: '#6b4a2a', torso: tier > 2 ? '#f0ead2' : '#3f8a4a', sleeve: tier > 2 ? '#e2dac0' : '#367a40', tabard: tier > 2 ? '#3f8a4a' : null, head: tier === 1 ? 'hood' : 'hair', hoodCol: '#2f7040', hairCol: '#f2d77a', ears: 'elf', weapon: 'bow', weaponCol: tier > 2 ? '#e8c060' : '#9a6a36', cape: tier > 1 ? (tier > 2 ? '#3f8a4a' : '#2f7040') : null, blush: true, backArm: false });
  const MAGE = (tier) => ({ skin: '#f1c39a', legs: '#2a2a5a', boots: '#3a2a4a', torso: ['#3a5ab8', '#2f4ca8', '#4a3ab8', '#5a3ac8'][tier - 1], sleeve: ['#3050a8', '#2a4498', '#4234a8', '#5034b8'][tier - 1], tabard: '#f2c14e', head: 'wizard', hatCol: ['#3a5ab8', '#2f4ca8', '#4a3ab8', '#5a3ac8'][tier - 1], beard: tier > 1 ? '#f4f1e6' : null, weapon: 'staff', weaponCol: tier > 2 ? '#d8a8ff' : '#7fd4ff', cape: tier > 2 ? '#2a2060' : null, blush: true, backArm: false });
  const DWARF = { skin: '#f0b890', legs: '#5a3a2a', boots: '#3a2418', torso: '#a83a2a', sleeve: '#8a3022', head: 'horned', helmCol: '#a8acb6', beard: '#e08a3a', weapon: 'axe', weaponCol: '#c8ccd6', bulk: 1.2, tall: 0.85, blush: true, nose: true };
  const HERO = { skin: '#f1c39a', legs: '#3a3a4a', boots: '#3a2418', torso: '#e8c060', tabard: '#b8302a', emblem: '#f4f1e6', sleeve: '#d8b050', head: 'helmet', helmCol: '#f2c14e', plume: '#f4f1e6', pauldron: '#f2c14e', cape: '#b8302a', weapon: 'bigsword', weaponCol: '#eef2f8', bulk: 1.12, blush: true, glove: '#8a5a30' };

  const ENEMY = {
    goblin: { skin: '#8cc152', legs: '#5a4a2a', boots: '#3a2a18', torso: '#8a5a34', sleeve: '#8cc152', ears: 'goblin', weapon: 'dagger', weaponCol: '#c8ccd6', eyeCol: '#ffde4a', brow: true, head: 'bandana', hoodCol: '#b83a2a', bulk: 0.86, tall: 0.86, headR: 10 },
    orc: { skin: '#6b9a4a', legs: '#4a3a2a', boots: '#2a1e14', torso: '#5a4636', sleeve: '#6b9a4a', pauldron: '#7a7e8a', weapon: 'cleaver', weaponCol: '#b8bcc6', eyeCol: '#ff5a3a', brow: true, tusks: true, head: 'helmet', helmCol: '#6a6e7a', bulk: 1.15, headR: 10.5 },
    blackOrc: { skin: '#4a5a3a', legs: '#2a2420', boots: '#1a1412', torso: '#3a3a44', tabard: '#8a1a1a', sleeve: '#4a5a3a', pauldron: '#2a2a32', weapon: 'axe', weaponCol: '#9aa0ac', eyeCol: '#ff3a2a', brow: true, tusks: true, head: 'horned', helmCol: '#3a3a44', bulk: 1.3, tall: 1.05, headR: 11, shield: { col: '#3a3a44', rim: '#8a1a1a', kite: true } },
    troll: { skin: '#8a9a9a', legs: '#5a4a3a', boots: '#5a6a6a', torso: '#7a8a8a', tabard: '#6a4a2a', sleeve: '#8a9a9a', weapon: 'club', weaponCol: '#7a5030', eyeCol: '#ffcc44', brow: true, tusks: true, nose: true, head: 'none', bulk: 1.9, tall: 1.25, headR: 11, armLen: 1.3, wScale: 1.3 },
    trollKing: { skin: '#7a8a9a', legs: '#4a3a2a', boots: '#4a5a6a', torso: '#6a7a8a', tabard: '#7a1a2a', emblem: '#f2c14e', sleeve: '#7a8a9a', pauldron: '#f2c14e', cape: '#5a1020', weapon: 'club', weaponCol: '#5a3a24', eyeCol: '#ff6a2a', brow: true, tusks: true, nose: true, head: 'crown', bulk: 2.3, tall: 1.4, headR: 12, armLen: 1.4, wScale: 1.6 },
    orcArcher: { skin: '#7aa04a', legs: '#4a3a2a', boots: '#2a1e14', torso: '#4a3a2a', sleeve: '#7aa04a', head: 'bandana', hoodCol: '#3a2a1a', weapon: 'bow', weaponCol: '#5a3a1a', eyeCol: '#ff5a3a', brow: true, tusks: true, bulk: 1.05, backArm: false }
  };

  /* ---------------- Sói Warg ---------------- */
  function warg(ctx, P) {
    const mv = P.w >= 0, ph = mv ? P.w * TAU : 0, t = P.t || 0, bob = mv ? Math.sin(ph * 2) * 1.6 : Math.sin(t * 2.4) * 0.4;
    const F = '#6a5a52', FD = '#4a3e3a', bite = P.a >= 0 ? Math.sin(Math.min(1, P.a * 1.3) * Math.PI) : 0;
    K.shadow(ctx, 0, 0, 22, 5.5);
    const legF = (x, off, col) => { const a = mv ? Math.sin(ph + off) * 0.8 : 0, l = mv ? Math.max(0, Math.cos(ph + off)) * 3 : 0;
      K.limb(ctx, x, -12 + bob, x + Math.sin(a) * 9, -2 - l, 4.4, col); K.ell(ctx, x + Math.sin(a) * 9 + 1.4, -1.5 - l, 3.4, 2.2, shade(col, -0.2), { s: 0.8, h: 0.3, lw: 1.6 }); };
    legF(10, 2.4, FD); legF(-12, 0.6, FD);
    K.blob(ctx, [-16, -20 + bob, -26, -27 + bob, -31, -22 + bob, -24, -18 + bob], F, { s: 1.6, h: 0.8 });
    K.blob(ctx, [-18, -14 + bob, -18, -24 + bob, -6, -28 + bob, 10, -27 + bob, 17, -20 + bob, 14, -12 + bob, 0, -10 + bob], F, { s: 3, h: 1.4 });
    for (let i = 0; i < 5; i++) K.poly(ctx, [-12 + i * 5, -26 + bob, -10 + i * 5, -31 + bob - (i % 2) * 2, -7 + i * 5, -26.5 + bob], FD, { s: 0, h: 0, lw: 1.4 });
    legF(8, 0, F); legF(-10, 3, F);
    // đầu
    K.blob(ctx, [11, -16 + bob + bite, 24, -16 + bob + bite * 2.4, 25, -13 + bob + bite * 2.4, 13, -12 + bob], '#b8a8a0', { s: 1, h: 0.4, lw: 1.8 });
    K.blob(ctx, [10, -26 + bob, 17, -31 + bob, 25, -24 + bob - bite, 27, -19 + bob - bite, 14, -17 + bob, 9, -20 + bob], F, { s: 2.2, h: 1 });
    K.poly(ctx, [12, -28 + bob, 13, -36 + bob, 17, -30 + bob], FD, { s: 0.8, h: 0.4, lw: 1.6 });
    K.dot(ctx, 26.5, -20.5 + bob - bite, 1.6, K.INK);
    K.glow(ctx, 18, -24 + bob, 4.5, '#ffb030', 0.9); K.dot(ctx, 18, -24 + bob, 1.4, '#ffe080');
    K.flat(ctx, [21, -17.6 + bob, 22.4, -17.6 + bob, 21.6, -15 + bob], '#fff'); K.flat(ctx, [17, -17.4 + bob, 18.4, -17.4 + bob, 17.6, -15 + bob], '#fff');
  }

  /* ---------------- Bóng ma bay ---------------- */
  function wraith(ctx, P) {
    const t = P.t || 0, ph = P.w >= 0 ? P.w * TAU : t * 2, fly = -16 + Math.sin(ph) * 3, a = P.a;
    K.shadow(ctx, 0, 0, 12, 3.6, 0.25);
    ctx.save(); ctx.globalAlpha = 0.92;
    const wv = Math.sin(t * 5 + ph) * 2;
    K.blob(ctx, [-11, fly - 6, -9, fly - 22, 0, fly - 30, 9, fly - 22, 11, fly - 6, 8 + wv, fly + 4, 3, fly - 1, -1 - wv, fly + 6, -6, fly - 1, -10 + wv, fly + 5], '#4a3a6a', { s: 3, h: 1.4, dark: '#2a1a40' });
    K.blob(ctx, [-6, fly - 18, -5, fly - 27, 3, fly - 29, 9, fly - 21, 7, fly - 12, 0, fly - 10], '#1a1028', { s: 0, h: 0, lw: 1.6 });
    K.glow(ctx, 3, fly - 20, 10, '#9a6aff', 0.8);
    K.dot(ctx, 1, fly - 20, 1.6, '#e8d8ff'); K.dot(ctx, 6, fly - 20, 1.6, '#e8d8ff');
    const r = a >= 0 ? Math.sin(Math.min(1, a) * Math.PI) * 6 : 0;
    K.limb(ctx, 6, fly - 12, 13 + r, fly - 8 - r * 0.5, 2.4, '#4a3a6a');
    K.dot(ctx, 13 + r, fly - 8 - r * 0.5, 2.2, '#c8b8ff');
    ctx.restore();
  }

  /* ---------------- Bảng tra ---------------- */
  const reg = {};
  const H = (spec) => (ctx, P) => humanoid(ctx, P, Object.assign({}, spec));
  // box: [rộng, cao, gốcX, gốcY]   dr: bán kính va chạm thiết kế
  SOLDIER.forEach((s, i) => { reg['soldier' + (i + 1)] = { draw: H(s), box: [90, 80, 40, 66], dr: 13 }; });
  [1, 2, 3, 4].forEach(i => { reg['elf' + i] = { draw: H(ELF(i)), box: [70, 70, 30, 60], dr: 12 }; reg['mage' + i] = { draw: H(MAGE(i)), box: [70, 82, 30, 72], dr: 12 }; });
  reg.dwarf = { draw: H(DWARF), box: [80, 72, 36, 62], dr: 13 };
  reg.hero = { draw: H(HERO), box: [110, 96, 50, 80], dr: 15 };
  reg.goblin = { draw: H(ENEMY.goblin), box: [80, 64, 38, 54], dr: 12 };
  reg.orc = { draw: H(ENEMY.orc), box: [90, 80, 42, 66], dr: 15 };
  reg.orcArcher = { draw: H(ENEMY.orcArcher), box: [80, 76, 36, 64], dr: 14 };
  reg.blackOrc = { draw: H(ENEMY.blackOrc), box: [110, 92, 52, 76], dr: 17 };
  reg.troll = { draw: H(ENEMY.troll), box: [160, 120, 76, 102], dr: 24 };
  reg.trollKing = { draw: H(ENEMY.trollKing), box: [200, 150, 96, 128], dr: 30 };
  reg.warg = { draw: warg, box: [80, 56, 40, 44], dr: 16 };
  reg.wraith = { draw: wraith, box: [60, 64, 30, 54], dr: 13 };
  window.ArtChars = reg;
})();
