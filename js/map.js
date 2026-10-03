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

    /** Vẽ nền tĩnh 1 lần vào canvas phụ */
    renderBackground(map, scale) {
      const c = document.createElement('canvas');
      c.width = Math.ceil(map.W * scale); c.height = Math.ceil(map.H * scale);
      const g = c.getContext('2d');
      g.scale(scale, scale);
      const th = map.theme, W = map.W, H = map.H;

      // Nền ô cỏ (lệch sắc nhẹ từng ô)
      const rand = seeded(5);
      for (let r = 0; r < map.rows; r++) {
        for (let col = 0; col < map.cols; col++) {
          g.fillStyle = (r + col) % 2 ? th.ground : th.ground2;
          g.fillRect(col * CELL, r * CELL, CELL, CELL);
        }
      }
      g.globalAlpha = 0.25;
      for (let i = 0; i < 900; i++) {
        g.fillStyle = rand() < 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.35)';
        g.fillRect(rand() * W, rand() * H, 2, 2);
      }
      g.globalAlpha = 1;

      // Đường đi: tô từng ô đường + viền + đá lát
      map.pathCells.forEach(k => {
        const [col, r] = k.split(',').map(Number);
        g.fillStyle = th.pathEdge; g.fillRect(col * CELL, r * CELL, CELL, CELL);
      });
      const inset = (CELL - this.PATH_WIDTH) / 2;
      map.pathCells.forEach(k => {
        const [col, r] = k.split(',').map(Number);
        const x0 = col * CELL, y0 = r * CELL;
        g.fillStyle = th.path;
        const L = map.pathCells.has((col - 1) + ',' + r), R = map.pathCells.has((col + 1) + ',' + r);
        const U = map.pathCells.has(col + ',' + (r - 1)) || r === 0, D = map.pathCells.has(col + ',' + (r + 1));
        g.fillRect(x0 + (L ? 0 : inset), y0 + (U ? 0 : inset), CELL - (L ? 0 : inset) - (R ? 0 : inset), CELL - (U ? 0 : inset) - (D ? 0 : inset));
      });
      // đá lát
      map.pathCells.forEach(k => {
        const [col, r] = k.split(',').map(Number);
        for (let i = 0; i < 5; i++) {
          const x = col * CELL + inset + rand() * (CELL - inset * 2 - 12), y = r * CELL + inset + rand() * (CELL - inset * 2 - 8);
          g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, y, 10 + rand() * 6, 6 + rand() * 4);
        }
      });
      // đường nối xuống cổng
      const end = map.path.points[map.path.points.length - 1];
      g.fillStyle = th.path; g.fillRect(end.x - this.PATH_WIDTH / 2, end.y, this.PATH_WIDTH, H - end.y);

      // Hang quái xuất hiện ở đầu đường
      const sp = map.path.points[1] || map.path.points[0];
      g.fillStyle = 'rgba(10,6,12,0.55)';
      g.beginPath(); g.ellipse(sp.x, Math.max(16, sp.y - 30), 30, 14, 0, 0, Math.PI * 2); g.fill();

      // Cây, đá
      map.decor.forEach(d => Painter.decor(g, d.kind, d.x, d.y, d.s, th));

      // Thềm trước cổng
      g.fillStyle = th.pathEdge; g.fillRect(0, map.gate.y - 4, W, H - map.gate.y + 4);
      return c;
    }
  };

  window.GameMap = GameMap;
})();
