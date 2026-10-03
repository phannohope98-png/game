/* =========================================================
 * map.js – Bản đồ: đường đi, ô xây, chướng ngại, nền
 * Đường đi là polyline; quái di chuyển theo "quãng đường đã đi" (dist).
 * Thiết kế cho phép nhiều đường khác nhau (thêm vào CONFIG.paths).
 * ========================================================= */
(function () {
  class MapPath {
    constructor(points) {
      this.points = points;
      this.segLen = []; this.cum = [0];
      for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x, dy = points[i + 1].y - points[i].y;
        const l = Math.hypot(dx, dy);
        this.segLen.push(l); this.cum.push(this.cum[i] + l);
      }
      this.length = this.cum[this.cum.length - 1];
    }

    /** Vị trí + vector hướng (tx, ty) + pháp tuyến (nx, ny) tại quãng đường d */
    pointAt(d, out) {
      out = out || {};
      d = Math.max(0, Math.min(this.length, d));
      let i = 0;
      while (i < this.segLen.length - 1 && this.cum[i + 1] < d) i++;
      const a = this.points[i], b = this.points[i + 1], l = this.segLen[i] || 1;
      const t = (d - this.cum[i]) / l;
      out.tx = (b.x - a.x) / l; out.ty = (b.y - a.y) / l;
      out.nx = -out.ty; out.ny = out.tx;
      out.x = a.x + (b.x - a.x) * t; out.y = a.y + (b.y - a.y) * t;
      return out;
    }

    /** Khoảng cách vuông góc nhỏ nhất từ điểm tới đường + quãng đường tương ứng */
    nearest(x, y) {
      let best = Infinity, bestD = 0;
      for (let i = 0; i < this.segLen.length; i++) {
        const a = this.points[i], b = this.points[i + 1], l = this.segLen[i];
        if (!l) continue;
        let t = ((x - a.x) * (b.x - a.x) + (y - a.y) * (b.y - a.y)) / (l * l);
        t = Math.max(0, Math.min(1, t));
        const px = a.x + (b.x - a.x) * t, py = a.y + (b.y - a.y) * t;
        const dd = Math.hypot(x - px, y - py);
        if (dd < best) { best = dd; bestD = this.cum[i] + l * t; }
      }
      return { dist: bestD, perp: best };
    }
  }

  // Bộ sinh số ngẫu nhiên có hạt giống – để bản đồ giống nhau mỗi lần chơi
  function seeded(seed) {
    let s = seed * 9301 + 49297;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  const PATH_WIDTH = 58;

  const GameMap = {
    PATH_WIDTH,
    MapPath,

    build(stageIndex, W, H) {
      const st = CONFIG.stages[stageIndex];
      const tpl = CONFIG.paths[st.path];
      const path = new MapPath(tpl.map(p => ({ x: p[0] * W, y: p[1] * H })));
      const gate = { x: W / 2, y: H * 0.875, width: W };
      const theme = CONFIG.themes[st.theme] || CONFIG.themes.grass;
      const rand = seeded(stageIndex + 7);

      const slots = st.slots
        ? st.slots.map(p => ({ x: p[0] * W, y: p[1] * H }))
        : this.generateSlots(path, W, H, gate, st.slotCount || 7);

      // Chướng ngại vật trang trí (cây, đá) – tránh đường đi và ô xây
      const obstacles = [];
      for (let tries = 0; tries < 140 && obstacles.length < 22; tries++) {
        const x = 20 + rand() * (W - 40), y = H * 0.02 + rand() * H * 0.8;
        if (path.nearest(x, y).perp < PATH_WIDTH + 12) continue;
        if (slots.some(s => Math.hypot(s.x - x, s.y - y) < 62)) continue;
        if (obstacles.some(o => Math.hypot(o.x - x, o.y - y) < 46)) continue;
        obstacles.push({ x, y, emoji: theme.decor[Math.floor(rand() * theme.decor.length)], size: 26 + rand() * 16 });
      }

      return { W, H, path, gate, slots, obstacles, theme, stage: st, spawn: path.points[0] };
    },

    /** Tự tìm vị trí ô xây: cách đường 75–125 đơn vị, trải đều (farthest-point) */
    generateSlots(path, W, H, gate, count) {
      const cands = [];
      for (let y = H * 0.14; y < H * 0.8; y += 26) {
        for (let x = 55; x < W - 55; x += 26) {
          const n = path.nearest(x, y);
          if (n.perp < 78 || n.perp > 125) continue;
          cands.push({ x, y, d: n.dist });
        }
      }
      if (!cands.length) return [];
      const chosen = [];
      // bắt đầu từ ứng viên ở khoảng 65% chiều dài đường (gần cổng – vị trí quan trọng)
      let start = cands[0], best = Infinity;
      cands.forEach(c => { const v = Math.abs(c.d - path.length * 0.65); if (v < best) { best = v; start = c; } });
      chosen.push(start);
      while (chosen.length < count) {
        let pick = null, pickScore = -1;
        for (const c of cands) {
          let m = Infinity;
          for (const s of chosen) m = Math.min(m, Math.hypot(c.x - s.x, c.y - s.y));
          if (m > pickScore) { pickScore = m; pick = c; }
        }
        if (!pick || pickScore < 110) break;
        chosen.push(pick);
      }
      return chosen.map(c => ({ x: c.x, y: c.y }));
    },

    /** Vẽ nền tĩnh 1 lần vào canvas phụ (cache) */
    renderBackground(map, scale) {
      const c = document.createElement('canvas');
      c.width = Math.ceil(map.W * scale); c.height = Math.ceil(map.H * scale);
      const g = c.getContext('2d');
      g.scale(scale, scale);
      const th = map.theme, W = map.W, H = map.H;

      // Mặt đất + ô cỏ loang
      g.fillStyle = th.ground; g.fillRect(0, 0, W, H);
      const rand = seeded(3);
      g.fillStyle = th.ground2;
      for (let i = 0; i < 70; i++) {
        g.globalAlpha = 0.5;
        g.beginPath(); g.ellipse(rand() * W, rand() * H, 20 + rand() * 60, 10 + rand() * 30, 0, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;

      // Đường đi: viền – lòng đường – vệt sáng
      const pts = map.path.points;
      const stroke = (w, color) => {
        g.strokeStyle = color; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round';
        g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
        g.stroke();
      };
      stroke(PATH_WIDTH + 14, 'rgba(0,0,0,0.18)');
      stroke(PATH_WIDTH + 8, th.pathEdge);
      stroke(PATH_WIDTH, th.path);
      g.setLineDash([4, 18]); stroke(4, 'rgba(255,255,255,0.18)'); g.setLineDash([]);

      // Cổng quái xuất hiện
      const sp = pts[1];
      g.fillStyle = 'rgba(60,0,40,0.35)';
      g.beginPath(); g.ellipse(sp.x, Math.max(30, sp.y - 30), 48, 22, 0, 0, Math.PI * 2); g.fill();

      // Chướng ngại vật
      map.obstacles.forEach(o => {
        g.fillStyle = 'rgba(0,0,0,0.2)';
        g.beginPath(); g.ellipse(o.x, o.y + o.size * 0.45, o.size * 0.45, o.size * 0.16, 0, 0, Math.PI * 2); g.fill();
        g.font = `${o.size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(o.emoji, o.x, o.y);
      });

      // Thềm đất trước cổng
      g.fillStyle = th.pathEdge;
      g.fillRect(0, map.gate.y - 6, W, H - map.gate.y + 6);
      return c;
    }
  };

  window.GameMap = GameMap;
})();
