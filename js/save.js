/* =========================================================
 * save.js – Lưu / tải dữ liệu bằng localStorage
 * ========================================================= */
(function () {
  const KEY = 'canhcong_save_v1';

  function defaults() {
    const unitLevels = {}, units = {};
    Object.keys(CONFIG.units).forEach(id => { unitLevels[id] = 1; units[id] = true; });
    const buildingLevels = {}, buildings = {};
    Object.keys(CONFIG.buildings).forEach(id => { buildingLevels[id] = 1; buildings[id] = true; });
    return {
      version: 1,
      gold: 0,
      gems: CONFIG.player.startGems,
      playerLevel: 1,
      playerXP: 0,
      unlockedLevels: 1,      // số màn đã mở
      stars: {},              // { "0": 3, "1": 2 }
      units,                  // loại lính đã mở khoá
      unitLevels,
      buildings,              // loại công trình đã mở khoá
      buildingLevels,         // cấp khởi điểm của công trình
      gateLevel: 1,
      startGoldLevel: 0,
      settings: { music: true, sound: true, shake: true }
    };
  }

  // Gộp dữ liệu cũ vào khung mặc định (để bản cập nhật thêm trường mới không lỗi)
  function merge(base, saved) {
    if (!saved || typeof saved !== 'object') return base;
    Object.keys(base).forEach(k => {
      const b = base[k], s = saved[k];
      if (s === undefined || s === null) return;
      if (b && typeof b === 'object' && !Array.isArray(b)) {
        // object con: giữ cả khoá mặc định lẫn khoá đã lưu (vd. stars)
        base[k] = merge(Object.assign({}, b), s);
        Object.keys(s).forEach(sk => { if (!(sk in base[k])) base[k][sk] = s[sk]; });
      } else if (typeof b === typeof s) {
        base[k] = s;
      }
    });
    return base;
  }

  const Save = {
    data: null,
    load() {
      let parsed = null;
      try { parsed = JSON.parse(localStorage.getItem(KEY)); } catch (e) { parsed = null; }
      this.data = merge(defaults(), parsed);
      return this.data;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* bộ nhớ đầy / chế độ ẩn danh */ }
    },
    reset() {
      try { localStorage.removeItem(KEY); } catch (e) {}
      this.data = defaults();
      this.save();
    }
  };

  window.Save = Save;
})();
