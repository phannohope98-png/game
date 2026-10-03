/* =========================================================
 * buildings.js – Ô xây & công trình (dữ liệu từ CONFIG.buildings)
 * Trại lính: tự sinh lính tới giới hạn. Mỏ vàng: sinh vàng theo thời gian.
 * ========================================================= */
(function () {
  const SLOT_R = 36;

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
      for (const s of this.slots) if (Math.abs(s.x - x) <= SLOT_R + 4 && Math.abs(s.y - y) <= SLOT_R + 4) return s;
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
            Units.spawn(b.def.unitType, Player.unitLevel(b.def.unitType), s.x, s.y, s.id);
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
      const size = GameMap.CELL - 8;
      // vẽ ô trống trước, công trình sau (để mái nhà không bị ô khác đè)
      for (const s of this.slots) if (!s.building) Painter.plot(ctx, s.x, s.y, size, this.highlight ? 'highlight' : 'empty', time);
      for (const s of this.slots) {
        const b = s.building; if (!b) continue;
        Painter.plot(ctx, s.x, s.y, size, 'built', time);
        const k = b.pulse > 0 ? 1 + b.pulse * 0.25 : 1;
        Painter.building(ctx, b.type, s.x, s.y + 4, 0.95 * k, time);
        // vạch cấp
        for (let i = 0; i < b.level; i++) {
          ctx.fillStyle = '#e2b45a'; ctx.fillRect(s.x - size / 2 + 5 + i * 9, s.y + size / 2 - 9, 6, 5);
          ctx.strokeStyle = '#17110f'; ctx.lineWidth = 1; ctx.strokeRect(s.x - size / 2 + 5 + i * 9, s.y + size / 2 - 9, 6, 5);
        }
        // thanh tiến độ sản xuất
        const total = b.def.unitType ? b.productionTime : b.def.baseProductionTime;
        const prog = Math.min(1, b.timer / total);
        if (prog > 0) {
          const w = size - 30, x0 = s.x + size / 2 - 5 - w, y0 = s.y + size / 2 - 9;
          ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x0, y0, w, 5);
          ctx.fillStyle = b.def.unitType ? '#7fb3d5' : '#e2b45a'; ctx.fillRect(x0, y0, w * prog, 5);
        }
      }
    }
  };

  window.Buildings = Buildings;
})();
