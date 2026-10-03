/* =========================================================
 * art-chars.js – Nhân vật vẽ bằng code (có đổ sáng, hoạt ảnh đi / đánh)
 * Hệ toạ độ: gốc = chân nhân vật, y âm = hướng lên, nhìn sang PHẢI.
 * P = { w: pha bước chân 0..1 (hoặc -1 nếu đứng), a: tiến độ đòn đánh 0..1 (hoặc -1), t: giây }
 * Khung hình được vẽ sẵn vào canvas phụ (art.js) nên vẽ đẹp tới đâu cũng không nặng máy.
 * ========================================================= */
(function () {
  const K = ArtKit, shade = K.shade, lerp = K.lerp;

  function gait(P) {
    const mv = P.w >= 0, ph = mv ? P.w * 6.2832 : 0;
    return { mv, ph, s: Math.sin(ph), c: Math.cos(ph), bob: mv ? -Math.abs(Math.cos(ph)) * 1.7 : Math.sin((P.t || 0) * 2.4) * 0.35 };
  }
  /** Chân 2 đoạn: hông (hx,hy), góc ang, nhấc chân lift */
  function leg(ctx, hx, hy, ang, lift, len, col, boot, w, bl) {
    const fx = hx + Math.sin(ang) * len, fy = hy + Math.cos(ang) * len - lift;
    const kx = (hx + fx) / 2 + 1.7, ky = (hy + fy) / 2 - lift * 0.15;
    K.limb(ctx, hx, hy, kx, ky, w || 5, col);
    K.limb(ctx, kx, ky, fx, fy, (w || 5) * 0.92, col);
    K.ell(ctx, fx + 1.6, fy + 0.6, bl || 4.6, 2.9, boot);
  }
  /** Lưỡi kiếm: ang = 0 hướng lên, dương = quay theo chiều kim đồng hồ (ra trước) */
  function blade(ctx, x, y, ang, len, w, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    K.rect(ctx, -w * 0.32, -1, w * 0.64, 6, '#5a3a22', 1, { lw: 0.8 });
    K.poly(ctx, [-w / 2, -2, -w / 2, -len + w, 0, -len - w * 0.5, w / 2, -len + w, w / 2, -2], col);
    K.flat(ctx, [-w * 0.05, -3, -w * 0.05, -len + 1, w * 0.45, -len + w, w * 0.45, -3], 'rgba(255,255,255,0.30)');
    K.rect(ctx, -w * 1.15, -3.4, w * 2.3, 2.8, '#e4b95a', 1, { lw: 0.8 });
    ctx.restore();
  }
  function axe(ctx, x, y, ang, len, hs, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    K.limb(ctx, 0, 7, 0, -len, 3.4, '#6b4a2b');
    K.poly(ctx, [-0.5, -len + 3, hs * 1.15, -len - hs * 0.45, hs * 1.3, -len + hs * 0.95, -0.5, -len + hs * 1.5], col);
    K.poly(ctx, [0.5, -len + 3, -hs * 0.7, -len - hs * 0.2, -hs * 0.7, -len + hs * 0.9, 0.5, -len + hs * 1.5], shade(col, -0.18));
    K.flat(ctx, [hs * 0.2, -len - hs * 0.1, hs * 1.1, -len - hs * 0.35, hs * 1.15, -len - hs * 0.1, hs * 0.3, -len + hs * 0.2], 'rgba(255,255,255,0.35)');
    ctx.restore();
  }
  /** góc tay theo nhịp vung: (idle, giơ lên, chém) */
  function armAng(sg, idle, up, hit) { return sg < 0 ? lerp(idle, up, -sg) : lerp(idle, hit, sg); }

  /* ===================== KIẾM SĨ (lính Trụ Người) ===================== */
  function swordsman(ctx, P) {
    const g = gait(P), b = g.bob, sg = K.swingT(P.a);
    K.shadow(ctx, 0, 1, 16, 5, 0.4);
    leg(ctx, 3, -13 + b, -g.s * 0.55, Math.max(0, -g.c) * 3, 13, '#2f3a56', '#4b3424');
    // áo choàng
    const fl = g.mv ? g.s * 2.5 : Math.sin((P.t || 0) * 2) * 0.8;
    ctx.beginPath(); ctx.moveTo(-5, -30 + b); ctx.quadraticCurveTo(-13 - fl, -22 + b, -17 - fl, -5 + b);
    ctx.quadraticCurveTo(-10, -3 + b, -5, -9 + b); ctx.closePath();
    K.paint(ctx, '#b23a35', [-17, -30, -5, -3]);
    // thân
    K.poly(ctx, [-8.5, -14 + b, 8.5, -14 + b, 9.5, -30 + b, -9.5, -30 + b], '#3f78c4');
    K.flat(ctx, [-1.8, -14 + b, 1.8, -14 + b, 1.8, -29 + b, -1.8, -29 + b], '#eac45e');
    K.poly(ctx, [-9, -14 + b, 9, -14 + b, 10.5, -7.5 + b, -10.5, -7.5 + b], '#9aa4b6');
    for (let i = -8; i <= 8; i += 3.4) K.line(ctx, i, -13 + b, i + 0.4, -8 + b, 'rgba(30,36,60,0.35)', 0.8);
    K.rect(ctx, -9, -17.5 + b, 18, 3.2, '#5a3a22', 1, { lw: 0.8 });
    K.rect(ctx, -2.2, -18 + b, 4.4, 4.2, '#eac45e', 0.8, { lw: 0.8 });
    K.circ(ctx, -8, -29 + b, 4.7, '#9ea9bd'); 
    // chân gần
    leg(ctx, -3, -13 + b, g.s * 0.55, Math.max(0, g.c) * 3, 13, '#394668', '#5a3d28');
    // khiên
    K.circ(ctx, 7.5, -21 + b, 9, '#b4becf');
    K.circ(ctx, 7.5, -21 + b, 6.8, '#2f62b0', { lw: 0.8 });
    K.flat(ctx, [6.6, -27 + b, 8.4, -27 + b, 8.4, -15 + b, 6.6, -15 + b], '#eac45e');
    K.flat(ctx, [1.5, -22 + b, 13.5, -22 + b, 13.5, -20.2 + b, 1.5, -20.2 + b], '#eac45e');
    K.circ(ctx, 7.5, -21 + b, 2.3, '#f3d77d', { lw: 0.7 });
    // đầu + mũ
    K.rect(ctx, -2, -34 + b, 5, 5, '#d49d77', 1, { lw: 0.8 });
    K.circ(ctx, 1, -38.5 + b, 7.2, '#e6b38d');
    K.dot(ctx, 4.8, -38.4 + b, 1.15, '#1b1214');
    K.line(ctx, 3.2, -40.4 + b, 6.4, -40 + b, '#6b4326', 1);
    ctx.beginPath(); ctx.arc(1, -39.5 + b, 8.5, Math.PI * 1.04, Math.PI * 1.98); ctx.lineTo(9.4, -36 + b); ctx.lineTo(-7.4, -36 + b); ctx.closePath();
    K.paint(ctx, '#b4becf', [-8, -48, 10, -35], { dir: 'd' });
    K.rect(ctx, 5.6, -39.5 + b, 2.2, 7.5, '#aab4c6', 0.6, { lw: 0.8 });
    K.rect(ctx, -8.5, -37 + b, 18, 2, '#e4b95a', 0.8, { lw: 0.7 });
    // chổi lông mũ
    ctx.beginPath(); ctx.moveTo(-1, -47.5 + b); ctx.quadraticCurveTo(-10, -55 + b + (g.mv ? g.s : 0), -14 - fl * 0.5, -43 + b); ctx.quadraticCurveTo(-8, -46 + b, -4, -41 + b); ctx.closePath();
    K.paint(ctx, '#d6403a', [-14, -55, -1, -41]);
    // tay + kiếm
    const A = armAng(sg, 1.0, 3.3, 1.55), phi = armAng(sg, 0.45, -0.35, 2.0);
    const hx = 8 + Math.sin(A) * 11, hy = -29 + b + Math.cos(A) * 11;
    K.limb(ctx, 8, -29 + b, hx, hy, 4.6, '#3f78c4');
    K.circ(ctx, hx, hy, 2.5, '#e6b38d', { lw: 0.8 });
    blade(ctx, hx, hy, phi, 22, 4.6, '#d5dbe6');
    if (P.a >= 0.38 && P.a < 0.7) { // vệt chém
      ctx.save(); ctx.globalAlpha = 0.5 * (1 - (P.a - 0.38) / 0.32); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(8, -26 + b, 28, -1.3, 1.0); ctx.stroke(); ctx.restore();
    }
  }

  /* ===================== ORC KỴ SÓI (lính Trụ Orc) ===================== */
  function wolfLeg(ctx, x, y, ang, lift, col, dark) {
    const fx = x + Math.sin(ang) * 11, fy = y + Math.cos(ang) * 11 - lift;
    const kx = x + Math.sin(ang * 0.5) * 6 + (ang > 0 ? -1.5 : 2.2), ky = y + 5.5 - lift * 0.4;
    K.limb(ctx, x, y, kx, ky, 6, col);
    K.limb(ctx, kx, ky, fx, fy, 4.6, col);
    K.ell(ctx, fx + 1.5, fy + 0.8, 4.2, 2.6, dark);
  }
  function orcRider(ctx, P) {
    const mv = P.w >= 0, ph = mv ? P.w * 6.2832 : 0, bob = mv ? Math.sin(ph * 2) * 1.6 : Math.sin((P.t || 0) * 2.4) * 0.4;
    const sg = K.swingT(P.a), FUR = '#737a89', FURD = '#4c5260', BEL = '#b9bfca';
    K.shadow(ctx, 0, 2, 30, 7, 0.42);
    // chân sói xa
    wolfLeg(ctx, 13, -13 + bob, mv ? Math.sin(ph + 2.2) * 0.9 : 0.1, mv ? Math.max(0, Math.cos(ph + 2.2)) * 4 : 0, FURD, '#2f3440');
    wolfLeg(ctx, -14, -13 + bob, mv ? Math.sin(ph + 0.4) * 0.9 : -0.1, mv ? Math.max(0, Math.cos(ph + 0.4)) * 4 : 0, FURD, '#2f3440');
    // đuôi
    const tw = mv ? Math.sin(ph * 2 + 1) * 3 : Math.sin((P.t || 0) * 2) * 1.5;
    ctx.beginPath(); ctx.moveTo(-18, -24 + bob); ctx.quadraticCurveTo(-30, -30 + tw, -38, -20 + tw * 0.6);
    ctx.quadraticCurveTo(-30, -24 + tw * 0.4, -20, -17 + bob); ctx.closePath(); K.paint(ctx, FUR, [-38, -30, -18, -17]);
    // thân
    ctx.beginPath(); ctx.ellipse(-1, -22 + bob, 22, 10.5, 0, 0, 6.2832); K.paint(ctx, FUR, [-22, -33, 20, -11], { dir: 'v' });
    ctx.beginPath(); ctx.ellipse(-1, -17 + bob, 19, 5.2, 0, 0, Math.PI); ctx.fillStyle = BEL; ctx.fill();
    ctx.beginPath(); ctx.ellipse(-12, -22 + bob, 10, 10.5, 0, 0, 6.2832); K.paint(ctx, shade(FUR, 0.04), [-22, -33, -2, -11], { dir: 'v', lw: 0 });
    // lông gáy dựng
    for (let i = 0; i < 6; i++) K.flat(ctx, [-16 + i * 6, -31 + bob + (i % 2), -13 + i * 6, -37 + bob - (i % 3), -10 + i * 6, -31 + bob], FURD);
    // sơn chiến trận
    K.line(ctx, -6, -28 + bob, -3, -20 + bob, '#d6403a', 2); K.line(ctx, -1, -29 + bob, 2, -21 + bob, '#d6403a', 2);
    // chân sói gần
    wolfLeg(ctx, 11, -12 + bob, mv ? Math.sin(ph) * 0.95 : 0, mv ? Math.max(0, Math.cos(ph)) * 4.5 : 0, FUR, '#39404d');
    wolfLeg(ctx, -12, -12 + bob, mv ? Math.sin(ph + 2.6) * 0.95 : 0, mv ? Math.max(0, Math.cos(ph + 2.6)) * 4.5 : 0, FUR, '#39404d');
    // cổ + đầu sói
    const jaw = P.a >= 0 ? Math.sin(Math.min(1, P.a * 1.4) * Math.PI) * 4 : 0;
    ctx.beginPath(); ctx.moveTo(14, -32 + bob); ctx.quadraticCurveTo(24, -36 + bob, 26, -28 + bob); ctx.lineTo(20, -14 + bob); ctx.lineTo(10, -14 + bob); ctx.closePath();
    K.paint(ctx, FUR, [10, -36, 26, -14], { dir: 'h' });
    // hàm dưới
    K.poly(ctx, [24, -24 + bob + jaw * 0.3, 36, -22 + bob + jaw, 35, -19 + bob + jaw, 26, -18 + bob + jaw * 0.4], '#9097a4');
    // đầu trên + mõm
    ctx.beginPath(); ctx.moveTo(20, -35 + bob); ctx.quadraticCurveTo(30, -37 + bob, 38, -27 + bob - jaw * 0.4); ctx.lineTo(37, -24 + bob - jaw * 0.3);
    ctx.lineTo(24, -23 + bob); ctx.quadraticCurveTo(18, -28 + bob, 20, -35 + bob); ctx.closePath();
    K.paint(ctx, shade(FUR, 0.05), [18, -37, 38, -23], { dir: 'v' });
    K.dot(ctx, 37, -27 + bob - jaw * 0.3, 2.2, '#16121a');
    K.flat(ctx, [31, -23.5 + bob, 33, -23.5 + bob, 32, -20 + bob + jaw * 0.6], '#fff6e0');
    K.flat(ctx, [26, -23.5 + bob, 28, -23.5 + bob, 27, -20.5 + bob + jaw * 0.6], '#fff6e0');
    // tai
    K.poly(ctx, [19, -35 + bob, 20, -45 + bob, 25, -36 + bob], FURD);
    K.poly(ctx, [24, -36 + bob, 28, -44 + bob, 29, -35 + bob], FUR);
    // mắt
    K.glow(ctx, 27, -31 + bob, 6, '#ffb030', 0.7);
    K.dot(ctx, 27, -31 + bob, 1.8, '#ffe27a');
    K.line(ctx, 24, -34 + bob, 30, -32.5 + bob, '#1b1214', 1.2);
    // yên + chăn đỏ
    K.rect(ctx, -9, -34 + bob, 18, 5, '#b3302b', 2);
    K.rect(ctx, -9, -34.6 + bob, 18, 2.4, '#e4b95a', 1, { lw: 0.6 });
    K.rect(ctx, -6, -35.5 + bob, 12, 3.4, '#6b4529', 1.5);
    // chân orc kẹp hông sói
    const ob = bob * 0.8;
    K.limb(ctx, -1, -37 + bob, 6, -29 + bob, 7, '#5a9a3e');
    K.limb(ctx, 6, -29 + bob, 5, -22 + bob, 5.4, '#5a9a3e');
    K.ell(ctx, 6.4, -20.6 + bob, 4, 2.3, '#3d2a1c');
    // tay trái giữ cương (xa)
    K.limb(ctx, -1, -49 + ob, 10, -41 + ob, 5, '#4f8a35');
    K.circ(ctx, 11, -40.5 + ob, 2.6, '#4f8a35', { lw: 0.8 });
    K.line(ctx, 11.5, -40 + ob, 22, -31 + bob, '#3a2616', 1);
    // thân orc (nhìn nghiêng, vạm vỡ)
    K.poly(ctx, [-8, -35 + ob, 9, -35 + ob, 12, -52 + ob, -10, -52 + ob], '#6aa84a');
    K.poly(ctx, [-7.5, -36 + ob, 8.5, -36 + ob, 9.5, -43 + ob, -8.5, -43 + ob], '#6b4529');
    K.line(ctx, -9, -51 + ob, 10, -37 + ob, '#4a2f1d', 2.4);
    for (const [sx, sy] of [[-3, -41], [3, -42], [0, -46]]) K.circ(ctx, sx, sy + ob, 1.1, '#e4b95a', { lw: 0.4 });
    K.flat(ctx, [-8.5, -36.5 + ob, 9.5, -36.5 + ob, 10.5, -33.5 + ob, -9.5, -33.5 + ob], '#eadfc2');
    K.line(ctx, -5, -33 + ob, -5, -36 + ob, 'rgba(60,40,20,0.4)', 0.8); K.line(ctx, 0, -33 + ob, 0, -36 + ob, 'rgba(60,40,20,0.4)', 0.8); K.line(ctx, 5, -33 + ob, 5, -36 + ob, 'rgba(60,40,20,0.4)', 0.8);
    // vai lông (một bên xa, một bên gần)
    K.circ(ctx, -7, -51 + ob, 5, '#c9a468');
    // đầu orc (hàm bạnh, nanh hướng lên)
    K.rect(ctx, -2, -55 + ob, 6, 5, '#558f3a', 1, { lw: 0.8 });
    K.circ(ctx, 2.5, -59 + ob, 8.6, '#6aa84a');
    K.poly(ctx, [-0.5, -54 + ob, 9, -55 + ob, 9.5, -51.5 + ob, 0.5, -51 + ob], '#5b9640', { lw: 0.8 });
    K.flat(ctx, [4.6, -54.5 + ob, 5.9, -60 + ob, 7.1, -54.5 + ob], '#fff6e0'); K.flat(ctx, [0.2, -54.5 + ob, 1.4, -59 + ob, 2.6, -54.5 + ob], '#fff6e0');
    K.line(ctx, 5.5, -63 + ob, 11, -61.4 + ob, '#2e4a1e', 2.2);
    K.dot(ctx, 8, -61 + ob, 1.5, '#ffd23f');
    K.line(ctx, 3.4, -58.4 + ob, 4.4, -55 + ob, '#4a8be0', 1.5); K.line(ctx, 6, -58.4 + ob, 6.8, -55.4 + ob, '#4a8be0', 1.5);
    // mũ sắt + sừng
    ctx.beginPath(); ctx.arc(2, -61 + ob, 9, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); K.paint(ctx, '#7c8190', [-7, -70, 11, -61]);
    K.rect(ctx, -7.2, -63 + ob, 18.4, 2.2, '#4f525e', 1, { lw: 0.7 });
    ctx.beginPath(); ctx.moveTo(-6, -66 + ob); ctx.quadraticCurveTo(-14, -68 + ob, -12.5, -77 + ob); ctx.quadraticCurveTo(-8.5, -70 + ob, -2, -67 + ob); ctx.closePath(); K.paint(ctx, '#e6dcc2', [-14, -77, -2, -66]);
    ctx.beginPath(); ctx.moveTo(10, -66 + ob); ctx.quadraticCurveTo(18, -68 + ob, 16.5, -77 + ob); ctx.quadraticCurveTo(12.5, -70 + ob, 6, -67 + ob); ctx.closePath(); K.paint(ctx, '#f0e6cc', [6, -77, 18, -66]);
    // tay phải + rìu
    const A = armAng(sg, 0.9, 3.3, 1.7), phi = armAng(sg, 0.35, -0.5, 2.3);
    const sx = 5, sy = -49 + ob, hx = sx + Math.sin(A) * 13, hy = sy + Math.cos(A) * 13;
    K.circ(ctx, 5, -50 + ob, 5.6, '#d9b87c');
    K.limb(ctx, sx, sy, hx, hy, 5.6, '#6aa84a');
    K.circ(ctx, hx, hy, 2.9, '#5f9a41', { lw: 0.8 });
    axe(ctx, hx, hy, phi, 25, 11, '#c3c9d4');
    if (P.a >= 0.38 && P.a < 0.7) {
      ctx.save(); ctx.globalAlpha = 0.55 * (1 - (P.a - 0.38) / 0.32); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(7, -46 + ob, 36, -1.3, 1.0); ctx.stroke(); ctx.restore();
    }
  }

  /* ===================== XẠ THỦ ELF (đứng trên Trụ Elf) ===================== */
  function elfArcher(ctx, P) {
    const g = gait({ w: -1, t: P.t }), b = g.bob, a = P.a;
    const draw = a < 0 ? 0 : (a < 0.5 ? a / 0.5 : Math.max(0, 1 - (a - 0.5) / 0.15)); // kéo cung rồi thả
    K.shadow(ctx, 0, 1, 10, 3.2, 0.35);
    leg(ctx, 2.2, -9 + b, 0.1, 0, 9, '#3f5d34', '#5a3d28', 3.6, 3.4);
    leg(ctx, -2.2, -9 + b, -0.1, 0, 9, '#4a6c3c', '#6b4a30', 3.6, 3.4);
    // áo choàng
    ctx.beginPath(); ctx.moveTo(-3, -21 + b); ctx.quadraticCurveTo(-11, -14 + b, -12 + Math.sin((P.t || 0) * 3) * 0.8, -3 + b); ctx.quadraticCurveTo(-6, -4 + b, -3, -8 + b); ctx.closePath();
    K.paint(ctx, '#2f6b45', [-12, -21, -3, -3]);
    K.poly(ctx, [-5.5, -9 + b, 5.5, -9 + b, 6.3, -21 + b, -6.3, -21 + b], '#4f9a5a');
    K.flat(ctx, [-5.5, -9 + b, 5.5, -9 + b, 5.8, -11.5 + b, -5.8, -11.5 + b], '#e3c26a');
    K.rect(ctx, -5.8, -14 + b, 11.6, 2, '#6b4a2b', 0.8, { lw: 0.6 });
    // đầu elf
    K.circ(ctx, 0.8, -26.5 + b, 5.4, '#f0c9a4');
    K.poly(ctx, [4.2, -27.8 + b, 10.5, -31 + b, 5.2, -25 + b], '#f0c9a4', { lw: 0.8 });
    K.dot(ctx, 3.4, -26.6 + b, 0.95, '#2b7a4a'); K.line(ctx, 2.2, -28.2 + b, 4.8, -27.9 + b, '#7a5a30', 0.8);
    // mũ trùm
    ctx.beginPath(); ctx.arc(0.4, -27.5 + b, 6.4, Math.PI * 0.95, Math.PI * 1.95); ctx.lineTo(-2.5, -24 + b); ctx.closePath(); K.paint(ctx, '#2f7a4a', [-6, -34, 6, -24]);
    K.poly(ctx, [-6, -27 + b, -9, -23 + b, -4, -23.5 + b], '#26603c', { lw: 0.8 });
    K.flat(ctx, [-1, -33 + b, 3, -35.5 + b, 4.5, -32.5 + b], '#e8f5c0');
    // cung
    const bx = 6.5 + draw * -1.2;
    ctx.strokeStyle = shade('#8a5a2a', -0.6); ctx.lineWidth = 3.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(bx + 1, -17 + b, 12.5, -1.05, 1.05); ctx.stroke();
    ctx.strokeStyle = '#b57a3a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bx + 1, -17 + b, 12.5, -1.05, 1.05); ctx.stroke();
    const ax = bx + 1 + Math.cos(1.05) * 12.5, ay = Math.sin(1.05) * 12.5, px = bx - 5 - draw * 7;
    ctx.strokeStyle = '#f2ecd0'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(ax, -17 + b - ay); ctx.lineTo(px, -17 + b); ctx.lineTo(ax, -17 + b + ay); ctx.stroke();
    if (draw > 0.05 && a < 0.5) { K.line(ctx, px, -17 + b, bx + 14, -17 + b, '#d9c28a', 1.3); K.flat(ctx, [bx + 14, -18.8 + b, bx + 18, -17 + b, bx + 14, -15.2 + b], '#e8ecf0'); }
    // tay
    K.limb(ctx, 2.5, -20 + b, bx + 1, -17 + b, 3.4, '#4f9a5a');
    K.limb(ctx, 2.5, -20.5 + b, px + 1, -17 + b, 3.2, '#46884f');
    K.dot(ctx, bx + 1, -17 + b, 1.8, '#f0c9a4');
  }

  /* ===================== PHÙ THỦY (đứng trên Trụ Phù thủy) ===================== */
  function witch(ctx, P) {
    const b = Math.sin((P.t || 0) * 2.2) * 0.4, a = P.a, cast = a < 0 ? 0 : Math.sin(Math.min(1, a) * Math.PI);
    K.shadow(ctx, 0, 1, 10, 3.2, 0.35);
    // váy
    ctx.beginPath(); ctx.moveTo(-5, -20 + b); ctx.lineTo(5, -20 + b); ctx.quadraticCurveTo(10, -9, 11.5 + Math.sin((P.t || 0) * 2.6) * 0.6, -1); ctx.quadraticCurveTo(0, 1.5, -11.5, -1); ctx.quadraticCurveTo(-10, -9, -5, -20 + b); ctx.closePath();
    K.paint(ctx, '#6b3fa8', [-11, -20, 11, 1], { dir: 'h' });
    K.line(ctx, -9, -4, 9, -4, '#e4b95a', 1.4);
    K.flat(ctx, [-1.4, -19 + b, 1.4, -19 + b, 1.8, -4, -1.8, -4], 'rgba(255,255,255,0.12)');
    K.rect(ctx, -5.5, -22 + b, 11, 3, '#3c2260', 1, { lw: 0.8 });
    K.circ(ctx, 0, -20.5 + b, 1.5, '#e4b95a', { lw: 0.5 });
    // tóc
    ctx.beginPath(); ctx.moveTo(-3, -27 + b); ctx.quadraticCurveTo(-11, -22 + b, -9, -12 + b); ctx.quadraticCurveTo(-5, -16 + b, -2.5, -21 + b); ctx.closePath();
    K.paint(ctx, '#e8e2f0', [-11, -27, -2, -12]);
    // đầu
    K.circ(ctx, 0.6, -27 + b, 5.2, '#f2d0b0');
    K.dot(ctx, 3.2, -26.8 + b, 0.95, '#6b2f9a'); K.dot(ctx, 3.8, -24.5 + b, 0.9, '#e86a8a');
    // mũ
    K.ell(ctx, 0.6, -30.5 + b, 10.5, 2.8, '#3a1f66');
    ctx.beginPath(); ctx.moveTo(-5.6, -31 + b); ctx.quadraticCurveTo(-3, -40 + b, 3, -43 + b); ctx.quadraticCurveTo(10, -44 + b + Math.sin((P.t || 0) * 3) * 1, 11, -38 + b); ctx.quadraticCurveTo(4, -39 + b, 6.8, -31 + b); ctx.closePath();
    K.paint(ctx, '#4b2a82', [-6, -44, 11, -31]);
    K.rect(ctx, -5.4, -34.5 + b, 12.2, 2.8, '#e4b95a', 0.8, { lw: 0.7 });
    // gậy phép
    const sx = 9, top = -34 - cast * 4 + b;
    K.limb(ctx, sx, -4, sx + 1, top + 4, 2.4, '#6b4a2b');
    K.glow(ctx, sx + 1, top, 7 + cast * 9, '#d58bff', 0.55 + cast * 0.5);
    K.circ(ctx, sx + 1, top, 3.6, '#e9b6ff', { lw: 0.9 });
    K.dot(ctx, sx + 0.2, top - 0.8, 1.2, '#fff');
    // tay
    K.limb(ctx, 3, -19 + b, sx, -15 + b - cast * 3, 3.2, '#6b3fa8');
    K.dot(ctx, sx, -15 + b - cast * 3, 1.7, '#f2d0b0');
  }

  /* ===================== QUÁI ===================== */
  function goblin(ctx, P) {
    const g = gait(P), b = g.bob * 0.8, sg = K.swingT(P.a), SK = '#8bb044';
    K.shadow(ctx, 0, 1, 13, 4, 0.38);
    leg(ctx, 2, -9 + b, -g.s * 0.6, Math.max(0, -g.c) * 2.5, 9.5, '#6c8a34', '#4a3220', 4, 3.6);
    // thân gù + áo rách
    K.poly(ctx, [-6.5, -8 + b, 6.5, -8 + b, 8, -18 + b, 2, -22 + b, -7.5, -18 + b], '#8a5a34');
    K.flat(ctx, [-6.5, -8 + b, 6.5, -8 + b, 7.5, -5 + b, 4, -7 + b, 1, -4 + b, -2, -7 + b, -7.5, -5 + b], '#8a5a34');
    K.rect(ctx, -6.8, -12 + b, 13.6, 2.4, '#3a2616', 1, { lw: 0.7 });
    K.flat(ctx, [-3, -17 + b, 1, -17 + b, 0, -13 + b, -3, -14 + b], '#a97543');
    leg(ctx, -2, -9 + b, g.s * 0.6, Math.max(0, g.c) * 2.5, 9.5, '#7a9c3a', '#5a3d28', 4, 3.6);
    // tai
    K.poly(ctx, [-3, -26 + b, -18, -31 + b, -15, -24 + b, -3, -21 + b], SK);
    K.flat(ctx, [-5, -25 + b, -14, -28.5 + b, -13, -25.5 + b, -5, -23 + b], '#e58a8a');
    K.poly(ctx, [5, -27 + b, 19, -34 + b, 17, -26 + b, 5, -22 + b], SK);
    K.flat(ctx, [6, -26.5 + b, 15.5, -31 + b, 14.5, -27 + b, 6.5, -24 + b], '#e58a8a');
    K.circ(ctx, 1.5, -25 + b, 7.8, SK);
    // mắt, mũi, miệng
    K.ell(ctx, -1, -26.3 + b, 2.2, 1.9, '#fff3a0', { lw: 0.7 }); K.ell(ctx, 4.6, -26.7 + b, 2.4, 2, '#fff3a0', { lw: 0.7 });
    K.dot(ctx, -0.4, -26.2 + b, 0.9, '#1b1214'); K.dot(ctx, 5.3, -26.6 + b, 0.95, '#1b1214');
    K.line(ctx, -3.4, -29 + b, 1, -27.6 + b, '#3a4a1a', 1.2); K.line(ctx, 3, -28.2 + b, 7, -29.2 + b, '#3a4a1a', 1.2);
    K.poly(ctx, [6.5, -25 + b, 11, -23 + b, 6.8, -21.6 + b], shade(SK, -0.12), { lw: 0.8 });
    K.line(ctx, 0, -20.6 + b, 6, -20.4 + b, '#2a1810', 1.1);
    K.flat(ctx, [1, -20.5 + b, 2.3, -20.5 + b, 1.6, -18.2 + b], '#fff'); K.flat(ctx, [4, -20.4 + b, 5.3, -20.4 + b, 4.7, -18.2 + b], '#fff');
    // vũ khí
    const A = armAng(sg, 1.0, 3.2, 1.55), phi = armAng(sg, 0.45, -0.4, 2.1);
    const hx = 4 + Math.sin(A) * 8.5, hy = -18 + b + Math.cos(A) * 8.5;
    K.limb(ctx, 4, -18 + b, hx, hy, 3.6, SK);
    blade(ctx, hx, hy, phi, 14, 3.6, '#bfc5ce');
  }

  function skeleton(ctx, P) {
    const g = gait(P), b = g.bob * 0.8, sg = K.swingT(P.a), B = '#eee8d6', BD = '#cfc6ac';
    K.shadow(ctx, 0, 1, 13, 4, 0.38);
    leg(ctx, 2.5, -15 + b, -g.s * 0.55, Math.max(0, -g.c) * 3, 14.5, BD, '#b9b095', 3.2, 3.4);
    K.ell(ctx, 0, -15.5 + b, 6, 3.2, B);
    K.limb(ctx, 0, -16 + b, 0.5, -31 + b, 2.8, B);
    // xương sườn
    for (let i = 0; i < 4; i++) {
      const y = -30 + i * 3.6 + b, w = 7.2 - i * 0.8;
      ctx.strokeStyle = shade(B, -0.6); ctx.lineWidth = 3.2; ctx.beginPath(); ctx.ellipse(0.5, y, w, 2, 0, 0.1, Math.PI - 0.1); ctx.stroke();
      ctx.strokeStyle = B; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.ellipse(0.5, y, w, 2, 0, 0.1, Math.PI - 0.1); ctx.stroke();
    }
    leg(ctx, -2.5, -15 + b, g.s * 0.55, Math.max(0, g.c) * 3, 14.5, B, '#d4cbb2', 3.2, 3.4);
    // vải rách
    K.poly(ctx, [-6, -16 + b, 6, -16 + b, 7.5, -9 + b, 3, -11 + b, 0, -7.5 + b, -3, -11 + b, -7, -9 + b], '#9e2b25');
    K.rect(ctx, -6.2, -17.6 + b, 12.4, 2.2, '#4a3220', 0.8, { lw: 0.6 });
    // khiên gỗ nhỏ (tay xa)
    K.circ(ctx, -4.5, -23 + b, 6.4, '#8a6238'); K.circ(ctx, -4.5, -23 + b, 2, '#c9c2b0', { lw: 0.7 });
    K.line(ctx, -9.5, -23 + b, 0.5, -23 + b, 'rgba(40,24,12,0.5)', 0.8); K.line(ctx, -4.5, -28 + b, -4.5, -18 + b, 'rgba(40,24,12,0.5)', 0.8);
    // đầu lâu
    K.limb(ctx, 0.5, -31 + b, 1, -34 + b, 2.6, B);
    K.circ(ctx, 1.4, -39 + b, 7.2, B);
    K.poly(ctx, [-1.5, -34 + b, 5.5, -34 + b, 5, -30.4 + b, -1, -30.4 + b], BD, { lw: 0.9 });
    for (let i = 0; i < 3; i++) K.line(ctx, 0 + i * 2, -33.6 + b, 0 + i * 2, -31 + b, '#6a6250', 0.7);
    K.glow(ctx, -0.6, -39.5 + b, 5, '#6fd0ff', 0.5); K.glow(ctx, 4.8, -39.5 + b, 5, '#6fd0ff', 0.5);
    K.ell(ctx, -0.8, -39.5 + b, 2, 2.4, '#1a1226', { lw: 0 }); K.ell(ctx, 4.8, -39.5 + b, 2, 2.4, '#1a1226', { lw: 0 });
    K.dot(ctx, -0.6, -39.4 + b, 0.9, '#aef0ff'); K.dot(ctx, 4.9, -39.4 + b, 0.9, '#aef0ff');
    K.flat(ctx, [2, -36.6 + b, 3.4, -36.6 + b, 2.7, -34.8 + b], '#2a1a22');
    // tay + kiếm gỉ
    const A = armAng(sg, 1.0, 3.3, 1.55), phi = armAng(sg, 0.45, -0.35, 2.0);
    const hx = 5 + Math.sin(A) * 11, hy = -29.5 + b + Math.cos(A) * 11;
    K.limb(ctx, 5, -29.5 + b, hx, hy, 2.8, B);
    blade(ctx, hx, hy, phi, 20, 4.2, '#a79a84');
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(phi); K.flat(ctx, [-1, -9, 1.6, -11, 1.6, -7], '#8a5a30'); K.flat(ctx, [-1.5, -15, 1.8, -16, 1.5, -13], '#8a5a30'); ctx.restore();
  }

  function darkOrc(ctx, P) {
    const g = gait(P), b = g.bob, sg = K.swingT(P.a), SK = '#5f7f3d', IR = '#777b88';
    K.shadow(ctx, 0, 1, 17, 5.5, 0.42);
    leg(ctx, 4.5, -15 + b, -g.s * 0.5, Math.max(0, -g.c) * 3, 14, '#3a2a22', '#2a1c18', 7, 6);
    // thân
    K.poly(ctx, [-12, -15 + b, 12, -15 + b, 16, -33 + b, -16, -33 + b], SK);
    K.poly(ctx, [-10, -17 + b, 10, -17 + b, 12.5, -32 + b, -12.5, -32 + b], '#5a3a28');
    for (const [sx, sy] of [[-7, -22], [0, -26], [7, -22], [-5, -29], [5, -29]]) K.circ(ctx, sx, sy + b, 1.3, '#c3c8d2', { lw: 0.5 });
    K.line(ctx, -10, -31 + b, 9, -18 + b, '#3a2616', 2.4);
    K.rect(ctx, -12, -18.5 + b, 24, 4, '#3a2616', 1, { lw: 0.8 });
    K.circ(ctx, 0, -16.5 + b, 3.4, '#eee4cc', { lw: 0.7 }); K.dot(ctx, -1.1, -17 + b, 0.7, '#1b1214'); K.dot(ctx, 1.1, -17 + b, 0.7, '#1b1214');
    K.poly(ctx, [-12, -15 + b, 12, -15 + b, 13, -8 + b, 0, -10.5 + b, -13, -8 + b], '#9e2b25');
    leg(ctx, -4.5, -15 + b, g.s * 0.5, Math.max(0, g.c) * 3, 14, '#463228', '#33221c', 7, 6);
    // vai gai
    for (const sx of [-15, 15]) {
      K.poly(ctx, [sx - 4, -36 + b, sx - 2, -45 + b, sx + 1, -36 + b], '#c3c8d2', { lw: 0.8 });
      K.circ(ctx, sx, -32.5 + b, 7, IR);
      K.poly(ctx, [sx - 3, -37 + b, sx + 1, -46 + b, sx + 3, -37 + b], '#d6dae2', { lw: 0.8 });
    }
    // đầu
    K.rect(ctx, -3, -38 + b, 7, 5, shade(SK, -0.1), 1, { lw: 0.8 });
    K.circ(ctx, 2, -42 + b, 8.8, SK);
    K.poly(ctx, [-1, -37 + b, 9, -38 + b, 9, -34.5 + b, 0, -34 + b], shade(SK, -0.1), { lw: 0.8 });
    K.flat(ctx, [3.5, -38 + b, 4.7, -44.5 + b, 6, -38 + b], '#fff3d6'); K.flat(ctx, [-0.2, -38 + b, 1, -43 + b, 2.2, -38 + b], '#fff3d6');
    K.glow(ctx, 4, -43.5 + b, 6, '#ff3a2a', 0.6);
    K.dot(ctx, 6.4, -43.2 + b, 1.5, '#ff5a3a'); K.dot(ctx, 0.2, -43.4 + b, 1.4, '#ff5a3a');
    K.line(ctx, -2, -46.5 + b, 3, -44.6 + b, '#1e2e10', 2.4); K.line(ctx, 4.5, -45.4 + b, 9.5, -46.6 + b, '#1e2e10', 2.4);
    // mũ sắt + sừng
    ctx.beginPath(); ctx.arc(2, -44 + b, 9.2, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); K.paint(ctx, IR, [-7, -54, 11, -44]);
    K.rect(ctx, -7.4, -46 + b, 18.8, 2.4, '#4f525e', 1, { lw: 0.7 });
    ctx.beginPath(); ctx.moveTo(-6, -50 + b); ctx.quadraticCurveTo(-15, -52 + b, -13, -62 + b); ctx.quadraticCurveTo(-9, -55 + b, -2, -52 + b); ctx.closePath(); K.paint(ctx, '#e6dcc2', [-15, -62, -2, -50]);
    ctx.beginPath(); ctx.moveTo(10, -50 + b); ctx.quadraticCurveTo(19, -52 + b, 17, -62 + b); ctx.quadraticCurveTo(13, -55 + b, 6, -52 + b); ctx.closePath(); K.paint(ctx, '#f0e6cc', [6, -62, 19, -50]);
    // rìu lớn
    const A = armAng(sg, 0.9, 3.3, 1.7), phi = armAng(sg, 0.35, -0.5, 2.3);
    const sx = 14, sy = -31 + b, hx = sx + Math.sin(A) * 12, hy = sy + Math.cos(A) * 12;
    K.limb(ctx, sx, sy, hx, hy, 6, SK);
    K.circ(ctx, hx, hy, 3.2, shade(SK, -0.08), { lw: 0.8 });
    axe(ctx, hx, hy, phi, 28, 13, '#a9aebb');
    if (P.a >= 0.38 && P.a < 0.7) {
      ctx.save(); ctx.globalAlpha = 0.5 * (1 - (P.a - 0.38) / 0.32); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(13, -28 + b, 34, -1.3, 1.0); ctx.stroke(); ctx.restore();
    }
  }

  function giant(ctx, P) {
    const mv = P.w >= 0, ph = mv ? P.w * 6.2832 : 0, s = Math.sin(ph), c = Math.cos(ph), b = mv ? -Math.abs(c) * 2 : Math.sin((P.t || 0) * 1.6) * 0.6;
    const sg = K.swingT(P.a), R = '#8a847d', RD = '#615b57';
    K.shadow(ctx, 0, 2, 32, 9, 0.45);
    // chân
    K.rect(ctx, -17 + s * 3, -22 + b, 14, 22 - Math.max(0, c) * 2, RD, 4);
    K.rect(ctx, 3 - s * 3, -22 + b, 14, 22 - Math.max(0, -c) * 2, R, 4);
    K.rect(ctx, -18 + s * 3, -5, 16, 5, '#4a4541', 2); K.rect(ctx, 2 - s * 3, -5, 16, 5, '#57524d', 2);
    // thân đá
    ctx.beginPath(); ctx.moveTo(-23, -22 + b); ctx.lineTo(-27, -44 + b); ctx.lineTo(-17, -62 + b); ctx.lineTo(17, -62 + b); ctx.lineTo(27, -44 + b); ctx.lineTo(23, -22 + b); ctx.closePath();
    K.paint(ctx, R, [-27, -62, 27, -22]);
    K.flat(ctx, [-14, -60 + b, 6, -62 + b, -4, -40 + b, -20, -44 + b], 'rgba(255,255,255,0.12)');
    // mảng đá + vết nứt dung nham
    K.poly(ctx, [-18, -26 + b, -8, -30 + b, -4, -22 + b, -16, -20 + b], RD, { lw: 0.9 });
    K.poly(ctx, [8, -34 + b, 20, -40 + b, 22, -28 + b, 10, -26 + b], RD, { lw: 0.9 });
    const lav = 0.65 + Math.sin((P.t || 0) * 4) * 0.2;
    K.glow(ctx, 0, -42 + b, 20, '#ff7a1a', lav * 0.7);
    ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-2, -58 + b); ctx.lineTo(3, -50 + b); ctx.lineTo(-3, -44 + b); ctx.lineTo(4, -36 + b); ctx.lineTo(-1, -26 + b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3, -50 + b); ctx.lineTo(13, -47 + b); ctx.moveTo(-3, -44 + b); ctx.lineTo(-14, -40 + b); ctx.stroke();
    ctx.strokeStyle = '#fff2c0'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-2, -58 + b); ctx.lineTo(3, -50 + b); ctx.lineTo(-3, -44 + b); ctx.lineTo(4, -36 + b); ctx.stroke();
    // rêu
    ctx.fillStyle = '#5f8a3a';
    for (const [mx, my, mr] of [[-20, -46, 5], [-14, -58, 4], [20, -52, 4.5], [14, -24, 4]]) { ctx.beginPath(); ctx.ellipse(mx, my + b, mr, mr * 0.55, 0, 0, 6.2832); ctx.fill(); }
    // đầu
    K.poly(ctx, [-9, -62 + b, 9, -62 + b, 8, -75 + b, -8, -75 + b], R);
    K.poly(ctx, [-9, -73 + b, 9, -73 + b, 6, -78 + b, -6, -78 + b], shade(R, 0.1), { lw: 0.9 });
    K.glow(ctx, -3.5, -69 + b, 7, '#ffa030', 0.8); K.glow(ctx, 3.5, -69 + b, 7, '#ffa030', 0.8);
    K.rect(ctx, -6, -70.5 + b, 4.6, 3, '#fff0b0', 1, { lw: 0.6 }); K.rect(ctx, 1.4, -70.5 + b, 4.6, 3, '#fff0b0', 1, { lw: 0.6 });
    K.line(ctx, -6.5, -73 + b, -1, -71.4 + b, '#2a2420', 1.6); K.line(ctx, 6.5, -73 + b, 1, -71.4 + b, '#2a2420', 1.6);
    // cánh tay: đi thì đung đưa, đánh thì giơ cao rồi đập xuống
    for (const side of [-1, 1]) {
      const sx = side * 27, sy = -52 + b;
      const raise = sg < 0 ? -sg * 30 : 0, slam = sg > 0 ? sg * 12 : 0, swing = mv ? -side * s * 4 : 0;
      const ex = sx + side * (6 - raise * 0.12), ey = sy + 25 - raise + slam + swing;
      K.limb(ctx, sx, sy, ex, ey, 13, side < 0 ? RD : R);
      K.circ(ctx, ex, ey + 3, 9.5, side < 0 ? '#706a64' : '#989289');
      K.flat(ctx, [ex - 6, ey + 1, ex - 2, ey - 2, ex + 1, ey + 1], 'rgba(255,255,255,0.2)');
      K.circ(ctx, sx, sy, 10.5, side < 0 ? '#77716b' : '#8f8982');
    }
    // vụ nổ bụi khi đập
    if (P.a >= 0.5 && P.a < 0.8) { ctx.globalAlpha = 0.5 * (1 - (P.a - 0.5) / 0.3); K.glow(ctx, 0, 0, 44, '#d9c9a8', 1); ctx.globalAlpha = 1; }
  }

  function boss(ctx, P) {
    const g = gait(P), b = g.bob * 1.2, sg = K.swingT(P.a), t = P.t || 0;
    K.shadow(ctx, 0, 2, 38, 11, 0.5);
    // cánh
    for (const side of [-1, 1]) {
      const fl = Math.sin(t * 2.6) * 4;
      ctx.beginPath(); ctx.moveTo(side * 8, -60 + b); ctx.quadraticCurveTo(side * 38, -92 + b - fl, side * 60, -66 + b - fl);
      ctx.quadraticCurveTo(side * 48, -58 + b, side * 52, -44 + b); ctx.quadraticCurveTo(side * 36, -52 + b, side * 36, -38 + b); ctx.quadraticCurveTo(side * 22, -48 + b, side * 8, -40 + b); ctx.closePath();
      K.paint(ctx, '#4a1224', [side * 60, -92, side * 8, -38]);
      K.line(ctx, side * 8, -58 + b, side * 56, -66 + b - fl, '#2a0a14', 1.6);
    }
    // áo choàng
    const fl2 = Math.sin(t * 3) * 3;
    ctx.beginPath(); ctx.moveTo(-16, -58 + b); ctx.lineTo(16, -58 + b); ctx.quadraticCurveTo(30 + fl2, -30, 32 + fl2, -2); ctx.lineTo(-32 - fl2, -2); ctx.quadraticCurveTo(-30 - fl2, -30, -16, -58 + b); ctx.closePath();
    K.paint(ctx, '#5a1020', [-32, -58, 32, -2], { dir: 'v' });
    // chân
    leg(ctx, 7, -26 + b, -g.s * 0.4, Math.max(0, -g.c) * 3, 24, '#2a1a22', '#1a1016', 11, 8);
    leg(ctx, -7, -26 + b, g.s * 0.4, Math.max(0, g.c) * 3, 24, '#33202a', '#22141c', 11, 8);
    // thân giáp
    K.poly(ctx, [-17, -24 + b, 17, -24 + b, 22, -60 + b, -22, -60 + b], '#2e2230');
    K.poly(ctx, [-12, -28 + b, 12, -28 + b, 16, -57 + b, -16, -57 + b], '#3b2a3e');
    K.glow(ctx, 0, -44 + b, 16, '#ff3a2a', 0.5 + Math.sin(t * 4) * 0.15);
    K.circ(ctx, 0, -44 + b, 6, '#ff5a3a', { lw: 1 }); K.circ(ctx, 0, -44 + b, 2.6, '#ffd7a0', { lw: 0 });
    K.line(ctx, -14, -52 + b, 14, -34 + b, '#c01e2a', 1.4);
    K.rect(ctx, -17, -26 + b, 34, 5, '#1a1218', 1.5, { lw: 0.9 });
    K.rect(ctx, -4, -27 + b, 8, 7, '#e4b95a', 1.5, { lw: 0.8 });
    // vai nhọn
    for (const sx of [-24, 24]) {
      K.poly(ctx, [sx - 7, -60 + b, sx - 3, -80 + b, sx + 2, -60 + b], '#1e1620', { lw: 1 });
      K.circ(ctx, sx, -58 + b, 10, '#3a2a3e');
      K.poly(ctx, [sx - 5, -64 + b, sx, -80 + b, sx + 5, -64 + b], '#55425a', { lw: 0.9 });
    }
    // đầu
    K.circ(ctx, 0, -72 + b, 11, '#8c2230');
    K.poly(ctx, [-8, -65 + b, 8, -65 + b, 6, -61 + b, -6, -61 + b], '#6e1a26', { lw: 0.9 });
    K.flat(ctx, [-5, -65 + b, -3.6, -61.4 + b, -2.4, -65 + b], '#fff3d6'); K.flat(ctx, [2.4, -65 + b, 3.6, -61.4 + b, 5, -65 + b], '#fff3d6');
    K.glow(ctx, -4.5, -73 + b, 8, '#ffcc33', 0.8); K.glow(ctx, 5, -73 + b, 8, '#ffcc33', 0.8);
    K.poly(ctx, [-8, -75 + b, -1.5, -72.6 + b, -2.5, -71 + b, -8.5, -72 + b], '#ffe066', { lw: 0.6 });
    K.poly(ctx, [9, -75 + b, 2, -72.6 + b, 3, -71 + b, 9.5, -72 + b], '#ffe066', { lw: 0.6 });
    // sừng
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(side * 6, -79 + b); ctx.quadraticCurveTo(side * 20, -82 + b, side * 18, -100 + b); ctx.quadraticCurveTo(side * 12, -88 + b, side * 2, -82 + b); ctx.closePath();
      K.paint(ctx, '#efe4c8', [side * 20, -100, side * 2, -79]);
    }
    // vương miện lửa
    for (let i = -2; i <= 2; i++) K.poly(ctx, [i * 3.6 - 2, -82 + b, i * 3.6, -90 + b - Math.abs(Math.sin(t * 6 + i)) * 3, i * 3.6 + 2, -82 + b], '#ff7a1a', { lw: 0.6 });
    // đại kiếm
    const A = armAng(sg, 0.8, 3.3, 1.6), phi = armAng(sg, 0.3, -0.4, 2.2);
    const sx = 26, sy = -56 + b, hx = sx + Math.sin(A) * 18, hy = sy + Math.cos(A) * 18;
    K.limb(ctx, sx, sy, hx, hy, 9, '#3a2a3e');
    K.circ(ctx, hx, hy, 4.4, '#33202a', { lw: 0.9 });
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(phi);
    K.rect(ctx, -2, -2, 4, 10, '#2a1a22', 1);
    K.poly(ctx, [-5, -4, -5, -42, 0, -56, 5, -42, 5, -4], '#4a4256');
    K.flat(ctx, [0, -5, 0, -52, 4, -42, 4, -5], 'rgba(255,255,255,0.18)');
    ctx.strokeStyle = '#ff3a2a'; ctx.lineWidth = 1.3; ctx.globalAlpha = 0.8 + Math.sin(t * 5) * 0.2;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, -46); ctx.stroke(); ctx.globalAlpha = 1;
    K.rect(ctx, -11, -5.5, 22, 4, '#e4b95a', 1.5, { lw: 0.9 });
    ctx.restore();
    if (P.a >= 0.38 && P.a < 0.7) {
      ctx.save(); ctx.globalAlpha = 0.6 * (1 - (P.a - 0.38) / 0.32); ctx.strokeStyle = '#ff9a6a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(24, -46 + b, 54, -1.3, 1.0); ctx.stroke(); ctx.restore();
    }
  }

  /** Bảng nhân vật: draw + hộp khung (w,h, gốc ox,oy) tính theo đơn vị thiết kế + bán kính thiết kế dr */
  window.ArtChars = {
    swordsman: { draw: swordsman, box: [96, 92, 46, 76], dr: 17 },
    orcRider:  { draw: orcRider,  box: [116, 110, 58, 94], dr: 22 },
    elfArcher: { draw: elfArcher, box: [60, 64, 30, 52], dr: 11 },
    witch:     { draw: witch,     box: [64, 76, 30, 64], dr: 11 },
    goblin:    { draw: goblin,    box: [70, 64, 34, 52], dr: 15 },
    skeleton:  { draw: skeleton,  box: [74, 70, 34, 60], dr: 15 },
    orc:       { draw: darkOrc,   box: [100, 96, 48, 80], dr: 19 },
    giant:     { draw: giant,     box: [140, 130, 70, 108], dr: 28 },
    boss:      { draw: boss,      box: [200, 170, 100, 138], dr: 36 }
  };
})();
