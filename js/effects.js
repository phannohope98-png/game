/* =========================================================
 * effects.js – Hạt, số sát thương, vòng nổ, rung màn hình
 * Dùng Object Pool để không tạo rác bộ nhớ liên tục.
 * ========================================================= */
(function () {
  const MAX_PARTICLES = 320, MAX_TEXTS = 60, MAX_RINGS = 40;

  // Xoá phần tử i khỏi mảng trong O(1) (đổi chỗ với phần tử cuối)
  function swapRemove(arr, i) { const last = arr.pop(); if (i < arr.length) arr[i] = last; }

  const Effects = {
    particles: [], pPool: [],
    texts: [], tPool: [],
    rings: [], rPool: [],
    shakeAmp: 0, shakeTime: 0, shakeX: 0, shakeY: 0,

    clear() {
      while (this.particles.length) this.pPool.push(this.particles.pop());
      while (this.texts.length) this.tPool.push(this.texts.pop());
      while (this.rings.length) this.rPool.push(this.rings.pop());
      this.shakeAmp = this.shakeTime = this.shakeX = this.shakeY = 0;
    },

    particle(x, y, vx, vy, life, color, size, gravity) {
      if (this.particles.length >= MAX_PARTICLES) return;
      const p = this.pPool.pop() || {};
      p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = p.maxLife = life;
      p.color = color; p.size = size; p.g = gravity || 0;
      this.particles.push(p);
    },

    burst(x, y, color, count, speed, life, size, gravity) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.6);
        this.particle(x, y, Math.cos(a) * s, Math.sin(a) * s, life * (0.6 + Math.random() * 0.4), color, size * (0.6 + Math.random() * 0.6), gravity);
      }
    },

    ring(x, y, r0, r1, life, color, width) {
      if (this.rings.length >= MAX_RINGS) return;
      const r = this.rPool.pop() || {};
      r.x = x; r.y = y; r.r0 = r0; r.r1 = r1; r.life = r.maxLife = life; r.color = color; r.w = width || 4;
      this.rings.push(r);
    },

    text(x, y, str, color, size, crit) {
      if (this.texts.length >= MAX_TEXTS) return;
      const t = this.tPool.pop() || {};
      t.x = x + (Math.random() - 0.5) * 14; t.y = y; t.str = str; t.color = color;
      t.size = size || 20; t.crit = !!crit; t.life = t.maxLife = crit ? 1.0 : 0.8;
      this.texts.push(t);
    },

    hit(x, y, color) { this.burst(x, y, color || '#fff', 5, 120, 0.25, 4); },
    explosion(x, y, radius, color) {
      this.ring(x, y, radius * 0.2, radius, 0.35, color || '#ffb347', 6);
      this.burst(x, y, color || '#ff7b2e', 18, radius * 3, 0.5, 7);
      this.burst(x, y, '#ffe08a', 8, radius * 2, 0.35, 5);
    },
    death(x, y, color) {
      this.burst(x, y, color || '#c9c9c9', 12, 140, 0.5, 6, 200);
      this.ring(x, y, 4, 30, 0.3, 'rgba(255,255,255,0.8)', 3);
    },
    confetti(cx, cy, w) {
      const colors = ['#f2b84b', '#e6533c', '#4fb3e8', '#7ad36b', '#c77dff'];
      for (let i = 0; i < 120; i++) {
        this.particle(cx + (Math.random() - 0.5) * w, cy - Math.random() * 200,
          (Math.random() - 0.5) * 120, -Math.random() * 250, 2 + Math.random(), colors[i % colors.length], 7, 260);
      }
    },

    shake(amp, time) {
      if (!Save.data.settings.shake) return;
      this.shakeAmp = Math.max(this.shakeAmp, amp);
      this.shakeTime = Math.max(this.shakeTime, time);
    },

    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) { this.pPool.push(p); swapRemove(this.particles, i); continue; }
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.98; if (!p.g) p.vy *= 0.98;
      }
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i];
        t.life -= dt;
        if (t.life <= 0) { this.tPool.push(t); swapRemove(this.texts, i); continue; }
        t.y -= 45 * dt;
      }
      for (let i = this.rings.length - 1; i >= 0; i--) {
        const r = this.rings[i];
        r.life -= dt;
        if (r.life <= 0) { this.rPool.push(r); swapRemove(this.rings, i); }
      }
      if (this.shakeTime > 0) {
        this.shakeTime -= dt;
        const a = this.shakeAmp * Math.min(1, this.shakeTime * 4);
        this.shakeX = (Math.random() - 0.5) * 2 * a; this.shakeY = (Math.random() - 0.5) * 2 * a;
        if (this.shakeTime <= 0) { this.shakeAmp = 0; this.shakeX = this.shakeY = 0; }
      }
    },

    draw(ctx) {
      for (let i = 0; i < this.rings.length; i++) {
        const r = this.rings[i], k = 1 - r.life / r.maxLife;
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = r.color; ctx.lineWidth = r.w;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * k, 0, Math.PI * 2); ctx.stroke();
      }
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        ctx.globalAlpha = Math.min(1, p.life / p.maxLife * 1.5);
        ctx.fillStyle = p.color;
        const s = p.size; ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    },

    drawTexts(ctx) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      for (let i = 0; i < this.texts.length; i++) {
        const t = this.texts[i], k = t.life / t.maxLife;
        const pop = t.crit ? 1 + Math.max(0, (k - 0.75)) * 3 : 1;
        ctx.globalAlpha = Math.min(1, k * 2);
        ctx.font = `900 ${Math.round(t.size * pop)}px system-ui, sans-serif`;
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,10,30,0.85)';
        ctx.strokeText(t.str, t.x, t.y); ctx.fillStyle = t.color; ctx.fillText(t.str, t.x, t.y);
      }
      ctx.globalAlpha = 1;
    }
  };

  window.Effects = Effects;
  window.swapRemove = swapRemove;
})();
