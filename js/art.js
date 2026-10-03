/* =========================================================
 * art.js – Lớp vẽ chung (Painter)
 * - Nhân vật: vẽ sẵn từng khung hình (đi / đánh / đứng) vào canvas phụ,
 *   mỗi khung chỉ vẽ 1 lần → hình đẹp nhiều chi tiết mà vẫn mượt.
 * - Trụ: phần tĩnh vẽ sẵn theo cấp, phần động (cờ, lửa, xạ thủ) vẽ mỗi khung.
 * - Cây cối, đá, ô xây nhà.
 * Muốn dùng ảnh PNG thật: khai báo sprite.image trong config (xem sprites.js).
 * ========================================================= */
(function () {
  const K = ArtKit, shade = K.shade, TAU = Math.PI * 2;
  const N = { walk: 10, atk: 10, idle: 6 };
  const IDLE_PERIOD = 2.618;

  function bucket(ppu) { return Math.max(0.25, Math.round(ppu * 4) / 4); }
  function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

  /* ---------------- Bộ đệm khung hình nhân vật ---------------- */
  const charCache = new Map();
  function charFrame(type, mode, i, ppu) {
    const key = type + '|' + mode + '|' + i + '|' + ppu;
    let c = charCache.get(key);
    if (c) return c;
    const d = ArtChars[type], [w, h, ox, oy] = d.box;
    c = mk(w * ppu, h * ppu);
    const g = c.getContext('2d');
    g.scale(ppu, ppu); g.translate(ox, oy); g.lineJoin = 'round'; g.lineCap = 'round';
    const P = { w: -1, a: -1, t: 0 };
    if (mode === 'walk') P.w = i / N.walk;
    else if (mode === 'atk') P.a = (i + 0.5) / N.atk;
    else P.t = i / N.idle * IDLE_PERIOD;
    d.draw(g, P);
    charCache.set(key, c);
    return c;
  }

  /* ---------------- Bộ đệm trụ ---------------- */
  const towerCache = new Map();
  function towerStatic(type, tier, ppu) {
    const key = type + '|' + tier + '|' + ppu;
    let c = towerCache.get(key);
    if (c) return c;
    const d = ArtTowers[type], [w, h, ox, oy] = d.box;
    c = mk(w * ppu, h * ppu);
    const g = c.getContext('2d');
    g.scale(ppu, ppu); g.translate(ox, oy); g.lineJoin = 'round'; g.lineCap = 'round';
    d.static(g, tier);
    towerCache.set(key, c);
    return c;
  }

  const Painter = {
    res: 2, // số điểm ảnh thật trên 1 đơn vị thế giới (game.js cập nhật)

    clearCache() { charCache.clear(); towerCache.clear(); plotCache.clear(); },

    /** Vẽ nhân vật. (x,y) = điểm chân. scale = đơn vị thế giới / đơn vị thiết kế.
     *  mode 'walk' (phase 0..1), 'atk' (phase 0..1), 'idle' (phase = giây) */
    char(ctx, type, x, y, scale, face, mode, phase, ppuOverride) {
      const d = ArtChars[type]; if (!d) return;
      const ppu = bucket(ppuOverride || scale * this.res);
      let i;
      if (mode === 'walk') i = Math.floor(((phase % 1) + 1) % 1 * N.walk);
      else if (mode === 'atk') i = Math.min(N.atk - 1, Math.max(0, Math.floor(phase * N.atk)));
      else { mode = 'idle'; i = Math.floor(((phase / IDLE_PERIOD) % 1 + 1) % 1 * N.idle); }
      const img = charFrame(type, mode, i, ppu), [w, h, ox, oy] = d.box;
      if (face < 0) {
        ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
        ctx.drawImage(img, -ox * scale, -oy * scale, w * scale, h * scale); ctx.restore();
      } else ctx.drawImage(img, x - ox * scale, y - oy * scale, w * scale, h * scale);
    },

    /** Vẽ trụ. st = { a, face, k, door } trạng thái hoạt ảnh */
    tower(ctx, type, tier, x, y, scale, t, st) {
      const d = ArtTowers[type]; if (!d) return;
      const [w, h, ox, oy] = d.box;
      ctx.drawImage(towerStatic(type, tier, bucket(scale * this.res)), x - ox * scale, y - oy * scale, w * scale, h * scale);
      ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const self = this;
      d.fx(ctx, tier, t, st || {}, {
        char(ct, cx, cy, face, a, tt) {
          if (a >= 0) self.char(ctx, ct, cx, cy, 1, face, 'atk', a, scale * self.res);
          else self.char(ctx, ct, cx, cy, 1, face, 'idle', tt, scale * self.res);
        }
      });
      ctx.restore();
    },

    /** Chân dung cho giao diện */
    towerPortrait(canvas, type, tier) {
      const g = canvas.getContext('2d'), d = ArtTowers[type], [w, h, ox, oy] = d.box;
      g.clearRect(0, 0, canvas.width, canvas.height);
      const s = Math.min(canvas.width / (w * 0.8), canvas.height / (h * 0.92));
      this.tower(g, type, tier, canvas.width / 2, canvas.height - (h - oy) * s * 0.8, s, 0.6, { a: -1, face: 1 });
    },
    charPortrait(canvas, type, fill) {
      const g = canvas.getContext('2d'), d = ArtChars[type], [w, h, ox, oy] = d.box;
      g.clearRect(0, 0, canvas.width, canvas.height);
      const s = Math.min(canvas.width / (w * (fill || 0.8)), canvas.height / (h * (fill || 0.8)));
      this.char(g, type, canvas.width / 2 + (w / 2 - ox) * s, canvas.height / 2 + (oy - h / 2) * s, s, 1, 'idle', 0.3, s);
    },

    /* ---------------- Ô xây nhà ---------------- */
    plot(ctx, x, y, size, state, t) {
      const ppu = bucket(this.res), key = 'plot|' + ppu + '|' + size;
      let c = plotCache.get(key);
      if (!c) c = makePlot(size, ppu, key);
      const W = size * 1.1, H = size * 0.75;
      ctx.drawImage(c, x - W / 2, y - H / 2 + 6, W, H);
      if (state === 'highlight') {
        const p = 0.6 + Math.sin(t * 6) * 0.3;
        ctx.save(); ctx.globalAlpha = p; ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(x, y + 6, size * 0.47, size * 0.3, 0, 0, TAU); ctx.stroke();
        K.glow(ctx, x, y + 6, size * 0.6, '#ffd060', 0.5 * p);
        ctx.restore();
        // mũi tên chỉ xuống
        const by = y - 18 + Math.sin(t * 5) * 4;
        K.flat(ctx, [x - 7, by - 8, x + 7, by - 8, x, by], '#ffe08a');
      }
    },

    /* ---------------- Trang trí bản đồ ---------------- */
    decor(g, kind, x, y, s, th) {
      const fn = DECOR[kind]; if (!fn) return;
      g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
      fn(g, th); g.restore();
    }
  };

  /* Ô đất trống để xây */
  const plotCache = new Map();
  function makePlot(size, ppu, key) {
    const W = size * 1.1, H = size * 0.75, c = mk(W * ppu, H * ppu), g = c.getContext('2d');
    g.scale(ppu, ppu); g.translate(W / 2, H / 2);
    const rx = size * 0.47, ry = size * 0.3;
    K.shadow(g, 0, 3, rx * 1.05, ry * 1.1, 0.35);
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU);
    const gr = g.createRadialGradient(-rx * 0.3, -ry * 0.4, 2, 0, 0, rx); gr.addColorStop(0, '#9a7a52'); gr.addColorStop(1, '#6b4f33');
    g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    const rnd = K.seeded(7);
    for (let i = 0; i < 26; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(40,24,10,0.25)' : 'rgba(255,230,180,0.18)'; g.beginPath(); g.ellipse((rnd() - 0.5) * rx * 1.8, (rnd() - 0.5) * ry * 1.8, 1.5 + rnd() * 2.5, 1 + rnd() * 1.5, 0, 0, TAU); g.fill(); }
    g.restore();
    // vòng đá viền
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * TAU, sx = Math.cos(a) * rx, sy = Math.sin(a) * ry;
      K.ell(g, sx, sy, 4.6 + (i % 3), 3 + (i % 2), i % 2 ? '#a9a49a' : '#8f8a80', { lw: 0.9 });
    }
    // dấu cọc gỗ đánh dấu
    for (const sx of [-1, 1]) { K.rect(g, sx * rx * 0.42 - 1.5, -ry * 0.45 - 8, 3, 10, '#8a6238', 1, { lw: 0.8 }); }
    g.strokeStyle = 'rgba(255,240,200,0.7)'; g.lineWidth = 1.2; g.setLineDash([3, 3]);
    g.beginPath(); g.moveTo(-rx * 0.42, -ry * 0.45 - 6); g.lineTo(rx * 0.42, -ry * 0.45 - 6); g.stroke(); g.setLineDash([]);
    plotCache.set(key, c);
    return c;
  }

  /* ---------------- Cây cối, đá ---------------- */
  function blob(g, x, y, r, col, lite) {
    K.circ(g, x, y, r, col, { hi: 0.32, lo: -0.36 });
    g.fillStyle = K.alpha(lite || shade(col, 0.4), 0.45);
    g.beginPath(); g.ellipse(x - r * 0.32, y - r * 0.38, r * 0.4, r * 0.22, -0.5, 0, TAU); g.fill();
  }
  const DECOR = {
    tree(g, th) {
      K.shadow(g, 3, 13, 17, 5.5, 0.4);
      K.poly(g, [-3.5, 13, -2.6, -2, 2.6, -2, 3.5, 13], '#6b4528');
      blob(g, -8, -6, 10, th.leaf2); blob(g, 8, -6, 10, th.leaf2);
      blob(g, 0, -14, 12, th.leaf); blob(g, -5, -19, 7, shade(th.leaf, 0.08));
      if (th.snow) { g.fillStyle = '#f4f8fb'; g.beginPath(); g.ellipse(-2, -23, 8, 3.4, 0, 0, TAU); g.fill(); }
    },
    pine(g, th) {
      K.shadow(g, 3, 13, 14, 4.5, 0.4);
      K.rect(g, -2.4, 6, 4.8, 8, '#6b4528', 1, { lw: 0.9 });
      K.poly(g, [-13, 9, 13, 9, 0, -6], th.leaf2);
      K.poly(g, [-10, 0, 10, 0, 0, -15], shade(th.leaf, -0.04));
      K.poly(g, [-7, -9, 7, -9, 0, -24], th.leaf);
      g.fillStyle = 'rgba(255,255,230,0.14)'; g.beginPath(); g.moveTo(0, -24); g.lineTo(-7, -9); g.lineTo(-2, -10); g.closePath(); g.fill();
      if (th.snow) { K.flat(g, [-4, -15, 4, -15, 0, -24], '#f4f8fb'); K.flat(g, [-8, -4, 2, -6, -4, -1], '#f4f8fb'); }
    },
    rock(g, th) {
      K.shadow(g, 2, 7, 14, 4.5, 0.4);
      K.poly(g, [-12, 7, -11, -2, -4, -9, 6, -8, 12, 0, 10, 7], th.rock);
      K.flat(g, [-9, -2, -4, -7, 4, -6, -1, -1], 'rgba(255,255,255,0.22)');
      K.poly(g, [7, 8, 9, 2, 15, 3, 16, 8], shade(th.rock, -0.08), { lw: 0.9 });
    },
    bush(g, th) {
      K.shadow(g, 2, 6, 14, 4, 0.35);
      blob(g, -6, 1, 7, th.leaf2); blob(g, 6, 1, 7, th.leaf2); blob(g, 0, -4, 8, th.leaf);
      if (!th.snow) { K.dot(g, -4, -5, 1.4, '#f2d36a'); K.dot(g, 4, -2, 1.4, '#f2a0b8'); }
    },
    deadtree(g) {
      K.shadow(g, 2, 13, 12, 4, 0.35);
      K.limb(g, 0, 13, 0, -6, 4.5, '#4a3628'); K.limb(g, 0, -6, -8, -16, 3, '#4a3628'); K.limb(g, 0, -2, 9, -12, 2.6, '#4a3628');
      K.limb(g, 9, -12, 13, -11, 1.8, '#4a3628'); K.limb(g, -3, -9, -9, -8, 1.8, '#4a3628');
    },
    cactus(g, th) {
      K.shadow(g, 2, 13, 11, 4, 0.35);
      K.rect(g, -4.5, -16, 9, 30, th.leaf, 4.5); K.rect(g, -13, -8, 7, 12, th.leaf, 3.5); K.rect(g, 6, -12, 7, 12, th.leaf, 3.5);
      K.dot(g, 0, -17, 2, '#f2a0b8');
    },
    bones(g) {
      K.limb(g, -8, 4, 8, -2, 2.6, '#eadfc2'); K.limb(g, -6, -3, 6, 5, 2.6, '#e0d4b4');
      K.circ(g, 10, 4, 4.2, '#eadfc2', { lw: 1 }); K.dot(g, 9, 3.5, 1, '#2a1a22'); K.dot(g, 11.4, 3.5, 1, '#2a1a22');
    },
    crystal(g) {
      K.glow(g, 0, -2, 16, '#a070ff', 0.5);
      K.poly(g, [-6, 10, -8, -2, -3, -13, 2, 10], '#8a5adf');
      K.poly(g, [0, 10, 3, -7, 8, -2, 7, 10], '#b38aff');
      K.flat(g, [-5, 6, -6, -1, -3, -9, -2, 4], 'rgba(255,255,255,0.3)');
    }
  };

  window.Painter = Painter;
})();
