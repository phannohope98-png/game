/* =========================================================
 * units.js – Lính phe ta (dữ liệu hoá hoàn toàn từ CONFIG.units)
 * Thêm loại lính mới: chỉ cần thêm cấu hình, không sửa code này.
 * Quy trình: tìm quái trong tầm → chọn mục tiêu → đánh → chờ hồi → đánh tiếp
 * ========================================================= */
(function () {
  let uidCounter = 0;
  const tmp = {};

  // Các chiến thuật chọn mục tiêu – thêm chiến thuật mới tại đây
  const TARGETING = {
    // Quái đi xa nhất trên đường = gần cổng nhất
    closestToGate(u, list) {
      let best = null, bd = -1;
      for (const e of list) if (e.alive && u.inRange(e) && e.dist > bd) { bd = e.dist; best = e; }
      return best;
    },
    // Quái có nhiều quái khác xung quanh nhất (tối ưu nổ lan)
    densest(u, list) {
      let best = null, bc = -1;
      const r = (u.def.aoeRadius || 60);
      for (const e of list) {
        if (!e.alive || !u.inRange(e)) continue;
        let c = 0;
        for (const o of list) if (o.alive && Math.abs(o.x - e.x) < r && Math.abs(o.y - e.y) < r && Math.hypot(o.x - e.x, o.y - e.y) < r) c++;
        if (c > bc || (c === bc && e.dist > best.dist)) { bc = c; best = e; }
      }
      return best;
    },
    // Quái gần bản thân nhất
    nearest(u, list) {
      let best = null, bd = Infinity;
      for (const e of list) {
        if (!e.alive || !u.inRange(e)) continue;
        const d = Math.hypot(e.x - u.x, e.y - u.y);
        if (d < bd) { bd = d; best = e; }
      }
      return best;
    }
  };

  class Unit {
    reset(type, level, x, y, ownerSlot, fIndex) {
      const def = CONFIG.units[type], lv = def.levels[Math.min(level, def.levels.length) - 1];
      this.uid = ++uidCounter;
      this.id = this.uid; this.type = type; this.name = def.name; this.def = def; this.level = level;
      this.maxHp = lv.hp; this.hp = lv.hp; this.damage = lv.damage;
      this.attackSpeed = def.attackSpeed; this.range = def.range;
      this.armor = (def.armor || 0) + (lv.armor || 0); this.speed = def.speed;
      this.cost = def.cost; this.abilities = def.abilities;
      this.radius = def.radius;
      this.x = x; this.y = y; this.homeX = x; this.homeY = y;
      this.ownerSlot = ownerSlot; this.fIndex = fIndex; this.guardRange = def.leash || 150;
      this.alive = true; this.cd = Math.random() * 0.5; this.rage = 0;
      this.hitFlash = 0; this.attackAnim = 0; this.anim = Math.random() * 10; this.face = 1;
      this.engaged = 0; this.scan = 0; this.chase = null; this.chaseUid = -1; this.moving = false;
      return this;
    }

    inRange(e) {
      const dx = e.x - this.x, dy = e.y - this.y, r = this.range + e.radius + this.radius * 0.5;
      return dx * dx + dy * dy <= r * r;
    }

    update(dt) {
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.attackAnim > 0) this.attackAnim -= dt;
      if (this.rage > 0) this.rage -= dt;
      this.anim += dt;

      // Chọn điểm cần tới: đang đánh → đứng yên; có quái để đuổi → tiến lại gần; không → về đội hình
      if (this.engaged > 0) this.engaged -= dt;
      this.scan -= dt;
      if (this.scan <= 0) { this.scan = 0.3; this.chase = this.engaged > 0 ? null : this.findChase(); }
      let gx = this.homeX, gy = this.homeY;
      const c = this.chase;
      if (this.engaged > 0) { gx = this.x; gy = this.y; }
      else if (c && c.alive && c.uid === this.chaseUid) {
        const ex = c.x - this.x, ey = c.y - this.y, ed = Math.hypot(ex, ey) || 1;
        const keep = this.def.attackType === 'melee' ? c.radius + this.radius : this.range * 0.85;
        gx = c.x - ex / ed * keep; gy = c.y - ey / ed * keep;
      }
      const dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy);
      this.moving = d > 3;
      if (this.moving) {
        const step = Math.min(d, this.speed * 1.5 * dt);
        this.x += dx / d * step; this.y += dy / d * step;
        if (Math.abs(dx) > 1) this.face = dx > 0 ? 1 : -1;
      }

      // Hồi chiêu đánh (Cuồng nộ tăng tốc đánh)
      const rageCfg = CONFIG.skills.rage;
      this.cd -= dt * (this.rage > 0 ? 1 + rageCfg.attackSpeedBonus : 1);
      if (this.cd > 0) return;
      const target = TARGETING[this.def.targeting](this, Enemies.list);
      if (!target) { this.cd = 0.1; return; } // quét lại sau 0.1s cho nhẹ máy
      this.attack(target);
      this.cd = this.attackSpeed;
    }

    /** Tìm quái để tiến tới: quái đang phá cổng (luôn đuổi) hoặc quái trong vùng canh giữ */
    findChase() {
      const leash = this.guardRange || this.def.leash || 150;
      let best = null, bd = Infinity;
      for (const e of Enemies.list) {
        if (!e.alive || this.inRange(e)) continue;
        const nearHome = Math.hypot(e.x - this.homeX, e.y - this.homeY) < leash + this.range;
        if (e.state !== 'gate' && !nearHome) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < bd) { bd = d; best = e; }
      }
      if (best) this.chaseUid = best.uid;
      return best;
    }

    attack(t) {
      this.engaged = 0.6;
      const mult = this.rage > 0 ? 1 + CONFIG.skills.rage.damageBonus : 1;
      this.face = t.x >= this.x ? 1 : -1;
      this.attackAnim = 0.15;
      if (this.def.attackType === 'ranged') {
        Combat.fire(this.def.projectile, this.x, this.y - 12, t, 0, 0, this.damage, mult, this.def.aoeRadius);
      } else {
        Combat.damageEnemy(t, this.damage, mult);
        Effects.hit((t.x + this.x) / 2, (t.y + this.y) / 2, '#ffe6a0');
      }
      AudioSys.play(this.def.sound);
    }

    draw(ctx) {
      const lunge = this.attackAnim > 0 ? -3 : 0;
      const bob = this.moving ? Math.sin(this.anim * 12) * 2 : 0;
      const x = this.x, y = this.y + bob + lunge, r = this.radius;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(this.x, this.y + r * 0.85, r, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
      if (this.rage > 0) {
        ctx.fillStyle = 'rgba(255,60,40,0.35)';
        ctx.beginPath(); ctx.arc(x, y, r + 8 + Math.sin(this.anim * 20) * 2, 0, Math.PI * 2); ctx.fill();
      }
      // vòng xanh dưới chân = phe ta
      ctx.strokeStyle = 'rgba(127,179,213,0.9)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(this.x, this.y + r * 0.85, r * 0.95, r * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
      const img = Sprites.image(this.def.sprite);
      if (img) Sprites.draw(ctx, img, x, y, r * 2.6, this.face < 0);
      else Painter.unit(ctx, this.type, x, y, r, this.face, this.anim, this.attackAnim > 0, this.moving);
      if (this.hitFlash > 0) {
        ctx.globalAlpha = 0.35; ctx.fillStyle = '#ff4040';
        ctx.beginPath(); ctx.arc(x, y - r * 0.3, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      // chấm cấp
      if (this.hp < this.maxHp) {
        const w = r * 2, hx = this.x - r, hy = this.y - r * 1.9 - 6;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(hx - 1, hy - 1, w + 2, 6);
        ctx.fillStyle = '#6fbf4a'; ctx.fillRect(hx, hy, w * Math.max(0, this.hp / this.maxHp), 4);
      }
    }
  }

  const Units = {
    list: [], pool: [], game: null,

    init(game) { this.game = game; this.clear(); },
    clear() { while (this.list.length) this.pool.push(this.list.pop()); },

    count(type) { let n = 0; for (const u of this.list) if (u.alive && (!type || u.type === type)) n++; return n; },
    countOwned(slot) { let n = 0; for (const u of this.list) if (u.alive && u.ownerSlot === slot) n++; return n; },

    spawn(type, level, x, y, ownerSlot) {
      const melee = CONFIG.units[type].attackType === 'melee';
      // Chỉ số đội hình nhỏ nhất còn trống trong nhóm (cận chiến / tầm xa)
      const used = new Set();
      for (const u of this.list) if (u.alive && (u.def.attackType === 'melee') === melee) used.add(u.fIndex);
      let fi = 0; while (used.has(fi)) fi++;
      const u = (this.pool.pop() || new Unit()).reset(type, level, x, y, ownerSlot, fi);
      this.list.push(u);
      this.placeHome(u);
      Effects.ring(x, y, 4, 34, 0.35, '#fff3c4', 3);
      return u;
    },

    kill(u) {
      if (!u.alive) return;
      u.alive = false;
      Effects.death(u.x, u.y, u.def.color);
      AudioSys.play('death');
    },

    /** Đội hình xếp trên đường: Orc chặn phía trước, lính tầm xa đứng sau (phía cổng) */
    placeHome(u) {
      if (u.ownerSlot >= 0 && window.Buildings && Buildings.slots[u.ownerSlot] && Buildings.slots[u.ownerSlot].building) {
        Buildings.placeGuard(u, Buildings.slots[u.ownerSlot]); return;
      }
      const g=this.game,path=g.map.path,p=path.pointAt(g.rallyDist,tmp);u.homeX=p.x;u.homeY=p.y;
    },

    replaceAll() { for (const u of this.list) if (u.alive) this.placeHome(u); },

    rage(duration) {
      let n = 0;
      for (const u of this.list) if (u.alive && u.abilities.includes('rage')) { u.rage = duration; n++; Effects.ring(u.x, u.y, 5, 40, 0.4, '#ff4a2a', 4); }
      return n;
    },

    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const u = this.list[i];
        if (u.alive) u.update(dt);
        if (!u.alive) { this.pool.push(u); swapRemove(this.list, i); }
      }
    },

    draw(ctx) { for (let i = 0; i < this.list.length; i++) this.list[i].draw(ctx); }
  };

  window.Unit = Unit;
  window.Units = Units;
})();
