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
      this.scale = def.radius / ArtChars[type].dr; this.height = ArtChars[type].box[3] * this.scale * 0.8; this.walk = Math.random();
      this.map = map; this.dist = startDist || 0;
      this.lateral = (Math.random() - 0.5) * 22;
      this.alive = true; this.state = 'walk';
      this.attackCd = 0.5; this.hitFlash = 0; this.slow = 0; this.slowTimer = 0;
      this.anim = Math.random() * 10; this.attackAnim = -1; this.face = 1;
      this.skillCd = def.skill ? def.skill.cooldown : 0;
      this.place();
      return this;
    }

    place() {
      const p = this.map.path.pointAt(this.dist, tmp);
      // Khi đứng ở cổng, dàn quái theo hàng ngang để không chồng lên nhau
      const lat = this.dist >= this.map.path.length ? this.lateral * 6 : this.lateral;
      this.x = p.x + p.nx * lat; this.y = p.y + p.ny * lat;
      if (Math.abs(p.tx) > 0.5) this.face = p.tx > 0 ? 1 : -1;
    }

    applySlow(amount, duration) {
      this.slow = Math.max(this.slow, amount);
      this.slowTimer = Math.max(this.slowTimer, duration);
    }

    update(dt, game) {
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.attackAnim >= 0) { this.attackAnim += dt / Math.min(0.5, this.attackSpeed * 0.6); if (this.attackAnim >= 1) this.attackAnim = -1; }
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
          Effects.ring(this.x, this.y, 10, 90, 0.5, '#9e2b25', 6);
          Effects.text(this.x, this.y - 70, 'Triệu hồi!', '#e88a7a', 22);
        }
      }

      // 1) Có lính chắn đường? → đánh lính
      const atEnd = this.dist >= this.map.path.length;
      const units = Units.list;
      let blocker = null;
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        if (!u.active || u.alpha < 0.5) continue;
        const r = this.radius + u.radius + 4;
        const dx = u.x - this.x, dy = u.y - this.y;
        if (dx * dx + dy * dy < r * r) { blocker = u; break; }
      }
      if (blocker) {
        this.state = 'fight';
        this.face = blocker.x >= this.x ? 1 : -1;
        if (this.attackCd <= 0) {
          this.attackCd = this.attackSpeed; this.attackAnim = 0;
          Combat.damageUnit(blocker, this.damage);
          Effects.hit(blocker.x, blocker.y - blocker.radius, '#ff9a8a');
        }
        return;
      }

      // 2) Tới cổng → đánh cổng
      if (atEnd) {
        this.state = 'gate';
        if (this.attackCd <= 0) {
          this.attackCd = this.attackSpeed; this.attackAnim = 0;
          game.gate.takeDamage(this.damage);
        }
        return;
      }

      // 3) Đi tiếp theo đường
      this.state = 'walk';
      const step = this.speed * (1 - this.slow) * dt;
      this.dist = Math.min(this.map.path.length, this.dist + step);
      this.walk += step / (this.radius * 2.6);
      this.place();
    }

    get drawY() { return this.y; }
    draw(ctx, time) {
      const fy = this.y + this.radius * 0.55;
      if (this.isBoss) ArtKit.glow(ctx, this.x, fy - this.height * 0.5, this.radius * 3, '#c01e3a', 0.35 + Math.sin(this.anim * 4) * 0.1);
      const img = Sprites.image(this.def.sprite);
      if (img) Sprites.draw(ctx, img, this.x, this.y, this.size * 1.3, this.face < 0);
      else if (this.attackAnim >= 0) Painter.char(ctx, this.type, this.x, fy, this.scale, this.face, 'atk', this.attackAnim);
      else if (this.state === 'walk') Painter.char(ctx, this.type, this.x, fy, this.scale, this.face, 'walk', this.walk);
      else Painter.char(ctx, this.type, this.x, fy, this.scale, this.face, 'idle', this.anim);
      if (this.hitFlash > 0) ArtKit.glow(ctx, this.x, fy - this.height * 0.45, this.radius * 1.7, '#ffffff', this.hitFlash * 5);
      if (this.slow > 0) {
        ctx.strokeStyle = 'rgba(160,220,255,0.9)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(this.x, fy, this.radius * 1.1, this.radius * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
        ArtKit.glow(ctx, this.x, fy - this.height * 0.4, this.radius * 1.6, '#9fe3ff', 0.35);
      }
    }
    drawBar(ctx) {
      if (this.hp >= this.maxHp || this.isBoss) return;
      drawHpBar(ctx, this.x, this.y + this.radius * 0.55 - this.height - 8, Math.max(26, this.radius * 2.2), this.hp / this.maxHp, '#e0483a');
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
