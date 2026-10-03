/* =========================================================
 * units.js – Lính phe ta (sinh ra từ Trụ Người & Trụ Orc)
 * Vòng đời một lính:
 *   spawn  – vừa ra khỏi trụ, đi tới vị trí canh
 *   post   – canh giữ: thấy quái trong vùng thì xông vào đánh
 *   dead   – chết, chờ `respawn` giây rồi hồi sinh tại trụ
 *   toGate – hết đợt quái mà còn sống (bị thương) → chạy theo đường về thành
 *   inside – trong thành hồi máu
 *   fromGate – hồi xong, chạy ra lại vị trí canh
 * ========================================================= */
(function () {
  const tmp = {}, tmp2 = {};
  let uid = 0;

  class Unit {
    constructor(tower, idx) {
      this.uid = ++uid; this.tower = tower; this.idx = idx;
      this.def = CONFIG.soldiers[tower.def.soldier];
      this.radius = this.def.radius; this.art = this.def.art;
      this.scale = this.radius / ArtChars[this.art].dr;
      this.applyStats(true);
      this.x = tower.x; this.y = tower.y + 10;
      this.state = 'spawn'; this.respawnT = 0;
      this.face = 1; this.walk = Math.random(); this.atk = -1; this.cd = 0.3; this.idleT = Math.random() * 3;
      this.hitFlash = 0; this.rage = 0; this.target = null; this.targetUid = -1; this.scan = 0; this.moving = false;
      this.route = null; this.alpha = 1;
    }

    get active() { return this.state === 'spawn' || this.state === 'post' || this.state === 'fromGate'; }
    get alive() { return this.active; } // tương thích với code cũ

    /** Chỉ số theo cấp trụ + nâng cấp vĩnh viễn */
    applyStats(full) {
      const T = this.tower, lv = T.def.levels[T.level - 1], bonus = 1 + Player.towerBonus(T.type);
      const ratio = full || !this.maxHp ? 1 : this.hp / this.maxHp;
      this.maxHp = Math.round(lv.hp * bonus); this.hp = Math.max(1, Math.round(this.maxHp * ratio));
      this.damage = Math.round(lv.damage * bonus); this.armor = lv.armor;
    }

    setPost(x, y, d) { this.postX = x; this.postY = y; this.postDist = d; }

    moveTo(gx, gy, speed, dt) {
      const dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy);
      if (d < 1.5) { this.moving = false; return true; }
      const step = Math.min(d, speed * dt);
      this.x += dx / d * step; this.y += dy / d * step;
      if (Math.abs(dx) > 0.8) this.face = dx > 0 ? 1 : -1;
      this.moving = true;
      this.walk += step / (this.def.art === 'orcRider' ? 70 : 34);
      return d - step < 1.5;
    }

    update(dt, game) {
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.rage > 0) this.rage -= dt;
      this.idleT += dt;
      switch (this.state) {
        case 'dead':
          this.respawnT -= dt;
          if (this.respawnT <= 0) this.respawn();
          return;
        case 'toGate': this.runToGate(dt, game); return;
        case 'inside':
          this.respawnT -= dt;
          this.hp = Math.min(this.maxHp, this.hp + this.maxHp * dt / CONFIG.heal.time);
          if (this.respawnT <= 0) this.leaveGate(game);
          return;
      }
      if (this.state === 'fromGate' && this.route) { if (!this.nearEnemy(60)) { this.runFromGate(dt, game); return; } this.route = null; this.state = 'post'; }

      // ---- Chiến đấu ----
      const rageMul = this.rage > 0 ? 1 + CONFIG.skills.rage.attackSpeedBonus : 1;
      this.cd -= dt * rageMul;
      if (this.atk >= 0) {
        const prev = this.atk;
        this.atk += dt * rageMul / 0.42;
        const t = this.target;
        if (prev < 0.5 && this.atk >= 0.5 && t && t.alive && t.uid === this.targetUid) {
          const mult = this.rage > 0 ? 1 + CONFIG.skills.rage.damageBonus : 1;
          Combat.damageEnemy(t, this.damage, mult);
          Effects.hit((t.x + this.x) / 2 + this.face * 6, t.y - t.radius, '#fff2c0');
          AudioSys.play(this.def.art === 'orcRider' ? 'orc' : 'sword');
        }
        if (this.atk >= 1) this.atk = -1;
      }

      this.scan -= dt;
      const t = this.target;
      if (!t || !t.alive || t.uid !== this.targetUid || this.scan <= 0) { this.scan = 0.25; this.pickTarget(); }
      const e = this.target;
      if (e) {
        const dx = e.x - this.x, dy = e.y - this.y, d = Math.hypot(dx, dy), reach = e.radius + this.radius + 2;
        if (d > reach) {
          if (this.atk < 0) this.moveTo(e.x - dx / d * (reach - 2), e.y - dy / d * (reach - 2), this.def.speed, dt);
        } else {
          this.moving = false; this.face = dx >= 0 ? 1 : -1;
          if (this.cd <= 0 && this.atk < 0) { this.atk = 0; this.cd = this.def.attackSpeed; }
        }
      } else if (this.atk < 0) {
        if (this.moveTo(this.postX, this.postY, this.def.speed, dt) && this.state === 'spawn') this.state = 'post';
        if (!this.moving && this.state !== 'spawn') this.state = 'post';
      }
    }

    nearEnemy(r) {
      for (const e of Enemies.list) if (e.alive && Math.abs(e.x - this.x) < r && Math.abs(e.y - this.y) < r) return true;
      return false;
    }

    /** Chọn quái trong vùng canh giữ: ưu tiên con chưa bị lính khác chặn, rồi con gần nhất */
    pickTarget() {
      const R = this.tower.def.engage, cx = this.postX, cy = this.postY;
      let best = null, bs = Infinity;
      for (const e of Enemies.list) {
        if (!e.alive) continue;
        const dp = Math.hypot(e.x - cx, e.y - cy);
        if (dp > R + e.radius) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        let taken = 0;
        for (const u of Units.list) if (u !== this && u.active && u.targetUid === e.uid) taken++;
        const score = d + taken * 60 - (e.isBoss ? 30 : 0);
        if (score < bs) { bs = score; best = e; }
      }
      this.target = best; this.targetUid = best ? best.uid : -1;
    }

    respawn() {
      this.applyStats(true);
      this.x = this.tower.x + (this.idx ? 8 : -8); this.y = this.tower.y + 14;
      this.state = 'spawn'; this.alpha = 0; this.atk = -1; this.target = null;
      this.tower.doorGlow = 0.6;
      Effects.ring(this.x, this.y - 10, 4, 30, 0.35, '#fff3c4', 3);
    }

    /* ---- Về thành hồi máu ---- */
    sendHome(game) {
      const path = game.map.path, n = path.nearest(this.x, this.y);
      this.route = { phase: 0, d: n.dist, lat: (this.idx ? 9 : -9) + (Math.random() - 0.5) * 6 };
      this.state = 'toGate'; this.target = null; this.targetUid = -1; this.atk = -1;
    }
    runToGate(dt, game) {
      const r = this.route, path = game.map.path, sp = CONFIG.heal.runSpeed, g = game.gate;
      if (r.phase === 0) { const p = path.pointAt(r.d, tmp); if (this.moveTo(p.x + p.nx * r.lat, p.y + p.ny * r.lat, sp, dt)) r.phase = 1; }
      else if (r.phase === 1) {
        r.d = Math.min(path.length, r.d + sp * dt);
        const p = path.pointAt(r.d, tmp); this.moveTo(p.x + p.nx * r.lat, p.y + p.ny * r.lat, sp * 1.2, dt);
        if (r.d >= path.length) { r.phase = 2; g.holdOpen(1.6); }
      } else {
        g.holdOpen(0.6);
        if (this.moveTo(g.doorX + r.lat, g.doorY, sp * 0.6, dt)) { this.state = 'inside'; this.respawnT = CONFIG.heal.time; }
        this.alpha = Math.max(0, Math.min(1, (g.doorY - this.y) / 30));
      }
    }
    leaveGate(game) {
      const g = game.gate;
      this.x = g.doorX + this.route.lat; this.y = g.doorY; this.alpha = 0;
      this.route = { phase: 0, d: game.map.path.length, lat: this.route.lat };
      this.state = 'fromGate'; this.hp = this.maxHp;
      g.holdOpen(1.4);
      Effects.text(this.x, this.y - 40, 'Hồi máu!', '#9fe07a', 16);
    }
    runFromGate(dt, game) {
      const r = this.route, path = game.map.path, sp = CONFIG.heal.runSpeed;
      this.alpha = Math.min(1, this.alpha + dt * 2.5);
      if (r.phase === 0) { const p = path.pointAt(path.length, tmp); if (this.moveTo(p.x + p.nx * r.lat, p.y + p.ny * r.lat, sp * 0.6, dt)) r.phase = 1; }
      else if (r.phase === 1) {
        r.d = Math.max(this.postDist, r.d - sp * dt);
        const p = path.pointAt(r.d, tmp); this.moveTo(p.x + p.nx * r.lat, p.y + p.ny * r.lat, sp * 1.2, dt);
        if (r.d <= this.postDist) r.phase = 2;
      } else if (this.moveTo(this.postX, this.postY, this.def.speed, dt)) { this.state = 'post'; this.route = null; }
    }

    /* ---- Vẽ ---- */
    get drawY() { return this.y; }
    draw(ctx, time) {
      if (this.state === 'dead' || this.state === 'inside') return;
      if (this.state === 'spawn' && this.alpha < 1) this.alpha = Math.min(1, this.alpha + 0.06);
      const a = this.alpha;
      if (a <= 0.02) return;
      const fy = this.y + this.radius * 0.55;
      ctx.globalAlpha = a;
      // vòng xanh dưới chân = phe ta
      ctx.strokeStyle = this.rage > 0 ? 'rgba(255,90,60,0.95)' : 'rgba(120,200,255,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(this.x, fy, this.radius * 1.05, this.radius * 0.38, 0, 0, Math.PI * 2); ctx.stroke();
      if (this.rage > 0) ArtKit.glow(ctx, this.x, this.y - this.radius, this.radius * 2.6, '#ff4a2a', 0.5 + Math.sin(time * 18) * 0.15);
      const img = Sprites.image(this.def.sprite);
      if (img) Sprites.draw(ctx, img, this.x, this.y, this.radius * 2.6, this.face < 0);
      else if (this.atk >= 0) Painter.char(ctx, this.art, this.x, fy, this.scale, this.face, 'atk', this.atk);
      else if (this.moving) Painter.char(ctx, this.art, this.x, fy, this.scale, this.face, 'walk', this.walk);
      else Painter.char(ctx, this.art, this.x, fy, this.scale, this.face, 'idle', this.idleT);
      if (this.hitFlash > 0) ArtKit.glow(ctx, this.x, this.y - this.radius * 0.8, this.radius * 1.6, '#ff3030', 0.6);
      ctx.globalAlpha = 1;
    }
    drawBar(ctx) {
      if (!this.active || this.hp >= this.maxHp || this.alpha < 0.5) return;
      const H = ArtChars[this.art].box[3] * this.scale * 0.92;
      drawHpBar(ctx, this.x, this.y + this.radius * 0.55 - H, this.radius * 2, this.hp / this.maxHp, '#7ad36b');
    }
  }

  /** Thanh máu bo góc đẹp (dùng chung cho quái) */
  function drawHpBar(ctx, cx, y, w, ratio, col) {
    const h = 5, x = cx - w / 2;
    ctx.fillStyle = 'rgba(15,8,18,0.8)'; ArtKit.rr(ctx, x - 1.5, y - 1.5, w + 3, h + 3, 3); ctx.fill();
    ctx.fillStyle = '#3a1a1e'; ArtKit.rr(ctx, x, y, w, h, 2); ctx.fill();
    if (ratio > 0) { ctx.fillStyle = col; ArtKit.rr(ctx, x, y, Math.max(2, w * ratio), h, 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 1, y + 1, Math.max(0, w * ratio - 2), 1.4); }
  }

  const Units = {
    list: [], game: null,
    init(game) { this.game = game; this.list.length = 0; },
    clear() { this.list.length = 0; },

    /** Số lính đang trên sân (theo loại lính hoặc loại trụ) */
    count(towerType) { let n = 0; for (const u of this.list) if (u.active && (!towerType || u.tower.type === towerType)) n++; return n; },

    /** Trụ vừa mua: sinh lính đúng 1 lần */
    createFor(tower) {
      const arr = [];
      for (let i = 0; i < tower.def.count; i++) { const u = new Unit(tower, i); u.alpha = 0; this.list.push(u); arr.push(u); }
      this.placePosts(tower);
      return arr;
    },
    removeFor(tower) { for (let i = this.list.length - 1; i >= 0; i--) if (this.list[i].tower === tower) this.list.splice(i, 1); },
    refreshStats(tower) { for (const u of this.list) if (u.tower === tower) u.applyStats(false); },

    /** Vị trí canh: điểm tập kết của trụ, các lính đứng dàn hàng dọc theo đường */
    placePosts(tower) {
      const path = this.game.map.path, L = path.length, n = tower.def.count;
      let k = 0;
      for (const u of this.list) {
        if (u.tower !== tower) continue;
        const off = n === 1 ? 0 : (k - (n - 1) / 2) * 26, d = Math.max(30, Math.min(L - 30, tower.rallyDist + off));
        const p = path.pointAt(d, tmp2), lat = n === 1 ? 0 : (k % 2 ? 7 : -7);
        u.setPost(p.x + p.nx * lat, p.y + p.ny * lat, d);
        k++;
      }
    },

    kill(u) {
      if (!u.active) return;
      u.state = 'dead'; u.respawnT = u.tower.def.respawn; u.target = null; u.targetUid = -1; u.atk = -1; u.route = null;
      Effects.death(u.x, u.y - u.radius * 0.5, u.tower.def.color);
      Effects.text(u.x, u.y - u.radius * 2, 'Hồi sinh ' + u.tower.def.respawn + 's', '#d8cdb6', 14);
      AudioSys.play('death');
    },

    /** Hết một đợt quái: lính còn sống (bị thương) về thành hồi máu */
    waveCleared() {
      const g = this.game; let n = 0;
      for (const u of this.list) {
        if (!u.active || u.state === 'fromGate') continue;
        if (CONFIG.heal.onlyInjured && u.hp >= u.maxHp) continue;
        u.sendHome(g); n++;
      }
      return n;
    },

    rage(duration) {
      let n = 0;
      for (const u of this.list) if (u.active && u.tower.type === 'orc') { u.rage = duration; n++; Effects.ring(u.x, u.y, 5, 44, 0.4, '#ff4a2a', 4); }
      return n;
    },

    update(dt) { for (let i = 0; i < this.list.length; i++) this.list[i].update(dt, this.game); }
  };

  window.Unit = Unit;
  window.Units = Units;
  window.drawHpBar = drawHpBar;
})();
