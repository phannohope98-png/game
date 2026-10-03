/* =========================================================
 * player.js – Tiến trình lâu dài của người chơi
 * (kho vàng, kim cương, EXP, cấp, nâng cấp lính/công trình/cổng)
 * ========================================================= */
(function () {
  const d = () => Save.data;
  const persist = () => Save.save();

  const Player = {
    gold() { return d().gold; },
    gems() { return d().gems; },
    level() { return d().playerLevel; },

    addGold(n) { d().gold += Math.max(0, Math.floor(n)); persist(); },
    spendGold(n) { if (d().gold < n) return false; d().gold -= n; persist(); return true; },
    addGems(n) { d().gems += Math.max(0, Math.floor(n)); persist(); },
    spendGems(n) { if (d().gems < n) return false; d().gems -= n; persist(); return true; },

    /** Cộng EXP, trả về số cấp vừa lên */
    addExp(n) {
      const t = CONFIG.player.levelExp, s = d();
      s.playerXP += Math.max(0, Math.floor(n));
      let ups = 0;
      while (s.playerLevel < t.length && s.playerXP >= t[s.playerLevel]) {
        s.playerLevel++; ups++;
        s.gems += CONFIG.player.gemsPerLevel;
      }
      persist();
      return ups;
    },

    /** { cur, need, ratio, max } để vẽ thanh EXP */
    expProgress() {
      const t = CONFIG.player.levelExp, s = d();
      if (s.playerLevel >= t.length) return { cur: s.playerXP, need: s.playerXP, ratio: 1, max: true };
      const base = t[s.playerLevel - 1], next = t[s.playerLevel];
      return { cur: s.playerXP - base, need: next - base, ratio: (s.playerXP - base) / (next - base), max: false };
    },

    /* ---- Nâng cấp vĩnh viễn từng loại trụ ---- */
    towerLevel(type) { return d().towerLevels[type] || 0; },
    /** Phần trăm cộng thêm (0.08 = +8%) cho sát thương trụ & máu/sát thương lính */
    towerBonus(type) { return this.towerLevel(type) * CONFIG.research.perLevel; },
    towerUpgradeCost(type) {
      const lv = this.towerLevel(type), R = CONFIG.research;
      return lv >= R.maxLevel ? null : R.cost[lv];
    },
    upgradeTower(type) {
      const cost = this.towerUpgradeCost(type);
      if (cost === null || !this.spendGold(cost)) return false;
      d().towerLevels[type] = this.towerLevel(type) + 1; persist(); return true;
    },

    /* ---- Cổng ---- */
    gateLevel() { return d().gateLevel; },
    gateUpgradeCost() {
      const lv = d().gateLevel;
      return lv >= CONFIG.gate.levels.length ? null : CONFIG.gate.upgradeCost[lv];
    },
    upgradeGate() {
      const cost = this.gateUpgradeCost();
      if (cost === null || !this.spendGold(cost)) return false;
      d().gateLevel++; persist(); return true;
    },

    /* ---- Vàng khởi đầu ---- */
    startGold() { return CONFIG.match.startGold + d().startGoldLevel * CONFIG.upgrades.startGold.perLevel; },
    startGoldUpgradeCost() {
      const u = CONFIG.upgrades.startGold, lv = d().startGoldLevel;
      return lv >= u.maxLevel ? null : u.cost[lv];
    },
    upgradeStartGold() {
      const cost = this.startGoldUpgradeCost();
      if (cost === null || !this.spendGold(cost)) return false;
      d().startGoldLevel++; persist(); return true;
    },

    /* ---- Chiến dịch ---- */
    isUnlocked(i) { return i < d().unlockedLevels; },
    stageStars(i) { return d().stars[i] || 0; },
    totalStars() { return Object.values(d().stars).reduce((a, b) => a + b, 0); },
    /** Ghi kết quả thắng. Trả về số sao MỚI đạt được (để thưởng kim cương). */
    recordVictory(i, stars) {
      const s = d(), old = s.stars[i] || 0, gained = Math.max(0, stars - old);
      if (stars > old) s.stars[i] = stars;
      if (s.unlockedLevels < Math.min(CONFIG.stages.length, i + 2)) s.unlockedLevels = Math.min(CONFIG.stages.length, i + 2);
      s.gems += gained * CONFIG.player.gemsPerNewStar;
      persist();
      return gained;
    },

    settings() { return d().settings; },
    setSetting(k, v) { d().settings[k] = v; persist(); }
  };

  window.Player = Player;
})();
