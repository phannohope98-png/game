/* =========================================================
 * gate.js – Cổng thành (mục tiêu cần bảo vệ)
 * ========================================================= */
(function () {
  class Gate {
    constructor(level, x, y, W, H) {
      const lv = CONFIG.gate.levels[level - 1];
      this.id = 'gate'; this.level = level;
      this.maxHp = lv.hp; this.hp = lv.hp; this.armor = lv.armor;
      this.x = x; this.y = y; this.W = W; this.H = H;
      this.flash = 0;
    }

    get ratio() { return Math.max(0, this.hp / this.maxHp); }

    takeDamage(raw) {
      if (this.hp <= 0) return 0;
      const r = Combat.calc(raw, 1, this.armor);
      this.hp = Math.max(0, this.hp - r.amount);
      this.flash = 0.18;
      Effects.text(this.x + (Math.random() - 0.5) * 80, this.y + 10, '-' + r.amount, '#ff5a4a', 22, r.crit);
      Effects.burst(this.x + (Math.random() - 0.5) * 60, this.y + 8, '#9a8f86', 6, 140, 0.4, 6, 300);
      Effects.shake(r.amount > 60 ? 9 : 4, 0.2);
      AudioSys.play('gateHit');
      return r.amount;
    }

    repair(percent) { this.hp = Math.min(this.maxHp, this.hp + this.maxHp * percent); }

    update(dt) { if (this.flash > 0) this.flash -= dt; }

    draw(ctx) {
      const { x, y, W, H } = this;
      const wallTop = y + 10, h = H - wallTop;
      // Tường thành
      ctx.fillStyle = '#7d7a8a'; ctx.fillRect(0, wallTop, W, h);
      ctx.fillStyle = '#6a6777';
      for (let row = 0; row * 22 < h; row++) {
        for (let col = 0; col * 56 < W + 56; col++) {
          const ox = (row % 2) * 28;
          ctx.fillRect(col * 56 - ox + 2, wallTop + row * 22 + 2, 52, 18);
        }
      }
      // Răng cưa trên tường
      ctx.fillStyle = '#8e8b9b';
      for (let i = 0; i < W; i += 40) ctx.fillRect(i + 4, wallTop - 16, 24, 18);

      // Hai tháp canh
      [x - 110, x + 110].forEach(tx => {
        ctx.fillStyle = '#86839a'; ctx.fillRect(tx - 34, wallTop - 46, 68, h + 46);
        ctx.fillStyle = '#9b98ad';
        for (let i = 0; i < 3; i++) ctx.fillRect(tx - 34 + i * 26, wallTop - 62, 16, 18);
        ctx.fillStyle = '#2b2236'; ctx.fillRect(tx - 6, wallTop - 26, 12, 22);
        // cờ
        ctx.fillStyle = '#5b4a2e'; ctx.fillRect(tx - 1, wallTop - 100, 3, 40);
        ctx.fillStyle = '#e6533c';
        ctx.beginPath(); ctx.moveTo(tx + 2, wallTop - 100); ctx.lineTo(tx + 30, wallTop - 92); ctx.lineTo(tx + 2, wallTop - 84); ctx.fill();
      });

      // Cửa cổng (vòm)
      const dw = 92, dh = Math.min(h - 6, 120);
      ctx.fillStyle = '#4a3a2c';
      ctx.beginPath();
      ctx.moveTo(x - dw / 2, wallTop + dh); ctx.lineTo(x - dw / 2, wallTop + 30);
      ctx.arc(x, wallTop + 30, dw / 2, Math.PI, 0); ctx.lineTo(x + dw / 2, wallTop + dh); ctx.fill();
      ctx.strokeStyle = '#2e241b'; ctx.lineWidth = 4;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(x + i * 18, wallTop + (Math.abs(i) === 2 ? 22 : 0) + 4); ctx.lineTo(x + i * 18, wallTop + dh); ctx.stroke();
      }

      // Vết nứt khi máu thấp
      if (this.ratio < 0.5) {
        ctx.strokeStyle = 'rgba(30,20,20,0.7)'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 160, wallTop + 4); ctx.lineTo(x - 150, wallTop + 30); ctx.lineTo(x - 170, wallTop + 52);
        ctx.moveTo(x + 150, wallTop + 6); ctx.lineTo(x + 165, wallTop + 34); ctx.lineTo(x + 150, wallTop + 60);
        if (this.ratio < 0.25) { ctx.moveTo(x - 30, wallTop + 10); ctx.lineTo(x - 10, wallTop + 40); ctx.lineTo(x - 26, wallTop + 70); }
        ctx.stroke();
      }

      // Nháy đỏ khi bị đánh
      if (this.flash > 0) {
        ctx.globalAlpha = Math.min(0.45, this.flash * 3);
        ctx.fillStyle = '#ff2a2a'; ctx.fillRect(0, wallTop - 60, W, h + 60);
        ctx.globalAlpha = 1;
      }
    }
  }

  window.Gate = Gate;
})();
