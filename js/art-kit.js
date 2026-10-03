/* =========================================================
 * art-kit.js – Bộ công cụ vẽ phong cách hoạt hình (cel-shading)
 * Mỗi mảng màu gồm: viền mực đậm + màu nền + vệt sáng góc trên-trái
 * + mảng tối góc dưới-phải. Ánh sáng luôn từ trên-trái.
 * ========================================================= */
(function () {
  const K = { INK: '#1d1220', lw: 2.2 };
  const TAU = Math.PI * 2;

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
  /** k>0 sáng (ngả vàng kem), k<0 tối (ngả tím than) */
  function shade(c, k) {
    const key = c + k; let v = memo.get(key);
    if (!v) { v = k >= 0 ? mix(c, '#fff6d8', k) : mix(c, '#2a1240', -k); memo.set(key, v); }
    return v;
  }
  function alpha(c, a) { const A = parse(c); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }
  K.parse = parse; K.mix = mix; K.shade = shade; K.alpha = alpha; K.TAU = TAU;
  K.lerp = (a, b, t) => a + (b - a) * t;
  K.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  K.seeded = function (seed) { let s = (Math.abs(Math.floor(seed)) * 9301 + 49297) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };

  /** Tô cel: build(ctx) chỉ thêm đường. o: s (mảng tối), h (vệt sáng), lw (viền), dark, light, flat, ink */
  function cel(ctx, build, base, o) {
    o = o || {};
    const s = o.s === undefined ? 2.4 : o.s, h = o.h === undefined ? 1.2 : o.h;
    ctx.save();
    ctx.beginPath(); build(ctx); ctx.clip();
    if (o.flat) { ctx.fillStyle = base; ctx.fillRect(-4000, -4000, 8000, 8000); }
    else {
      ctx.fillStyle = h > 0 ? (o.light || shade(base, 0.32)) : base; ctx.fillRect(-4000, -4000, 8000, 8000);
      if (h > 0) { ctx.translate(h, h); ctx.beginPath(); build(ctx); ctx.fillStyle = base; ctx.fill(); ctx.translate(-h, -h); }
      if (s > 0) {
        ctx.beginPath(); ctx.rect(-4000, -4000, 8000, 8000);
        ctx.translate(-s, -s); build(ctx); ctx.translate(s, s);
        ctx.fillStyle = o.dark || shade(base, -0.34); ctx.fill('evenodd');
      }
    }
    ctx.restore();
    const lw = o.lw === undefined ? K.lw : o.lw;
    if (lw > 0) {
      ctx.beginPath(); build(ctx);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = o.ink || K.INK; ctx.stroke();
    }
  }
  K.cel = cel;

  const P = {
    circ: (x, y, r) => c => { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); },
    ell: (x, y, rx, ry, rot) => c => { c.moveTo(x + rx * Math.cos(rot || 0), y + rx * Math.sin(rot || 0)); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); },
    poly: pts => c => { c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); },
    rr: (x, y, w, h, r) => c => {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    },
    blob: pts => c => {
      const n = pts.length / 2, X = i => pts[((i % n + n) % n) * 2], Y = i => pts[((i % n + n) % n) * 2 + 1];
      c.moveTo((X(0) + X(1)) / 2, (Y(0) + Y(1)) / 2);
      for (let i = 1; i <= n; i++) c.quadraticCurveTo(X(i), Y(i), (X(i) + X(i + 1)) / 2, (Y(i) + Y(i + 1)) / 2);
      c.closePath();
    }
  };
  K.P = P;
  K.circ = (ctx, x, y, r, base, o) => cel(ctx, P.circ(x, y, r), base, Object.assign({ s: r * 0.32, h: r * 0.16 }, o));
  K.ell = (ctx, x, y, rx, ry, base, o) => cel(ctx, P.ell(x, y, rx, ry, o && o.rot), base, Object.assign({ s: Math.min(rx, ry) * 0.38, h: Math.min(rx, ry) * 0.18 }, o));
  K.poly = (ctx, pts, base, o) => cel(ctx, P.poly(pts), base, o);
  K.rr = (ctx, x, y, w, h, r, base, o) => cel(ctx, P.rr(x, y, w, h, r), base, Object.assign({ s: Math.min(w, h) * 0.26, h: Math.min(w, h) * 0.13 }, o));
  K.blob = (ctx, pts, base, o) => cel(ctx, P.blob(pts), base, o);

  K.flat = (ctx, pts, col) => { ctx.beginPath(); P.poly(pts)(ctx); ctx.fillStyle = col; ctx.fill(); };
  K.dot = (ctx, x, y, r, col) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = col; ctx.fill(); };
  K.line = (ctx, x1, y1, x2, y2, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  K.limb = (ctx, x1, y1, x2, y2, w, col, ink) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = ink || K.INK; ctx.lineWidth = w + K.lw * 1.8; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    ctx.strokeStyle = shade(col, 0.3); ctx.lineWidth = w * 0.3;
    ctx.beginPath(); ctx.moveTo(x1 - w * 0.18, y1 - w * 0.18); ctx.lineTo(x2 - w * 0.18, y2 - w * 0.18); ctx.stroke();
  };
  K.stroke = (ctx, build, col, w, ink) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (ink !== false) { ctx.beginPath(); build(ctx); ctx.strokeStyle = ink || K.INK; ctx.lineWidth = w + K.lw * 1.8; ctx.stroke(); }
    ctx.beginPath(); build(ctx); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  };
  K.shadow = (ctx, x, y, rx, ry, a) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx), A = a === undefined ? 0.38 : a;
    g.addColorStop(0, 'rgba(20,8,30,' + A + ')'); g.addColorStop(0.65, 'rgba(20,8,30,' + A * 0.7 + ')'); g.addColorStop(1, 'rgba(20,8,30,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore();
  };
  const glowCache = new Map();
  K.glow = (ctx, x, y, r, col, a) => {
    a = a === undefined ? 1 : a; if (a <= 0 || r <= 0) return;
    let c = glowCache.get(col);
    if (!c) {
      c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, alpha(col, 0.9)); gr.addColorStop(0.35, alpha(col, 0.38)); gr.addColorStop(1, alpha(col, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64); glowCache.set(col, c);
    }
    const ga = ctx.globalAlpha; ctx.globalAlpha = ga * Math.min(1, a);
    ctx.drawImage(c, x - r, y - r, r * 2, r * 2); ctx.globalAlpha = ga;
  };
  K.swing = a => {
    if (a < 0) return 0;
    if (a < 0.4) return -Math.sin(a / 0.4 * Math.PI / 2);
    if (a < 0.58) return -1 + 2 * ((a - 0.4) / 0.18);
    return 1 - (a - 0.58) / 0.42;
  };
  window.ArtKit = K;
})();
