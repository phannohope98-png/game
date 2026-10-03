/* =========================================================
 * combat.js – Công thức sát thương & đạn bay
 * Sát thương cuối = Sát thương × Hệ số kỹ năng (× Chí mạng) − Giáp
 * Tối thiểu = CONFIG.combat.minDamage
 * ========================================================= */
(function () {
  const PROJECTILE = {
    arrow:  { speed: 680, color: '#f5e6c8', size: 3 },
    magic:  { speed: 430, color: '#c77dff', size: 9 },
    meteor: { speed: 900, color: '#ff7b2e', size: 16 }
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

    /** Gây sát thương lên quái, hiện số, xử lý chết */
    damageEnemy(e, base, mult) {
      if (!e.alive) return 0;
      const r = this.calc(base, mult, e.armor);
      e.hp -= r.amount; e.hitFlash = 0.1;
      Effects.text(e.x, e.y - e.radius - 6, (r.crit ? '💥' : '') + r.amount, r.crit ? '#ffd23f' : '#ffffff', r.crit ? 24 : 18, r.crit);
      if (e.hp <= 0) Game.killEnemy(e);
      return r.amount;
    },

    /** Gây sát thương lên lính */
    damageUnit(u, base) {
      if (!u.alive) return;
      const r = this.calc(base, 1, u.armor);
      u.hp -= r.amount; u.hitFlash = 0.1;
      Effects.text(u.x, u.y - u.radius - 6, '-' + r.amount, '#ff7a6b', 16, r.crit);
      if (u.hp <= 0) Units.kill(u);
    },

    /** Sát thương diện rộng */
    aoe(x, y, radius, base, mult, slow) {
      const list = Enemies.list;
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (!e.alive) continue;
        if (Math.hypot(e.x - x, e.y - y) <= radius + e.radius) {
          if (slow) e.applySlow(slow.factor, slow.duration);
          this.damageEnemy(e, base, mult);
        }
      }
    },

    clear() { while (this.projectiles.length) this.pool.push(this.projectiles.pop()); },

    /**
     * Bắn đạn. target: quái (đạn đuổi theo) hoặc null + toạ độ tx, ty.
     * opts: { damage, mult, aoe, kind }
     */
    fire(kind, x, y, target, tx, ty, damage, mult, aoe) {
      const p = this.pool.pop() || {};
      const def = PROJECTILE[kind];
      p.kind = kind; p.def = def; p.x = x; p.y = y;
      p.target = target; p.targetUid = target ? target.uid : -1;
      p.tx = target ? target.x : tx; p.ty = target ? target.y : ty;
      p.damage = damage; p.mult = mult || 1; p.aoe = aoe || 0;
      p.angle = Math.atan2(p.ty - y, p.tx - x); p.trail = 0;
      this.projectiles.push(p);
      return p;
    },

    update(dt) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        // Đạn đuổi mục tiêu nếu mục tiêu còn sống (so uid vì quái được tái sử dụng)
        if (p.target && p.target.alive && p.target.uid === p.targetUid) { p.tx = p.target.x; p.ty = p.target.y; }
        const dx = p.tx - p.x, dy = p.ty - p.y, dist = Math.hypot(dx, dy), step = p.def.speed * dt;
        p.angle = Math.atan2(dy, dx);
        if (dist <= step + 6) {
          this.impact(p);
          this.pool.push(p); swapRemove(this.projectiles, i);
          continue;
        }
        p.x += dx / dist * step; p.y += dy / dist * step;
        if (p.kind !== 'arrow') {
          p.trail -= dt;
          if (p.trail <= 0) { p.trail = 0.03; Effects.particle(p.x, p.y, 0, 0, 0.3, p.def.color, p.def.size * 0.7); }
        }
      }
    },

    impact(p) {
      if (p.aoe > 0) {
        this.aoe(p.tx, p.ty, p.aoe, p.damage, p.mult);
        if (p.kind === 'meteor') {
          Effects.explosion(p.tx, p.ty, p.aoe, '#ff7b2e'); Effects.shake(8, 0.25); AudioSys.play('explode');
        } else {
          Effects.ring(p.tx, p.ty, 6, p.aoe, 0.3, '#c77dff', 4);
          Effects.burst(p.tx, p.ty, '#d9a6ff', 10, 160, 0.35, 5);
        }
      } else {
        const t = p.target;
        if (t && t.alive && t.uid === p.targetUid) {
          this.damageEnemy(t, p.damage, p.mult);
          Effects.hit(p.tx, p.ty, '#f5e6c8');
        }
      }
    },

    draw(ctx) {
      for (let i = 0; i < this.projectiles.length; i++) {
        const p = this.projectiles[i];
        if (p.kind === 'arrow') {
          const c = Math.cos(p.angle), s = Math.sin(p.angle);
          ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(p.x - c * 18, p.y - s * 18); ctx.lineTo(p.x, p.y); ctx.stroke();
          ctx.fillStyle = '#e8e8e8';
          ctx.beginPath(); ctx.moveTo(p.x + c * 6, p.y + s * 6); ctx.lineTo(p.x - s * 4, p.y + c * 4); ctx.lineTo(p.x + s * 4, p.y - c * 4); ctx.fill();
        } else {
          ctx.fillStyle = p.def.color; ctx.globalAlpha = 0.35;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.def.size * 1.9, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.def.size, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.def.size * 0.45, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  };

  window.Combat = Combat;
})();
