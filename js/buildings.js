/* =========================================================
 * buildings.js – Ô xây & công trình (dữ liệu từ CONFIG.buildings)
 * Trại lính: tự sinh lính tới giới hạn. Mỏ vàng: sinh vàng theo thời gian.
 * ========================================================= */
(function () {
  const SLOT_R = 34;

  function makeBuilding(type, level, slotId) {
    const def = CONFIG.buildings[type];
    return {
      id: slotId, type, def, level,
      hp: def.hp, maxHp: def.hp,
      cost: def.cost, spent: def.cost,
      get upgradeCost() { return this.level >= def.levels.length ? null : def.upgradeCost[this.level]; },
      get productionTime() { return def.baseProductionTime / (def.levels[this.level - 1].productionSpeed || 1); },
      unitType: def.unitType,
      timer: 0, pulse: 0
    };
  }

  const Buildings = {
    SLOT_R,
    slots: [], highlight: false, game: null,

    init(game, slotPositions) {
      this.game = game;
      this.slots = slotPositions.map((p, i) => ({ id: i, x: p.x, y: p.y, building: null }));
      this.highlight = false;
    },

    slotAt(x, y) {
      for (const s of this.slots) if (Math.hypot(s.x - x, s.y - y) <= SLOT_R + 14) return s;
      return null;
    },

    build(slot, type) {
      const g = this.game, def = CONFIG.buildings[type];
      if (slot.building || !g.spendGold(def.cost)) return false;
      // cấp khởi điểm lấy từ nâng cấp vĩnh viễn
      const b = makeBuilding(type, Player.buildingLevel(type), slot.id);
      b.spent = def.cost;
      if (def.unitType) b.timer = b.productionTime * 0.7; // lính đầu tiên ra nhanh
      slot.building = b;
      Effects.burst(slot.x, slot.y, '#d9c7a0', 16, 160, 0.5, 6, 200);
      Effects.ring(slot.x, slot.y, 10, 60, 0.4, '#f2b84b', 4);
      AudioSys.play('build');
      return true;
    },

    upgrade(slot) {
      const b = slot.building, cost = b && b.upgradeCost;
      if (!b || cost === null || !this.game.spendGold(cost)) return false;
      b.level++; b.spent += cost;
      Effects.ring(slot.x, slot.y, 10, 70, 0.5, '#ffd23f', 5);
      Effects.text(slot.x, slot.y - 40, 'Cấp ' + b.level + '!', '#ffd23f', 22);
      AudioSys.play('build');
      return true;
    },

    sell(slot) {
      const b = slot.building; if (!b) return 0;
      const refund = Math.floor(b.spent * CONFIG.match.sellRefund);
      this.game.addGold(refund, slot.x, slot.y);
      slot.building = null;
      Effects.burst(slot.x, slot.y, '#a08a6a', 14, 140, 0.5, 6, 200);
      return refund;
    },

    update(dt) {
      const g = this.game;
      for (const s of this.slots) {
        const b = s.building; if (!b) continue;
        if (b.pulse > 0) b.pulse -= dt;
        if (b.def.unitType) {
          const lv = b.def.levels[b.level - 1];
          const full = Units.countOwned(s.id) >= lv.maxUnits || Units.count() >= CONFIG.match.maxUnits;
          if (full) { b.timer = Math.min(b.timer, b.productionTime * 0.5); continue; }
          b.timer += dt;
          if (b.timer >= b.productionTime) {
            b.timer = 0; b.pulse = 0.3;
            Units.spawn(b.def.unitType, Player.unitLevel(b.def.unitType), s.x, s.y + 10, s.id);
          }
        } else if (b.def.levels[0].income) {
          b.timer += dt;
          if (b.timer >= b.def.baseProductionTime) {
            b.timer = 0; b.pulse = 0.3;
            const inc = b.def.levels[b.level - 1].income;
            g.addGold(inc, s.x, s.y - 30);
            AudioSys.play('gold');
          }
        }
      }
    },

    draw(ctx, time) {
      for (const s of this.slots) {
        const b = s.building;
        if (!b) {
          // Ô trống
          const pulse = this.highlight ? 1 + Math.sin(time * 6) * 0.08 : 1;
          ctx.fillStyle = this.highlight ? 'rgba(242,184,75,0.35)' : 'rgba(0,0,0,0.22)';
          ctx.beginPath(); ctx.arc(s.x, s.y, SLOT_R * pulse, 0, Math.PI * 2); ctx.fill();
          ctx.setLineDash([6, 6]); ctx.lineWidth = 3;
          ctx.strokeStyle = this.highlight ? '#ffd27a' : 'rgba(255,255,255,0.55)';
          ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = this.highlight ? '#fff3d6' : 'rgba(255,255,255,0.75)';
          ctx.font = '900 30px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('+', s.x, s.y + 1);
          continue;
        }
        const k = b.pulse > 0 ? 1 + b.pulse * 0.4 : 1;
        const x = s.x, y = s.y;
        // bóng
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(x, y + 26, 38, 12, 0, 0, Math.PI * 2); ctx.fill();
        // thân nhà
        ctx.fillStyle = '#cdb994'; ctx.fillRect(x - 28 * k, y - 10 * k, 56 * k, 36 * k);
        ctx.fillStyle = '#a99472'; ctx.fillRect(x - 28 * k, y + 18 * k, 56 * k, 8 * k);
        // mái
        ctx.fillStyle = b.def.color;
        ctx.beginPath(); ctx.moveTo(x - 36 * k, y - 8 * k); ctx.lineTo(x, y - 40 * k); ctx.lineTo(x + 36 * k, y - 8 * k); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.stroke();
        Sprites.draw(ctx, { emoji: b.def.icon }, x, y + 8, 24);
        // sao cấp
        ctx.fillStyle = '#ffd23f';
        for (let i = 0; i < b.level; i++) {
          ctx.beginPath(); ctx.arc(x - (b.level - 1) * 7 + i * 14, y - 46, 4, 0, Math.PI * 2); ctx.fill();
        }
        // vòng tiến độ sản xuất
        const total = b.def.unitType ? b.productionTime : b.def.baseProductionTime;
        const prog = Math.min(1, b.timer / total);
        if (prog > 0) {
          ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(x, y + 6, 40, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); ctx.stroke();
        }
      }
    }
  };

  window.Buildings = Buildings;
})();
