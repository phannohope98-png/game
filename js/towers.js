/* =========================================================
 * towers.js – 4 loại trụ trên các ô xây
 * Trụ không bị tấn công. Nâng cấp đổi hình dạng (4 cấp).
 * ========================================================= */
(function () {
  const TS = 1.0; // tỉ lệ vẽ trụ
  const TARGET = {
    first(T, air) { let b = null, bd = -1; for (const e of Enemies.list) if (e.alive && (air || !e.flying) && T.inRange(e) && e.dist > bd) { bd = e.dist; b = e; } return b; },
    densest(T) {
      let b = null, bc = -1; const r = T.stats.aoe;
      for (const e of Enemies.list) { if (!e.alive || e.flying || !T.inRange(e)) continue; let c = 0; for (const o of Enemies.list) if (o.alive && !o.flying && Math.abs(o.x - e.x) < r && Math.abs(o.y - e.y) < r) c++; if (c > bc || (c === bc && e.dist > b.dist)) { bc = c; b = e; } }
      return b;
    }
  };

  class Tower {
    constructor(type, spot) {
      this.type = type; this.def = CONFIG.towers[type]; this.spot = spot; this.x = spot.x; this.y = spot.y;
      this.level = 1; this.spent = this.def.cost[0]; this.cd = 0.5; this.shots = 0; this.t = Math.random() * 5;
      this.anim = { a: -1, face: 1, k: 0, door: 0 }; this.pulse = 0.4; this.pending = null;
      if (this.def.kind === 'barracks') {
        let best = null;
        Game.map.paths.forEach((p, i) => { const n = p.nearest(this.x, this.y); if (!best || n.perp < best.perp) best = { perp: n.perp, dist: n.dist, i }; });
        this.rallyPath = best.i; this.rallyDist = best.dist;
      }
    }
    get stats() {
      const lv = this.def.levels[this.level - 1], dm = 1 + Progress.bonus(this.type, 'damage'), rm = 1 + Progress.bonus(this.type, 'range'), am = 1 + Progress.bonus(this.type, 'aoe');
      return { damage: lv.damage ? [lv.damage[0] * dm, lv.damage[1] * dm] : null, range: (lv.range || 0) * rm, rate: lv.rate, aoe: (lv.aoe || 0) * am, special: lv.special };
    }
    get nextCost() { return this.level >= 4 ? null : this.def.cost[this.level]; }
    get refund() { return Math.floor(this.spent * CONFIG.match.sellRefund); }
    inRange(e) { const r = this.stats.range + e.radius, dx = e.x - this.x, dy = (e.y - this.y) * 1.15; return dx * dx + dy * dy <= r * r; }
    muzzle() {
      const T = ArtTowers, f = this.anim.face;
      if (this.type === 'archer') return { x: this.x + ((this.anim.k % 2 ? 9 : -9) + 14 * f) * TS, y: this.y + (T.ARCH_TOP[this.level] - 20) * TS };
      if (this.type === 'mage') return { x: this.x + 6 * f * TS, y: this.y + (T.MAGE_TOP[this.level] - 50) * TS };
      return { x: this.x + 14 * f * TS, y: this.y + (T.ART_Y[this.level] - 26) * TS };
    }
    update(dt) {
      this.t += dt; if (this.pulse > 0) this.pulse -= dt; if (this.anim.door > 0) this.anim.door -= dt;
      if (this.def.kind !== 'shooter') return;
      const A = this.anim, st = this.stats;
      if (A.a >= 0) { const prev = A.a; A.a += dt / (this.type === 'artillery' ? 0.5 : 0.36); if (prev < 0.5 && A.a >= 0.5) this.release(); if (A.a >= 1) A.a = -1; }
      this.cd -= dt;
      if (this.cd > 0 || A.a >= 0) return;
      const tg = this.type === 'artillery' ? TARGET.densest(this) : TARGET.first(this, this.def.targetsAir);
      if (!tg) { this.cd = 0.1; return; }
      this.pending = tg; A.face = tg.x >= this.x ? 1 : -1; A.a = 0; A.k++; this.cd = st.rate;
    }
    release() {
      const t = this.pending, st = this.stats; if (!t || !t.alive) return;
      const m = this.muzzle();
      if (this.type === 'archer') {
        this.shots++;
        const pierce = st.special === 'pierce' && this.shots % 4 === 0;
        Combat.fire('arrow', m.x, m.y, t, { damage: pierce ? [st.damage[0] * 3, st.damage[1] * 3] : st.damage, type: 'physical', pierce });
        AudioSys.play('arrow');
      } else if (this.type === 'mage') {
        Combat.fire('bolt', m.x, m.y, t, { damage: st.damage, type: 'magic', chain: st.special === 'chain' }); AudioSys.play('magic');
      } else {
        Combat.fire('bomb', m.x, m.y, t, { damage: st.damage, aoe: st.aoe, cluster: st.special === 'cluster' }); AudioSys.play('cannon');
        Effects.burst(m.x, m.y, '#e8e0d8', 8, 80, 0.5, 7, -30);
      }
    }
    get drawY() { return this.y + 14; }
    draw(ctx) {
      const k = this.pulse > 0 ? 1 + Math.sin(this.pulse / 0.4 * Math.PI) * 0.08 : 1;
      Painter.tower(ctx, this.type, this.level, this.x, this.y, TS * k, this.t, this.anim);
    }
    drawOverlay(ctx) {
      if (this.def.kind !== 'barracks') return;
      let i = 0;
      for (const u of Units.list) {
        if (u.tower !== this || u.state !== 'dead') continue;
        const p = 1 - u.respawnT / this.def.respawn, x = this.x - 22 + i * 22, y = this.y + 22;
        ctx.fillStyle = 'rgba(29,18,32,0.85)'; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill();
        ctx.strokeStyle = '#ffe58a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 6.5, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
        i++;
      }
    }
  }

  const Towers = {
    TS, list: [], spots: [],
    init(map) { this.list = []; this.spots = map.spots.map(s => Object.assign({ tower: null }, s)); },
    spotAt(x, y) { for (const s of this.spots) if (Math.abs(s.x - x) < 46 && Math.abs(s.y - y + 12) < 44) return s; return null; },
    count(type) { return this.list.filter(t => t.type === type).length; },
    build(spot, type) {
      const cost = CONFIG.towers[type].cost[0];
      if (spot.tower || !Game.spend(cost)) return null;
      const T = new Tower(type, spot); spot.tower = T; this.list.push(T);
      if (T.def.kind === 'barracks') Units.createFor(T);
      Effects.burst(spot.x, spot.y, '#e8d8b0', 18, 170, 0.5, 6, 260); Effects.ring(spot.x, spot.y, 10, 60, 0.4, '#ffe58a', 4);
      AudioSys.play('build'); return T;
    },
    upgrade(T) {
      const c = T.nextCost; if (c === null || !Game.spend(c)) return false;
      T.level++; T.spent += c; T.pulse = 0.4;
      if (T.def.kind === 'barracks') Units.refresh(T, false);
      Effects.ring(T.x, T.y, 10, 70, 0.5, '#ffe58a', 5); Effects.burst(T.x, T.y - 40, '#fff0a0', 22, 200, 0.6, 5, -60);
      AudioSys.play('build'); return true;
    },
    sell(T) {
      Game.addGold(T.refund, T.x, T.y - 30);
      Units.remove(T); this.list.splice(this.list.indexOf(T), 1); T.spot.tower = null;
      Effects.burst(T.x, T.y, '#b8a888', 16, 150, 0.5, 6, 220); AudioSys.play('sell');
    },
    setRally(T, x, y) {
      const p = Game.map.paths[T.rallyPath]; let best = null;
      Game.map.paths.forEach((pp, i) => { const n = pp.nearest(x, y); if (!best || n.perp < best.perp) best = { perp: n.perp, dist: n.dist, i }; });
      if (best.perp > 40) return 'path';
      const pt = Game.map.paths[best.i].pointAt(best.dist, {});
      if (Math.hypot(pt.x - T.x, pt.y - T.y) > T.def.rallyRange) return 'far';
      T.rallyPath = best.i; T.rallyDist = best.dist; Units.placePosts(T);
      Effects.ring(pt.x, pt.y, 4, 30, 0.4, '#8ac8ff', 3); return 'ok';
    },
    update(dt) { for (const T of this.list) T.update(dt); }
  };
  window.Towers = Towers;
})();
