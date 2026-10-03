/* =========================================================
 * audio.js – Âm thanh
 * Mặc định dùng âm thanh TỔNG HỢP bằng Web Audio (không cần file).
 * Khai báo đường dẫn file trong CONFIG.audioFiles để thay bằng âm thật.
 * ========================================================= */
(function () {
  const AudioSys = {
    ctx: null, master: null, sfxGain: null, musicGain: null,
    buffers: {}, lastPlay: {}, musicTimer: null, musicStep: 0, musicSource: null,
    musicOn: true, soundOn: true, currentMusic: null,

    /** Gọi trong sự kiện chạm đầu tiên (iOS bắt buộc) */
    unlock() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.6; this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.22; this.musicGain.connect(this.master);
      this.loadFiles();
      if (this.currentMusic) this.playMusic(this.currentMusic);
    },

    loadFiles() {
      const files = CONFIG.audioFiles || {};
      Object.keys(files).forEach(name => {
        const url = files[name];
        if (!url) return;
        fetch(url).then(r => r.arrayBuffer()).then(b => this.ctx.decodeAudioData(b))
          .then(buf => { this.buffers[name] = buf; }).catch(() => { /* giữ âm tổng hợp */ });
      });
    },

    setMusic(on) { this.musicOn = on; if (on) { if (this.currentMusic) this.playMusic(this.currentMusic); } else this.stopMusic(true); },
    setSound(on) { this.soundOn = on; },

    /* ---------- Hiệu ứng âm thanh ---------- */
    play(name) {
      if (!this.soundOn || !this.ctx) return;
      const now = this.ctx.currentTime;
      if (this.lastPlay[name] && now - this.lastPlay[name] < 0.05) return; // chống dồn tiếng
      this.lastPlay[name] = now;
      if (this.buffers[name]) { this.playBuffer(this.buffers[name], this.sfxGain); return; }
      const fn = SYNTH[name];
      if (fn) fn(this, now);
    },

    playBuffer(buf, dest, loop) {
      const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = !!loop; s.connect(dest); s.start(); return s;
    },

    tone(type, f0, f1, dur, vol, t, dest) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest || this.sfxGain); o.start(t); o.stop(t + dur + 0.02);
    },

    noise(dur, vol, t, freq, q) {
      const c = this.ctx;
      if (!this._noise) {
        const b = c.createBuffer(1, c.sampleRate, c.sampleRate), ch = b.getChannelData(0);
        for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
        this._noise = b;
      }
      const s = c.createBufferSource(); s.buffer = this._noise;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1000; f.Q.value = q || 1;
      const g = c.createGain();
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.sfxGain); s.start(t); s.stop(t + dur + 0.02);
    },

    /* ---------- Nhạc nền ---------- */
    playMusic(kind) {
      this.currentMusic = kind;
      if (!this.ctx || !this.musicOn) return;
      this.stopMusic(false);
      if (this.buffers.music) { this.musicSource = this.playBuffer(this.buffers.music, this.musicGain, true); return; }
      const pattern = MUSIC[kind] || MUSIC.menu;
      this.musicStep = 0;
      const stepDur = pattern.tempo;
      let next = this.ctx.currentTime + 0.05;
      // Bộ lập lịch đơn giản: lên lịch trước ~0.3s
      this.musicTimer = setInterval(() => {
        if (!this.ctx) return;
        while (next < this.ctx.currentTime + 0.3) {
          const i = this.musicStep % pattern.melody.length;
          const m = pattern.melody[i], b = pattern.bass[i % pattern.bass.length];
          if (m) this.tone('triangle', m, m, stepDur * 0.9, 0.35, next, this.musicGain);
          if (b) this.tone('sine', b, b, stepDur * 1.8, 0.5, next, this.musicGain);
          this.musicStep++; next += stepDur;
        }
      }, 100);
    },
    stopMusic(clearKind) {
      if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
      if (this.musicSource) { try { this.musicSource.stop(); } catch (e) {} this.musicSource = null; }
      if (clearKind) { /* giữ currentMusic để bật lại */ }
    }
  };

  // Nốt nhạc (Hz) – ngũ cung Rê thứ cho không khí fantasy
  const N = { D3: 146.8, F3: 174.6, G3: 196, A3: 220, C4: 261.6, D4: 293.7, F4: 349.2, G4: 392, A4: 440, C5: 523.3, D5: 587.3 };
  const MUSIC = {
    menu: { tempo: 0.32,
      melody: [N.D4, 0, N.F4, N.G4, N.A4, 0, N.G4, N.F4, N.D4, 0, N.C4, N.D4, N.F4, 0, 0, 0],
      bass: [N.D3, 0, 0, 0, N.A3, 0, 0, 0, N.F3, 0, 0, 0, N.G3, 0, 0, 0] },
    battle: { tempo: 0.2,
      melody: [N.D4, N.D4, N.F4, N.D4, N.G4, N.F4, N.D4, 0, N.A4, N.G4, N.F4, N.G4, N.A4, 0, N.C5, N.A4],
      bass: [N.D3, 0, N.D3, 0, N.F3, 0, N.F3, 0, N.G3, 0, N.G3, 0, N.A3, 0, N.A3, 0] }
  };

  // Âm thanh tổng hợp (placeholder)
  const SYNTH = {
    click:   (a, t) => a.tone('sine', 660, 880, 0.07, 0.3, t),
    arrow:   (a, t) => { a.noise(0.08, 0.25, t, 3000, 2); a.tone('triangle', 900, 500, 0.06, 0.08, t); },
    magic:   (a, t) => { a.tone('sine', 400, 1200, 0.25, 0.18, t); a.tone('triangle', 800, 1600, 0.2, 0.08, t + 0.03); },
    orc:     (a, t) => { a.tone('square', 140, 60, 0.12, 0.18, t); a.noise(0.08, 0.25, t, 400, 1); },
    hit:     (a, t) => a.noise(0.05, 0.15, t, 1500, 1),
    sword:   (a, t) => { a.noise(0.07, 0.2, t, 4200, 3); a.tone('triangle', 1400, 700, 0.07, 0.07, t); },
    death:   (a, t) => a.tone('sawtooth', 300, 80, 0.18, 0.1, t),
    gold:    (a, t) => { a.tone('sine', 1200, 1200, 0.06, 0.12, t); a.tone('sine', 1800, 1800, 0.08, 0.1, t + 0.05); },
    build:   (a, t) => { a.tone('square', 200, 120, 0.1, 0.15, t); a.tone('square', 260, 160, 0.1, 0.12, t + 0.1); },
    explode: (a, t) => { a.noise(0.4, 0.5, t, 300, 0.7); a.tone('sine', 120, 40, 0.35, 0.3, t); },
    ice:     (a, t) => { a.noise(0.5, 0.2, t, 5000, 3); a.tone('sine', 1500, 600, 0.4, 0.08, t); },
    rage:    (a, t) => { a.tone('sawtooth', 110, 220, 0.4, 0.2, t); a.tone('square', 90, 180, 0.4, 0.1, t); },
    gateHit: (a, t) => { a.noise(0.15, 0.3, t, 250, 1); a.tone('square', 90, 60, 0.12, 0.12, t); },
    boss:    (a, t) => { a.tone('sawtooth', 70, 50, 1.2, 0.35, t); a.tone('sawtooth', 105, 75, 1.2, 0.2, t + 0.1); a.noise(1, 0.2, t, 200, 0.5); },
    wave:    (a, t) => { a.tone('triangle', 440, 440, 0.15, 0.2, t); a.tone('triangle', 660, 660, 0.25, 0.2, t + 0.15); },
    victory: (a, t) => { [523, 659, 784, 1047].forEach((f, i) => a.tone('triangle', f, f, 0.3, 0.25, t + i * 0.13)); },
    defeat:  (a, t) => { [392, 349, 311, 262].forEach((f, i) => a.tone('sawtooth', f, f * 0.98, 0.35, 0.12, t + i * 0.22)); },
    error:   (a, t) => a.tone('square', 200, 150, 0.12, 0.12, t)
  };

  window.AudioSys = AudioSys;
})();
