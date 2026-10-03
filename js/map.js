/* =========================================================
 * map.js – Bản đồ dạng LƯỚI Ô VUÔNG
 * - Bản đồ chia thành ô CELL×CELL (9 cột).
 * - Đường đi chạy qua tâm các ô, chỉ đi ngang/dọc.
 * - Ô xây nhà = các ô cỏ nằm sát đường (trên/dưới/trái/phải).
 * - Các ô còn lại được trang trí cây, đá (chướng ngại vật).
 * ========================================================= */
(function () {
  const CELL = 80;

  class MapPath {
    constructor(points) {
      this.points = points;
      this.segLen = []; this.cum = [0];
      for (let i = 0; i < points.length - 1; i++) {
        const l = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
        this.segLen.push(l); this.cum.push(this.cum[i] + l);
      }
      this.length = this.cum[this.cum.length - 1];
    }

    /** Vị trí + hướng (tx, ty) + pháp tuyến (nx, ny) tại quãng đường d */
    pointAt(d, out) {
      out = out || {};
      d = Math.max(0, Math.min(this.length, d));
      let i = 0;
      while (i < this.segLen.length - 1 && (this.cum[i + 1] < d || this.segLen[i] === 0)) i++;
      const a = this.points[i], b = this.points[i + 1], l = this.segLen[i] || 1;
      const t = Math.max(0, Math.min(1, (d - this.cum[i]) / l));
      out.tx = (b.x - a.x) / l; out.ty = (b.y - a.y) / l;
      out.nx = -out.ty; out.ny = out.tx;
      out.x = a.x + (b.x - a.x) * t; out.y = a.y + (b.y - a.y) * t;
      return out;
    }

    /** Khoảng cách vuông góc nhỏ nhất tới đường + quãng đường tương ứng */
    nearest(x, y) {
      let best = Infinity, bestD = 0;
      for (let i = 0; i < this.segLen.length; i++) {
        const a = this.points[i], b = this.points[i + 1], l = this.segLen[i];
        if (!l) continue;
        let t = ((x - a.x) * (b.x - a.x) + (y - a.y) * (b.y - a.y)) / (l * l);
        t = Math.max(0, Math.min(1, t));
        const dd = Math.hypot(x - (a.x + (b.x - a.x) * t), y - (a.y + (b.y - a.y) * t));
        if (dd < best) { best = dd; bestD = this.cum[i] + l * t; }
      }
      return { dist: bestD, perp: best };
    }
  }

  function seeded(seed) {
    let s = seed * 9301 + 49297;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  const GameMap = {
    CELL, MapPath,
    PATH_WIDTH: 62,

    /** Làm tròn chiều cao bản đồ theo bội số ô */
    snapHeight(H) { return Math.max(11, Math.round(H / CELL)) * CELL; },

    build(stageIndex, W, H) {
      const st = CONFIG.stages[stageIndex];
      const cols = Math.round(W / CELL), rows = Math.round(H / CELL);
      const endRow = rows - 3;                       // hàng cuối của đường (ngay trên cổng)
      const toRow = f => (f < 0 ? -1 : Math.round(f * endRow));

      // Điểm đường đi theo ô
      const cellPts = CONFIG.paths[st.path].map(([c, f]) => ({ c, r: toRow(f) }));
      const points = [];
      cellPts.forEach(p => {
        const q = { x: (p.c + 0.5) * CELL, y: (p.r + 0.5) * CELL };
        const last = points[points.length - 1];
        if (!last || last.x !== q.x || last.y !== q.y) points.push(q);
      });
      const path = new MapPath(points);

      // Đánh dấu các ô đường
      const pathCells = new Set();
      for (let i = 0; i < cellPts.length - 1; i++) {
        const a = cellPts[i], b = cellPts[i + 1];
        const dc = Math.sign(b.c - a.c), dr = Math.sign(b.r - a.r);
        let c = a.c, r = a.r;
        while (true) {
          if (r >= 0) pathCells.add(c + ',' + r);
          if (c === b.c && r === b.r) break;
          c += dc; r += dr;
        }
      }

      // Ô xây: ô cỏ kề cạnh đường, nằm trên khu vực cổng
      const plots = [];
      const isPath = (c, r) => pathCells.has(c + ',' + r);
      for (let r = 1; r <= endRow - 1; r++) {
        for (let c = 0; c < cols; c++) {
          if (isPath(c, r)) continue;
          if (isPath(c - 1, r) || isPath(c + 1, r) || isPath(c, r - 1) || isPath(c, r + 1)) {
            plots.push({ c, r, x: (c + 0.5) * CELL, y: (r + 0.5) * CELL });
          }
        }
      }
      const plotSet = new Set(plots.map(p => p.c + ',' + p.r));

      // Trang trí trên các ô trống còn lại
      const theme = CONFIG.themes[st.theme] || CONFIG.themes.grass;
      const rand = seeded(stageIndex * 31 + 7);
      const decor = [];
      for (let r = 0; r < endRow; r++) {
        for (let c = 0; c < cols; c++) {
          const k = c + ',' + r;
          if (pathCells.has(k) || plotSet.has(k)) continue;
          const n = rand() < 0.75 ? (rand() < 0.4 ? 2 : 1) : 0;
          for (let i = 0; i < n; i++) {
            decor.push({
              kind: theme.decor[Math.floor(rand() * theme.decor.length)],
              x: (c + 0.25 + rand() * 0.5) * CELL, y: (r + 0.25 + rand() * 0.5) * CELL,
              s: 1 + rand() * 0.6
            });
          }
        }
      }
      decor.sort((a, b) => a.y - b.y);

      const end = points[points.length - 1];
      const gate = { x: W / 2, y: end.y + 22, width: W };
      return { W, H, cols, rows, path, pathCells, gate, slots: plots, decor, theme, stage: st, spawn: points[1] || points[0] };
    },

    /** Vẽ nền tĩnh 1 lần vào canvas phụ: cỏ, đường, hang quái, cây, tường thành */
    renderBackground(map, scale) {
      const c = document.createElement('canvas');
      c.width = Math.ceil(map.W * scale); c.height = Math.ceil(map.H * scale);
      const g = c.getContext('2d');
      g.scale(scale, scale);
      const th = map.theme, W = map.W, H = map.H, K = ArtKit, TAU = Math.PI * 2;
      const rand = seeded(map.stage.name.length * 17 + 5);

      // 1) Nền đất/cỏ với các mảng sáng tối mềm
      g.fillStyle = th.ground; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 60; i++) {
        const x = rand() * W, y = rand() * H, r = 50 + rand() * 120, lite = rand() < 0.5;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        const col = lite ? K.shade(th.ground, 0.16) : K.shade(th.ground, -0.16);
        gr.addColorStop(0, K.alpha(col, 0.55)); gr.addColorStop(1, K.alpha(col, 0));
        g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // cỏ lún phún
      const tuft = K.shade(th.ground, -0.22), tuftHi = K.shade(th.ground, 0.22);
      for (let i = 0; i < 520; i++) {
        const x = rand() * W, y = rand() * H, h = 3 + rand() * 4;
        g.strokeStyle = rand() < 0.7 ? tuft : tuftHi; g.lineWidth = 1.2; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x - 2, y); g.lineTo(x - 3, y - h); g.moveTo(x, y); g.lineTo(x, y - h - 1.5); g.moveTo(x + 2, y); g.lineTo(x + 3.5, y - h); g.stroke();
      }
      if (!th.snow && (th.decor.includes('tree') || th.decor.includes('bush'))) {
        const flowers = ['#f7e27a', '#f3a6c0', '#ffffff', '#b9a6ff'];
        for (let i = 0; i < 90; i++) { K.dot(g, rand() * W, rand() * H, 1.6, flowers[i % 4]); }
      }

      // 2) Con đường: viền tối → mặt đường → vệt sáng giữa → sỏi
      const pts = map.path.points, end = pts[pts.length - 1];
      const line = () => { g.beginPath(); g.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y); g.lineTo(end.x, H); };
      g.lineJoin = 'round'; g.lineCap = 'round';
      line(); g.strokeStyle = 'rgba(10,6,4,0.22)'; g.lineWidth = this.PATH_WIDTH + 22; g.stroke();
      line(); g.strokeStyle = th.pathEdge; g.lineWidth = this.PATH_WIDTH + 10; g.stroke();
      line(); g.strokeStyle = th.path; g.lineWidth = this.PATH_WIDTH; g.stroke();
      line(); g.strokeStyle = K.alpha(K.shade(th.path, 0.18), 0.6); g.lineWidth = this.PATH_WIDTH * 0.45; g.stroke();
      // vệt bánh xe
      g.setLineDash([14, 10]); line(); g.strokeStyle = K.alpha(K.shade(th.path, -0.2), 0.35); g.lineWidth = 2.5; g.stroke(); g.setLineDash([]);
      // sỏi & đá lát dọc đường
      const L = map.path.length, tmpP = {};
      for (let d = 0; d < L; d += 9) {
        const p = map.path.pointAt(d, tmpP), off = (rand() - 0.5) * (this.PATH_WIDTH - 8);
        const x = p.x + p.nx * off, y = p.y + p.ny * off;
        if (rand() < 0.5) K.ell(g, x, y, 2 + rand() * 3, 1.4 + rand() * 1.8, rand() < 0.5 ? K.shade(th.path, -0.18) : K.shade(th.path, 0.14), { lw: 0 });
      }
      // cỏ mọc lấn mép đường
      for (let d = 0; d < L; d += 7) {
        const p = map.path.pointAt(d, tmpP), side = rand() < 0.5 ? -1 : 1, off = side * (this.PATH_WIDTH / 2 + 3);
        const x = p.x + p.nx * off, y = p.y + p.ny * off;
        g.fillStyle = rand() < 0.5 ? K.shade(th.ground, 0.05) : K.shade(th.ground, -0.12);
        g.beginPath(); g.ellipse(x, y, 4 + rand() * 4, 3 + rand() * 2, 0, 0, TAU); g.fill();
      }

      // 3) Hang quái ở đầu đường
      const sp = pts[1] || pts[0], cy = Math.max(26, sp.y - 26);
      K.ell(g, sp.x, cy, 52, 26, th.rock || '#6f6b64');
      for (const [dx, dy, r] of [[-40, -6, 14], [38, -8, 15], [-22, -18, 12], [22, -20, 13], [0, -24, 12]]) K.circ(g, sp.x + dx, cy + dy, r, K.shade(th.rock || '#6f6b64', 0.05));
      g.beginPath(); g.ellipse(sp.x, cy + 4, 30, 18, 0, Math.PI, 0); g.lineTo(sp.x + 30, cy + 16); g.lineTo(sp.x - 30, cy + 16); g.closePath();
      const cave = g.createLinearGradient(0, cy - 14, 0, cy + 16); cave.addColorStop(0, '#05030a'); cave.addColorStop(1, '#2a1420');
      g.fillStyle = cave; g.fill();
      K.glow(g, sp.x, cy + 6, 30, '#c0303a', 0.45);
      for (const dx of [-14, 0, 14]) K.dot(g, sp.x + dx, cy + 2 + (dx ? 2 : 0), 1.4, '#ff5a3a');

      // 4) Cây, đá
      map.decor.forEach(d => Painter.decor(g, d.kind, d.x, d.y, d.s * 0.95, th));

      // 5) Tường thành phía dưới
      Gate.paintWall(g, map);

      // 6) Viền tối nhẹ quanh mép bản đồ
      const vg = g.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.45, W / 2, H * 0.45, Math.max(W, H) * 0.8);
      vg.addColorStop(0, 'rgba(10,4,20,0)'); vg.addColorStop(1, 'rgba(10,4,20,0.35)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      return c;
    }
  };

  window.GameMap = GameMap;
})();
