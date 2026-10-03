/* =========================================================
 * enemies.js – Quái vật & AI
 * AI: Xuất hiện → đi theo đường → gặp lính thì đánh lính
 *     → lính chết thì đi tiếp → tới cổng thì đánh cổng.
 * Quái không đi xuyên qua lính.
 * ========================================================= */
(function () {
  let uidCounter = 0;
  const tmp = {};

  class Enemy {
    reset(type, hpMul, startDist, map) {
      const def = CONFIG.enemies[type];
      this.uid = ++uidCounter;
      this.type = type; this.def = def; this.name = def.name;
      this.maxHp = Math.round(def.hp * hpMul); this.hp = this.maxHp;
      this.damage = def.damage; this.speed = def.speed; this.armor = def.armor || 0;
      this.attackSpeed = def.attackSpeed || 1; this.reward = def.reward; this.exp = def.exp;
      this.radius = def.radius; this.size = def.size; this.isBoss = !!def.isBoss;
      this.map = map; this.dist = startDist || 0;
      this.lateral = (Math.random() - 0.5) * 22;
      this.alive = true; this.state = 'walk';
      this.attackCd = 0.5; this.hitFlash = 0; this.slow = 0; this.slowTimer = 0;
      this.anim = Math.random() * 10; this.attackAnim = 0;
      this.skillCd = def.skill ? def.skill.cooldown : 0;
      this.place();
      return this;
    }

    place() {
      const p = this.map.path.pointAt(this.dist, tmp);
      // Khi đứng ở cổng, dàn quái theo hàng ngang để không chồng lên nhau
      const lat = this.dist >= this.map.path.length ? this.lateral * 6 : this.lateral;
      this.x = p.x + p.nx * lat; this.y = p.y + p.ny * lat;
    }

    applySlow(amount, duration) {
      this.slow = Math.max(this.slow, amount);
      this.slowTimer = Math.max(this.slowTimer, duration);
    }

    update(dt, game) {
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.attackAnim > 0) this.attackAnim -= dt;
      if (this.slowTimer > 0) { this.slowTimer -= dt; if (this.slowTimer <= 0) this.slow = 0; }
      this.attackCd -= dt;
      this.anim += dt * (1 - this.slow);

      // Kỹ năng riêng của Boss: triệu hồi lính
      if (this.def.skill && this.def.skill.type === 'summon') {
        this.skillCd -= dt;
        if (this.skillCd <= 0) {
          this.skillCd = this.def.skill.cooldown;
          for (let i = 0; i < this.def.skill.count; i++) {
            Enemies.spawn(this.def.skill.enemy, game.stage.hpMul, Math.max(0, this.dist - 30 - i * 18));
          }
          Effects.ring(this.x, this.y, 10, 90, 0.5, '#b14dff', 6);
          Effects.text(this.x, this.y - 60, 'Triệu hồi!', '#e0a6ff', 22);
        }
      }

      // 1) Có lính chắn đường? → đánh lính
      const atEnd = this.dist >= this.map.path.length;
      const units = Units.list;
      let blocker = null;
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        if (!u.alive) continue;
        const r = this.radius + u.radius + 4;
        const dx = u.x - this.x, dy = u.y - this.y;
        if (dx * dx + dy * dy < r * r) { blocker = u; break; }
      }
      if (blocker) {
        this.state = 'fight';
        if (this.attackCd <= 0) {
          this.attackCd = this.attackSpeed; this.attackAnim = 0.15;
          Combat.damageUnit(blocker, this.damage);
          Effects.hit(blocker.x, blocker.y, '#ff9a8a');
        }
        return;
      }

      // 2) Tới cổng → đánh cổng
      if (atEnd) {
        this.state = 'gate';
        if (this.attackCd <= 0) {
          this.attackCd = this.attackSpeed; this.attackAnim = 0.15;
          game.gate.takeDamage(this.damage);
        }
        return;
      }

      // 3) Đi tiếp theo đường
      this.state = 'walk';
      this.dist = Math.min(this.map.path.length, this.dist + this.speed * (1 - this.slow) * dt);
      this.place();
    }

    draw(ctx) {
      const bob = this.state === 'walk' ? Math.sin(this.anim * 10) * 2 : 0;
      const lunge = this.attackAnim > 0 ? 4 : 0;
      const x = this.x, y = this.y + bob + lunge;
      // bóng
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.ellipse(this.x, this.y + this.radius * 0.8, this.radius, this.radius * 0.35, 0, 0, Math.PI * 2); ctx.fill();
      // hào quang boss
      if (this.isBoss) {
        ctx.fillStyle = 'rgba(177,77,255,0.25)';
        ctx.beginPath(); ctx.arc(x, y, this.radius + 10 + Math.sin(this.anim * 4) * 4, 0, Math.PI * 2); ctx.fill();
      }
      Sprites.draw(ctx, this.def.sprite, x, y, this.size);
      if (this.hitFlash > 0) {
        ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x, y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      if (this.slow > 0) {
        ctx.strokeStyle = 'rgba(140,210,255,0.9)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, this.radius + 3, 0, Math.PI * 2); ctx.stroke();
      }
      // thanh máu
      if (this.hp < this.maxHp && !this.isBoss) {
        const w = this.radius * 2.2, hx = this.x - w / 2, hy = this.y - this.radius - 12;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(hx - 1, hy - 1, w + 2, 6);
        ctx.fillStyle = '#e6533c'; ctx.fillRect(hx, hy, w * Math.max(0, this.hp / this.maxHp), 4);
      }
    }
  }

  const Enemies = {
    list: [], pool: [], map: null,

    init(map) { this.map = map; this.clear(); },
    clear() { while (this.list.length) this.pool.push(this.list.pop()); },

    spawn(type, hpMul, startDist) {
      if (!CONFIG.enemies[type]) { console.warn('Không có loại quái:', type); return null; }
      const e = (this.pool.pop() || new Enemy()).reset(type, hpMul, startDist || 0, this.map);
      this.list.push(e);
      if (e.isBoss) Game.onBossSpawn(e);
      return e;
    },

    update(dt, game) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const e = this.list[i];
        if (e.alive) e.update(dt, game);
        if (!e.alive) { this.pool.push(e); swapRemove(this.list, i); }
      }
    },

    boss() { for (const e of this.list) if (e.isBoss && e.alive) return e; return null; },

    draw(ctx) { for (let i = 0; i < this.list.length; i++) this.list[i].draw(ctx); }
  };

  window.Enemy = Enemy;
  window.Enemies = Enemies;
})();
