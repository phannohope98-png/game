/* =========================================================
 * ui.js – Giao diện: menu, các màn hình, HUD trong trận,
 * bảng xây nhà, tạm dừng, kết quả, thông báo.
 * ========================================================= */
(function () {
  const $ = id => document.getElementById(id);
  const fmt = n => Math.floor(n).toLocaleString('vi-VN');
  const I = (n, c) => Icon(n, c);
  const stars = (n, cls) => [1, 2, 3].map(i => `<span class="st ${i <= n ? 'got' : ''} ${cls || ''}" style="--i:${i}">${I('star')}</span>`).join('');

  const UI = {
    current: 'screen-menu', settingsReturn: null, hud: {}, toastTimer: null, hintTimer: null, bannerTimer: null,

    init() {
      Icon.hydrate();
      document.addEventListener('click', e => {
        const el = e.target.closest('[data-action]');
        if (!el || el.disabled) return;
        AudioSys.unlock();
        AudioSys.play('click');
        this.handle(el.dataset.action, el);
      });
      document.addEventListener('pointerdown', () => AudioSys.unlock(), { once: true });
      this.showScreen('screen-menu');
    },

    handle(action, el) {
      const d = el.dataset;
      switch (action) {
        case 'play': Game.start(Math.min(CONFIG.stages.length, Save.data.unlockedLevels) - 1); break;
        case 'open': this.showScreen(d.target); break;
        case 'back':
          if (this.settingsReturn) { const r = this.settingsReturn; this.settingsReturn = null; this.showScreen(r); if (r === 'screen-game') this.openPause(); }
          else this.showScreen('screen-menu');
          break;
        case 'stage': Game.start(+d.index); break;
        case 'upgrade-unit': if (Player.upgradeUnit(d.type)) this.success('Đã nâng cấp ' + CONFIG.units[d.type].name); else this.fail(); this.renderUnits(); break;
        case 'upgrade-building': if (Player.upgradeBuilding(d.type)) this.success('Đã nâng cấp ' + CONFIG.buildings[d.type].name); else this.fail(); this.renderBuildings(); break;
        case 'upgrade-gate': if (Player.upgradeGate()) this.success('Cổng thành đã được gia cố'); else this.fail(); this.renderUpgrade(); break;
        case 'upgrade-startgold': if (Player.upgradeStartGold()) this.success('Đã tăng vàng khởi đầu'); else this.fail(); this.renderUpgrade(); break;
        case 'buy': this.buy(d.id); break;
        case 'toggle': {
          const k = d.key, v = !Player.settings()[k];
          Player.setSetting(k, v);
          if (k === 'music') AudioSys.setMusic(v);
          if (k === 'sound') AudioSys.setSound(v);
          this.renderSettings(); break;
        }
        case 'reset-save':
          this.confirm('Xoá toàn bộ dữ liệu? Vàng, sao, cấp độ và nâng cấp sẽ mất hết, không thể khôi phục.', () => {
            Save.reset(); AudioSys.setMusic(true); AudioSys.setSound(true);
            this.toast('Đã xoá dữ liệu'); this.showScreen('screen-menu');
          });
          break;

        /* ---- Trong trận ---- */
        case 'unit': Game.deployUnit(d.type); this.updateHud(true); break;
        case 'skill': if (d.skill === 'repair') Game.repairGate(); else Game.useSkill(d.skill); this.updateHud(true); break;
        case 'build-mode':
          Buildings.highlight = !Buildings.highlight;
          this.hint(Buildings.highlight ? 'Chạm vào một ô vuông đang sáng để xây' : null, 4);
          this.updateHud(true); break;
        case 'speed': Game.toggleSpeed(); break;
        case 'pause': this.openPause(); break;
        case 'next-wave': Waves.startNext(true); this.updateHud(true); break;
        case 'resume': this.closePause(); break;
        case 'restart': this.closeOverlays(); Game.restart(); break;
        case 'pause-settings': this.settingsReturn = 'screen-game'; $('overlay-pause').classList.add('hidden'); this.showScreen('screen-settings'); break;
        case 'home': Game.quit(); break;
        case 'to-map': Game.quit(); this.showScreen('screen-map'); break;
        case 'next-stage': this.closeOverlays(); Game.start(Math.min(CONFIG.stages.length - 1, Game.stageIndex + 1)); break;

        /* ---- Bảng xây nhà ---- */
        case 'build': {
          const slot = Buildings.slots[+d.slot];
          if (Buildings.build(slot, d.type)) this.closeSheet(); else this.openSlotSheet(slot);
          break;
        }
        case 'b-upgrade': { const slot = Buildings.slots[+d.slot]; Buildings.upgrade(slot); this.openSlotSheet(slot); break; }
        case 'b-sell': { const slot = Buildings.slots[+d.slot]; const r = Buildings.sell(slot); this.toast('Đã bán, nhận lại ' + r + ' vàng'); this.closeSheet(); break; }
        case 'close-sheet': this.closeSheet(); break;
        case 'confirm-yes': { const cb = this._confirmCb; this._confirmCb = null; $('confirm').classList.add('hidden'); if (cb) cb(); break; }
        case 'confirm-no': this._confirmCb = null; $('confirm').classList.add('hidden'); break;
      }
    },

    success(msg) { this.toast(msg); AudioSys.play('gold'); },
    fail() { this.toast('Không đủ vàng trong kho'); AudioSys.play('error'); },

    /* ================= ĐIỀU HƯỚNG ================= */
    showScreen(id) {
      document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
      this.current = id;
      if (id !== 'screen-game') { AudioSys.playMusic('menu'); this.refreshResBars(); }
      else { AudioSys.playMusic('battle'); setTimeout(() => Game.resize(), 30); }
      const render = {
        'screen-menu': () => this.renderMenu(), 'screen-map': () => this.renderMap(),
        'screen-units': () => this.renderUnits(), 'screen-buildings': () => this.renderBuildings(),
        'screen-upgrade': () => this.renderUpgrade(), 'screen-shop': () => this.renderShop(),
        'screen-settings': () => this.renderSettings()
      }[id];
      if (render) render();
    },

    refreshResBars() {
      document.querySelectorAll('.res-bar').forEach(el => {
        el.innerHTML = `<span class="res gold">${I('coin')}${fmt(Player.gold())}</span><span class="res gem">${I('gem')}${fmt(Player.gems())}</span>`;
      });
    },

    renderMenu() {
      const p = Player.expProgress();
      $('menu-player').innerHTML = `
        <div class="pc-level"><small>Cấp</small><b>${Player.level()}</b></div>
        <div class="pc-main">
          <div class="bar"><div class="bar-fill" style="width:${Math.round(p.ratio * 100)}%"></div>
            <span>${p.max ? 'Cấp tối đa' : fmt(p.cur) + ' / ' + fmt(p.need) + ' EXP'}</span></div>
          <div class="pc-res">
            <span class="res gold">${I('coin')}${fmt(Player.gold())}</span>
            <span class="res gem">${I('gem')}${fmt(Player.gems())}</span>
            <span class="res star">${I('star')}${Player.totalStars()}/${CONFIG.stages.length * 3}</span>
          </div>
        </div>`;
      const next = Math.min(CONFIG.stages.length, Save.data.unlockedLevels);
      $('play-sub').textContent = 'Màn ' + next + ' · ' + CONFIG.stages[next - 1].name;
    },

    renderMap() {
      $('map-list').innerHTML = CONFIG.stages.map((st, i) => {
        const unlocked = Player.isUnlocked(i), n = Player.stageStars(i);
        const boss = st.waves.some(w => w.includes('boss'));
        const th = CONFIG.themes[st.theme] || CONFIG.themes.grass;
        return `<button class="stage-card ${unlocked ? '' : 'locked'} ${n ? 'cleared' : ''}" data-action="stage" data-index="${i}" ${unlocked ? '' : 'disabled'}
                  style="--g1:${th.ground};--g2:${th.pathEdge}">
          <span class="stage-no">${i + 1}</span>
          <span class="stage-body">
            <span class="stage-name">${st.name}</span>
            <span class="stage-meta">${st.waves.length} đợt quái${boss ? ' · <b class="boss">Có trùm</b>' : ''}</span>
          </span>
          <span class="stage-right">${unlocked ? `<span class="stars">${stars(n)}</span>` : `<span class="lock">${I('lock')}</span>`}</span>
        </button>`;
      }).join('');
    },

    statRow(icon, label, cur, next) {
      return `<div class="stat">${I(icon)}<span>${label}</span><b>${cur}${next !== undefined && next !== cur ? ` <em>→ ${next}</em>` : ''}</b></div>`;
    },
    costBtn(action, attrs, label, cost, can) {
      return `<button class="btn btn-gold" data-action="${action}" ${attrs} ${can ? '' : 'disabled'}><span>${label}</span><span class="price">${I('coin')}${fmt(cost)}</span></button>`;
    },

    renderUnits() {
      this.refreshResBars();
      $('units-list').innerHTML = Object.keys(CONFIG.units).map(type => {
        const def = CONFIG.units[type], lv = Player.unitLevel(type);
        const cur = def.levels[lv - 1], nx = def.levels[lv];
        const cost = Player.unitUpgradeCost(type);
        const abil = def.abilities.map(a => `<span class="tag">${I(CONFIG.skills[a].icon)}${CONFIG.skills[a].name}</span>`).join('');
        return `<div class="card">
          <div class="card-head"><canvas class="portrait" data-art="unit" data-type="${type}" width="120" height="120"></canvas>
            <div><h3>${def.name}</h3><p class="muted">${def.role} · Cấp ${lv}/${def.levels.length}</p></div></div>
          <p class="desc">${def.desc}</p>
          <div class="stats">
            ${this.statRow('heart', 'Máu', cur.hp, nx && nx.hp)}
            ${this.statRow('swords', 'Sát thương', cur.damage, nx && nx.damage)}
            ${this.statRow('clock', 'Hồi đòn', def.attackSpeed + 's')}
            ${this.statRow('target', 'Tầm đánh', def.range)}
            ${this.statRow('shield', 'Giáp', def.armor)}
            ${this.statRow('coin', 'Giá gửi', def.cost)}
          </div>
          ${abil ? `<div class="tags">${abil}</div>` : ''}
          ${cost === null ? '<button class="btn" disabled>Đã đạt cấp tối đa</button>'
            : this.costBtn('upgrade-unit', `data-type="${type}"`, 'Nâng lên cấp ' + (lv + 1), cost, Player.gold() >= cost)}
        </div>`;
      }).join('');
      this.paintPortraits($('units-list'));
    },

    renderBuildings() {
      this.refreshResBars();
      $('buildings-list').innerHTML = `<p class="note">Công trình xây trong trận sẽ bắt đầu ở cấp khởi điểm. Nâng cấp khởi điểm giúp tiết kiệm vàng mỗi trận.</p>` +
        Object.keys(CONFIG.buildings).map(type => {
          const def = CONFIG.buildings[type], lv = Player.buildingLevel(type), cost = Player.buildingUpgradeCost(type);
          const rows = def.levels.map((l, i) => `<div class="lvl-row ${i + 1 === lv ? 'now' : ''}"><span>Cấp ${i + 1}</span><span>${def.unitType
            ? `Tốc độ ${Math.round(l.productionSpeed * 100)}% · tối đa ${l.maxUnits} lính` : `+${l.income} vàng / ${def.baseProductionTime}s`}</span></div>`).join('');
          return `<div class="card">
            <div class="card-head"><canvas class="portrait" data-art="building" data-type="${type}" width="120" height="120"></canvas>
              <div><h3>${def.name}</h3><p class="muted">Giá xây ${def.cost} vàng · Khởi điểm cấp ${lv}/${def.levels.length}</p></div></div>
            <p class="desc">${def.desc}</p>
            <div class="lvl-table">${rows}</div>
            ${cost === null ? '<button class="btn" disabled>Đã đạt cấp tối đa</button>'
              : this.costBtn('upgrade-building', `data-type="${type}"`, 'Khởi điểm cấp ' + (lv + 1), cost, Player.gold() >= cost)}
          </div>`;
        }).join('');
      this.paintPortraits($('buildings-list'));
    },

    /** Vẽ chân dung nhân vật/công trình bằng art.js vào canvas nhỏ */
    paintPortraits(root) {
      root.querySelectorAll('canvas.portrait').forEach(c => {
        const g = c.getContext('2d');
        g.clearRect(0, 0, c.width, c.height);
        if (c.dataset.art === 'unit') Painter.unit(g, c.dataset.type, 60, 66, 34, 1, 0, false, false);
        else Painter.building(g, c.dataset.type, 60, 80, 1.0, 0);
      });
    },

    renderUpgrade() {
      this.refreshResBars();
      const gl = Player.gateLevel(), G = CONFIG.gate.levels, gc = Player.gateUpgradeCost();
      const cur = G[gl - 1], nx = G[gl];
      const sg = CONFIG.upgrades.startGold, sl = Save.data.startGoldLevel, sc = Player.startGoldUpgradeCost();
      $('upgrade-list').innerHTML = `
        <div class="card">
          <div class="card-head"><span class="emblem">${I('tower')}</span>
            <div><h3>Cổng thành</h3><p class="muted">Cấp ${gl}/${G.length}</p></div></div>
          <div class="stats">${this.statRow('heart', 'Máu cổng', cur.hp, nx && nx.hp)}${this.statRow('shield', 'Giáp', cur.armor, nx && nx.armor)}</div>
          <p class="note">Giáp trừ thẳng vào mỗi đòn đánh của quái.</p>
          ${gc === null ? '<button class="btn" disabled>Đã đạt cấp tối đa</button>' : this.costBtn('upgrade-gate', '', 'Gia cố lên cấp ' + (gl + 1), gc, Player.gold() >= gc)}
        </div>
        <div class="card">
          <div class="card-head"><span class="emblem">${I('coin')}</span>
            <div><h3>${sg.name}</h3><p class="muted">Cấp ${sl}/${sg.maxLevel}</p></div></div>
          <div class="stats">${this.statRow('coin', 'Vàng đầu trận', Player.startGold(), sc === null ? undefined : Player.startGold() + sg.perLevel)}</div>
          ${sc === null ? '<button class="btn" disabled>Đã đạt cấp tối đa</button>' : this.costBtn('upgrade-startgold', '', 'Nâng cấp', sc, Player.gold() >= sc)}
        </div>
        <p class="note">Nâng cấp lính ở mục Quân lính, nâng cấp khởi điểm công trình ở mục Công trình.</p>`;
    },

    renderShop() {
      this.refreshResBars();
      $('shop-list').innerHTML = `<p class="note">Kim cương nhận được khi lên cấp (+${CONFIG.player.gemsPerLevel}) và với mỗi sao mới (+${CONFIG.player.gemsPerNewStar}). Cửa hàng không dùng tiền thật.</p>` +
        CONFIG.shop.map(it => `<div class="card shop-item">
          <span class="emblem">${I(it.icon)}</span>
          <div class="grow"><h3>${it.name}</h3><p class="muted">Nhận ${fmt(it.gold)} vàng</p></div>
          <button class="btn btn-gem" data-action="buy" data-id="${it.id}" ${Player.gems() < it.gems ? 'disabled' : ''}>${I('gem')}${it.gems}</button>
        </div>`).join('');
    },

    buy(id) {
      const it = CONFIG.shop.find(s => s.id === id);
      if (!it || !Player.spendGems(it.gems)) { this.toast('Không đủ kim cương'); AudioSys.play('error'); return; }
      Player.addGold(it.gold);
      this.success('Nhận ' + fmt(it.gold) + ' vàng');
      this.renderShop();
    },

    renderSettings() {
      this.refreshResBars();
      const s = Player.settings();
      const row = (key, label, icon) => `<button class="setting-row" data-action="toggle" data-key="${key}">
        <span class="sr-label">${I(icon)}${label}</span><span class="switch ${s[key] ? 'on' : ''}"><i></i></span></button>`;
      $('settings-list').innerHTML = `
        <div class="card">${row('music', 'Nhạc nền', 'music')}${row('sound', 'Âm thanh', 'sound')}${row('shake', 'Rung màn hình', 'shake')}</div>
        <div class="card">
          <h3 class="h-ico">${I('install')}Cài game ra màn hình chính</h3>
          <p class="small"><b>Android (Chrome):</b> bấm menu ⋮ rồi chọn “Thêm vào màn hình chính”.<br>
          <b>iPhone (Safari):</b> bấm nút Chia sẻ rồi chọn “Thêm vào MH chính”.<br>
          Sau lần mở đầu tiên, game chơi được cả khi không có mạng.</p>
        </div>
        <div class="card">
          <h3 class="h-ico">${I('book')}Cách chơi</h3>
          <ul class="howto">
            <li>Chạm ô vuông cạnh đường để xây tháp, trại lính hoặc mỏ vàng.</li>
            <li>Chạm công trình đã xây để nâng cấp hoặc bán.</li>
            <li>Bấm nút lính phía dưới để gửi quân ra trận.</li>
            <li>Nhấn giữ lên con đường để dời cờ tập kết.</li>
            <li>Cầu lửa và Bão băng cần có Phù thủy trên sân, Cuồng nộ cần có Orc.</li>
            <li>Giữ cổng trên 80% máu để đạt 3 sao.</li>
          </ul>
        </div>
        <button class="btn btn-danger" data-action="reset-save">${I('trash')}<span>Xoá dữ liệu game</span></button>`;
    },

    /* ================= HUD TRONG TRẬN ================= */
    setupBattleHud() {
      $('unit-row').innerHTML = `<button class="ubtn ubtn-build" data-action="build-mode" id="btn-build">
          <span class="big-ico">${I('hammer')}</span><span class="nm">Xây trụ</span><span class="cost sub">Chọn đất sát đường</span></button>`;
      const skills = Object.keys(CONFIG.skills).map(k => {
        const s = CONFIG.skills[k];
        return `<button class="sbtn sk-${k}" data-action="skill" data-skill="${k}">${I(s.icon)}<span class="nm">${s.name}</span><i class="cd"></i></button>`;
      });
      skills.push(`<button class="sbtn sk-repair" data-action="skill" data-skill="repair">${I('hammer')}<span class="nm">Sửa ${CONFIG.match.repair.cost}</span><i class="cd"></i></button>`);
      $('skill-row').innerHTML = skills.join('');
      this.hud = {
        hpFill: $('hud-hp-fill'), hpText: $('hud-hp-text'), gold: $('hud-gold'), wave: $('hud-wave'),
        speed: $('btn-speed'), waveCall: $('wave-call'), waveCd: $('wave-countdown'),
        unitBtns: [...document.querySelectorAll('#unit-row .ubtn[data-type]')],
        skillBtns: [...document.querySelectorAll('#skill-row .sbtn')], build: $('btn-build'), cache: {}
      };
    },

    /** Cập nhật HUD – chỉ chạm DOM khi giá trị thay đổi */
    updateHud(force) {
      const h = this.hud, g = Game;
      if (!h.gold || !g.gate || this.current !== 'screen-game') return;
      const c = h.cache;
      const set = (key, val, fn) => { if (force || c[key] !== val) { c[key] = val; fn(val); } };

      set('hp', Math.ceil(g.gate.hp), v => {
        h.hpText.textContent = window.innerWidth < 380 ? v : v + ' / ' + g.gate.maxHp;
        const r = g.gate.ratio;
        h.hpFill.style.width = (r * 100) + '%';
        h.hpFill.className = 'hpbar-fill ' + (r > 0.5 ? 'ok' : r > 0.25 ? 'mid' : 'low');
      });
      set('gold', Math.floor(g.gold), v => { h.gold.textContent = fmt(v); });
      set('wave', Waves.current + '/' + Waves.total, v => { h.wave.textContent = v; });
      set('speed', g.speed, v => { h.speed.querySelector('b').textContent = v + 'x'; h.speed.classList.toggle('on', v === 2); });

      const canCall = Waves.state === 'waiting' && g.state === 'playing' && Waves.index < Waves.total - 1;
      set('call', canCall, v => h.waveCall.classList.toggle('hidden', !v));
      if (canCall) set('callT', Math.ceil(Waves.timer), v => { h.waveCd.textContent = v + 's'; });

      h.unitBtns.forEach(b => {
        const t = b.dataset.type, ok = g.gold >= CONFIG.units[t].cost;
        set('u_' + t, ok, v => b.classList.toggle('disabled', !v));
      });
      set('build', Buildings.highlight, v => h.build.classList.toggle('on', v));

      h.skillBtns.forEach(b => {
        const k = b.dataset.skill;
        let ratio, ready, active = false;
        if (k === 'repair') {
          const r = CONFIG.match.repair;
          ratio = Math.max(0, g.repairCd / r.cooldown);
          ready = g.repairCd <= 0 && g.gold >= r.cost && g.gate.hp < g.gate.maxHp;
        } else {
          const s = CONFIG.skills[k];
          ratio = Math.max(0, g.skillCd[k] / s.cooldown);
          ready = g.skillReady(k);
          active = g.pendingSkill === k;
        }
        const key = Math.round(ratio * 20) + '|' + ready + '|' + active;
        set('s_' + k, key, () => {
          b.style.setProperty('--cd', (ratio * 100) + '%');
          b.classList.toggle('disabled', !ready);
          b.classList.toggle('on', active);
        });
      });
    },

    /* ================= BẢNG XÂY / NÂNG CẤP ================= */
    openSlotSheet(slot) {
      Game.sheetOpen = true;
      const b = slot.building, g = Game;
      let html;
      if (!b) {
        html = `<div class="sheet-title"><h3>Xây công trình</h3><span class="res gold">${I('coin')}${fmt(g.gold)}</span></div><div class="build-list">` +
          Object.keys(CONFIG.buildings).filter(t => Save.data.buildings[t]).map(t => {
            const d = CONFIG.buildings[t];
            return `<button class="build-opt" data-action="build" data-slot="${slot.id}" data-type="${t}" ${g.gold < d.cost ? 'disabled' : ''}>
              <canvas class="portrait sm" data-art="building" data-type="${t}" width="96" height="96"></canvas>
              <span class="grow"><b>${d.name}</b><small>${d.desc}</small></span>
              <span class="price">${I('coin')}${d.cost}</span></button>`;
          }).join('') + `</div>`;
      } else {
        const d = b.def, lv = d.levels[b.level - 1], nx = d.levels[b.level];
        const info = d.mode === 'tower'
          ? `Sát thương ${lv.damage}, tầm bắn ${lv.range}. Trụ không có máu và không thể bị quái phá.` + (nx ? `<br><em>Cấp ${b.level + 1}: sát thương ${nx.damage}, tầm ${nx.range}.</em>` : '')
          : `Duy trì ${d.unitCount} ${CONFIG.units[d.unitType].name}; hồi sinh sau ${d.respawnTime} giây. Vùng canh ${lv.guardRange}.` + (nx ? `<br><em>Cấp ${b.level + 1}: vùng canh ${nx.guardRange}.</em>` : '');
        const uc = b.upgradeCost, refund = Math.floor(b.spent * CONFIG.match.sellRefund);
        html = `<div class="card-head"><canvas class="portrait sm" data-art="building" data-type="${b.type}" width="96" height="96"></canvas>
            <div class="grow"><h3>${d.name}</h3><p class="muted">Cấp ${b.level}/${d.levels.length}</p></div><span class="res gold">${I('coin')}${fmt(g.gold)}</span></div>
          <p class="small">${info}</p>
          <div class="row">
            ${uc === null ? '<button class="btn" disabled>Cấp tối đa</button>'
              : `<button class="btn btn-gold" data-action="b-upgrade" data-slot="${slot.id}" ${g.gold < uc ? 'disabled' : ''}>${I('up')}<span>Nâng cấp</span><span class="price">${I('coin')}${uc}</span></button>`}
            <button class="btn btn-danger" data-action="b-sell" data-slot="${slot.id}">${I('sell')}<span>Bán +${refund}</span></button>
          </div>`;
      }
      $('sheet-content').innerHTML = html + `<button class="btn btn-ghost" data-action="close-sheet">Đóng</button>`;
      this.paintPortraits($('sheet-content'));
      $('sheet').classList.remove('hidden');
    },

    closeSheet() {
      $('sheet').classList.add('hidden');
      Game.sheetOpen = false; Game.last = performance.now();
      this.hint(null);
      this.updateHud(true);
    },

    /* ================= TẠM DỪNG / KẾT QUẢ ================= */
    openPause() {
      if (Game.state !== 'playing') return;
      Game.pause();
      $('overlay-pause').classList.remove('hidden');
    },
    closePause() { $('overlay-pause').classList.add('hidden'); Game.resume(); },

    closeOverlays() {
      ['overlay-pause', 'overlay-result', 'sheet', 'confirm'].forEach(id => $(id).classList.add('hidden'));
      Game.sheetOpen = false;
    },

    showResult(r) {
      if (this.current !== 'screen-game') return;
      const lvl = r.levelUps ? `<p class="levelup">Lên cấp ${Player.level()}!</p>` : '';
      const gems = r.gems ? `<div class="reward"><span>${I('gem')}Kim cương</span><b>+${r.gems}</b></div>` : '';
      const rewards = `<div class="reward"><span>${I('coin')}Vàng nhận</span><b>+${fmt(r.gold)}</b></div>
        <div class="reward"><span>${I('exp')}EXP</span><b>+${fmt(r.exp)}</b></div>${gems}${lvl}`;
      $('result-panel').className = 'panel result ' + (r.win ? 'win' : 'lose');
      $('result-panel').innerHTML = r.win ? `
        <h2>Chiến thắng</h2>
        <div class="big-stars">${stars(r.stars, 'big')}</div>
        ${rewards}
        <div class="col">
          ${r.hasNext ? `<button class="btn btn-gold btn-big" data-action="next-stage"><span>Màn tiếp theo</span>${I('play')}</button>` : '<p class="note">Bạn đã chinh phục toàn bộ chiến dịch.</p>'}
          <div class="row"><button class="btn" data-action="restart">${I('restart')}<span>Chơi lại</span></button><button class="btn" data-action="to-map">${I('map')}<span>Bản đồ</span></button></div>
        </div>` : `
        <h2>Thất bại</h2>
        <p class="lose-sub">Cổng thành đã bị phá</p>
        ${rewards}
        <p class="note">Nâng cấp lính và cổng thành ở menu chính rồi thử lại.</p>
        <div class="row"><button class="btn btn-gold" data-action="restart">${I('restart')}<span>Chơi lại</span></button><button class="btn" data-action="to-map">${I('map')}<span>Bản đồ</span></button></div>`;
      $('overlay-result').classList.remove('hidden');
    },

    confirm(msg, onYes) {
      this._confirmCb = onYes;
      $('confirm-text').textContent = msg;
      $('confirm').classList.remove('hidden');
    },

    /* ================= THÔNG BÁO ================= */
    toast(msg) {
      const t = $('toast');
      t.textContent = msg; t.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
    },

    hint(msg, sec) {
      const h = $('hint');
      clearTimeout(this.hintTimer);
      if (!msg) { h.classList.add('hidden'); return; }
      h.textContent = msg; h.classList.remove('hidden');
      if (sec) this.hintTimer = setTimeout(() => h.classList.add('hidden'), sec * 1000);
    },

    banner(text, sec) {
      const b = $('wave-banner');
      b.textContent = text; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
      clearTimeout(this.bannerTimer);
      this.bannerTimer = setTimeout(() => b.classList.remove('show'), (sec || 1.2) * 1000);
    },

    bossWarning(name) {
      const b = $('boss-banner');
      b.innerHTML = `Trùm xuất hiện<small>${name}</small>`;
      b.classList.remove('hidden', 'show'); void b.offsetWidth; b.classList.add('show');
      setTimeout(() => b.classList.add('hidden'), 2600);
    }
  };

  window.UI = UI;
})();
