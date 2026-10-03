/* =========================================================
 * art.js – Painter: vẽ nhân vật/trụ từ bộ đệm khung hình
 * Mỗi khung vẽ 1 lần ở độ phân giải hiện tại rồi tái sử dụng.
 * ========================================================= */
(function () {
  const K = ArtKit, TAU = Math.PI * 2;
  const N = { walk: 10, atk: 10, idle: 6 }, IDLE = 2.618;
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
      if (window.Sprites && Sprites.char(ctx,type,x,y,scale,face,mode,phase)) return;
      const ppu = bucket(ppuOverride || scale * this.res);
      let i;
      if (mode === 'walk') i = Math.floor((((phase % 1) + 1) % 1) * N.walk);
      else if (mode === 'atk') i = Math.min(N.atk - 1, Math.max(0, Math.floor(phase * N.atk)));
      else { mode = 'idle'; i = Math.floor((((phase / IDLE) % 1) + 1) % 1 * N.idle); }
      const img = charFrame(type, mode, i, ppu), [w, h, ox, oy] = d.box;
      // Anime presentation pass: contact shadow + aura rất nhẹ, giúp sprite hòa vào map.
      ctx.save();
      ctx.globalAlpha = 0.24; ctx.fillStyle = '#25182f';
      ctx.beginPath(); ctx.ellipse(x, y + 1.5 * scale, 11.5 * scale, 3.5 * scale, 0, 0, TAU); ctx.fill();
      if (/mage|hero|nec|demon|shaman|witch|wizard/i.test(type)) {
        const rg = ctx.createRadialGradient(x, y - 16*scale, 0, x, y - 16*scale, 25*scale);
        rg.addColorStop(0,'rgba(172,128,255,.12)'); rg.addColorStop(1,'rgba(172,128,255,0)');
        ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(x,y-16*scale,25*scale,0,TAU); ctx.fill();
      }
      ctx.restore();
      // V5: đổi silhouette thật sự. Sprite cao hơn 34%, rộng hơn 8%, nhưng neo đúng tại chân nên gameplay/hitbox không đổi.
      const sx = scale * 1.08, sy = scale * 1.34;
      if (face < 0) {
        ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
        ctx.drawImage(img, -ox * sx, -oy * sy, w * sx, h * sy); ctx.restore();
      } else ctx.drawImage(img, x - ox * sx, y - oy * sy, w * sx, h * sy);
      // V3: anime action accents. Chỉ render, không can thiệp combat/hitbox.
      if (mode === 'atk') {
        const q=Math.max(0,Math.min(1,phase)), dir=face<0?-1:1;
        ctx.save(); ctx.translate(x,y); ctx.scale(dir,1);
        if (/soldier|hero|dwarf|orc|goblin|troll|warg/i.test(type)) {
          const a=(q-.5)*1.9, alpha=Math.sin(Math.PI*q);
          ctx.globalCompositeOperation='screen'; ctx.globalAlpha=.52*alpha;
          ctx.strokeStyle=/hero/i.test(type)?'#ffe99a':'#d9efff'; ctx.lineWidth=Math.max(1.2,2.4*scale);
          ctx.beginPath(); ctx.arc(7*scale,-20*scale,18*scale,-1.25+a,-.05+a); ctx.stroke();
          ctx.globalAlpha=.22*alpha; ctx.lineWidth=7*scale; ctx.stroke();
        } else if (/mage|elf|wraith/i.test(type)) {
          const alpha=Math.sin(Math.PI*q), yy=-28*scale;
          ctx.globalCompositeOperation='screen';
          const rg=ctx.createRadialGradient(12*scale,yy,0,12*scale,yy,15*scale);
          rg.addColorStop(0,'rgba(255,255,255,.9)'); rg.addColorStop(.25,'rgba(144,216,255,.65)'); rg.addColorStop(1,'rgba(144,120,255,0)');
          ctx.globalAlpha=.75*alpha; ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(12*scale,yy,15*scale,0,TAU); ctx.fill();
          ctx.globalAlpha=.55*alpha; ctx.strokeStyle='#e9f7ff'; ctx.lineWidth=1.2*scale;
          for(let j=0;j<3;j++){ const aa=q*4+j*TAU/3; ctx.beginPath(); ctx.arc(12*scale+Math.cos(aa)*9*scale,yy+Math.sin(aa)*5*scale,1.2*scale,0,TAU);ctx.stroke(); }
        }
        ctx.restore();
      }
    },
    tower(ctx, type, tier, x, y, scale, t, st) {
      const d = ArtTowers[type], [w, h, ox, oy] = d.box;
      if (window.Sprites && Sprites.tower(ctx,type,tier,x,y,scale,t,st)) return;
      // Bóng kiến trúc + vòng ma thuật làm chân trụ có trọng lượng hơn.
      ctx.save(); ctx.globalAlpha=.25; ctx.fillStyle='#21162c'; ctx.beginPath(); ctx.ellipse(x,y+4*scale,38*scale,11*scale,0,0,TAU); ctx.fill();
      if (type === 'mage') {
        ctx.globalAlpha=.42; ctx.strokeStyle='rgba(170,205,255,.75)'; ctx.lineWidth=Math.max(1,1.25*scale);
        ctx.beginPath(); ctx.ellipse(x,y+1*scale,31*scale,9*scale,0,0,TAU); ctx.stroke();
        ctx.globalAlpha=.24; ctx.setLineDash([4*scale,5*scale]); ctx.lineDashOffset=-t*12*scale;
        ctx.beginPath(); ctx.ellipse(x,y+1*scale,25*scale,7*scale,0,0,TAU); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
      // V5: tower monumental hơn nhưng vẫn neo chân tại cùng tọa độ logic.
      const ts = scale * 1.22;
      ctx.drawImage(towerStatic(type, tier, bucket(ts * this.res)), x - ox * ts, y - oy * ts, w * ts, h * ts);
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
      const g = canvas.getContext('2d'), d = ArtTowers[type], [w, h, ox, oy] = d.box;
      g.clearRect(0, 0, canvas.width, canvas.height);
      const s = Math.min(canvas.width / (w * (fit || 0.82)), canvas.height / (h * (fit || 0.82) * 0.9));
      this.tower(g, type, tier, canvas.width / 2, canvas.height - (h - oy) * s * 0.85, s, 0.5, { a: -1, face: 1 });
    },
    charPortrait(canvas, type, opts) {
      opts = opts || {};
      const g = canvas.getContext('2d'), d = ArtChars[type], [w, h, ox, oy] = d.box;
      g.clearRect(0, 0, canvas.width, canvas.height);
      const z = opts.zoom || 1, s = opts.head ? canvas.width / 44 * z / 2 : Math.min(canvas.width / w, canvas.height / h) * z;
      if (opts.head) { this.char(g, type, canvas.width / 2 - 3 * s, canvas.height * 0.56 + 33 * s, s, 1, 'idle', 0.4, s); return; }
      this.char(g, type, canvas.width / 2 + (w / 2 - ox) * s * 0.6, canvas.height / 2 + (oy - h / 2) * s, s, 1, 'idle', 0.4, s);
    }
  };
  window.Painter = Painter;
})();
