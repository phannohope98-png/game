/* =========================================================
 * save.js – Tiến trình người chơi (localStorage)
 * ========================================================= */
(function () {
  const KEY = 'canhcong_v3';
  function defaults() {
    const upgrades = {}; Object.keys(CONFIG.upgrades).forEach(k => { upgrades[k] = 0; });
    return { stars: {}, unlocked: 1, upgrades, heroXp: 0, seen: {}, settings: { music: true, sound: true, shake: true } };
  }
  const Save = {
    data: null,
    load() {
      let p = null; try { p = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
      const d = defaults();
      if (p && typeof p === 'object') {
        Object.assign(d.stars, p.stars || {}); Object.assign(d.upgrades, p.upgrades || {}); Object.assign(d.seen, p.seen || {}); Object.assign(d.settings, p.settings || {});
        d.unlocked = p.unlocked || 1; d.heroXp = p.heroXp || 0;
      }
      this.data = d; return d;
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {} },
    reset() { try { localStorage.removeItem(KEY); } catch (e) {} this.data = defaults(); this.save(); }
  };

  /** Tiện ích tiến trình */
  const Progress = {
    totalStars() { return Object.values(Save.data.stars).reduce((a, b) => a + b, 0); },
    spentStars() { let n = 0; for (const k in Save.data.upgrades) { const c = CONFIG.upgrades[k].cost; for (let i = 0; i < Save.data.upgrades[k]; i++) n += c[i]; } return n; },
    freeStars() { return this.totalStars() - this.spentStars(); },
    upLevel(type) { return Save.data.upgrades[type] || 0; },
    bonus(type, stat) { const u = CONFIG.upgrades[type]; return u && u.perLevel[stat] ? u.perLevel[stat] * this.upLevel(type) : 0; },
    buyUpgrade(type) {
      const u = CONFIG.upgrades[type], lv = this.upLevel(type);
      if (lv >= u.cost.length || this.freeStars() < u.cost[lv]) return false;
      Save.data.upgrades[type] = lv + 1; Save.save(); return true;
    },
    heroLevel() { const t = CONFIG.hero.levelXp; let lv = 1; while (lv < t.length && Save.data.heroXp >= t[lv]) lv++; return lv; },
    heroXpProgress() { const t = CONFIG.hero.levelXp, lv = this.heroLevel(); if (lv >= t.length) return 1; return (Save.data.heroXp - t[lv - 1]) / (t[lv] - t[lv - 1]); },
    recordWin(i, stars) {
      const s = Save.data, old = s.stars[i] || 0;
      if (stars > old) s.stars[i] = stars;
      s.unlocked = Math.max(s.unlocked, Math.min(CONFIG.levels.length, i + 2));
      Save.save(); return Math.max(0, stars - old);
    }
  };
  window.Save = Save; window.Progress = Progress;
})();
