/* =========================================================
 * buildings.js – Ô xây & 4 loại trụ (dữ liệu từ CONFIG.towers)
 * Trụ không bị quái tấn công và không có máu.
 *  - Trụ lính (Người, Orc): lính ra 1 lần khi mua, chết thì hồi sinh.
 *  - Trụ bắn (Elf, Phù thủy): tự bắn quái trong tầm.
 * Nâng cấp → trụ đổi hình dạng (3 cấp).
 * ========================================================= */
(function () {
  const SLOT_R = 36;
  const TS = 0.96; // tỉ lệ vẽ trụ trên bản đồ

  /** Điểm tay xạ thủ/phù thủy theo cấp (toạ độ thiết kế trụ) – nơi đạn bay ra */
  const MUZZLE = {
    elf:   tier => ({ x: 15, y: (tier === 1 ? -48 : tier === 2 ? -56 : -64) - 15 }),
    witch: tier => ({ x: 10, y: (tier === 1 ? -40 : tier === 2 ? -52 : -66) - 34 })
  };

  const TARGETING = {
    closestToGate(T, list) {
      let best = null, bd = -1;
      for (const e of list) if (e.alive && T.inRange(e) && e.dist > bd) { bd = e.dist; best = e; }
      return best;
    },
    densest(T, list) {
      let best = null, bc = -1; const r = T.stats.aoe || 60;
      for (const e of list) {
        if (!e.alive || !T.inRange(e)) continue;
        let c = 0;
        for (const o of list) if (o.alive && Math.abs(o.x - e.x) < r && Math.abs(o.y - e.y) < r) c++;
        if (c > bc || (c === bc && e.dist > best.dist)) { bc = c; best = e; }
      }
      return best;
    }
  };

  class Tower {
    constructor(type, slot, game) {
      this.type = type; this.def = CONFIG.towers[type]; this.slot = slot; this.game = game;
      this.x = slot.x; this.y = slot.y; this.level = 1; this.spent = this.def.cost;
      this.cd = 0.4; this.anim = { a: -1, face: 1, k: 0, door: 0 }; this.pending = null; this.pendingUid = -1;
      this.pulse = 0; this.doorGlow = 0; this.t = Math.random() * 10;
      if (this.def.kind === 'barracks') {
        const n = game.map.path.nearest(slot.x, slot.y);
        this.rallyDist = n.dist;
      }
    }
    get stats() {
      const lv = this.def.levels[this.level - 1], b = 1 + Player.towerBonus(this.type);
      return { damage: Math.round((lv.damage || 0) * b), range: lv.range || 0, attackSpeed: lv.attackSpeed || 1, aoe: lv.aoe || 0 };
    }
    get upgradeCost() { return this.level >= this.def.levels.length ? null : this.def.upgradeCost[this.level]; }
    get maxLevel() { return this.def.levels.length; }
    inRange(e) { const r = this.stats.range + e.radius, dx = e.x - this.x, dy = e.y - this.y; return dx * dx + dy * dy <= r * r; }

    muzzle() {
      const m = MUZZLE[this.type](this.level), f = this.anim.face;
      let mx = m.x * f;
      if (this.type === 'elf' && this.level === 3) mx += (this.anim.k % 2 ? 11 : -11);
      return { x: this.x + mx * TS, y: this.y + 10 + m.y * TS };
    }

    update(dt) {
      this.t += dt;
      if (this.pulse > 0) this.pulse -= dt;
      if (this.doorGlow > 0) this.doorGlow -= dt;
      this.anim.door = Math.max(0, this.doorGlow);
      if (this.def.kind !== 'shooter') return;
      const st = this.stats, A = this.anim;
      if (A.a >= 0) {
        const prev = A.a; A.a += dt / 0.42;
        if (prev < 0.5 && A.a >= 0.5) this.release();
        if (A.a >= 1) A.a = -1;
      }
      this.cd -= dt;
      if (this.cd > 0 || A.a >= 0) return;
      const target = TARGETING[this.def.targeting](this, Enemies.list);
      if (!target) { this.cd = 0.1; return; }
      this.pending = target; this.pendingUid = target.uid;
      A.face = target.x >= this.x ? 1 : -1;
      A.a = 0; A.k++;
      this.cd = st.attackSpeed;
    }

    release() {
      const t = this.pending, st = this.stats;
      if (!t || !t.alive || t.uid !== this.pendingUid) return;
      const m = this.muzzle();
      Combat.fire(this.def.projectile, m.x, m.y, t, 0, 0, st.damage, 1, st.aoe, this.def.magic);
      AudioSys.play(this.def.sound);
    }

    get drawY() { return this.y + 22; }
    draw(ctx, time) {
      const k = this.pulse > 0 ? 1 + Math.sin(this.pulse / 0.35 * Math.PI) * 0.06 : 1;
      Painter.tower(ctx, this.type, this.level, this.x, this.y + 10, TS * k, this.t, this.anim);
    }
    /** Đồng hồ hồi sinh lính phía trên trụ */
    drawOverlay(ctx) {
      if (this.def.kind !== 'barracks') return;
      let i = 0;
      for (const u of Units.list) {
        if (u.tower !== this || u.state !== 'dead') continue;
        const p = 1 - u.respawnT / this.def.respawn, x = this.x - 14 + i * 28, y = this.y - 6;
        ctx.fillStyle = 'rgba(15,8,18,0.82)'; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3a3238'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = this.def.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 8, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#f3ece0'; ctx.font = '800 10px "Alegreya Sans", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(Math.ceil(u.respawnT), x, y + 0.5);
        i++;
      }
    }
  }

  const Buildings = {
    SLOT_R, TS, Tower,
    slots: [], towers: [], highlight: false, buildType: null, selected: null, rallyMode: null, game: null,

    init(game, slotPositions) {
      this.game = game;
      this.slots = slotPositions.map((p, i) => ({ id: i, x: p.x, y: p.y, building: null }));
      this.towers = []; this.highlight = false; this.buildType = null; this.selected = null; this.rallyMode = null;
    },

    slotAt(x, y) {
      for (const s of this.slots) if (Math.abs(s.x - x) <= SLOT_R + 4 && Math.abs(s.y - y + 6) <= SLOT_R + 10) return s;
      return null;
    },

    count(type) { let n = 0; for (const t of this.towers) if (t.type === type) n++; return n; },

    build(slot, type) {
      const g = this.game, def = CONFIG.towers[type];
      if (slot.building || !g.spendGold(def.cost)) return false;
      const T = new Tower(type, slot, g);
      slot.building = T; this.towers.push(T);
      T.pulse = 0.35;
      if (def.kind === 'barracks') { Units.createFor(T); T.doorGlow = 0.8; }
      Effects.burst(slot.x, slot.y + 10, '#d9c7a0', 18, 170, 0.55, 6, 220);
      Effects.ring(slot.x, slot.y + 10, 10, 64, 0.45, '#f2b84b', 4);
      AudioSys.play('build');
      return true;
    },

    upgrade(slot) {
      const T = slot.building, cost = T && T.upgradeCost;
      if (!T || cost === null || !this.game.spendGold(cost)) return false;
      T.level++; T.spent += cost; T.pulse = 0.35;
      if (T.def.kind === 'barracks') Units.refreshStats(T);
      Effects.ring(slot.x, slot.y, 10, 76, 0.55, '#ffd23f', 5);
      Effects.burst(slot.x, slot.y - 30, '#ffe08a', 26, 200, 0.7, 5, -60);
      Effects.text(slot.x, slot.y - 70, T.def.tierNames[T.level - 1] + '!', '#ffd23f', 22);
      AudioSys.play('build');
      return true;
    },

    sell(slot) {
      const T = slot.building; if (!T) return 0;
      const refund = Math.floor(T.spent * CONFIG.match.sellRefund);
      this.game.addGold(refund, slot.x, slot.y);
      Units.removeFor(T);
      this.towers.splice(this.towers.indexOf(T), 1);
      slot.building = null;
      if (this.selected === slot) this.selected = null;
      Effects.burst(slot.x, slot.y, '#a08a6a', 16, 150, 0.5, 6, 200);
      return refund;
    },

    /** Dời điểm tập kết của trụ lính (phải nằm trên đường và trong tầm) */
    setRally(T, x, y) {
      const path = this.game.map.path, n = path.nearest(x, y);
      if (n.perp > 45) return 'path';
      const p = path.pointAt(n.dist, {});
      if (Math.hypot(p.x - T.x, p.y - T.y) > T.def.rallyRange) return 'far';
      T.rallyDist = n.dist;
      Units.placePosts(T);
      for (const u of Units.list) if (u.tower === T && u.state === 'post') u.state = 'spawn';
      Effects.ring(p.x, p.y, 6, 44, 0.5, '#7fc3ff', 4);
      return 'ok';
    },

    update(dt) { for (const T of this.towers) T.update(dt); },

    drawPlots(ctx, time) {
      const size = GameMap.CELL - 8;
      for (const s of this.slots) if (!s.building) Painter.plot(ctx, s.x, s.y, size, this.highlight ? 'highlight' : 'empty', time);
    },

    /** Vòng tầm bắn / vùng tập kết của trụ đang chọn */
    drawSelection(ctx, time) {
      const s = this.selected; if (!s || !s.building) return;
      const T = s.building;
      if (T.def.kind === 'shooter') ring(ctx, T.x, T.y + 6, T.stats.range, T.def.color, time);
      else {
        ring(ctx, T.x, T.y + 6, T.def.rallyRange, T.def.color, time);
        const p = this.game.map.path.pointAt(T.rallyDist, {});
        drawFlag(ctx, p.x, p.y, T.def.color, time);
      }
    }
  };

  function ring(ctx, x, y, r, col, t) {
    ctx.save();
    ctx.fillStyle = ArtKit.alpha(col, 0.12); ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.92, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2.5; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 20; ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }
  function drawFlag(ctx, x, y, col, t) {
    ArtKit.shadow(ctx, x, y + 4, 12, 4, 0.4);
    ArtKit.line(ctx, x, y + 4, x, y - 34, '#5a3a22', 3);
    ctx.beginPath(); ctx.moveTo(x + 1, y - 34);
    for (let i = 0; i <= 6; i++) { const f = i / 6; ctx.lineTo(x + 1 + f * 22, y - 34 + Math.sin(t * 6 + f * 3) * 2.5 * f); }
    for (let i = 6; i >= 0; i--) { const f = i / 6; ctx.lineTo(x + 1 + f * 18, y - 22 + Math.sin(t * 6 + f * 3 + 0.4) * 2.5 * f); }
    ctx.closePath(); ArtKit.paint(ctx, col, [x, y - 34, x + 22, y - 22], { dir: 'h' });
  }

  window.Buildings = Buildings;
  window.drawRallyFlag = drawFlag;
})();
