/* =========================================================
 * combat.js – Công thức sát thương & đạn bay
 * Sát thương cuối = Sát thương × Hệ số (× Chí mạng) − Giáp
 * Sát thương phép (Trụ Phù thủy) bỏ qua giáp.
 * ========================================================= */
(function () {
  const K = ArtKit;
  const PROJECTILE = {
    arrow:  { speed: 620, arc: 0.22 },
    magic:  { speed: 380, arc: 0 },
    meteor: { speed: 900, arc: 0 }
  };

  const Combat = {
    projectiles: [], pool: [],

    calc(base, mult, armor) {
      const C = CONFIG.combat;
      const crit = Math.random() < C.critChance;
      let dmg = base * mult * (crit ? C.critMultiplier : 1) - (armor || 0);
      dmg = Math.max(C.minDamage, Math.round(dmg));
      return { amount: dmg, crit };
    },

    damageEnemy(e, base, mult, magic) {
      if (!e.alive) return 0;
      const r = this.calc(base, mult || 1, magic ? 0 : e.armor);
      e.hp -= r.amount; e.hitFlash = 0.12;
      Effects.text(e.x, e.y - e.height * 0.9, r.crit ? r.amount + '!' : '' + r.amount, magic ? '#e3b9ff' : r.crit ? '#f3c25a' : '#f3ece0', r.crit ? 22 : 16, r.crit);
      if (e.hp <= 0) Game.killEnemy(e);
      return r.amount;
    },

    damageUnit(u, base) {
      if (!u.active) return;
      const r = this.calc(base, 1, u.armor);
      u.hp -= r.amount; u.hitFlash = 0.12;
      Effects.text(u.x, u.y - u.radius * 2.6, '-' + r.amount, '#ff7a6b', 14, r.crit);
      if (u.hp <= 0) Units.kill(u);
    },

    aoe(x, y, radius, base, mult, slow, magic) {
      const list = Enemies.list;
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (!e.alive) continue;
        if (Math.hypot(e.x - x, e.y - y) <= radius + e.radius) {
          if (slow) e.applySlow(slow.factor, slow.duration);
          this.damageEnemy(e, base, mult, magic);
        }
      }
    },

    clear() { while (this.projectiles.length) this.pool.push(this.projectiles.pop()); },

    fire(kind, x, y, target, tx, ty, damage, mult, aoe, magic) {
      const p = this.pool.pop() || {};
      const def = PROJECTILE[kind];
      p.kind = kind; p.def = def; p.x = p.sx = x; p.y = p.sy = y;
      p.target = target; p.targetUid = target ? target.uid : -1;
      p.tx = target ? target.x : tx; p.ty = target ? target.y - target.height * 0.45 : ty;
      p.damage = damage; p.mult = mult || 1; p.aoe = aoe || 0; p.magic = !!magic;
      p.angle = Math.atan2(p.ty - y, p.tx - x); p.trail = 0; p.k = 0; p.age = 0;
      p.dur = Math.max(0.12, Math.hypot(p.tx - x, p.ty - y) / def.speed);
      this.projectiles.push(p);
      return p;
    },

    update(dt) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.age += dt;
        if (p.target && p.target.alive && p.target.uid === p.targetUid) { p.tx = p.target.x; p.ty = p.target.y - p.target.height * 0.45; }
        if (p.kind === 'arrow') {
          // đường cong parabol tới mục tiêu
          p.k = Math.min(1, p.k + dt / p.dur);
          const dist = Math.hypot(p.tx - p.sx, p.ty - p.sy), h = dist * p.def.arc;
          const nx = p.sx + (p.tx - p.sx) * p.k, ny = p.sy + (p.ty - p.sy) * p.k - h * 4 * p.k * (1 - p.k);
          p.angle = Math.atan2(ny - p.y, nx - p.x); p.x = nx; p.y = ny;
          if (p.k >= 1) { this.impact(p); this.pool.push(p); swapRemove(this.projectiles, i); }
          continue;
        }
        const dx = p.tx - p.x, dy = p.ty - p.y, dist = Math.hypot(dx, dy), step = p.def.speed * dt;
        p.angle = Math.atan2(dy, dx);
        if (dist <= step + 6) { this.impact(p); this.pool.push(p); swapRemove(this.projectiles, i); continue; }
        p.x += dx / dist * step; p.y += dy / dist * step;
        p.trail -= dt;
        if (p.trail <= 0) {
          p.trail = 0.025;
          if (p.kind === 'magic') Effects.particle(p.x + (Math.random() - 0.5) * 6, p.y + (Math.random() - 0.5) * 6, 0, -20, 0.35, Math.random() < 0.5 ? '#c77dff' : '#f0d0ff', 5);
          else Effects.particle(p.x, p.y, (Math.random() - 0.5) * 40, -30, 0.4, Math.random() < 0.5 ? '#ff7b2e' : '#ffd23f', 9);
        }
      }
    },

    impact(p) {
      if (p.aoe > 0) {
        this.aoe(p.tx, p.ty, p.aoe, p.damage, p.mult, null, p.magic);
        if (p.kind === 'meteor') {
          Effects.explosion(p.tx, p.ty, p.aoe, '#ff7b2e'); Effects.shake(8, 0.25); AudioSys.play('explode');
        } else {
          Effects.flash(p.tx, p.ty, p.aoe * 1.2, '#c77dff');
          Effects.ring(p.tx, p.ty, 6, p.aoe, 0.35, '#d9a6ff', 4);
          Effects.burst(p.tx, p.ty, '#e3b9ff', 14, 170, 0.45, 5);
        }
      } else {
        const t = p.target;
        if (t && t.alive && t.uid === p.targetUid) {
          this.damageEnemy(t, p.damage, p.mult, p.magic);
          Effects.hit(p.tx, p.ty, '#f5e6c8');
        }
      }
    },

    draw(ctx) {
      for (let i = 0; i < this.projectiles.length; i++) {
        const p = this.projectiles[i];
        if (p.kind === 'arrow') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
          ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(-12, 0); ctx.stroke();
          K.line(ctx, -14, 0, 6, 0, '#3a2414', 3.2); K.line(ctx, -14, 0, 6, 0, '#c99a5a', 1.6);
          K.flat(ctx, [4, -3.2, 11, 0, 4, 3.2], '#e8ecf0');
          K.flat(ctx, [-15, 0, -19, -4, -12, -1], '#7fd27a'); K.flat(ctx, [-15, 0, -19, 4, -12, 1], '#5fb058');
          ctx.restore();
        } else if (p.kind === 'magic') {
          K.glow(ctx, p.x, p.y, 22, '#c77dff', 0.9);
          K.circ(ctx, p.x, p.y, 6, '#d9a6ff', { hi: 0.7, lo: -0.1, lw: 0 });
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.age * 9);
          ctx.strokeStyle = 'rgba(255,240,255,0.85)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
          K.dot(ctx, p.x - 1.5, p.y - 1.5, 2, '#fff');
        } else {
          K.glow(ctx, p.x, p.y, 44, '#ff7b2e', 0.9);
          K.circ(ctx, p.x, p.y, 13, '#ff9a3a', { hi: 0.7, lo: -0.3, lw: 0 });
          K.dot(ctx, p.x - 3, p.y - 3, 5, '#fff3c4');
        }
      }
    }
  };

  window.Combat = Combat;
})();
