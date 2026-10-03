/* =========================================================
 * waves.js – Quản lý đợt quái
 * Trạng thái: waiting (đếm ngược) → spawning (thả quái) → fighting
 *             (chờ diệt hết) → thưởng → đợt tiếp / chiến thắng
 * ========================================================= */
(function () {
  /** "goblin:10,boss:1@0.5" → [{type:'goblin',count:10,hpMul:1}, ...] */
  function parseWave(str) {
    return str.split(',').map(s => s.trim()).filter(Boolean).map(part => {
      const [main, hp] = part.split('@');
      const [type, count, interval] = main.split(':');
      return {
        type: type.trim(), count: parseInt(count, 10) || 1,
        interval: interval ? parseFloat(interval) : (CONFIG.spawnInterval[type.trim()] || 1),
        hpMul: hp ? parseFloat(hp) : 1
      };
    });
  }

  const Waves = {
    parseWave,
    waves: [], index: -1, state: 'idle', timer: 0, queue: [], qi: 0, t: 0, game: null,

    init(game, stage) {
      this.game = game;
      // Mỗi đợt: danh sách nhóm + thưởng hoàn thành
      this.waves = stage.waves.map((w, i) => ({ groups: parseWave(w), reward: 20 + i * 10 }));
      this.index = -1; this.state = 'waiting'; this.timer = CONFIG.match.firstWaveDelay;
      this.queue = []; this.qi = 0; this.t = 0;
    },

    get total() { return this.waves.length; },
    get current() { return Math.max(0, this.index + 1); },

    /** Dựng lịch xuất hiện: các nhóm nối tiếp nhau */
    buildQueue(wave) {
      const q = []; let t = 0;
      wave.groups.forEach((g, gi) => {
        if (gi > 0) t += CONFIG.match.groupGap;
        for (let i = 0; i < g.count; i++) { q.push({ time: t, type: g.type, hpMul: g.hpMul }); t += g.interval; }
      });
      return q;
    },

    startNext(early) {
      if (this.state !== 'waiting' || this.index >= this.waves.length - 1) return;
      if (early && this.timer > 0) {
        const bonus = Math.floor(this.timer * CONFIG.match.earlyCallBonusPerSec);
        if (bonus > 0) this.game.addGold(bonus, this.game.map.spawn.x, 80);
      }
      this.index++;
      this.queue = this.buildQueue(this.waves[this.index]);
      this.qi = 0; this.t = 0; this.state = 'spawning';
      AudioSys.play('wave');
      UI.banner('Đợt ' + (this.index + 1) + '/' + this.waves.length, 1.4);
    },

    update(dt) {
      const g = this.game;
      if (this.state === 'waiting') {
        this.timer -= dt;
        if (this.timer <= 0) this.startNext(false);
      } else if (this.state === 'spawning') {
        this.t += dt;
        while (this.qi < this.queue.length && this.queue[this.qi].time <= this.t) {
          const s = this.queue[this.qi++];
          Enemies.spawn(s.type, g.stage.hpMul * s.hpMul, 0);
        }
        if (this.qi >= this.queue.length) this.state = 'fighting';
      } else if (this.state === 'fighting') {
        if (Enemies.list.length === 0) this.complete();
      }
    },

    complete() {
      const g = this.game, w = this.waves[this.index];
      if (window.Buildings) Buildings.healGuards();
      g.addGold(w.reward, g.map.W / 2, g.map.gate.y - 60);
      if (this.index >= this.waves.length - 1) {
        this.state = 'done';
        g.victory();
      } else {
        this.state = 'waiting';
        this.timer = CONFIG.match.nextWaveDelay;
      }
    }
  };

  window.Waves = Waves;
})();
