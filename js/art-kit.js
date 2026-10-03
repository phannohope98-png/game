/* =========================================================
 * art-kit.js – Bộ công cụ vẽ: màu, đổ bóng, hình khối có sáng-tối
 * Mọi hình trong game đều dựng từ các hàm này để có cùng phong cách:
 * ánh sáng từ trên-trái, viền màu tối cùng tông, bóng mềm.
 * ========================================================= */
(function () {
  const K = { INK: '#1b1214', lw: 1.3 };

  /* ---------- Màu ---------- */
  function parse(c) {
    if (c[0] === '#') {
      if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)];
    }
    const m = c.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]];
  }
  const h2 = n => { n = Math.max(0, Math.min(255, Math.round(n))); return (n < 16 ? '0' : '') + n.toString(16); };
  function mix(a, b, t) {
    const A = parse(a), B = parse(b);
    return '#' + h2(A[0] + (B[0] - A[0]) * t) + h2(A[1] + (B[1] - A[1]) * t) + h2(A[2] + (B[2] - A[2]) * t);
  }
  const memo = new Map();
  /** k > 0 sáng lên (ngả kem ấm), k < 0 tối đi (ngả tím than) */
  function shade(c, k) {
    const key = c + '|' + k; let v = memo.get(key);
    if (!v) { v = k >= 0 ? mix(c, '#fff4dc', k) : mix(c, '#150a26', -k); memo.set(key, v); }
    return v;
  }
  function alpha(c, a) { const A = parse(c); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }
  K.parse = parse; K.mix = mix; K.shade = shade; K.alpha = alpha;

  /* ---------- Tô có chiều sâu ---------- */
  function paint(ctx, base, b, o) {
    o = o || {};
    const hi = o.hi !== undefined ? o.hi : 0.26, lo = o.lo !== undefined ? o.lo : -0.3, dir = o.dir || 'd';
    let g;
    if (dir === 'v') g = ctx.createLinearGradient(0, b[1], 0, b[3]);
    else if (dir === 'h') g = ctx.createLinearGradient(b[0], 0, b[2], 0);
    else g = ctx.createLinearGradient(b[0], b[1], b[2], b[3]);
    g.addColorStop(0, shade(base, hi)); g.addColorStop(0.45, base); g.addColorStop(1, shade(base, lo));
    ctx.fillStyle = g; ctx.fill();
    const lw = o.lw === undefined ? K.lw : o.lw;
    if (lw > 0) { ctx.strokeStyle = o.line || shade(base, -0.62); ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
  }
  K.paint = paint;

  K.rr = function (ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  /** Hình chữ nhật bo góc có đổ sáng */
  K.rect = function (ctx, x, y, w, h, base, r, o) { K.rr(ctx, x, y, w, h, r || 0); paint(ctx, base, [x, y, x + w, y + h], o); };
  /** Hình tròn như quả cầu */
  K.circ = function (ctx, x, y, r, base, o) {
    o = o || {};
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832);
    const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r * 1.06);
    g.addColorStop(0, shade(base, o.hi !== undefined ? o.hi : 0.42)); g.addColorStop(0.5, base); g.addColorStop(1, shade(base, o.lo !== undefined ? o.lo : -0.38));
    ctx.fillStyle = g; ctx.fill();
    const lw = o.lw === undefined ? K.lw : o.lw;
    if (lw > 0) { ctx.strokeStyle = o.line || shade(base, -0.62); ctx.lineWidth = lw; ctx.stroke(); }
  };
  K.ell = function (ctx, x, y, rx, ry, base, o) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, (o && o.rot) || 0, 0, 6.2832);
    paint(ctx, base, [x - rx, y - ry, x + rx * 0.6, y + ry], Object.assign({ dir: 'v' }, o));
  };
  K.poly = function (ctx, pts, base, o) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 0; i < pts.length; i += 2) {
      if (i) ctx.lineTo(pts[i], pts[i + 1]);
      x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]);
    }
    ctx.closePath(); paint(ctx, base, [x0, y0, x1, y1], o);
  };
  /** Chi tiết phẳng, không viền */
  K.flat = function (ctx, pts, col) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  };
  K.dot = function (ctx, x, y, r, col) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = col; ctx.fill(); };
  K.line = function (ctx, x1, y1, x2, y2, col, w, cap) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = cap || 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };
  /** Chi tiết cầm nắm: tay, chân, cán vũ khí. Có viền + vệt sáng. */
  K.limb = function (ctx, x1, y1, x2, y2, w, base) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = shade(base, -0.62); ctx.lineWidth = w + K.lw * 1.6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = base; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = shade(base, 0.38); ctx.lineWidth = Math.max(0.6, w * 0.28); ctx.globalAlpha = 0.7;
    const dx = y2 - y1, dy = x1 - x2, d = Math.hypot(dx, dy) || 1, o = w * 0.22;
    ctx.beginPath(); ctx.moveTo(x1 + dx / d * -o, y1 + dy / d * -o); ctx.lineTo(x2 + dx / d * -o, y2 + dy / d * -o); ctx.stroke();
    ctx.globalAlpha = 1;
  };
  /** Bóng mềm dưới chân */
  K.shadow = function (ctx, x, y, rx, ry, a) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, 'rgba(8,4,14,' + (a === undefined ? 0.4 : a) + ')'); g.addColorStop(0.7, 'rgba(8,4,14,' + ((a === undefined ? 0.4 : a) * 0.55) + ')'); g.addColorStop(1, 'rgba(8,4,14,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.2832); ctx.fill(); ctx.restore();
  };
  /** Quầng sáng mềm (dùng ảnh gradient dựng sẵn cho nhẹ máy) */
  const glowCache = new Map();
  function glowSprite(col) {
    let c = glowCache.get(col);
    if (!c) {
      c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, alpha(col, 0.85)); gr.addColorStop(0.4, alpha(col, 0.32)); gr.addColorStop(1, alpha(col, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64); glowCache.set(col, c);
    }
    return c;
  }
  K.glow = function (ctx, x, y, r, col, a) {
    a = a === undefined ? 1 : a; if (a <= 0 || r <= 0) return;
    const ga = ctx.globalAlpha; ctx.globalAlpha = ga * Math.min(1, a);
    ctx.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = ga;
  };
  /** Đường cong tô có viền (đuôi, áo choàng) */
  K.curve = function (ctx, pts, base, o) {
    // pts: [x0,y0, cx,cy, x1,y1, cx,cy, x2,y2 ...] bắt đầu bằng moveTo rồi các quadratic
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i + 3 < pts.length; i += 4) ctx.quadraticCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]);
    ctx.closePath();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
    paint(ctx, base, [x0, y0, x1, y1], o);
  };

  /* ---------- Số ngẫu nhiên có hạt giống ---------- */
  K.seeded = function (seed) {
    let s = (seed * 9301 + 49297) % 233280;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  };
  K.lerp = (a, b, t) => a + (b - a) * t;
  K.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /** Chuyển động vung vũ khí: -1 (giơ lên) → +1 (chém xuống) → 0 (thu về) */
  K.swingT = function (a) {
    if (a < 0) return 0;
    if (a < 0.38) return -Math.sin(a / 0.38 * Math.PI / 2);
    if (a < 0.56) return -1 + 2 * ((a - 0.38) / 0.18);
    return 1 - ((a - 0.56) / 0.44);
  };

  window.ArtKit = K;
})();
