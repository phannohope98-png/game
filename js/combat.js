/* =========================================================
 * combat.js – Sát thương & đạn bay
 * physical: giảm theo giáp; magic: giảm theo kháng phép.
 * ========================================================= */
(function () {
  const K = ArtKit, rand = (a, b) => a + Math.random() * (b - a);
  const Combat = {
    shots: [], pool: [],
    roll(dmg) { return Array.isArray(dmg) ? rand(dmg[0], dmg[1]) : dmg; },
    hitEnemy(e, dmg, type) {
      if (!e.alive) return 0;
      const red = type === 'magic' ? e.mres : type === 'true' ? 0 : e.armor;
      const amt = Math.max(1, Math.round(this.roll(dmg) * (1 - red)));
      e.hp -= amt; e.flash = 0.1;
      if (e.hp <= 0) Game.killEnemy(e);
      return amt;
    },
    hitUnit(u, dmg) {
      if (!u.active) return;
      const amt = Math.max(1, Math.round(this.roll(dmg) * (1 - u.armor)));
      u.hp -= amt; u.flash = 0.1;
      if (u.hp <= 0) Units.kill(u);
    },
    splash(x, y, r, dmg, type, opts) {
      for (const e of Enemies.list) {
        if (!e.alive || (e.flying && !(opts && opts.air))) continue;
        const d = Math.hypot(e.x - x, (e.y - y) * 1.25);
        if (d <= r + e.radius) this.hitEnemy(e, Array.isArray(dmg) ? [dmg[0] * (d < r * 0.5 ? 1 : 0.6), dmg[1] * (d < r * 0.5 ? 1 : 0.6)] : dmg, type);
      }
    },
    clear() { while (this.shots.length) this.pool.push(this.shots.pop()); },

    /** kind: arrow | bolt | bomb | enemyArrow ; target: quái (hoặc lính với enemyArrow) */
    fire(kind, x, y, target, o) {
      const p = this.pool.pop() || {};
      p.kind = kind; p.sx = p.x = x; p.sy = p.y = y; p.target = target; p.uid = target.uid;
      p.o = o; p.k = 0; p.age = 0; p.trail = 0;
      const tx = target.x, ty = target.y - (target.height || 20) * 0.5;
      if (kind === 'bomb') {
        // dự đoán vị trí quái khi đạn rơi
        p.dur = 0.95; const fut = target.predict ? target.predict(p.dur) : target;
        p.tx = fut.x; p.ty = fut.y;
      } else { p.tx = tx; p.ty = ty; p.dur = Math.max(0.12, Math.hypot(tx - x, ty - y) / (kind === 'bolt' ? 420 : 640)); }
      p.angle = 0;
      this.shots.push(p); return p;
    },

    update(dt) {
      for (let i = this.shots.length - 1; i >= 0; i--) {
        const p = this.shots[i]; p.age += dt;
        const t = p.target, alive = t && (t.alive || t.active) && t.uid === p.uid;
        if (alive && p.kind !== 'bomb') { p.tx = t.x; p.ty = t.y - (t.height || 20) * 0.5; }
        p.k = Math.min(1, p.k + dt / p.dur);
        const arc = p.kind === 'bomb' ? 160 : p.kind === 'bolt' ? 0 : Math.hypot(p.tx - p.sx, p.ty - p.sy) * 0.22;
        const nx = p.sx + (p.tx - p.sx) * p.k, ny = p.sy + (p.ty - p.sy) * p.k - arc * 4 * p.k * (1 - p.k);
        p.angle = Math.atan2(ny - p.y, nx - p.x); p.x = nx; p.y = ny;
        if (p.kind === 'bolt' || p.kind === 'bomb') {
          p.trail -= dt;
          if (p.trail <= 0) { p.trail = 0.03; Effects.particle(p.x, p.y, (Math.random() - 0.5) * 20, -20, 0.35, p.kind === 'bolt' ? (Math.random() < 0.5 ? '#a8d8ff' : '#e0c8ff') : '#c8c0b8', p.kind === 'bolt' ? 5 : 6); }
        }
        if (p.k >= 1) { this.impact(p, alive); this.pool.push(p); swapRemove(this.shots, i); }
      }
    },

    impact(p, alive) {
      const o = p.o;
      if (p.kind === 'bomb') {
        this.splash(p.tx, p.ty, o.aoe, o.damage, 'physical');
        Effects.explosion(p.tx, p.ty, o.aoe); Effects.shake(3, 0.15); AudioSys.play('explode');
        if (o.cluster) for (let k = 0; k < 3; k++) {
          const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 30, x = p.tx + Math.cos(a) * r, y = p.ty + Math.sin(a) * r * 0.7;
          setTimeout(() => { if (Game.state !== 'playing') return; this.splash(x, y, o.aoe * 0.55, [o.damage[0] * 0.4, o.damage[1] * 0.4], 'physical'); Effects.explosion(x, y, o.aoe * 0.55); }, 140 + k * 110);
        }
        return;
      }
      if (p.kind === 'enemyArrow') { if (alive) this.hitUnit(p.target, o.damage); return; }
      if (!alive) return;
      const e = p.target;
      this.hitEnemy(e, o.damage, o.type);
      if (p.kind === 'bolt') {
        Effects.flash(p.tx, p.ty, 26, '#9fd8ff'); Effects.burst(p.tx, p.ty, '#c8e8ff', 8, 120, 0.35, 4);
        if (o.chain) { // nảy sang quái gần
          let from = e; const hit = new Set([e.uid]);
          for (let c = 0; c < 2; c++) {
            let best = null, bd = 110;
            for (const q of Enemies.list) { if (!q.alive || hit.has(q.uid)) continue; const d = Math.hypot(q.x - from.x, q.y - from.y); if (d < bd) { bd = d; best = q; } }
            if (!best) break;
            hit.add(best.uid); Effects.lightning(from.x, from.y - from.height * 0.5, best.x, best.y - best.height * 0.5);
            this.hitEnemy(best, [o.damage[0] * 0.6, o.damage[1] * 0.6], 'magic'); from = best;
          }
        }
      } else {
        Effects.hit(p.tx, p.ty, o.pierce ? '#ffe58a' : '#fff4d0');
        if (o.pierce) Effects.flash(p.tx, p.ty, 22, '#ffd860');
      }
    },

    draw(ctx) {
      for (const p of this.shots) {
        if (p.kind === 'arrow' || p.kind === 'enemyArrow') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
          if (p.o.pierce) K.glow(ctx, 0, 0, 16, '#ffd860', 0.9);
          K.line(ctx, -12, 0, 5, 0, '#2a1810', 3.4); K.line(ctx, -12, 0, 5, 0, p.kind === 'enemyArrow' ? '#5a3a20' : '#d8b070', 1.8);
          K.flat(ctx, [4, -3, 10, 0, 4, 3], '#e8edf2');
          K.flat(ctx, [-12, 0, -16, -3.6, -9, -0.8], p.kind === 'enemyArrow' ? '#3a2a2a' : '#6ad06a'); K.flat(ctx, [-12, 0, -16, 3.6, -9, 0.8], p.kind === 'enemyArrow' ? '#2a1a1a' : '#4ab04a');
          ctx.restore();
        } else if (p.kind === 'bolt') {
          K.glow(ctx, p.x, p.y, 22, '#8fd0ff', 1);
          K.circ(ctx, p.x, p.y, 5.5, '#c8ecff', { s: 1.4, h: 1, lw: 1.6 });
          K.dot(ctx, p.x - 1.4, p.y - 1.4, 1.8, '#fff');
        } else if (p.kind === 'bomb') {
          K.shadow(ctx, p.sx + (p.tx - p.sx) * p.k, p.sy + (p.ty - p.sy) * p.k + 6, 8 * (0.5 + p.k * 0.5), 3, 0.3);
          K.circ(ctx, p.x, p.y, 7, '#3a3a44', { lw: 1.8 });
          K.dot(ctx, p.x + 3, p.y - 6, 2, Math.sin(p.age * 30) > 0 ? '#ffd040' : '#ff7020');
        }
      }
    }
  };
  window.Combat = Combat;
})();
