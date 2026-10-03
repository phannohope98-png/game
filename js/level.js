/* =========================================================
 * level.js – Dựng màn chơi
 *  - Đường đi: spline mềm (Catmull-Rom) từ các điểm điều khiển
 *  - Ô xây: tự đặt dọc 2 bên đường, cách đều, không đè đường
 *  - Nền bản đồ: vẽ 1 lần vào canvas (cỏ, đường, sông, cầu, rừng, tường thành)
 * ========================================================= */
(function () {
  const K = ArtKit, shade = K.shade, TAU = Math.PI * 2;

  class Path {
    constructor(points) {
      this.points = points; this.segLen = []; this.cum = [0];
      for (let i = 0; i < points.length - 1; i++) {
        const l = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
        this.segLen.push(l); this.cum.push(this.cum[i] + l);
      }
      this.length = this.cum[this.cum.length - 1];
    }
    pointAt(d, out) {
      out = out || {}; d = Math.max(0, Math.min(this.length, d));
      let lo = 0, hi = this.segLen.length - 1;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (this.cum[m] <= d) lo = m; else hi = m - 1; }
      const i = lo, a = this.points[i], b = this.points[i + 1], l = this.segLen[i] || 1, t = Math.max(0, Math.min(1, (d - this.cum[i]) / l));
      out.tx = (b.x - a.x) / l; out.ty = (b.y - a.y) / l; out.nx = -out.ty; out.ny = out.tx;
      out.x = a.x + (b.x - a.x) * t; out.y = a.y + (b.y - a.y) * t;
      return out;
    }
    nearest(x, y) {
      let best = Infinity, bestD = 0;
      for (let i = 0; i < this.segLen.length; i++) {
        const a = this.points[i], b = this.points[i + 1], l = this.segLen[i]; if (!l) continue;
        let t = ((x - a.x) * (b.x - a.x) + (y - a.y) * (b.y - a.y)) / (l * l); t = Math.max(0, Math.min(1, t));
        const dd = Math.hypot(x - (a.x + (b.x - a.x) * t), y - (a.y + (b.y - a.y) * t));
        if (dd < best) { best = dd; bestD = this.cum[i] + l * t; }
      }
      return { dist: bestD, perp: best };
    }
  }

  /** Catmull-Rom → đường gấp khúc mịn */
  function smooth(ctrl, step) {
    const P = ctrl.map(p => ({ x: p[0], y: p[1] })), out = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      const n = Math.max(2, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / step));
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push({
          x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        });
      }
    }
    out.push({ x: P[P.length - 1].x, y: P[P.length - 1].y });
    return out;
  }

  function distToPaths(paths, x, y) { let m = Infinity; for (const p of paths) m = Math.min(m, p.nearest(x, y).perp); return m; }

  const Level = {
    Path,

    build(index) {
      const L = CONFIG.levels[index], W = CONFIG.world.width, H = CONFIG.world.height, PW = CONFIG.pathWidth;
      const theme = CONFIG.themes[L.theme];
      const paths = L.paths.map(c => new Path(smooth(c, 10)));
      const river = L.river ? new Path(smooth(L.river, 12)) : null;

      // ---- Ô xây: dọc hai bên đường ----
      const spots = [], rnd = K.seeded(index * 97 + 13), tmp = {};
      const ok = (x, y) => {
        if (x < 55 || x > W - 55 || y < 90 || y > H - 210) return false;
        if (distToPaths(paths, x, y) < PW / 2 + 44) return false;
        if (river && river.nearest(x, y).perp < 70) return false;
        for (const s of spots) if (Math.hypot(s.x - x, s.y - y) < 150) return false;
        return true;
      };
      for (const p of paths) {
        for (let d = 140, side = 1; d < p.length - 150; d += 70, side = -side) {
          p.pointAt(d, tmp);
          for (const sd of [side, -side]) {
            const off = PW / 2 + 52 + rnd() * 10, x = tmp.x + tmp.nx * off * sd, y = tmp.y + tmp.ny * off * sd;
            if (ok(x, y)) { spots.push({ id: spots.length, x: Math.round(x), y: Math.round(y) }); break; }
          }
        }
      }

      // ---- Cây cối & đá (tránh đường, ô xây, sông) ----
      const decor = [], r2 = K.seeded(index * 31 + 7);
      for (let y = -20; y < H - 150; y += 46) for (let x = -10; x < W + 20; x += 46) {
        const jx = x + (r2() - 0.5) * 40, jy = y + (r2() - 0.5) * 40;
        const dp = distToPaths(paths, jx, jy);
        if (dp < PW / 2 + 34) continue;
        let near = false; for (const s of spots) if (Math.hypot(s.x - jx, s.y - jy) < 80) { near = true; break; }
        if (near) continue;
        if (river && river.nearest(jx, jy).perp < 58) continue;
        const edge = Math.min(jx, W - jx, jy + 60) < 90, dens = theme.dense ? 0.55 : 0.32;
        const pChance = edge ? 0.9 : dp > 170 ? dens + 0.3 : dp > 110 ? dens * 0.7 : 0.05;
        if (r2() > pChance) continue;
        const roll = r2();
        let kind;
        if (theme.dead) kind = roll < 0.4 ? 'deadtree' : roll < 0.75 ? 'rock' : 'crystal';
        else if (theme.snow) kind = roll < 0.7 ? 'pine' : roll < 0.85 ? 'rock' : 'bush';
        else if (theme.mush && roll < 0.12) kind = 'mushroom';
        else kind = roll < (theme.dense ? 0.42 : 0.5) ? 'tree' : roll < 0.78 ? 'pine' : roll < 0.9 ? 'bush' : 'rock';
        decor.push({ kind, x: jx, y: jy, s: (kind === 'tree' || kind === 'pine' ? 1.35 : 1.1) + r2() * 0.5, v: Math.floor(r2() * 3) });
      }
      decor.sort((a, b) => a.y - b.y);

      const end = paths[0].points[paths[0].points.length - 1];
      return { index, def: L, W, H, theme, paths, river, spots, decor, exit: { x: end.x, y: end.y } };
    },

    /* ================= VẼ NỀN ================= */
    renderBackground(map, res) {
      const W = map.W, H = map.H, th = map.theme, PW = CONFIG.pathWidth;
      const c = document.createElement('canvas'); c.width = Math.ceil(W * res); c.height = Math.ceil(H * res);
      const g = c.getContext('2d'); g.scale(res, res); g.lineJoin = 'round'; g.lineCap = 'round';
      const rnd = K.seeded(map.index * 53 + 3);

      // 1) Mặt đất: nền chuyển sắc + mảng nắng/bóng + cỏ nhiều tầng
      const base = g.createLinearGradient(0, 0, W * 0.3, H);
      base.addColorStop(0, shade(th.grass2, -0.08)); base.addColorStop(0.5, th.grass); base.addColorStop(1, shade(th.grass, 0.06));
      g.fillStyle = base; g.fillRect(0, 0, W, H);
      const blot = (x, y, r, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, K.alpha(col, a)); gr.addColorStop(1, K.alpha(col, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
      for (let i = 0; i < 70; i++) blot(rnd() * W, rnd() * H, 60 + rnd() * 160, rnd() < 0.5 ? th.grass2 : shade(th.grass2, -0.12), 0.55);
      for (let i = 0; i < 40; i++) blot(rnd() * W, rnd() * H, 50 + rnd() * 120, shade(th.grass, 0.28), 0.35);
      // vệt cỏ ngắn loang (texture)
      for (let i = 0; i < 2600; i++) { const x = rnd() * W, y = rnd() * H; g.fillStyle = K.alpha(rnd() < 0.5 ? shade(th.grass, -0.2) : shade(th.grass, 0.22), 0.35); g.fillRect(x, y, 2.2, 1.1); }
      const tuftCols = [shade(th.grass, -0.22), shade(th.grass2, -0.12), shade(th.grass, 0.18)];
      for (let i = 0; i < 1500; i++) {
        const x = rnd() * W, y = rnd() * H, h = 4 + rnd() * 6, col = tuftCols[(rnd() * 3) | 0];
        g.fillStyle = col; g.beginPath(); g.moveTo(x - 3.4, y); g.quadraticCurveTo(x - 3, y - h * 0.6, x - 4.8, y - h); g.quadraticCurveTo(x - 1.2, y - h * 0.55, x, y - h * 1.2); g.quadraticCurveTo(x + 1, y - h * 0.5, x + 4.6, y - h * 0.9); g.quadraticCurveTo(x + 2.6, y - h * 0.4, x + 3.4, y); g.closePath(); g.fill();
      }
      if (th.flowers) { // hoa mọc thành cụm
        const fc = ['#fff6a0', '#ffffff', '#ffb0c8', '#c8b0ff', '#ffd27a'];
        for (let i = 0; i < 70; i++) { const cx = rnd() * W, cy = rnd() * H, col = fc[(rnd() * fc.length) | 0], n = 3 + (rnd() * 6 | 0);
          for (let j = 0; j < n; j++) { const x = cx + (rnd() - 0.5) * 34, y = cy + (rnd() - 0.5) * 20; K.line(g, x, y + 4, x, y, shade(th.grass, -0.3), 1); for (let k = 0; k < 5; k++) { const an = k / 5 * TAU; K.dot(g, x + Math.cos(an) * 1.9, y + Math.sin(an) * 1.9, 1.5, col); } K.dot(g, x, y, 1.1, '#f2a83a'); } }
      }
      if (th.snow) for (let i = 0; i < 260; i++) { const x = rnd() * W, y = rnd() * H; K.dot(g, x, y, 1 + rnd() * 1.6, 'rgba(255,255,255,0.8)'); }
      if (th.lava) for (let i = 0; i < 18; i++) { const x = rnd() * W, y = rnd() * (H - 200); K.glow(g, x, y, 40 + rnd() * 30, '#ff5a1a', 0.35); }

      // 2) Đường đi: bóng – mép đất – nền – vệt mòn – sỏi – cỏ lấn mép
      const drawPath = (p, w, col) => { g.beginPath(); p.points.forEach((pt, i) => i ? g.lineTo(pt.x, pt.y) : g.moveTo(pt.x, pt.y)); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
      const tmp = {};
      for (const p of map.paths) drawPath(p, PW + 30, 'rgba(30,20,10,0.13)');
      for (const p of map.paths) drawPath(p, PW + 12, th.dirtEdge);
      for (const p of map.paths) drawPath(p, PW + 4, shade(th.dirt, -0.1));
      for (const p of map.paths) drawPath(p, PW - 4, th.dirt);
      for (const p of map.paths) drawPath(p, PW * 0.62, K.alpha(shade(th.dirt, 0.14), 0.8));
      for (const p of map.paths) drawPath(p, PW * 0.3, K.alpha(shade(th.dirt, 0.24), 0.5));
      // vệt bánh xe
      for (const p of map.paths) for (const off of [-PW * 0.2, PW * 0.2]) {
        g.beginPath(); let first = true;
        for (let d = 0; d < p.length; d += 8) { p.pointAt(d, tmp); const x = tmp.x + tmp.nx * off, y = tmp.y + tmp.ny * off; if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y); }
        g.strokeStyle = K.alpha(shade(th.dirt, -0.22), 0.32); g.lineWidth = 3.2; g.stroke();
      }
      for (const p of map.paths) for (let d = 0; d < p.length; d += 6) {
        p.pointAt(d, tmp);
        if (rnd() < 0.45) { const o = (rnd() - 0.5) * (PW - 12), x = tmp.x + tmp.nx * o, y = tmp.y + tmp.ny * o, r = 1.2 + rnd() * 2.6;
          g.fillStyle = K.alpha(shade(th.dirt, -0.35), 0.45); g.beginPath(); g.ellipse(x + 0.6, y + 0.8, r, r * 0.7, 0, 0, TAU); g.fill();
          g.fillStyle = rnd() < 0.5 ? shade(th.rock, 0.1) : shade(th.dirt, 0.25); g.beginPath(); g.ellipse(x, y, r, r * 0.68, 0, 0, TAU); g.fill();
          g.fillStyle = 'rgba(255,255,240,0.5)'; g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.25, r * 0.4, r * 0.25, 0, 0, TAU); g.fill(); }
        if (rnd() < 0.85) { const sd = rnd() < 0.5 ? -1 : 1, o = sd * (PW / 2 + 1 + rnd() * 5), x = tmp.x + tmp.nx * o, y = tmp.y + tmp.ny * o, h = 4 + rnd() * 6;
          g.fillStyle = rnd() < 0.5 ? th.grass : shade(th.grass, 0.12); g.beginPath(); g.moveTo(x - 4, y + 2); g.quadraticCurveTo(x - 3, y - h * 0.5, x - 5, y - h); g.quadraticCurveTo(x - 1, y - h * 0.4, x, y - h * 1.15); g.quadraticCurveTo(x + 1.2, y - h * 0.4, x + 5, y - h * 0.85); g.quadraticCurveTo(x + 3, y - h * 0.3, x + 4, y + 2); g.closePath(); g.fill(); }
      }

      // 3) Sông + cầu
      if (map.river) {
        const r = map.river;
        drawPath(r, 112, shade(th.dirt, 0.1));
        drawPath(r, 96, shade(th.water, -0.25));
        drawPath(r, 84, th.water);
        drawPath(r, 40, K.alpha(shade(th.water, 0.2), 0.6));
        for (let d = 0; d < r.length; d += 26) { r.pointAt(d, tmp); const o = (rnd() - 0.5) * 60; K.line(g, tmp.x + tmp.nx * o - 8, tmp.y + tmp.ny * o, tmp.x + tmp.nx * o + 8, tmp.y + tmp.ny * o, 'rgba(255,255,255,0.55)', 2); }
        for (const p of map.paths) for (let d = 0; d < p.length; d += 4) {
          p.pointAt(d, tmp);
          if (r.nearest(tmp.x, tmp.y).perp < 2) { drawBridge(g, tmp, PW); break; }
        }
      }

      // 4) Cây, đá
      for (const d of map.decor) DECOR[d.kind] && (g.save(), g.translate(d.x, d.y), g.scale(d.s, d.s), DECOR[d.kind](g, th, d.v), g.restore());

      // 5) Sương mù ở cửa vào phía trên
      const fog = g.createLinearGradient(0, 0, 0, 170); fog.addColorStop(0, 'rgba(20,10,30,0.75)'); fog.addColorStop(1, 'rgba(20,10,30,0)');
      g.fillStyle = fog; g.fillRect(0, 0, W, 170);
      for (const p of map.paths) { const s = p.points.find(q => q.y > 10) || p.points[0]; K.glow(g, s.x, 20, 70, '#c02a3a', 0.45); }

      // 6) Tường thành & cổng
      paintWall(g, map);
      // 7) Ánh sáng kiểu nền anime: nắng ấm góc trên trái, bóng mát góc dưới phải
      g.save(); g.globalCompositeOperation = 'soft-light';
      const sun = g.createLinearGradient(0, 0, W, H * 0.8);
      sun.addColorStop(0, 'rgba(255,236,170,0.55)'); sun.addColorStop(0.55, 'rgba(255,236,170,0)'); sun.addColorStop(1, 'rgba(40,60,120,0.35)');
      g.fillStyle = sun; g.fillRect(0, 0, W, H); g.restore();
      g.save(); const vg = g.createRadialGradient(W * 0.5, H * 0.45, Math.min(W, H) * 0.3, W * 0.5, H * 0.45, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(20,12,40,0)'); vg.addColorStop(1, 'rgba(20,12,40,0.22)'); g.fillStyle = vg; g.fillRect(0, 0, W, H); g.restore();

      return c;
    }
  };

  function drawBridge(g, p, PW) {
    g.save(); g.translate(p.x, p.y); g.rotate(Math.atan2(p.ty, p.tx));
    const L = 128, w = PW + 8;
    K.shadow(g, 6, 10, L * 0.55, w * 0.5, 0.35);
    K.rr(g, -L / 2, -w / 2, L, w, 8, '#b8a890', { s: 4, h: 2 });
    g.strokeStyle = 'rgba(40,20,20,0.35)'; g.lineWidth = 1.2;
    for (let x = -L / 2 + 12; x < L / 2; x += 12) { g.beginPath(); g.moveTo(x, -w / 2 + 3); g.lineTo(x, w / 2 - 3); g.stroke(); }
    for (const s of [-1, 1]) { K.rr(g, -L / 2 - 2, s * w / 2 - 5, L + 4, 10, 4, '#9a8e7a', { s: 2.4, h: 1 }); for (const x of [-L / 2, L / 2]) K.rr(g, x - 7, s * w / 2 - 8, 14, 16, 4, '#8a7e6a', { s: 2.4, h: 1 }); }
    g.restore();
  }

  /* ---------------- Trang trí kiểu nền anime ---------------- */
  const inkOf = c => K.mix(c, '#1a1424', 0.7);
  function leafBlob(g, x, y, r, seed) {
    const n = 9, rr = K.seeded(seed), pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 0.82 + rr() * 0.3; pts.push(x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * 0.86); }
    return K.P.blob(pts);
  }
  /** Tán lá 3 tông: đáy tối, thân, đốm sáng trên trái + viền */
  function foliage(g, x, y, r, col, seed, hi) {
    const dark = shade(col, -0.28), light = shade(col, 0.3);
    g.save(); g.beginPath(); leafBlob(g, x, y, r, seed)(g); g.fillStyle = col; g.fill(); g.clip();
    g.fillStyle = dark; g.beginPath(); leafBlob(g, x + r * 0.28, y + r * 0.5, r * 0.95, seed + 3)(g); g.fill();
    g.fillStyle = light; for (let i = 0; i < 4; i++) { const a = -2.3 + i * 0.42; g.beginPath(); g.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.5, r * (0.3 - i * 0.03), 0, TAU); g.fill(); }
    if (hi) { g.fillStyle = K.alpha('#fffbe0', 0.35); g.beginPath(); g.arc(x - r * 0.38, y - r * 0.42, r * 0.18, 0, TAU); g.fill(); }
    g.restore();
    g.beginPath(); leafBlob(g, x, y, r, seed)(g); g.strokeStyle = inkOf(col); g.lineWidth = 1.4; g.lineJoin = 'round'; g.stroke();
  }
  function trunk(g, x0, y0, x1, y1, w, col) {
    g.lineCap = 'round'; g.strokeStyle = inkOf(col); g.lineWidth = w + 2.6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.strokeStyle = col; g.lineWidth = w; g.stroke();
    g.strokeStyle = shade(col, -0.3); g.lineWidth = w * 0.35; g.beginPath(); g.moveTo(x0 + w * 0.25, y0); g.lineTo(x1 + w * 0.25, y1); g.stroke();
  }
  const DECOR = {
    tree(g, th, v) {
      K.shadow(g, 6, 3, 26, 9, 0.42);
      trunk(g, 0, 3, 0, -16, 6, '#7a4e32'); trunk(g, 0, -10, -7, -18, 2.4, '#7a4e32'); trunk(g, 0, -12, 6, -20, 2.4, '#7a4e32');
      const c = th.tree[v % 3], sd = v * 13 + 5;
      foliage(g, -10, -21, 12, shade(c, -0.08), sd, false); foliage(g, 10, -22, 12, shade(c, -0.06), sd + 1, false); foliage(g, 0, -31, 15, c, sd + 2, true);
      if (th.flowers && v === 1) for (const [x, y] of [[-5, -36], [7, -28], [-11, -23], [3, -40]]) { K.dot(g, x, y, 2.1, '#ff6a7a'); K.dot(g, x - 0.6, y - 0.6, 0.7, '#ffe0e0'); }
    },
    pine(g, th, v) {
      K.shadow(g, 5, 3, 19, 6.5, 0.42);
      trunk(g, 0, 3, 0, -8, 4.6, '#6b4426');
      const c = th.tree[v % 3];
      const tier = (y, w, h, col) => {
        const path = cc => { cc.moveTo(-w, y); cc.quadraticCurveTo(-w * 0.45, y - h * 0.35, 0, y - h); cc.quadraticCurveTo(w * 0.45, y - h * 0.35, w, y); cc.quadraticCurveTo(w * 0.5, y - 3, 0, y + 1.5); cc.quadraticCurveTo(-w * 0.5, y - 3, -w, y); cc.closePath(); };
        g.save(); g.beginPath(); path(g); g.fillStyle = col; g.fill(); g.clip();
        g.fillStyle = shade(col, -0.25); g.beginPath(); g.moveTo(0, y - h); g.lineTo(w * 1.2, y); g.lineTo(w * 0.15, y + 3); g.closePath(); g.fill();
        g.fillStyle = shade(col, 0.26); g.beginPath(); g.moveTo(0, y - h); g.lineTo(-w * 0.75, y - 1); g.lineTo(-w * 0.45, y - 1); g.closePath(); g.fill();
        g.restore(); g.beginPath(); path(g); g.strokeStyle = inkOf(col); g.lineWidth = 1.3; g.stroke();
        if (th.snow) { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, y - h); g.quadraticCurveTo(-w * 0.3, y - h * 0.55, -w * 0.4, y - h * 0.45); g.quadraticCurveTo(0, y - h * 0.62, w * 0.35, y - h * 0.45); g.quadraticCurveTo(w * 0.2, y - h * 0.6, 0, y - h); g.fill(); }
      };
      tier(-5, 17, 22, shade(c, -0.1)); tier(-16, 14, 21, c); tier(-27, 10.5, 20, shade(c, 0.06));
    },
    bush(g, th, v) {
      K.shadow(g, 3, 3, 16, 5, 0.38);
      const c = th.tree[(v + 1) % 3], sd = v * 7 + 2;
      foliage(g, -6, -5, 8, shade(c, -0.05), sd, false); foliage(g, 6, -5, 8, shade(c, -0.03), sd + 1, false); foliage(g, 0, -10, 9.5, c, sd + 2, true);
      if (th.flowers) { K.dot(g, -3, -12, 1.9, '#fff6a0'); K.dot(g, 5, -8, 1.9, '#ffb0c8'); K.dot(g, -7, -6, 1.7, '#ffffff'); }
      else if (v === 2) { K.dot(g, -2, -9, 1.6, '#d03a4a'); K.dot(g, 4, -6, 1.6, '#d03a4a'); }
    },
    rock(g, th, v) {
      K.shadow(g, 4, 3, 17, 5.5, 0.4);
      K.blob(g, [-14, 2, -12, -8, -4, -14, 7, -12, 14, -4, 12, 3], th.rock, { s: 4, h: 1.8, ink: inkOf(th.rock), animeHeavy: true, lw: 1.4 });
      K.line(g, -4, -10, -1, -4, K.alpha(shade(th.rock, -0.4), 0.6), 1);
      K.blob(g, [8, 4, 10, -2, 17, -1, 19, 4], shade(th.rock, -0.08), { s: 1.6, h: 0.8, ink: inkOf(th.rock), animeHeavy: true, lw: 1.2 });
      if (th.snow) K.flat(g, [-10, -8, -4, -13, 6, -11, 0, -9], '#ffffff');
      else if (!th.dead && v !== 1) { K.blob(g, [-12, -6, -6, -12, 0, -12, -4, -8, -10, -4], '#6aa84a', { s: 0.6, h: 0.4, lw: 0.9, ink: '#2e4a22', animeHeavy: true }); }
    },
    deadtree(g) {
      K.shadow(g, 3, 2, 14, 5, 0.35);
      trunk(g, 0, 2, 0, -24, 5, '#4a3a32'); trunk(g, 0, -16, -10, -30, 2.6, '#4a3a32'); trunk(g, 0, -12, 11, -24, 2.6, '#4a3a32'); trunk(g, 11, -24, 15, -23, 1.6, '#4a3a32');
    },
    crystal(g) {
      K.glow(g, 0, -10, 26, '#ff6a2a', 0.45);
      K.poly(g, [-7, 2, -9, -10, -3, -22, 2, 2], '#e0602a', { s: 2, h: 1.2 });
      K.poly(g, [0, 2, 4, -14, 9, -8, 8, 2], '#ff9a4a', { s: 1.6, h: 1 });
    },
    mushroom(g) {
      K.shadow(g, 2, 2, 10, 4, 0.35);
      K.rr(g, -2.5, -9, 5, 10, 2, '#f0e6d0', { s: 1, h: 0.5 });
      K.cel(g, c => { c.moveTo(-10, -8); c.quadraticCurveTo(0, -22, 10, -8); c.closePath(); }, '#c04a6a', { s: 2.4, h: 1 });
      K.dot(g, -3, -13, 1.6, '#fff'); K.dot(g, 4, -11, 1.3, '#fff');
      K.glow(g, 0, -12, 12, '#ff8ac0', 0.25);
    }
  };

  /* ---------------- Tường thành ở lối ra ---------------- */
  function paintWall(g, map) {
    const W = map.W, H = map.H, ex = map.exit.x, wy = H - 110, ST = '#b8b2c4';
    K.shadow(g, W / 2, wy, W * 0.6, 26, 0.4);
    // mặt tường
    K.rr(g, -10, wy, W + 20, H - wy + 10, 0, ST, { s: 8, h: 3 });
    g.save(); g.beginPath(); g.rect(-10, wy, W + 20, H - wy); g.clip(); g.strokeStyle = 'rgba(40,20,50,0.28)'; g.lineWidth = 1.4;
    for (let r = 0, y = wy + 16; y < H; y += 16, r++) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); for (let x = (r % 2) * 18; x < W; x += 36) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } }
    g.restore();
    for (let x = -6; x < W; x += 36) K.rr(g, x, wy - 14, 22, 18, 3, shade(ST, 0.08), { s: 3, h: 1.4 });
    // cổng
    const gw = PWg();
    function PWg() { return CONFIG.pathWidth + 24; }
    K.cel(g, c => { c.moveTo(ex - gw / 2, H); c.lineTo(ex - gw / 2, wy + 22); c.arc(ex, wy + 22, gw / 2, Math.PI, 0); c.lineTo(ex + gw / 2, H); c.closePath(); }, '#2a1828', { s: 0, h: 0, lw: 3 });
    K.glow(g, ex, wy + 60, 50, '#ffc860', 0.5);
    g.strokeStyle = '#3a2418'; g.lineWidth = 4; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(ex + i * 14, wy + (Math.abs(i) === 2 ? 14 : 0) - 4); g.lineTo(ex + i * 14, wy + 30); g.stroke(); }
    g.strokeStyle = K.INK; g.lineWidth = 10; g.beginPath(); g.arc(ex, wy + 22, gw / 2 + 4, Math.PI, 0); g.stroke();
    g.strokeStyle = '#d8d2e2'; g.lineWidth = 6; g.stroke();
    // 2 tháp cổng
    for (const s of [-1, 1]) {
      const tx = ex + s * (gw / 2 + 34);
      K.rr(g, tx - 26, wy - 50, 52, H - wy + 60, 6, shade(ST, 0.05), { s: 8, h: 3 });
      for (let i = 0; i < 3; i++) K.rr(g, tx - 26 + i * 19, wy - 64, 14, 16, 3, shade(ST, 0.12), { s: 2.4, h: 1 });
      K.cel(g, c => { c.moveTo(tx - 6, wy - 12); c.lineTo(tx - 6, wy - 24); c.arc(tx, wy - 24, 6, Math.PI, 0); c.lineTo(tx + 6, wy - 12); c.closePath(); }, '#ffd070', { s: 0, h: 1.6, light: '#fff6c0', lw: 2 });
      K.glow(g, tx, wy - 20, 18, '#ffc860', 0.6);
      // cờ treo
      K.cel(g, c => { c.moveTo(tx - 9, wy + 4); c.lineTo(tx + 9, wy + 4); c.lineTo(tx + 9, wy + 40); c.lineTo(tx, wy + 46); c.lineTo(tx - 9, wy + 40); c.closePath(); }, '#3d6fc0', { s: 2.4, h: 1 });
      K.dot(g, tx, wy + 20, 3, '#f4f1e6'); K.line(g, tx, wy + 22, tx, wy + 30, '#f4f1e6', 1.6);
    }
  }

  window.Level = Level;
})();
