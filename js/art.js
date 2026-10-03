/* =========================================================
 * art.js – Painter: vẽ nhân vật/trụ từ bộ đệm khung hình
 * Mỗi khung vẽ 1 lần ở độ phân giải hiện tại rồi tái sử dụng.
 * ========================================================= */
(function () {
  const K = ArtKit, TAU = Math.PI * 2;
  const N = { walk: 12, atk: 10, idle: 8 }, IDLE = 2.618;
  const BUCKETS = [0.35, 0.5, 0.7, 1, 1.4, 2, 2.8, 4];
  const bucket = v => { for (const b of BUCKETS) if (v <= b * 1.15) return b; return 4; };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  const cache = new Map();
  function remember(key, c) { if (cache.size > 1600) cache.clear(); cache.set(key, c); return c; }

  function charFrame(type, mode, i, ppu) {
    const key = 'c' + type + mode + i + '|' + ppu; let c = cache.get(key); if (c) return c;
    const d = ArtChars[type], [w, h, ox, oy] = d.box;
    c = mk(w * ppu, h * ppu); const g = c.getContext('2d');
    g.scale(ppu, ppu); g.translate(ox, oy); g.lineJoin = 'round'; g.lineCap = 'round';
    const P = { w: -1, a: -1, t: 0 };
    if (mode === 'walk') P.w = i / N.walk; else if (mode === 'atk') P.a = (i + 0.5) / N.atk; else P.t = i / N.idle * IDLE;
    d.draw(g, P);
    return remember(key, c);
  }
  function towerStatic(type, tier, ppu) {
    const key = 't' + type + tier + '|' + ppu; let c = cache.get(key); if (c) return c;
    const d = ArtTowers[type], [w, h, ox, oy] = d.box;
    c = mk(w * ppu, h * ppu); const g = c.getContext('2d');
    g.scale(ppu, ppu); g.translate(ox, oy); g.lineJoin = 'round'; g.lineCap = 'round';
    d.static(g, tier);
    return remember(key, c);
  }
  function plotSprite(ppu) {
    const key = 'plot|' + ppu; let c = cache.get(key); if (c) return c;
    const W = 100, H = 70; c = mk(W * ppu, H * ppu); const g = c.getContext('2d');
    g.scale(ppu, ppu); g.translate(W / 2, H / 2 + 6); g.lineJoin = 'round';
    K.shadow(g, 3, 6, 46, 16, 0.35);
    K.cel(g, K.P.ell(0, 0, 40, 15), '#9a7448', { s: 4, h: 0, lw: 0, dark: '#7a5634' });
    g.save(); g.beginPath(); g.ellipse(0, 0, 40, 15, 0, 0, TAU); g.clip();
    const r = K.seeded(5); for (let i = 0; i < 30; i++) K.dot(g, (r() - 0.5) * 76, (r() - 0.5) * 28, 1 + r() * 2, r() < 0.5 ? 'rgba(60,30,10,0.3)' : 'rgba(255,230,180,0.25)');
    g.restore();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; K.ell(g, Math.cos(a) * 40, Math.sin(a) * 15, 5.4 + (i % 3) * 0.8, 3.4, i % 2 ? '#b8b2a6' : '#a09a8e', { s: 1.4, h: 0.8, lw: 1.6 }); }
    // biển gỗ nhỏ
    K.limb(g, 26, -2, 26, -24, 2.4, '#7a4a26');
    K.rr(g, 15, -32, 22, 13, 2, '#c8965a', { s: 2, h: 1, lw: 1.8 });
    K.line(g, 21, -25.5, 31, -25.5, '#5a3418', 1.6); K.line(g, 26, -29, 26, -22, '#5a3418', 1.6);
    return remember(key, c);
  }

  const Painter = {
    res: 1,
    clear() { cache.clear(); },
    char(ctx, type, x, y, scale, face, mode, phase, ppuOverride) {
      const d = ArtChars[type]; if (!d) return;
      const ppu = bucket(ppuOverride || scale * this.res);
      let i;
      if (mode === 'walk') i = Math.floor((((phase % 1) + 1) % 1) * N.walk);
      else if (mode === 'atk') i = Math.min(N.atk - 1, Math.max(0, Math.floor(phase * N.atk)));
      else { mode = 'idle'; i = Math.floor((((phase / IDLE) % 1) + 1) % 1 * N.idle); }
      const img = charFrame(type, mode, i, ppu), [w, h, ox, oy] = d.box;
      if (face < 0) {
        ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
        ctx.drawImage(img, -ox * scale, -oy * scale, w * scale, h * scale); ctx.restore();
      } else ctx.drawImage(img, x - ox * scale, y - oy * scale, w * scale, h * scale);
    },
    tower(ctx, type, tier, x, y, scale, t, st) {
      const d = ArtTowers[type], [w, h, ox, oy] = d.box;
      ctx.drawImage(towerStatic(type, tier, bucket(scale * this.res)), x - ox * scale, y - oy * scale, w * scale, h * scale);
      ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const self = this;
      d.fx(ctx, tier, t, st || {}, { char(ct, cx, cy, face, a, tt) { self.char(ctx, ct, cx, cy, 1, face, a >= 0 ? 'atk' : 'idle', a >= 0 ? a : tt, scale * self.res); } });
      ctx.restore();
    },
    plot(ctx, x, y, hi, t) {
      const img = plotSprite(bucket(this.res));
      ctx.drawImage(img, x - 50, y - 41, 100, 70);
      if (hi) { const p = 0.6 + Math.sin(t * 6) * 0.3; ctx.save(); ctx.globalAlpha = p; ctx.strokeStyle = '#ffe58a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 44, 17, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    },
    /** Chân dung cho giao diện (canvas DOM) */
    towerPortrait(canvas, type, tier, fit) {
      const g = canvas.getContext('2d');
      const TOP = { archer: [0, 78, 92, 112, 138], mage: [0, 84, 92, 112, 140], barracks: [0, 62, 72, 82, 102], artillery: [0, 46, 52, 58, 64] }[type] || [0, 100, 100, 100, 100];
      g.clearRect(0, 0, canvas.width, canvas.height);
      const f = fit || 0.82, s = Math.min(canvas.width * f / 92, canvas.height * f / (TOP[tier] + 26));
      this.tower(g, type, tier, canvas.width / 2, canvas.height / 2 + (TOP[tier] - 26) * s / 2, s, 0.5, { a: -1, face: 1 });
    },
    charPortrait(canvas, type, opts) {
      opts = opts || {};
      const g = canvas.getContext('2d'), d = ArtChars[type], [w, h, ox, oy] = d.box;
      g.clearRect(0, 0, canvas.width, canvas.height);
      const z = opts.zoom || 1;
      if (opts.head) { // chân dung cận mặt: căn giữa đầu nhân vật
        const s = canvas.width / (d.tall * 0.62) * z / 2.1;
        this.char(g, type, canvas.width / 2 - d.tall * 0.04 * s, canvas.height * 0.5 + d.head * s, s, 1, 'idle', 0.4, s);
        return;
      }
      const s = Math.min(canvas.width / Math.max(d.tall * 1.15, d.wide || 0), canvas.height / (d.tall * 1.12)) * z;
      this.char(g, type, canvas.width / 2 - d.tall * 0.06 * s, canvas.height / 2 + d.tall * 0.52 * s, s, 1, 'idle', 0.4, s);
    }
  };
  window.Painter = Painter;
})();
