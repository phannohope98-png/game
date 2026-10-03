/* =========================================================
 * gate.js – Cổng thành (mục tiêu cần bảo vệ)
 * Phần tường tĩnh được vẽ sẵn vào nền (paintWall).
 * Mỗi khung chỉ vẽ cánh cổng, cờ, vết nứt và hiệu ứng bị đánh.
 * Cánh cổng tự mở khi lính về thành hồi máu / ra trận.
 * ========================================================= */
(function () {
  const K = ArtKit;

  function wallFace(g, x, y, w, h, base) {
    K.rect(g, x, y, w, h, base, 0, { dir: 'v', hi: 0.12, lo: -0.35, lw: 1.4 });
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.strokeStyle = 'rgba(20,10,30,0.28)'; g.lineWidth = 1;
    for (let r = 0, yy = y + 13; yy < y + h; yy += 13, r++) {
      g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke();
      for (let xx = x + (r % 2 ? 0 : 13); xx < x + w; xx += 26) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 13); g.stroke(); }
    }
    g.fillStyle = 'rgba(255,240,220,0.08)'; g.fillRect(x, y, w, 4);
    g.restore();
  }
  function battlements(g, x0, x1, y, base) {
    for (let x = x0; x < x1; x += 30) K.rect(g, x + 3, y - 14, 18, 16, base, 2, { dir: 'v', hi: 0.25, lo: -0.25, lw: 1.2 });
  }
  function roundTower(g, cx, top, bottom, w, base, roof) {
    const rx = w / 2, ry = rx * 0.3;
    g.beginPath(); g.moveTo(cx - rx, top); g.lineTo(cx - rx, bottom); g.lineTo(cx + rx, bottom); g.lineTo(cx + rx, top); g.ellipse(cx, top, rx, ry, 0, 0, Math.PI); g.closePath();
    const gr = g.createLinearGradient(cx - rx, 0, cx + rx, 0); gr.addColorStop(0, K.shade(base, 0.25)); gr.addColorStop(0.4, base); gr.addColorStop(1, K.shade(base, -0.42));
    g.fillStyle = gr; g.fill(); g.strokeStyle = K.shade(base, -0.62); g.lineWidth = 1.4; g.stroke();
    g.save(); g.clip(); g.strokeStyle = 'rgba(20,10,30,0.25)'; g.lineWidth = 1;
    for (let yy = top + 12; yy < bottom; yy += 12) { g.beginPath(); g.ellipse(cx, yy, rx, ry, 0, 0, Math.PI); g.stroke(); }
    g.restore();
    // mái
    g.beginPath(); g.moveTo(cx - rx - 6, top); g.quadraticCurveTo(cx - rx * 0.4, top - 30, cx, top - 58); g.quadraticCurveTo(cx + rx * 0.4, top - 30, cx + rx + 6, top); g.ellipse(cx, top, rx + 6, ry + 2, 0, 0, Math.PI); g.closePath();
    const rg = g.createLinearGradient(cx - rx, 0, cx + rx, 0); rg.addColorStop(0, K.shade(roof, 0.3)); rg.addColorStop(0.45, roof); rg.addColorStop(1, K.shade(roof, -0.45));
    g.fillStyle = rg; g.fill(); g.strokeStyle = K.shade(roof, -0.65); g.lineWidth = 1.4; g.stroke();
    g.strokeStyle = '#e4b95a'; g.lineWidth = 2.4; g.beginPath(); g.ellipse(cx, top, rx + 6, ry + 2, 0, 0.05, Math.PI - 0.05); g.stroke();
    // cửa sổ sáng
    K.rr(g, cx - 4, top + 16, 8, 14, 4); g.fillStyle = '#ffd98a'; g.fill(); g.strokeStyle = '#2a1c30'; g.lineWidth = 1.4; g.stroke();
    K.glow(g, cx, top + 23, 16, '#ffc860', 0.5);
  }

  class Gate {
    constructor(level, x, y, W, H) {
      const lv = CONFIG.gate.levels[level - 1];
      this.id = 'gate'; this.level = level;
      this.maxHp = lv.hp; this.hp = lv.hp; this.armor = lv.armor;
      this.x = x; this.y = y; this.W = W; this.H = H;
      this.flash = 0; this.open = 0; this.openHold = 0; this.t = 0;
    }

    get ratio() { return Math.max(0, this.hp / this.maxHp); }

    /** Giữ cổng mở thêm `sec` giây (lính đi qua) */
    holdOpen(sec) { this.openHold = Math.max(this.openHold, sec); }

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

    update(dt) {
      this.t += dt;
      if (this.flash > 0) this.flash -= dt;
      if (this.openHold > 0) this.openHold -= dt;
      const target = this.openHold > 0 ? 1 : 0;
      this.open += Math.sign(target - this.open) * Math.min(Math.abs(target - this.open), dt * 3);
    }

    /** Vị trí cửa (lính đi vào / ra) */
    get doorX() { return this.x; }
    get doorY() { return this.y + 34; }

    draw(ctx) {
      const { x, y, W, H } = this, wallTop = y + 10;
      const dw = 70, dh = 78, dy = wallTop + 8;
      // khoảng tối trong cổng
      ctx.beginPath(); ctx.moveTo(x - dw / 2, dy + dh); ctx.lineTo(x - dw / 2, dy + dw / 2); ctx.arc(x, dy + dw / 2, dw / 2, Math.PI, 0); ctx.lineTo(x + dw / 2, dy + dh); ctx.closePath();
      const ig = ctx.createLinearGradient(0, dy, 0, dy + dh); ig.addColorStop(0, '#120a10'); ig.addColorStop(1, '#3a2418');
      ctx.fillStyle = ig; ctx.fill();
      K.glow(ctx, x, dy + dh * 0.7, 40, '#ffb050', 0.35 * this.open);
      // hai cánh cổng gỗ (mở ra hai bên)
      const k = 1 - this.open * 0.85;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(x + s * dw / 2, 0); ctx.scale(k, 1);
        ctx.beginPath(); ctx.moveTo(0, dy + dh); ctx.lineTo(0, dy + dw / 2);
        ctx.arc(-s * dw / 2, dy + dw / 2, dw / 2, s < 0 ? Math.PI : 0, -Math.PI / 2, s > 0); ctx.lineTo(-s * dw / 2, dy + dh); ctx.closePath();
        ctx.save(); ctx.clip();
        const wg = ctx.createLinearGradient(0, dy, 0, dy + dh); wg.addColorStop(0, '#8a5a34'); wg.addColorStop(1, '#5a3a22');
        ctx.fillStyle = wg; ctx.fillRect(-dw, dy - 4, dw * 2, dh + 8);
        ctx.strokeStyle = 'rgba(30,14,6,0.55)'; ctx.lineWidth = 1.2;
        for (let i = 1; i < 4; i++) { const xx = -s * dw / 2 * i / 4; ctx.beginPath(); ctx.moveTo(xx, dy); ctx.lineTo(xx, dy + dh); ctx.stroke(); }
        ctx.fillStyle = '#3c3f4a';
        for (const yy of [dy + 30, dy + 58]) { ctx.fillRect(-dw, yy, dw * 2, 5); }
        ctx.fillStyle = '#9ea4b2'; for (const yy of [dy + 32.5, dy + 60.5]) for (let i = 1; i < 4; i++) K.dot(ctx, -s * dw / 2 * i / 4, yy, 1.2, '#b8bec9');
        ctx.restore();
        ctx.strokeStyle = '#2a1810'; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.restore();
      }
      // vòm đá viền
      ctx.strokeStyle = '#5b5868'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, dy + dw / 2, dw / 2 + 3, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = '#8e8a9c'; ctx.lineWidth = 3; ctx.stroke();
      K.rect(ctx, x - 6, dy - 6, 12, 10, '#c9a24a', 2, { lw: 1 });

      // cờ trên 2 tháp
      for (const tx of [x - 112, x + 112]) {
        const top = wallTop - 52 - 58, ph = this.t * 4;
        K.line(ctx, tx, top + 4, tx, top - 22, '#5a3a22', 2.2);
        ctx.beginPath(); ctx.moveTo(tx, top - 22);
        for (let i = 0; i <= 6; i++) { const f = i / 6; ctx.lineTo(tx + f * 26, top - 22 + Math.sin(ph + f * 3) * 2.5 * f); }
        for (let i = 6; i >= 0; i--) { const f = i / 6; ctx.lineTo(tx + f * 22, top - 8 + Math.sin(ph + f * 3 + 0.4) * 2.5 * f); }
        ctx.closePath(); K.paint(ctx, '#3f78c4', [tx, top - 22, tx + 26, top - 8], { dir: 'h' });
      }

      // vết nứt khi máu thấp
      if (this.ratio < 0.5) {
        ctx.strokeStyle = 'rgba(25,15,20,0.8)'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 160, wallTop + 4); ctx.lineTo(x - 150, wallTop + 30); ctx.lineTo(x - 170, wallTop + 52); ctx.lineTo(x - 160, wallTop + 70);
        ctx.moveTo(x + 150, wallTop + 6); ctx.lineTo(x + 165, wallTop + 34); ctx.lineTo(x + 150, wallTop + 60);
        if (this.ratio < 0.25) { ctx.moveTo(x - 60, wallTop + 4); ctx.lineTo(x - 48, wallTop + 30); ctx.lineTo(x - 62, wallTop + 56); ctx.moveTo(x + 230, wallTop + 10); ctx.lineTo(x + 245, wallTop + 40); }
        ctx.stroke();
      }
      if (this.flash > 0) {
        ctx.globalAlpha = Math.min(0.4, this.flash * 3);
        ctx.fillStyle = '#ff2a2a'; ctx.fillRect(0, wallTop - 60, W, H - wallTop + 60);
        ctx.globalAlpha = 1;
      }
    }
  }

  /** Vẽ tường thành tĩnh vào nền */
  Gate.paintWall = function (g, map) {
    const W = map.W, H = map.H, x = W / 2, y = map.gate.y, wallTop = y + 10, STONE = '#8e8aa0';
    // thềm đất trước cổng
    K.shadow(g, x, wallTop + 2, W * 0.6, 22, 0.35);
    wallFace(g, -2, wallTop, W + 4, H - wallTop + 2, STONE);
    // lối đi trên tường
    K.rect(g, -2, wallTop - 4, W + 4, 6, K.shade(STONE, 0.12), 0, { lw: 1.2 });
    battlements(g, -6, W, wallTop - 4, K.shade(STONE, 0.08));
    // cột cổng
    for (const s of [-1, 1]) K.rect(g, x + s * 46 - 9, wallTop - 10, 18, 110, K.shade(STONE, 0.05), 2, { dir: 'h' });
    // hai tháp canh tròn
    for (const tx of [x - 112, x + 112]) roundTower(g, tx, wallTop - 52, H + 4, 62, '#9a96ac', '#3f6fb8');
    // tháp góc
    for (const tx of [26, W - 26]) roundTower(g, tx, wallTop - 20, H + 4, 46, '#8a869c', '#36609e');
    // dây leo
    g.fillStyle = 'rgba(70,120,50,0.8)';
    for (const [vx, vy] of [[x - 200, wallTop + 6], [x + 190, wallTop + 10], [x - 40, wallTop + 70]]) for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(vx + Math.sin(i * 1.7) * 6, vy + i * 6, 4, 2.6, 0.5, 0, Math.PI * 2); g.fill(); }
  };

  window.Gate = Gate;
})();
