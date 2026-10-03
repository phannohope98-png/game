/* =========================================================
 * game.js – Vòng lặp game, điều khiển cảm ứng, vẽ, thắng/thua
 * ========================================================= */
(function () {
  const STEP = 1 / 60;            // bước mô phỏng cố định → chạy đúng ở 1x/2x
  // (đã bỏ nhấn giữ)
  const TAP_MOVE_TOL = 14;
  const tmp = {};

  const Game = {
    canvas: null, ctx: null, wrap: null,
    dpr: 1, scale: 1, offX: 0, offY: 0, cssW: 0, cssH: 0,
    state: 'idle', paused: false, sheetOpen: false, speed: 1, time: 0,
    stageIndex: 0, stage: null, map: null, gate: null, bg: null,
    gold: 0, killGold: 0, exp: 0, kills: 0, drawList: [],
    skillCd: {}, repairCd: 0, pendingSkill: null,
    raf: null, last: 0, pointer: null,

    init() {
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.wrap = document.getElementById('canvas-wrap');
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.state === 'playing' && !this.paused) UI.openPause();
      });
      this.setupInput();
    },

    /* ================= BẮT ĐẦU MÀN ================= */
    start(stageIndex) {
      this.stageIndex = stageIndex;
      this.stage = CONFIG.stages[stageIndex];
      UI.showScreen('screen-game');
      UI.setupBattleHud();   // dựng HUD trước để đo đúng vùng chơi còn lại
      this.measure();
      const W = CONFIG.world.width;
      const ratio = this.cssW > 0 ? this.cssH / this.cssW : 1.6;
      const H = GameMap.snapHeight(Math.max(CONFIG.world.minHeight, Math.min(CONFIG.world.maxHeight, W * ratio)));

      this.map = GameMap.build(stageIndex, W, H);
      this.gate = new Gate(Player.gateLevel(), W / 2, this.map.gate.y, W, H);
      Effects.clear(); Combat.clear();
      Enemies.init(this.map); Units.init(this);
      Buildings.init(this, this.map.slots);
      Waves.init(this, this.stage);

      this.gold = Player.startGold();
      this.killGold = 0; this.exp = 0; this.kills = 0;
      this.skillCd = {}; Object.keys(CONFIG.skills).forEach(k => { this.skillCd[k] = 0; });
      this.repairCd = 0; this.pendingSkill = null;
      this.paused = false; this.sheetOpen = false; this.speed = 1; this.time = 0;
      this.state = 'playing';

      this.resize();
      UI.updateHud(true);
      UI.closeOverlays();
      AudioSys.playMusic('battle');
      UI.hint('Chạm ô đất cạnh đường (hoặc chọn trụ bên dưới) để xây trụ.', 5);
      this.startLoop();
    },

    restart() { this.start(this.stageIndex); },

    quit() {
      this.state = 'idle'; this.stopLoop();
      Effects.clear(); Combat.clear(); Enemies.clear(); Units.clear();
      UI.closeOverlays();
      UI.showScreen('screen-menu');
    },

    /* ================= KÍCH THƯỚC ================= */
    measure() {
      const r = this.wrap.getBoundingClientRect();
      this.cssW = r.width; this.cssH = r.height;
    },

    resize() {
      if (!this.map) return;
      this.measure();
      if (this.cssW < 10 || this.cssH < 10) return; // màn game đang ẩn
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(this.cssW * this.dpr);
      this.canvas.height = Math.round(this.cssH * this.dpr);
      this.canvas.style.width = this.cssW + 'px';
      this.canvas.style.height = this.cssH + 'px';
      const W = this.map.W, H = this.map.H;
      this.scale = Math.min(this.cssW / W, this.cssH / H);
      this.offX = (this.cssW - W * this.scale) / 2;
      this.offY = (this.cssH - H * this.scale) / 2;
      const res = Math.min(2, this.scale * this.dpr);
      Sprites.setResolution(res);
      if (Math.abs(Painter.res - res) > 0.01) Painter.clearCache();
      Painter.res = res;
      this.bg = GameMap.renderBackground(this.map, res);
    },

    /* ================= VÒNG LẶP ================= */
    startLoop() {
      if (this.raf) return;
      this.last = performance.now();
      const tick = ts => { this.raf = requestAnimationFrame(tick); this.frame(ts); };
      this.raf = requestAnimationFrame(tick);
    },
    stopLoop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = null; },

    frame(ts) {
      const dt = Math.min(0.05, Math.max(0, (ts - this.last) / 1000));
      this.last = ts;
      if (this.state === 'playing' && !this.paused && !this.sheetOpen) {
        let sim = dt * this.speed;
        while (sim > 1e-6 && this.state === 'playing') {
          const s = Math.min(STEP, sim);
          this.update(s); sim -= s;
        }
      } else if (this.state === 'ended') {
        Effects.update(dt);
      }
      this.render();
      UI.updateHud(false);
    },

    update(dt) {
      this.time += dt;
      Waves.update(dt);
      Buildings.update(dt);
      Units.update(dt);
      Enemies.update(dt, this);
      Combat.update(dt);
      Effects.update(dt);
      this.gate.update(dt);
      for (const k in this.skillCd) if (this.skillCd[k] > 0) this.skillCd[k] -= dt;
      if (this.repairCd > 0) this.repairCd -= dt;
      if (this.gate.hp <= 0 && this.state === 'playing') this.defeat();
    },

    /* ================= VẼ ================= */
    render() {
      const ctx = this.ctx, d = this.dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = this.map ? this.map.theme.ground2 : '#1d1830';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      if (!this.map) return;
      const s = this.scale, t = this.time, now = performance.now() / 1000;
      ctx.setTransform(d * s, 0, 0, d * s, d * (this.offX + Effects.shakeX * s), d * (this.offY + Effects.shakeY * s));
      const W = this.map.W, H = this.map.H;
      // phần thừa ngoài bản đồ: nối tiếp tường thành / mặt đất
      ctx.fillStyle = '#4a4658'; ctx.fillRect(-W, H - 2, W * 3, 2000);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
      ctx.drawImage(this.bg, 0, 0, W, H);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';

      this.drawPortal(ctx);
      Buildings.drawPlots(ctx, now);
      Buildings.drawSelection(ctx, now);
      this.gate.draw(ctx);

      // Vẽ theo chiều sâu: trụ, lính, quái sắp theo y
      const L = this.drawList; L.length = 0;
      for (const T of Buildings.towers) L.push(T);
      for (const u of Units.list) if (u.state !== 'dead' && u.state !== 'inside') L.push(u);
      for (const e of Enemies.list) L.push(e);
      L.sort((a, b) => a.drawY - b.drawY);
      for (let i = 0; i < L.length; i++) L[i].draw(ctx, t);

      Combat.draw(ctx);
      Effects.draw(ctx);
      for (const u of Units.list) u.drawBar(ctx);
      for (const e of Enemies.list) e.drawBar(ctx);
      for (const T of Buildings.towers) T.drawOverlay(ctx);
      Effects.drawTexts(ctx);
      this.drawBossBar(ctx);
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },

    drawPortal(ctx) {
      const p = this.map.path.points[1] || this.map.path.points[0], y = Math.max(26, p.y - 26) + 6, t = this.time;
      ArtKit.glow(ctx, p.x, y, 44 + Math.sin(t * 3) * 6, '#c0303a', 0.45);
      ctx.save(); ctx.translate(p.x, y); ctx.scale(1, 0.5);
      for (let i = 0; i < 3; i++) {
        ctx.rotate(t * (1.2 + i * 0.4));
        ctx.strokeStyle = `rgba(255,${80 + i * 40},90,${0.55 - i * 0.12})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 14 + i * 8, 0, Math.PI * 1.2); ctx.stroke();
      }
      ctx.restore();
    },

    drawBossBar(ctx) {
      const b = Enemies.boss(); if (!b) return;
      const W = this.map.W, x = 70, w = W - 140, y = Waves.state === 'waiting' ? 76 : 18;
      ctx.fillStyle = 'rgba(12,8,10,0.85)'; ctx.fillRect(x - 4, y - 4, w + 8, 30);
      ctx.strokeStyle = '#b8893f'; ctx.lineWidth = 2; ctx.strokeRect(x - 4, y - 4, w + 8, 30);
      ctx.fillStyle = '#3a1418'; ctx.fillRect(x, y, w, 22);
      ctx.fillStyle = '#9e2b25'; ctx.fillRect(x, y, w * Math.max(0, b.hp / b.maxHp), 22);
      ctx.fillStyle = '#f3e6c8'; ctx.font = '800 16px "Alegreya Sans", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.name + '  ' + Math.max(0, Math.ceil(b.hp)) + '/' + b.maxHp, W / 2, y + 11);
    },

    /* ================= TÀI NGUYÊN TRONG TRẬN ================= */
    spendGold(n) {
      if (this.gold < n) { UI.toast('Không đủ vàng!'); AudioSys.play('error'); return false; }
      this.gold -= n; return true;
    },
    addGold(n, x, y) {
      this.gold += n;
      if (x !== undefined) Effects.text(x, y, '+' + n + ' vàng', '#e2b45a', 18);
    },

    killEnemy(e) {
      if (!e.alive) return;
      e.alive = false;
      this.gold += e.reward; this.killGold += e.reward; this.exp += e.exp; this.kills++;
      Effects.death(e.x, e.y - e.height * 0.4, e.isBoss ? '#9e2b25' : '#8a7f72');
      Effects.text(e.x, e.y - e.height - 14, '+' + e.reward, '#ffd23f', 16);
      AudioSys.play('death');
      if (e.isBoss) { Effects.explosion(e.x, e.y, 120, '#c0453a'); Effects.shake(14, 0.6); AudioSys.play('explode'); }
    },

    onBossSpawn(e) {
      UI.bossWarning(e.name);
      AudioSys.play('boss');
      Effects.shake(10, 0.8);
      const p = this.map.path.points[1];
      Effects.ring(p.x, Math.max(30, p.y - 30), 10, 160, 0.9, '#9e2b25', 8);
      Effects.burst(p.x, Math.max(30, p.y - 30), '#5a1018', 30, 260, 0.8, 8);
    },

    /* ================= HÀNH ĐỘNG NGƯỜI CHƠI ================= */
    skillReady(id) {
      const def = CONFIG.skills[id];
      return this.skillCd[id] <= 0 && this.hasRequirement(def);
    },
    hasRequirement(def) {
      if (!def.requires) return true;
      return def.requires === 'orc' ? Units.count('orc') > 0 : Buildings.count(def.requires) > 0;
    },

    useSkill(id) {
      if (this.state !== 'playing') return;
      const def = CONFIG.skills[id];
      if (this.pendingSkill === id) { this.pendingSkill = null; UI.hint(null); UI.updateHud(true); return; }
      if (!this.hasRequirement(def)) {
        UI.toast(def.requires === 'orc' ? 'Cần có Orc cưỡi sói trên sân' : 'Cần xây ' + CONFIG.towers[def.requires].name); AudioSys.play('error'); return;
      }
      if (this.skillCd[id] > 0) { UI.toast(def.name + ' đang hồi chiêu'); return; }
      if (def.targeted) { this.pendingSkill = id; UI.hint(def.hint); UI.updateHud(true); }
      else this.castSkill(id, 0, 0);
    },

    castSkill(id, x, y) {
      const def = CONFIG.skills[id];
      if (id === 'fireball') {
        Combat.fire('meteor', x + 60, y - 520, null, x, y, def.damage, 1, def.radius);
        Effects.ring(x, y, def.radius, def.radius, 0.6, 'rgba(255,123,46,0.9)', 3);
        AudioSys.play('magic');
      } else if (id === 'iceStorm') {
        Combat.aoe(x, y, def.radius, def.damage, 1, { factor: def.slow, duration: def.duration });
        Effects.ring(x, y, 10, def.radius, 0.6, '#9fe3ff', 8);
        Effects.burst(x, y, '#dff6ff', 40, def.radius * 2.2, 0.8, 6);
        AudioSys.play('ice');
      } else if (id === 'rage') {
        const n = Units.rage(def.duration);
        if (!n) { UI.toast('Không có Orc nào trên sân'); return; }
        UI.banner('Cuồng nộ!', 1);
        AudioSys.play('rage');
      }
      this.skillCd[id] = def.cooldown;
      this.pendingSkill = null; UI.hint(null);
      UI.updateHud(true);
    },

    repairGate() {
      const r = CONFIG.match.repair;
      if (this.state !== 'playing') return;
      if (this.repairCd > 0) { UI.toast('Thợ đang nghỉ, chờ ' + Math.ceil(this.repairCd) + ' giây'); return; }
      if (this.gate.hp >= this.gate.maxHp) { UI.toast('Cổng thành đang nguyên vẹn'); return; }
      if (!this.spendGold(r.cost)) return;
      this.gate.repair(r.percent);
      this.repairCd = r.cooldown;
      Effects.text(this.gate.x, this.gate.y - 20, '+' + Math.round(r.percent * 100) + '% máu cổng', '#7ad36b', 22);
      Effects.burst(this.gate.x, this.gate.y, '#7ad36b', 20, 200, 0.6, 6);
      AudioSys.play('build');
    },

    toggleSpeed() { this.speed = this.speed === 1 ? 2 : 1; UI.updateHud(true); },
    pause() { if (this.state === 'playing') this.paused = true; },
    resume() { this.paused = false; this.last = performance.now(); },

    /* ================= THẮNG / THUA ================= */
    victory() {
      if (this.state !== 'playing') return;
      this.state = 'ended';
      const ratio = this.gate.ratio, S = CONFIG.stars;
      const stars = ratio >= S.three ? 3 : ratio >= S.two ? 2 : 1;
      const M = CONFIG.match;
      const gold = this.stage.rewardGold + stars * M.goldPerStar + Math.floor(this.killGold * M.victoryKillGoldShare);
      const exp = this.exp + M.victoryBonusExp;
      Player.addGold(gold);
      const levelUps = Player.addExp(exp);
      const newStars = Player.recordVictory(this.stageIndex, stars);
      Effects.confetti(this.map.W / 2, this.map.H * 0.3, this.map.W);
      AudioSys.play('victory');
      setTimeout(() => UI.showResult({
        win: true, stars, gold, exp, levelUps,
        gems: newStars * CONFIG.player.gemsPerNewStar + levelUps * CONFIG.player.gemsPerLevel,
        hasNext: this.stageIndex < CONFIG.stages.length - 1
      }), 900);
    },

    defeat() {
      if (this.state !== 'playing') return;
      this.state = 'ended';
      const gold = Math.floor(this.killGold * CONFIG.match.defeatKillGoldShare);
      const exp = Math.floor(this.exp * 0.5);
      Player.addGold(gold);
      const levelUps = Player.addExp(exp);
      Effects.explosion(this.gate.x, this.gate.y + 30, 160, '#ff5a3a');
      Effects.shake(16, 0.8);
      AudioSys.play('defeat');
      setTimeout(() => UI.showResult({ win: false, gold, exp, levelUps, gems: levelUps * CONFIG.player.gemsPerLevel }), 1000);
    },

    /* ================= ĐIỀU KHIỂN CẢM ỨNG ================= */
    toWorld(cx, cy) {
      const r = this.canvas.getBoundingClientRect();
      return { x: (cx - r.left - this.offX) / this.scale, y: (cy - r.top - this.offY) / this.scale };
    },

    setupInput() {
      const c = this.canvas;
      c.addEventListener('pointerdown', e => {
        AudioSys.unlock();
        if (this.state !== 'playing' || this.paused) return;
        const w = this.toWorld(e.clientX, e.clientY);
        this.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, wx: w.x, wy: w.y, moved: false };
      });
      c.addEventListener('pointermove', e => {
        const pt = this.pointer;
        if (pt && pt.id === e.pointerId && Math.hypot(e.clientX - pt.x, e.clientY - pt.y) > TAP_MOVE_TOL) pt.moved = true;
      });
      const end = e => {
        const pt = this.pointer;
        if (!pt || pt.id !== e.pointerId) return;
        this.pointer = null;
        if (!pt.moved && e.type === 'pointerup') this.onTap(pt.wx, pt.wy);
      };
      c.addEventListener('pointerup', end);
      c.addEventListener('pointercancel', end);
      c.addEventListener('contextmenu', e => e.preventDefault());
    },

    onTap(x, y) {
      if (this.pendingSkill) { this.castSkill(this.pendingSkill, x, y); return; }
      const B = Buildings;
      if (B.rallyMode) {
        const r = B.setRally(B.rallyMode, x, y);
        if (r === 'ok') { UI.toast('Đã dời điểm tập kết'); AudioSys.play('click'); B.rallyMode = null; B.selected = null; UI.hint(null); }
        else { UI.toast(r === 'far' ? 'Quá xa trụ, chọn chỗ gần hơn' : 'Hãy chạm lên con đường'); AudioSys.play('error'); }
        return;
      }
      const slot = B.slotAt(x, y);
      if (slot && !slot.building && B.buildType) {
        const type = B.buildType;
        if (B.build(slot, type) && this.gold < CONFIG.towers[type].cost) this.exitBuildMode();
        UI.updateHud(true);
        return;
      }
      if (slot) { this.exitBuildMode(); B.selected = slot; UI.openSlotSheet(slot); return; }
      if (B.highlight || B.selected) { this.exitBuildMode(); B.selected = null; }
    },

    exitBuildMode() {
      Buildings.highlight = false; Buildings.buildType = null; UI.hint(null); UI.updateHud(true);
    }
  };

  window.Game = Game;
})();
