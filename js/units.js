/* =========================================================
 * units.js – Quân ta: lính doanh trại & anh hùng
 * Lính: ra 1 lần khi xây, chết thì hồi sinh tại trụ, rảnh thì tự hồi máu.
 * Anh hùng: chạm để chọn, chạm đường để di chuyển, có kỹ năng Thánh Quang.
 * ========================================================= */
(function () {
  const tmp = {}; let uid = 0;

  class Unit {
    constructor(o) {
      Object.assign(this, { uid: ++uid, face: 1, walk: 0, atk: -1, cd: 0.3, idleT: Math.random() * 3, flash: 0, stun: 0, alpha: 1,
        target: null, tUid: -1, scan: 0, moving: false, state: 'post', calm: 0 }, o);
    }
    get active() { return this.state === 'post' || this.state === 'move'; }
    get alive() { return this.active; }

    moveTo(gx, gy, dt) {
      const dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy);
      if (d < 1.5) { this.moving = false; return true; }
      const step = Math.min(d, this.speed * dt);
      this.x += dx / d * step; this.y += dy / d * step;
      if (Math.abs(dx) > 0.8) this.face = dx > 0 ? 1 : -1;
      this.moving = true; this.walk += step / 32;
      return d - step < 1.5;
    }

    update(dt) {
      if (this.flash > 0) this.flash -= dt;
      this.idleT += dt;
      if (this.state === 'dead') { this.respawnT -= dt; if (this.respawnT <= 0) this.respawn(); return; }
      if (this.alpha < 1) this.alpha = Math.min(1, this.alpha + dt * 3);
      if (this.stun > 0) { this.stun -= dt; this.moving = false; return; }
      if (this.isHero) Hero.tick(this, dt);

      // đòn đánh
      this.cd -= dt;
      if (this.atk >= 0) {
        const prev = this.atk; this.atk += dt / 0.4;
        const t = this.target;
        if (prev < 0.5 && this.atk >= 0.5 && t && t.alive && t.uid === this.tUid) { Combat.hitEnemy(t, this.damage, 'physical'); AudioSys.play('sword'); Effects.hit(t.x - this.face * 4, t.y - t.height * 0.5, '#fff2c0'); }
        if (this.atk >= 1) this.atk = -1;
      }
      // người chơi ra lệnh di chuyển (anh hùng / dời cờ) → bỏ mục tiêu
      if (this.state === 'move') {
        if (this.moveTo(this.postX, this.postY, dt)) this.state = 'post';
        return;
      }
      this.scan -= dt;
      const t = this.target;
      if (!t || !t.alive || t.uid !== this.tUid || this.scan <= 0) { this.scan = 0.25; this.pick(); }
      const e = this.target;
      if (e) {
        this.calm = 0;
        const dx = e.x - this.x, dy = e.y - this.y, d = Math.hypot(dx, dy), reach = e.radius + this.radius + 1;
        if (d > reach) { if (this.atk < 0) this.moveTo(e.x - dx / d * (reach - 1), e.y - dy / d * (reach - 1), dt); }
        else { this.moving = false; this.face = dx >= 0 ? 1 : -1; if (this.cd <= 0 && this.atk < 0) { this.atk = 0; this.cd = this.rate; } }
      } else {
        if (this.atk < 0) this.moveTo(this.postX, this.postY, dt);
        this.calm += dt;
        if (this.calm > 1.5 && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
      }
    }

    /** Chọn quái gần vị trí canh: ưu tiên con chưa ai chặn */
    pick() {
      const R = this.engage, cx = this.postX, cy = this.postY;
      let best = null, bs = Infinity;
      for (const e of Enemies.list) {
        if (!e.alive || e.flying) continue;
        if (Math.hypot(e.x - cx, e.y - cy) > R + e.radius) continue;
        let taken = 0; for (const u of Units.list) if (u !== this && u.active && u.tUid === e.uid) taken++;
        const sc = Math.hypot(e.x - this.x, e.y - this.y) + taken * 55 - e.dist * 0.02;
        if (sc < bs) { bs = sc; best = e; }
      }
      this.target = best; this.tUid = best ? best.uid : -1;
    }

    respawn() {
      this.hp = this.maxHp; this.state = 'post'; this.alpha = 0; this.target = null; this.atk = -1; this.stun = 0;
      if (this.isHero) { this.x = this.postX; this.y = this.postY; Effects.ring(this.x, this.y, 6, 50, 0.5, '#ffe58a', 5); }
      else { this.x = this.tower.x; this.y = this.tower.y + 12; this.tower.anim.door = 0.6; }
    }

    get drawY() { return this.y; }
    draw(ctx, time) {
      if (this.state === 'dead') return;
      const fy = this.y + this.radius * 0.5;
      ctx.globalAlpha = this.alpha;
      if (this.isHero) {
        ArtKit.shadow(ctx, this.x, fy, 22, 7, 0.25);
        ctx.strokeStyle = Game.heroSelected ? '#ffe58a' : 'rgba(255,229,138,0.55)'; ctx.lineWidth = Game.heroSelected ? 3 : 2;
        ctx.beginPath(); ctx.ellipse(this.x, fy, 20, 7.5, 0, 0, Math.PI * 2); ctx.stroke();
      }
      const mode = this.atk >= 0 ? 'atk' : this.moving ? 'walk' : 'idle';
      Painter.char(ctx, this.art, this.x, fy, this.scale, this.face, mode, mode === 'atk' ? this.atk : mode === 'walk' ? this.walk : this.idleT);
      if (this.flash > 0) ArtKit.glow(ctx, this.x, fy - 20, 22, '#ff4040', this.flash * 5);
      if (this.stun > 0) for (let i = 0; i < 3; i++) { const a = time * 5 + i * 2.1; ArtKit.dot(ctx, this.x + Math.cos(a) * 9, fy - 46 + Math.sin(a) * 3, 2, '#ffe58a'); }
      ctx.globalAlpha = 1;
    }
    drawBar(ctx) {
      if (this.state === 'dead' || this.hp >= this.maxHp) return;
      hpBar(ctx, this.x, this.y + this.radius * 0.5 - (this.isHero ? 62 : (this.barH || 48)), this.isHero ? 34 : 24, this.hp / this.maxHp, '#6ad04a');
    }
  }

  /* ---------------- Anh hùng ---------------- */
  const Hero = {
    create(map) {
      const H = CONFIG.hero, lv = Progress.heroLevel(), m = 1 + (lv - 1) * H.perLevel;
      const ex = map.exit, p = map.paths[0].pointAt(map.paths[0].length - 190, {});
      const u = new Unit({ isHero: true, art: H.art, radius: H.radius, scale: H.radius / ArtChars[H.art].dr, x: p.x, y: p.y, postX: p.x, postY: p.y,
        maxHp: Math.round(H.hp * m), hp: Math.round(H.hp * m), damage: [H.damage[0] * m, H.damage[1] * m], armor: H.armor, rate: H.attackRate,
        speed: H.speed, regen: H.regen, engage: 80, level: lv, skillCd: 0 });
      return u;
    },
    tick(u, dt) { if (u.skillCd > 0) u.skillCd -= dt; u.engage = u.state === 'post' ? 80 : 0; },
    moveHero(u, x, y) {
      if (u.state === 'dead') return;
      u.postX = x; u.postY = y; u.state = 'move'; u.target = null; u.tUid = -1; u.atk = -1;
      Effects.ring(x, y, 4, 26, 0.4, '#ffe58a', 3);
    },
    cast(u) {
      const S = CONFIG.hero.skill;
      if (u.state === 'dead' || u.skillCd > 0) return false;
      u.skillCd = S.cooldown; u.atk = 0;
      Effects.flash(u.x, u.y - 20, S.radius * 1.4, '#fff0a0'); Effects.ring(u.x, u.y, 10, S.radius, 0.6, '#ffe58a', 8);
      Effects.burst(u.x, u.y - 20, '#fff6c0', 28, 220, 0.7, 6, -40);
      Combat.splash(u.x, u.y, S.radius, S.damage * (1 + (u.level - 1) * CONFIG.hero.perLevel), 'magic', { air: true });
      for (const o of Units.list) if (o.active && Math.hypot(o.x - u.x, o.y - u.y) < S.radius * 1.4) { o.hp = Math.min(o.maxHp, o.hp + o.maxHp * S.heal); Effects.text(o.x, o.y - 50, '+', '#8aff6a', 22); }
      AudioSys.play('holy'); Effects.shake(6, 0.3);
      return true;
    }
  };

  const Units = {
    list: [], hero: null,
    clear() { this.list.length = 0; this.hero = null; },
    addHero(map) { this.hero = Hero.create(map); this.list.push(this.hero); return this.hero; },
    count(towerType) { let n = 0; for (const u of this.list) if (u.active && !u.isHero && (!towerType || u.tower.type === towerType)) n++; return n; },

    /** Doanh trại vừa xây: tạo lính 1 lần */
    createFor(T) {
      for (let i = 0; i < T.def.soldiers; i++) this.list.push(new Unit({ tower: T, idx: i, x: T.x, y: T.y + 12, alpha: 0, radius: 12, speed: T.def.speed || 80, rate: 1.0, engage: T.def.engage }));
      this.refresh(T, true); this.placePosts(T);
    },
    refresh(T, full) {
      const lv = T.def.levels[T.level - 1], hb = 1 + Progress.bonus(T.type, 'hp'), db = 1 + Progress.bonus(T.type, 'damage');
      for (const u of this.list) if (u.tower === T) {
        const r = full || !u.maxHp ? 1 : u.hp / u.maxHp;
        u.maxHp = Math.round(lv.hp * hb); u.hp = Math.max(1, Math.round(u.maxHp * r)); u.damage = [lv.damage[0] * db, lv.damage[1] * db];
        u.armor = lv.armor; u.art = lv.art; u.scale = 12 / ArtChars[lv.art].dr * 1.05; u.barH = Math.max(48, ArtChars[lv.art].tall * u.scale + 14); u.regen = u.maxHp * 0.08;
      }
    },
    remove(T) { for (let i = this.list.length - 1; i >= 0; i--) if (this.list[i].tower === T) this.list.splice(i, 1); },
    placePosts(T) {
      const path = Game.map.paths[T.rallyPath], L = path.length; let k = 0;
      const offs = [[0, 0], [-20, -10], [20, 10]];
      for (const u of this.list) {
        if (u.tower !== T) continue;
        const o = offs[k % 3], p = path.pointAt(Math.max(30, Math.min(L - 30, T.rallyDist + o[0])), tmp);
        u.postX = p.x + p.nx * o[1] * 1.4; u.postY = p.y + p.ny * o[1] * 1.4;
        if (u.state === 'post' && !u.target) u.state = 'move';
        k++;
      }
    },
    kill(u) {
      if (!u.active) return;
      u.state = 'dead'; u.target = null; u.tUid = -1; u.atk = -1;
      u.respawnT = u.isHero ? CONFIG.hero.respawn : u.tower.def.respawn;
      Effects.death(u.x, u.y - 14, u.isHero ? '#f2c14e' : '#9aa3b2');
      AudioSys.play('death');
    },
    update(dt) { for (const u of this.list) u.update(dt); }
  };
  window.Units = Units; window.Hero = Hero; window.Unit = Unit;
})();
