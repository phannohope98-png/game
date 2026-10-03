/* =========================================================
 * enemies.js – Quái vật
 * Đi theo đường → gặp lính thì đứng lại đánh → tới lối ra thì trừ mạng.
 * Quân bay bỏ qua lính. Cung thủ Orc bắn lính trong tầm.
 * Vua Troll đập đất làm choáng lính.
 * ========================================================= */
(function () {
  let uid = 0; const tmp = {};
  class Enemy {
    constructor(type, pathIndex, hpMul) {
      const d = CONFIG.enemies[type], art = ArtChars[type];
      this.uid = ++uid; this.type = type; this.def = d; this.name = d.name;
      this.maxHp = Math.round(d.hp * (hpMul || 1)); this.hp = this.maxHp;
      this.armor = d.armor; this.mres = d.mres; this.speed = d.speed; this.radius = d.radius;
      this.flying = !!d.flying; this.boss = !!d.boss; this.reward = d.reward;
      this.scale = d.radius / art.dr; this.height = art.box[3] * this.scale * 0.78 + (this.flying ? 18 : 0);
      this.path = Game.map.paths[pathIndex]; this.dist = 0; this.lat = (Math.random() - 0.5) * 26;
      this.alive = true; this.state = 'walk'; this.cd = 0.4; this.atk = -1; this.flash = 0; this.slow = 0;
      this.walk = Math.random(); this.anim = Math.random() * 3; this.face = 1; this.slamT = d.slam ? d.slam.every : 0; this.shootCd = 1;
      this.place();
    }
    place() {
      const p = this.path.pointAt(this.dist, tmp);
      this.x = p.x + p.nx * this.lat; this.y = p.y + p.ny * this.lat;
      if (Math.abs(p.tx) > 0.25) this.face = p.tx > 0 ? 1 : -1;
    }
    /** Vị trí sau t giây (để pháo bắn đón đầu) */
    predict(t) { if (this.state !== 'walk') return { x: this.x, y: this.y }; const p = this.path.pointAt(this.dist + this.speed * t, {}); return { x: p.x + p.nx * this.lat, y: p.y + p.ny * this.lat }; }

    update(dt) {
      if (this.flash > 0) this.flash -= dt;
      this.anim += dt;
      if (this.def.regen && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + this.def.regen * dt);
      if (this.atk >= 0) { this.atk += dt / 0.5; if (this.atk >= 1) this.atk = -1; }
      this.cd -= dt;

      // Trùm đập đất
      if (this.def.slam) {
        this.slamT -= dt;
        if (this.slamT <= 0) {
          this.slamT = this.def.slam.every; this.atk = 0;
          const s = this.def.slam; let n = 0;
          for (const u of Units.list) if (u.active && Math.hypot(u.x - this.x, u.y - this.y) < s.radius) { Combat.hitUnit(u, s.damage); u.stun = 2; n++; }
          Effects.ring(this.x, this.y, 10, s.radius, 0.5, '#d8c8a8', 8); Effects.shake(10, 0.4); AudioSys.play('explode');
        }
      }

      // Bị chặn bởi lính?
      if (!this.flying) {
        let blocker = null;
        for (const u of Units.list) {
          if (!u.active || u.alpha < 0.5) continue;
          const r = this.radius + u.radius + 3;
          if (Math.abs(u.x - this.x) < r && Math.abs(u.y - this.y) < r && Math.hypot(u.x - this.x, u.y - this.y) < r) { blocker = u; break; }
        }
        if (blocker) {
          this.state = 'fight'; this.face = blocker.x >= this.x ? 1 : -1;
          if (this.cd <= 0) { this.cd = this.def.rate; this.atk = 0; Combat.hitUnit(blocker, this.def.damage); Effects.hit(blocker.x, blocker.y - 14, '#ffb0a0'); }
          return;
        }
      }
      // Cung thủ: bắn lính trong tầm khi đang đi
      if (this.def.ranged) {
        this.shootCd -= dt;
        if (this.shootCd <= 0) {
          let best = null, bd = this.def.ranged;
          for (const u of Units.list) { if (!u.active) continue; const d = Math.hypot(u.x - this.x, u.y - this.y); if (d < bd) { bd = d; best = u; } }
          if (best) { this.shootCd = this.def.rate * 1.4; this.atk = 0; Combat.fire('enemyArrow', this.x, this.y - this.height * 0.6, best, { damage: this.def.damage }); }
          else this.shootCd = 0.3;
        }
      }
      this.state = 'walk';
      const step = this.speed * dt;
      this.dist += step; this.walk += step / (this.radius * 2.8);
      if (this.dist >= this.path.length) { Game.enemyEscaped(this); return; }
      this.place();
    }

    get drawY() { return this.y; }
    draw(ctx) {
      const fy = this.y + this.radius * 0.5;
      if (this.boss) ArtKit.glow(ctx, this.x, fy - this.height * 0.5, this.radius * 3.2, '#c01e3a', 0.3 + Math.sin(this.anim * 4) * 0.08);
      const mode = this.atk >= 0 ? 'atk' : this.state === 'walk' ? 'walk' : 'idle';
      Painter.char(ctx, this.type, this.x, fy, this.scale, this.face, mode, mode === 'atk' ? this.atk : mode === 'walk' ? this.walk : this.anim);
      if (this.flash > 0) ArtKit.glow(ctx, this.x, fy - this.height * 0.45, this.radius * 1.6, '#ffffff', this.flash * 6);
    }
    drawBar(ctx) {
      if (this.boss || this.hp >= this.maxHp) return;
      hpBar(ctx, this.x, this.y + this.radius * 0.5 - this.height - 10, Math.max(24, this.radius * 2), this.hp / this.maxHp, '#e8463a');
    }
  }

  function hpBar(ctx, cx, y, w, r, col) {
    const x = cx - w / 2, h = 5;
    ctx.fillStyle = '#1d1220'; ctx.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
    ctx.fillStyle = '#4a1e24'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = col; ctx.fillRect(x, y, Math.max(0, w * r), h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y, Math.max(0, w * r), 1.6);
  }

  const Enemies = {
    list: [],
    clear() { this.list.length = 0; },
    spawn(type, pathIndex, hpMul) { const e = new Enemy(type, pathIndex, hpMul); this.list.push(e); if (e.boss) Game.onBoss(e); return e; },
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) { const e = this.list[i]; if (e.alive) e.update(dt); if (!e.alive) this.list.splice(i, 1); }
    },
    boss() { return this.list.find(e => e.boss && e.alive) || null; }
  };
  window.Enemies = Enemies; window.hpBar = hpBar;
})();
