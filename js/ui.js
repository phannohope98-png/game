/* =========================================================
 * ui.js – Giao diện: menu, bản đồ chiến dịch, nâng cấp, bách khoa,
 * cài đặt, HUD trong trận, menu vòng tròn, lớp phủ.
 * ========================================================= */
(function () {
  const $ = id => document.getElementById(id);
  const I = n => Icon(n);
  const K = ArtKit;
  const fmt = n => Math.floor(n).toLocaleString('vi-VN');

  const UI = {
    current: 'screen-menu', hud: null, ringSel: null, codexTab: 'enemies', overlayCb: null,

    init() {
      Icon.hydrate();
      document.addEventListener('click', e => {
        const el = e.target.closest('[data-action]'); if (!el || el.disabled) return;
        AudioSys.unlock(); AudioSys.play('click'); this.act(el.dataset.action, el.dataset, el);
      });
      window.addEventListener('resize', () => { if (this.current === 'screen-menu') this.paintMenu(); if (this.current === 'screen-map') this.renderMap(); });
      this.showScreen('screen-menu');
    },

    act(a, d) {
      switch (a) {
        case 'open': this.showScreen(d.target); break;
        case 'back': this.showScreen('screen-menu'); break;
        case 'level': this.levelCard(+d.index); break;
        case 'start-level': this.closeOverlay(); Game.start(+d.index); break;
        case 'buy-up': if (Progress.buyUpgrade(d.type)) { AudioSys.play('build'); this.toast('Đã nâng cấp!'); } else { AudioSys.play('error'); this.toast('Không đủ sao'); } this.renderUpgrades(); break;
        case 'codex-tab': this.codexTab = d.tab; document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === d.tab)); this.renderCodex(); break;
        case 'toggle': { const s = Save.data.settings; s[d.key] = !s[d.key]; Save.save(); if (d.key === 'music') AudioSys.setMusic(s.music); if (d.key === 'sound') AudioSys.setSound(s.sound); this.renderSettings(); if (this.pauseOpen) this.openPause(); break; }
        case 'reset': this.confirm('Xoá toàn bộ tiến trình? Sao, nâng cấp và cấp anh hùng sẽ mất hết.', () => { Save.reset(); this.toast('Đã xoá dữ liệu'); this.showScreen('screen-menu'); }); break;
        case 'overlay-ok': { const cb = this.overlayCb; this.overlayCb = null; this.closeOverlay(); if (cb) cb(); break; }
        // trong trận
        case 'speed': Game.toggleSpeed(); break;
        case 'pause': this.openPause(); break;
        case 'resume': this.closeOverlay(); Game.resume(); this.pauseOpen = false; break;
        case 'restart': this.closeOverlay(); this.pauseOpen = false; Game.restart(); break;
        case 'to-map': this.closeOverlay(); this.pauseOpen = false; Game.quit(); this.showScreen('screen-map'); break;
        case 'next-level': this.closeOverlay(); Game.start(Math.min(CONFIG.levels.length - 1, Game.levelIndex + 1)); break;
        case 'hero': Game.selectHero(); break;
        case 'skill': Game.castHero(); break;
        case 'call-wave': Waves.callNext(); break;
        case 'ring-build': { const s = this.ringSel && this.ringSel.ref; if (s && Towers.build(s, d.type)) { Game.sel = null; this.closeRing(); } else this.openRing(this.ringSel); break; }
        case 'ring-up': { const T = this.ringSel.ref; if (Towers.upgrade(T)) this.openRing(this.ringSel); break; }
        case 'ring-sell': { const T = this.ringSel.ref; Towers.sell(T); Game.sel = null; this.closeRing(); break; }
        case 'ring-rally': { Game.rallyFor = this.ringSel.ref; this.closeRing(true); this.tip('Chạm lên con đường để đặt điểm tập kết'); break; }
      }
    },

    showScreen(id) {
      document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
      this.current = id;
      if (id !== 'screen-game') AudioSys.playMusic('menu');
      document.querySelectorAll('.star-count').forEach(e => { e.textContent = Progress.totalStars(); });
      ({ 'screen-menu': () => this.paintMenu(), 'screen-map': () => this.renderMap(), 'screen-upgrades': () => this.renderUpgrades(),
        'screen-codex': () => this.renderCodex(), 'screen-settings': () => this.renderSettings() }[id] || (() => {}))();
    },

    /* ================= MENU CHÍNH: cảnh nền vẽ từ chính game ================= */
    paintMenu() {
      $('menu-stars').textContent = Progress.totalStars() + '/' + CONFIG.levels.length * 3;
      const c = $('menu-bg'), r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      if (r.width < 10) return;
      c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
      const g = c.getContext('2d'), map = this._menuMap || (this._menuMap = Level.build(0));
      const z = Math.max(r.width / 500, r.height / 880) * dpr, mp = map.paths[0].pointAt(map.paths[0].length * 0.64, {}), cx = mp.x + 20, cy = mp.y - 90;
      const bg = this._menuBg || (this._menuBg = Level.renderBackground(map, Math.min(2, z)));
      g.setTransform(z, 0, 0, z, c.width / 2 - cx * z, c.height / 2 - cy * z);
      g.drawImage(bg, 0, 0, map.W, map.H);
      Painter.res = z;
      const near = (x, y) => map.spots.slice().sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
      const items = [];
      [['archer', 4, 360, 520], ['mage', 4, 620, 640], ['barracks', 3, 300, 900], ['artillery', 4, 640, 920]].forEach(([t, lv, x, y]) => { const s = near(x, y); if (s) items.push({ y: s.y + 14, f: () => Painter.tower(g, t, lv, s.x, s.y, 0.82, 0.8, { a: -1, face: 1 }) }); });
      const p = map.paths[0], pt = d => p.pointAt(d, {});
      const L = p.length, ch = (type, d, face, mode, ph, lat) => { const q = pt(d); items.push({ y: q.y, f: () => Painter.char(g, type, q.x + q.nx * (lat || 0), q.y + q.ny * (lat || 0) + 6, CONFIG.enemies[type] ? CONFIG.enemies[type].radius / ArtChars[type].dr : 1, face, mode, ph) }); };
      ch('hero', L * 0.57, -1, 'atk', 0.5, -6); ch('soldier4', L * 0.58, -1, 'idle', 0.2, 14);
      ch('orc', L * 0.6, 1, 'atk', 0.3, 0); ch('goblin', L * 0.63, 1, 'walk', 0.2, -10); ch('warg', L * 0.66, 1, 'walk', 0.6, 8); ch('blackOrc', L * 0.69, 1, 'walk', 0.4, -4); ch('troll', L * 0.74, 1, 'walk', 0.1, 0);
      items.sort((a, b) => a.y - b.y).forEach(i => i.f());
      g.setTransform(1, 0, 0, 1, 0, 0);
    },

    /* ================= BẢN ĐỒ CHIẾN DỊCH ================= */
    renderMap() {
      const wrap = $('map-scroll'), W = wrap.clientWidth || 390, H = Math.round(W * 2.1), dpr = Math.min(2, window.devicePixelRatio || 1);
      const c = $('world-map'); c.width = W * dpr; c.height = H * dpr; c.style.height = H + 'px';
      const g = c.getContext('2d'); g.scale(dpr * W / 400, dpr * W / 400);
      paintWorld(g, 400, 840);
      const nodes = [[200, 790], [110, 660], [270, 540], [130, 410], [280, 270], [190, 120]];
      // đường chấm nối các màn
      g.setLineDash([2, 12]); g.lineCap = 'round'; g.strokeStyle = 'rgba(60,30,20,.75)'; g.lineWidth = 6;
      g.beginPath(); nodes.forEach((n, i) => i ? g.lineTo(n[0], n[1]) : g.moveTo(n[0], n[1])); g.stroke();
      g.strokeStyle = '#fff3c8'; g.lineWidth = 3.4; g.stroke(); g.setLineDash([]);
      const un = Save.data.unlocked;
      $('map-nodes').innerHTML = CONFIG.levels.map((L, i) => {
        const st = Save.data.stars[i] || 0, locked = i >= un, next = i === un - 1 && !st;
        const [x, y] = nodes[i];
        return `<button class="node ${locked ? 'locked' : ''} ${st ? 'done' : ''} ${next ? 'next' : ''}" style="left:${x / 4}%;top:${y / 840 * 100}%" data-action="${locked ? '' : 'level'}" data-index="${i}">
          <span class="flag">${locked ? I('lock') : i + 1}</span>
          <span class="nstars">${[1, 2, 3].map(k => `<span class="${k <= st ? 'got' : ''}">${I('star')}</span>`).join('')}</span>
          <span class="nname">${L.name}</span></button>`;
      }).join('');
      requestAnimationFrame(() => { const n = $('map-nodes').children[Math.min(un, CONFIG.levels.length) - 1]; if (n) wrap.scrollTop = n.offsetTop - wrap.clientHeight * 0.6; });
    },
    levelCard(i) {
      const L = CONFIG.levels[i], st = Save.data.stars[i] || 0;
      const foes = [...new Set(L.waves.join(',').split(',').map(s => s.split(':')[0].trim()))];
      this.overlay(`<div class="ribbon">Màn ${i + 1}</div>
        <h3>${L.name}</h3>
        <div class="big-stars">${[1, 2, 3].map(k => `<span class="s ${k <= st ? 'got' : ''}">${I('star')}</span>`).join('')}</div>
        <p>${L.story}</p>
        <div class="row" style="margin:8px 0 14px">${foes.map(f => `<canvas class="portrait dark" data-char="${f}" width="120" height="120" style="width:48px;height:48px;border-radius:12px"></canvas>`).join('')}</div>
        <p style="font-size:14px">${L.waves.length} đợt quái · ${L.paths.length > 1 ? '2 cửa vào · ' : ''}${L.gold} vàng khởi đầu</p>
        <div class="row" style="margin-top:12px"><button class="gbtn gray sm" data-action="overlay-ok">Đóng</button><button class="gbtn green" data-action="start-level" data-index="${i}">${I('sword')}<span>Chiến đấu</span></button></div>`);
    },

    /* ================= NÂNG CẤP ================= */
    renderUpgrades() {
      $('free-stars').textContent = Progress.freeStars();
      const H = CONFIG.hero, lv = Progress.heroLevel(), prog = Progress.heroXpProgress();
      let html = `<div class="card"><div class="card-head"><canvas class="portrait" data-char="hero" data-zoom="1.6" data-head="1" width="152" height="152"></canvas>
        <div style="flex:1"><h3>${H.name}</h3><div class="sub">${H.title} · Cấp ${lv}/${H.maxLevel}</div>
        <div class="bar"><i style="width:${Math.round(prog * 100)}%"></i><span>${lv >= H.maxLevel ? 'Cấp tối đa' : 'Kinh nghiệm ' + Math.round(prog * 100) + '%'}</span></div></div></div>
        <div class="stat-row"><span class="chip">${I('heart')}${Math.round(H.hp * (1 + (lv - 1) * H.perLevel))}</span><span class="chip">${I('sword')}${Math.round(H.damage[0] * (1 + (lv - 1) * H.perLevel))}-${Math.round(H.damage[1] * (1 + (lv - 1) * H.perLevel))}</span><span class="chip">${I('sun')}${H.skill.name}</span></div>
        <p class="sub" style="margin:8px 0 0">Anh hùng lên cấp nhờ kinh nghiệm diệt quái trong mỗi trận.</p></div>`;
      html += Object.keys(CONFIG.upgrades).map(k => {
        const U = CONFIG.upgrades[k], T = CONFIG.towers[k], own = Progress.upLevel(k), free = Progress.freeStars();
        return `<div class="card"><div class="card-head"><canvas class="portrait" data-tower="${k}" data-tier="${Math.min(4, own + 1)}" width="152" height="152"></canvas>
          <div style="flex:1"><h3>${T.name}</h3><div class="sub">Mỗi cấp: ${U.text}</div></div></div>
          <div class="up-nodes">${U.cost.map((c, i) => i < own ? `<div class="up-node own">${I('check')}</div>`
            : i === own ? `<button class="up-node ${free >= c ? 'buy' : ''}" data-action="buy-up" data-type="${k}"><span>Cấp ${i + 1}</span><span>${I('star')} ${c}</span></button>`
            : `<div class="up-node">${I('star')} ${c}</div>`).join('')}</div></div>`;
      }).join('');
      $('upgrades-list').innerHTML = html; this.paintCanvases($('upgrades-list'));
    },

    /* ================= BÁCH KHOA ================= */
    renderCodex() {
      let html;
      if (this.codexTab === 'enemies') {
        html = '<div class="grid">' + Object.keys(CONFIG.enemies).map(k => {
          const e = CONFIG.enemies[k], seen = Save.data.seen[k];
          return `<div class="card codex-item ${seen ? '' : 'locked'}"><canvas class="portrait dark" data-char="${k}" width="192" height="192"></canvas>
            <h3 style="font-size:17px">${seen ? e.name : '???'}</h3>${seen ? `<div class="stat-row" style="justify-content:center"><span class="chip">${I('heart')}${e.hp}</span><span class="chip">${I('shield')}${Math.round(e.armor * 100)}%</span>${e.flying ? `<span class="chip">Bay</span>` : ''}</div><p>${e.desc}</p>` : '<p>Chưa gặp</p>'}</div>`;
        }).join('') + '</div>';
      } else {
        html = Object.keys(CONFIG.towers).map(k => {
          const T = CONFIG.towers[k];
          return `<div class="card"><h3>${T.name}</h3><div class="row" style="justify-content:space-around;margin:6px 0">${[1, 2, 3, 4].map(t => `<div style="text-align:center"><canvas data-tower="${k}" data-tier="${t}" width="150" height="190" style="width:72px;height:91px"></canvas><div class="sub" style="font-size:11px">${T.tierNames[t - 1]}</div></div>`).join('')}</div><p class="sub">${T.desc}</p></div>`;
        }).join('') + `<div class="card"><div class="card-head"><canvas class="portrait" data-char="hero" data-zoom="1.6" data-head="1" width="152" height="152"></canvas><div><h3>${CONFIG.hero.name}</h3><p class="sub">${CONFIG.hero.desc}</p></div></div></div>`;
      }
      $('codex-list').innerHTML = html; this.paintCanvases($('codex-list'));
    },

    renderSettings() {
      const s = Save.data.settings, row = (k, label) => `<div class="setting"><span>${label}</span><button class="switch ${s[k] ? 'on' : ''}" data-action="toggle" data-key="${k}"><i></i></button></div>`;
      $('settings-list').innerHTML = `<div class="card">${row('music', 'Nhạc nền')}${row('sound', 'Âm thanh')}${row('shake', 'Rung màn hình')}</div>
        <div class="card"><h3>Cách chơi</h3><p class="sub" style="line-height:1.6;font-size:15px">• Chạm ô đất có cọc gỗ để xây trụ, chạm trụ để nâng cấp hoặc bán.<br>• Kéo để di chuyển bản đồ, chụm 2 ngón để phóng to.<br>• Chạm anh hùng (hoặc ảnh góc trái) rồi chạm bản đồ để di chuyển.<br>• Chạm đầu lâu đỏ để gọi đợt quái, gọi sớm được thưởng vàng.<br>• Pháo không bắn được quân bay – cần tháp cung hoặc pháp sư.</p></div>
        <div class="row"><button class="gbtn red sm" data-action="reset">${I('trash')}<span>Xoá dữ liệu</span></button></div>`;
    },

    paintCanvases(root) {
      root.querySelectorAll('canvas[data-char]').forEach(c => Painter.charPortrait(c, c.dataset.char, { zoom: +(c.dataset.zoom || 0.95), head: !!c.dataset.head }));
      root.querySelectorAll('canvas[data-tower]').forEach(c => Painter.towerPortrait(c, c.dataset.tower, +(c.dataset.tier || 1), +(c.dataset.fit || 0.82)));
    },

    /* ================= TRONG TRẬN ================= */
    setupBattle() {
      this.closeRing(); this.closeOverlay(); this.tip(null);
      Painter.charPortrait($('hero-canvas'), 'hero', { zoom: 2.1, head: true });
      $('hero-lvl').textContent = Units.hero.level;
      this.hud = { lives: $('hud-lives'), gold: $('hud-gold'), wave: $('hud-wave'), speed: $('btn-speed'), hp: $('hero-hp'), face: $('hero-face'), dead: $('hero-dead'), skill: $('hero-skill'), cd: $('skill-cd'), boss: $('boss-bar'), bossFill: $('boss-fill'), waves: $('wave-btns'), cache: {} };
      this.hud.waves.innerHTML = '';
    },
    tick() {
      const h = this.hud; if (!h || this.current !== 'screen-game') return;
      const c = h.cache, set = (k, v, fn) => { if (c[k] !== v) { c[k] = v; fn(v); } };
      set('lives', Game.lives, v => h.lives.textContent = v);
      set('gold', Math.floor(Game.gold), v => h.gold.textContent = fmt(v));
      set('wave', Waves.shown + '/' + Waves.total, v => h.wave.textContent = v);
      set('speed', Game.speed, v => { h.speed.querySelector('em').textContent = v + 'x'; h.speed.classList.toggle('on', v === 2); });
      const H = Units.hero;
      if (H) {
        set('hp', Math.round(H.state === 'dead' ? 0 : H.hp / H.maxHp * 100), v => h.hp.style.strokeDashoffset = 182.2 * (1 - v / 100));
        set('dead', H.state === 'dead' ? Math.ceil(H.respawnT) : 0, v => { h.face.classList.toggle('dead', v > 0); h.dead.textContent = v || ''; });
        set('sel', Game.heroSelected, v => h.face.classList.toggle('sel', v));
        const p = H.skillCd > 0 ? Math.round(H.skillCd / CONFIG.hero.skill.cooldown * 100) : 0;
        set('cd', p, v => { h.cd.style.setProperty('--p', v + '%'); h.skill.classList.toggle('ready', v === 0); });
      }
      const B = Enemies.boss();
      set('boss', !!B, v => h.boss.classList.toggle('hidden', !v));
      if (B) { $('boss-name').textContent = B.name; h.bossFill.style.width = Math.max(0, B.hp / B.maxHp * 100) + '%'; }
      this.updateWaveButtons();
      if (this.ringSel) this.placeRing();
    },

    /** Nút đầu lâu ở cửa vào: gọi đợt quái */
    updateWaveButtons() {
      const box = this.hud.waves, can = Game.state === 'playing' && Waves.canCall;
      const paths = can ? Waves.upcomingPaths() : [];
      const key = can ? paths.join(',') + Waves.state : '';
      if (box.dataset.k !== key) {
        box.dataset.k = key;
        box.innerHTML = paths.map(i => `<button class="wave-btn" data-action="call-wave" data-p="${i}">${I('skull')}<svg class="ring" viewBox="0 0 76 76"><circle cx="38" cy="38" r="35"/></svg><b>${Waves.state === 'ready' ? 'Bắt đầu!' : ''}</b></button>`).join('');
      }
      if (!can) return;
      const vw = Game.viewW, vh = Game.viewH;
      box.querySelectorAll('.wave-btn').forEach(b => {
        const p = Game.map.paths[+b.dataset.p].pointAt(90, {}), s = Camera.toScreen(p.x, p.y);
        const sy = Math.max(200, Math.min(vh - 160, s.y)); b.style.left = Math.max(sy < 200 ? 140 : 44, Math.min(vw - 44, s.x)) + 'px'; b.style.top = sy + 'px';
        const circ = b.querySelector('circle');
        if (Waves.state === 'waiting') { circ.style.strokeDashoffset = 220 * (1 - Waves.timer / CONFIG.match.nextWaveDelay); b.querySelector('b').textContent = '+' + Math.floor(Waves.timer * CONFIG.match.earlyCallBonusPerSec); }
        else circ.style.strokeDashoffset = 0;
      });
    },

    /* ---------- Menu vòng tròn ---------- */
    openRing(sel) {
      this.ringSel = sel; const r = $('ring'); r.classList.remove('hidden');
      const tag = (cost) => `<span class="tag">${I('coin')}${cost}</span>`;
      if (sel.kind === 'spot') {
        const pos = [[-56, -56], [56, -56], [-56, 56], [56, 56]];
        r.innerHTML = Object.keys(CONFIG.towers).map((t, i) => {
          const T = CONFIG.towers[t], cost = T.cost[0];
          return `<button class="ring-item ${Game.gold < cost ? 'poor' : ''}" style="left:${pos[i][0]}px;top:${pos[i][1]}px;animation-delay:${i * 30}ms" data-action="ring-build" data-type="${t}"><canvas data-tower="${t}" data-tier="1" data-fit="0.62" width="120" height="120"></canvas>${tag(cost)}</button>`;
        }).join('') + `<div class="ring-title" style="top:-118px">Xây trụ</div>`;
      } else {
        const T = sel.ref, c = T.nextCost;
        r.innerHTML = `<div class="ring-title">${T.def.name}<small>${T.def.tierNames[T.level - 1]} · Cấp ${T.level}</small></div>`
          + (c === null ? `<div class="ring-item act max" style="left:0;top:-70px">${I('crown')}</div>`
            : `<button class="ring-item ${Game.gold < c ? 'poor' : ''}" style="left:0;top:-70px" data-action="ring-up"><canvas data-tower="${T.type}" data-tier="${T.level + 1}" data-fit="0.62" width="120" height="120"></canvas>${tag(c)}</button>`)
          + `<button class="ring-item act sell" style="left:0;top:70px" data-action="ring-sell">${I('coin')}<span class="tag">+${T.refund}</span></button>`
          + (T.def.kind === 'barracks' ? `<button class="ring-item act rally" style="left:-70px;top:0" data-action="ring-rally">${I('flag')}</button>` : '');
      }
      this.paintCanvases(r); this.placeRing();
    },
    placeRing() {
      const s = this.ringSel; if (!s) return;
      const p = Camera.toScreen(s.ref.x, s.ref.y - 20), r = $('ring');
      r.style.left = p.x + 'px'; r.style.top = p.y + 'px';
      // cập nhật trạng thái đủ/thiếu vàng
      r.querySelectorAll('[data-action="ring-build"]').forEach(b => b.classList.toggle('poor', Game.gold < CONFIG.towers[b.dataset.type].cost[0]));
      const up = r.querySelector('[data-action="ring-up"]'); if (up) up.classList.toggle('poor', Game.gold < s.ref.nextCost);
    },
    closeRing(keepSel) { this.ringSel = null; $('ring').classList.add('hidden'); $('ring').innerHTML = ''; if (!keepSel && Game.sel) Game.sel = null; },

    /* ---------- Lớp phủ ---------- */
    overlay(html, cb) { this.overlayCb = cb || null; $('overlay-panel').innerHTML = html; this.paintCanvases($('overlay-panel')); Icon.hydrate($('overlay-panel')); $('overlay').classList.remove('hidden'); },
    closeOverlay() { $('overlay').classList.add('hidden'); },
    confirm(msg, yes) { this.overlay(`<div class="ribbon">Xác nhận</div><p style="margin-top:10px">${msg}</p><div class="row" style="margin-top:12px"><button class="gbtn gray sm" data-action="resume-none" onclick="UI.closeOverlay()">Huỷ</button><button class="gbtn red sm" data-action="overlay-ok">Đồng ý</button></div>`, yes); },
    story(name, text) {
      Game.paused = true;
      this.overlay(`<div class="ribbon green">${name}</div><p style="margin-top:12px">${text}</p><p style="font-size:14px">Chạm ô đất để xây trụ. Bấm <b>đầu lâu đỏ</b> ở cửa vào khi đã sẵn sàng.</p><div class="row" style="margin-top:10px"><button class="gbtn green" data-action="overlay-ok"><span>Vào trận</span></button></div>`, () => Game.resume());
    },
    introEnemies(types) {
      const t = types.shift(); if (!t) { Game.resume(); return; }
      const e = CONFIG.enemies[t]; Save.data.seen[t] = true; Save.save(); Game.paused = true;
      this.overlay(`<div class="ribbon blue">Quái mới!</div><canvas class="intro-art portrait dark" data-char="${t}" width="300" height="300"></canvas>
        <h3>${e.name}</h3><div class="stat-row" style="justify-content:center"><span class="chip">${I('heart')}${e.hp}</span><span class="chip">${I('shield')}Giáp ${Math.round(e.armor * 100)}%</span><span class="chip">${I('fast')}${e.speed}</span>${e.flying ? '<span class="chip">Bay</span>' : ''}</div>
        <p>${e.desc}</p><button class="gbtn green" data-action="overlay-ok" style="margin-top:6px"><span>Đã rõ!</span></button>`, () => this.introEnemies(types));
    },
    openPause() {
      if (Game.state !== 'playing') return; Game.pause(); this.pauseOpen = true;
      const s = Save.data.settings;
      this.overlay(`<div class="ribbon">Tạm dừng</div><div class="col" style="margin-top:12px">
        <button class="gbtn green" data-action="resume">${I('play')}<span>Tiếp tục</span></button>
        <button class="gbtn" data-action="restart">${I('restart')}<span>Chơi lại</span></button>
        <button class="gbtn blue" data-action="to-map">${I('map')}<span>Bản đồ</span></button>
        <div class="row"><button class="rbtn ${s.music ? 'on' : ''}" data-action="toggle" data-key="music">${I('music')}</button><button class="rbtn ${s.sound ? 'on' : ''}" data-action="toggle" data-key="sound">${I('sound')}</button></div></div>`);
    },
    showResult(r) {
      if (this.current !== 'screen-game') return;
      this.closeRing();
      const hasNext = Game.levelIndex < CONFIG.levels.length - 1 && r.win;
      this.overlay(r.win ? `<div class="ribbon green">Chiến thắng!</div>
          <div class="big-stars" style="margin-top:14px">${[1, 2, 3].map(k => `<span class="s ${k <= r.stars ? 'got' : ''}" style="animation-delay:${k * 0.25}s">${I('star')}</span>`).join('')}</div>
          <div><span class="reward">${I('heart')} ${Game.lives} mạng</span><span class="reward">${I('exp')} +${r.xp} KN</span>${r.newStars ? `<span class="reward">${I('star')} +${r.newStars} sao</span>` : ''}</div>
          ${r.lvUp ? `<p class="levelup">Anh hùng lên cấp ${Progress.heroLevel()}!</p>` : ''}
          <div class="row" style="margin-top:12px"><button class="rbtn" data-action="restart">${I('restart')}</button><button class="rbtn" data-action="to-map">${I('map')}</button>
          ${hasNext ? `<button class="gbtn green" data-action="next-level"><span>Màn tiếp</span>${I('play')}</button>` : ''}</div>`
        : `<div class="ribbon">Thất bại</div><p style="margin-top:14px">Quân bóng tối đã tràn qua cổng thành...</p>
          <div><span class="reward">${I('exp')} +${r.xp} KN</span></div>
          <p style="font-size:14px">Mẹo: dùng sao để nâng cấp trụ, xây Pháp sư để hạ quái giáp dày.</p>
          <div class="row" style="margin-top:12px"><button class="rbtn" data-action="to-map">${I('map')}</button><button class="gbtn green" data-action="restart">${I('restart')}<span>Thử lại</span></button></div>`);
    },

    /* ---------- Thông báo ---------- */
    toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 1700); },
    tip(m) { const t = $('tip'); if (!m) { t.classList.add('hidden'); return; } t.textContent = m; t.classList.remove('hidden'); },
    banner(text, boss) { const b = $('banner'); b.textContent = text; b.className = boss ? 'boss' : ''; void b.offsetWidth; b.classList.add('show'); },
    bossWarning(name) { this.banner(name + '!', true); },
    lifeLost() { const f = $('life-flash'); f.classList.remove('show'); void f.offsetWidth; f.classList.add('show'); const p = $('hud-lives').parentElement; p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
  };

  /* ---------- Vẽ bản đồ thế giới ---------- */
  function paintWorld(g, W, H) {
    const bands = [['#7cb342', 840], ['#5f9a3a', 700], ['#78b048', 560], ['#6a8a48', 430], ['#e6eef4', 300], ['#6a5a50', 150]];
    const gr = g.createLinearGradient(0, H, 0, 0);
    bands.forEach(([c, y]) => gr.addColorStop(1 - y / H, c)); gr.addColorStop(1, '#3a2a30');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const rnd = K.seeded(11);
    // sông
    g.lineCap = 'round'; g.strokeStyle = '#d8c08a'; g.lineWidth = 34; g.beginPath(); g.moveTo(-10, 600); g.bezierCurveTo(120, 560, 260, 640, 410, 580); g.stroke();
    g.strokeStyle = '#46a6dc'; g.lineWidth = 24; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 6; g.stroke();
    // cây, núi, đá
    for (let i = 0; i < 260; i++) {
      const x = rnd() * W, y = 30 + rnd() * (H - 40);
      g.save(); g.translate(x, y); g.scale(0.55, 0.55);
      if (y < 190) { K.limb(g, 0, 0, 0, -18, 3, '#3a2e28'); K.limb(g, 0, -10, 8, -18, 2, '#3a2e28'); if (rnd() < 0.3) K.glow(g, 0, 0, 20, '#ff5a1a', 0.5); }
      else if (y < 340) { K.poly(g, [-14, 0, 14, 0, 0, -30], '#3f7a52', { s: 3, h: 1.4 }); K.flat(g, [-5, -20, 5, -20, 0, -30], '#fff'); }
      else if (y < 470) { K.circ(g, 0, -10, 10, '#4a6a36'); }
      else { K.circ(g, -6, -10, 9, rnd() < 0.5 ? '#4a8a32' : '#5a9a3a'); K.circ(g, 6, -12, 10, '#6aaa42'); }
      g.restore();
    }
    // núi tuyết
    for (const [x, y, s] of [[60, 300, 1.2], [330, 320, 1], [200, 250, 1.4]]) { g.save(); g.translate(x, y); g.scale(s, s); K.poly(g, [-40, 0, 0, -60, 40, 0], '#8a96a8', { s: 8, h: 3 }); K.flat(g, [-14, -40, 0, -60, 14, -40, 6, -36, 0, -42, -6, -36], '#fff'); g.restore(); }
    // núi lửa
    g.save(); g.translate(320, 120); K.poly(g, [-50, 0, -12, -56, 12, -56, 50, 0], '#4a3a36', { s: 8, h: 2 }); K.glow(g, 0, -56, 40, '#ff5a1a', 0.9); g.restore();
    // thành ở dưới
    g.save(); g.translate(200, 838); K.rr(g, -70, -40, 140, 44, 4, '#c8c2d4', { s: 6, h: 2 }); for (let i = -60; i < 66; i += 22) K.rr(g, i, -50, 14, 12, 2, '#d8d2e2', { s: 2, h: 1 }); for (const s of [-1, 1]) { K.rr(g, s * 60 - 14, -70, 28, 74, 4, '#d0cadc', { s: 5, h: 2 }); K.poly(g, [s * 60 - 18, -70, s * 60, -96, s * 60 + 18, -70], '#3d6fc0', { s: 4, h: 1.6 }); } g.restore();
    const v = g.createRadialGradient(W / 2, H / 2, W * 0.4, W / 2, H / 2, H * 0.7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,10,30,.45)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  window.UI = UI;
})();
