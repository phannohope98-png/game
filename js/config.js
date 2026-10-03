/* =========================================================
 * CANH CỔNG – CẤU HÌNH GAME (config.js)
 * ---------------------------------------------------------
 * TẤT CẢ thông số cân bằng game nằm ở đây.
 * Muốn chỉnh độ khó, giá tiền, máu, sát thương... chỉ cần
 * sửa file này, KHÔNG cần sửa engine.
 * ========================================================= */
window.CONFIG = {
  /* Kích thước thế giới (đơn vị logic). Chiều cao tự co giãn theo màn hình
     trong khoảng [minHeight, maxHeight] khi bắt đầu màn chơi. */
  world: { width: 720, minHeight: 900, maxHeight: 1500 },

  combat: {
    critChance: 0.05,      // 5% chí mạng
    critMultiplier: 1.5,   // 150% sát thương
    minDamage: 1           // sát thương tối thiểu
  },

  match: {
    startGold: 400,        // vàng đầu trận
    firstWaveDelay: 8,     // giây trước đợt đầu
    nextWaveDelay: 7,      // giây nghỉ giữa các đợt
    earlyCallBonusPerSec: 2, // thưởng vàng mỗi giây khi gọi đợt sớm
    groupGap: 1.5,         // giây nghỉ giữa các nhóm quái trong 1 đợt
    maxUnits: 30,          // giới hạn tổng số lính trên sân
    rallyProgress: 0.88,    // điểm tập kết mặc định (tỉ lệ chiều dài đường)
    repair: { cost: 120, percent: 0.25, cooldown: 20 },
    sellRefund: 0.5,
    victoryKillGoldShare: 0.2, // % vàng diệt quái chuyển vào kho khi thắng
    defeatKillGoldShare: 0.3,  // % vàng diệt quái chuyển vào kho khi thua
    victoryBonusExp: 20,
    goldPerStar: 50
  },

  /* ---------------- CỔNG THÀNH ---------------- */
  gate: {
    levels: [
      { hp: 1000, armor: 0 },
      { hp: 1500, armor: 10 },
      { hp: 2200, armor: 20 },
      { hp: 3200, armor: 35 },
      { hp: 5000, armor: 50 }
    ],
    upgradeCost: [0, 500, 1200, 2500, 5000] // giá lên cấp (kho vàng)
  },

  /* ---------------- LÍNH ----------------
     attackSpeed = số giây giữa 2 đòn đánh. leash = bán kính canh giữ quanh vị trí đứng.
     targeting: closestToGate | densest | nearest
     Thêm lính mới: copy 1 khối và đổi id/thông số. */
  units: {
    archer: {
      name: 'Cung thủ', role: 'Tấn công tầm xa', icon: '🏹', color: '#3d8bd9',
      attackType: 'ranged', projectile: 'arrow', targeting: 'closestToGate',
      cost: 100, attackSpeed: 1.2, range: 250, speed: 60, armor: 0, aoeRadius: 0,
      radius: 17, sound: 'arrow', abilities: [], leash: 160,
      desc: 'Bắn xa, sát thương vừa, máu thấp. Ưu tiên quái gần cổng.',
      levels: [
        { hp: 100, damage: 25 }, { hp: 130, damage: 35 }, { hp: 170, damage: 50 },
        { hp: 220, damage: 70 }, { hp: 300, damage: 100 }
      ],
      upgradeCost: [0, 300, 700, 1500, 3000]
    },
    mage: {
      name: 'Phù thủy', role: 'Phép thuật diện rộng', icon: '🔮', color: '#9b5de5',
      attackType: 'ranged', projectile: 'magic', targeting: 'densest',
      cost: 250, attackSpeed: 2.5, range: 220, speed: 55, armor: 0, aoeRadius: 70,
      radius: 17, sound: 'magic', abilities: ['fireball', 'iceStorm'], leash: 140,
      desc: 'Cầu phép nổ lan. Ưu tiên nhóm quái đông. Mở khóa Cầu lửa & Bão băng.',
      levels: [
        { hp: 80, damage: 50 }, { hp: 100, damage: 65 }, { hp: 125, damage: 85 },
        { hp: 155, damage: 110 }, { hp: 200, damage: 150 }
      ],
      upgradeCost: [0, 400, 900, 1800, 3500]
    },
    orc: {
      name: 'Chiến binh Orc', role: 'Đỡ đòn cận chiến', icon: '🪓', color: '#4f9a3a',
      attackType: 'melee', projectile: null, targeting: 'nearest',
      cost: 300, attackSpeed: 1.8, range: 50, speed: 70, armor: 30, aoeRadius: 0,
      radius: 20, sound: 'orc', abilities: ['rage'], leash: 90,
      desc: 'Máu trâu, giáp dày, đứng chặn đường quái. Mở khóa Cuồng nộ.',
      levels: [
        { hp: 500, damage: 60 }, { hp: 650, damage: 75 }, { hp: 850, damage: 95 },
        { hp: 1100, damage: 120 }, { hp: 1500, damage: 160 }
      ],
      upgradeCost: [0, 450, 1000, 2000, 4000]
    }
  },

  /* ---------------- KỸ NĂNG ---------------- */
  skills: {
    fireball: {
      name: 'Cầu lửa', icon: '🔥', requires: 'mage', cooldown: 5,
      damage: 100, radius: 80, targeted: true,
      hint: 'Chạm vào bản đồ để thả Cầu lửa'
    },
    iceStorm: {
      name: 'Bão băng', icon: '❄️', requires: 'mage', cooldown: 10,
      slow: 0.4, duration: 3, radius: 180, damage: 20, targeted: true,
      hint: 'Chạm vào bản đồ để gọi Bão băng'
    },
    rage: {
      name: 'Cuồng nộ', icon: '😡', requires: 'orc', cooldown: 15,
      damageBonus: 0.5, attackSpeedBonus: 0.3, duration: 5, targeted: false
    }
  },

  /* ---------------- QUÁI ----------------
     sprite.emoji là hình tạm. Muốn dùng ảnh thật: thêm sprite.image
     = 'assets/enemies/goblin.png' – không cần sửa gameplay. */
  enemies: {
    goblin:   { name: 'Yêu tinh',      hp: 100,   damage: 10,  speed: 80, reward: 10,   exp: 5,   armor: 0,  attackSpeed: 1.0, radius: 15, sprite: { emoji: '👺' }, size: 30 },
    skeleton: { name: 'Bộ xương',      hp: 150,   damage: 20,  speed: 70, reward: 15,   exp: 8,   armor: 5,  attackSpeed: 1.1, radius: 15, sprite: { emoji: '💀' }, size: 30 },
    orc:      { name: 'Orc hắc ám',    hp: 400,   damage: 30,  speed: 45, reward: 30,   exp: 15,  armor: 10, attackSpeed: 1.4, radius: 19, sprite: { emoji: '👹' }, size: 38 },
    giant:    { name: 'Người khổng lồ', hp: 2000, damage: 100, speed: 25, reward: 200,  exp: 50,  armor: 15, attackSpeed: 2.2, radius: 28, sprite: { emoji: '🗿' }, size: 56 },
    boss:     { name: 'Chúa Quỷ',      hp: 10000, damage: 150, speed: 20, reward: 1000, exp: 200, armor: 20, attackSpeed: 2.0, radius: 36, sprite: { emoji: '😈' }, size: 74,
                isBoss: true,
                skill: { type: 'summon', enemy: 'goblin', count: 3, cooldown: 9 } }
  },

  /* ---------------- CÔNG TRÌNH ----------------
     productionSpeed: 1 = 100%, 1.2 = 120%...
     startLevelCost: giá nâng "cấp khởi điểm" vĩnh viễn ở menu Công trình. */
  buildings: {
    archerBarracks: {
      name: 'Trại cung thủ', icon: '🏹', color: '#3d8bd9', unitType: 'archer',
      cost: 150, hp: 400, baseProductionTime: 12,
      levels: [ { productionSpeed: 1, maxUnits: 2 }, { productionSpeed: 1.2, maxUnits: 3 }, { productionSpeed: 1.5, maxUnits: 4 } ],
      upgradeCost: [0, 150, 250], startLevelCost: [0, 800, 2000],
      desc: 'Tự động huấn luyện Cung thủ miễn phí.'
    },
    mageTower: {
      name: 'Tháp phù thủy', icon: '🔮', color: '#9b5de5', unitType: 'mage',
      cost: 300, hp: 400, baseProductionTime: 18,
      levels: [ { productionSpeed: 1, maxUnits: 1 }, { productionSpeed: 1.2, maxUnits: 2 }, { productionSpeed: 1.5, maxUnits: 3 } ],
      upgradeCost: [0, 250, 400], startLevelCost: [0, 1000, 2500],
      desc: 'Tự động triệu hồi Phù thủy miễn phí.'
    },
    orcBarracks: {
      name: 'Trại Orc', icon: '🪓', color: '#4f9a3a', unitType: 'orc',
      cost: 350, hp: 600, baseProductionTime: 20,
      levels: [ { productionSpeed: 1, maxUnits: 1 }, { productionSpeed: 1.2, maxUnits: 2 }, { productionSpeed: 1.5, maxUnits: 3 } ],
      upgradeCost: [0, 300, 450], startLevelCost: [0, 1000, 2500],
      desc: 'Tự động huấn luyện Chiến binh Orc miễn phí.'
    },
    goldMine: {
      name: 'Mỏ vàng', icon: '💰', color: '#e0a526', unitType: null,
      cost: 200, hp: 300, baseProductionTime: 10,
      levels: [ { income: 5 }, { income: 10 }, { income: 20 } ],
      upgradeCost: [0, 150, 300], startLevelCost: [0, 600, 1500],
      desc: 'Sinh vàng mỗi 10 giây trong trận.'
    }
  },

  /* ---------------- NGƯỜI CHƠI ---------------- */
  player: {
    // EXP cần để đạt cấp: index 0 = Lv1, index 1 = Lv2...
    levelExp: [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 7000, 9000, 12000],
    gemsPerLevel: 10,
    gemsPerNewStar: 5,
    startGems: 20
  },

  /* Nâng cấp vĩnh viễn khác */
  upgrades: {
    startGold: { name: 'Vàng khởi đầu', icon: '🪙', perLevel: 50, maxLevel: 5, cost: [300, 700, 1200, 2000, 3000] }
  },

  stars: { three: 0.8, two: 0.5 }, // % máu cổng

  shop: [
    { id: 'gold_s', name: 'Túi vàng',   icon: '👝', gems: 10, gold: 300 },
    { id: 'gold_m', name: 'Rương vàng', icon: '🧰', gems: 25, gold: 900 },
    { id: 'gold_l', name: 'Kho báu',    icon: '👑', gems: 50, gold: 2000 }
  ],

  /* ---------------- ÂM THANH ----------------
     Để trống = dùng âm thanh tổng hợp. Muốn dùng file thật:
     arrow: 'assets/sounds/arrow.mp3' */
  audioFiles: {
    music: null, click: null, arrow: null, magic: null, orc: null, death: null,
    boss: null, victory: null, defeat: null, gold: null, build: null, hit: null
  },

  /* ---------------- BẢN ĐỒ ----------------
     Đường đi dạng toạ độ chuẩn hoá (0..1). Điểm đầu = nơi quái xuất hiện,
     điểm cuối = cổng thành. Thêm đường mới chỉ cần thêm 1 mảng. */
  paths: {
    s_curve: [[0.5,-0.04],[0.5,0.12],[0.22,0.2],[0.22,0.36],[0.78,0.46],[0.78,0.62],[0.5,0.72],[0.5,0.86]],
    zigzag:  [[0.15,-0.04],[0.15,0.16],[0.85,0.26],[0.85,0.4],[0.15,0.5],[0.15,0.64],[0.5,0.74],[0.5,0.86]],
    hook:    [[0.85,-0.04],[0.85,0.2],[0.4,0.2],[0.18,0.32],[0.18,0.5],[0.6,0.56],[0.82,0.68],[0.5,0.76],[0.5,0.86]],
    snake:   [[0.1,-0.04],[0.1,0.1],[0.9,0.14],[0.9,0.3],[0.1,0.36],[0.1,0.52],[0.9,0.56],[0.9,0.7],[0.5,0.75],[0.5,0.86]],
    fortress:[[0.5,-0.04],[0.5,0.08],[0.15,0.14],[0.15,0.3],[0.5,0.36],[0.85,0.3],[0.85,0.5],[0.5,0.56],[0.2,0.62],[0.2,0.72],[0.5,0.78],[0.5,0.86]]
  },

  themes: {
    grass:  { ground: '#5b8c3e', ground2: '#4f7d35', path: '#b98d5a', pathEdge: '#8a6438', decor: ['🌳','🌲','🌿','🪨','🌼'] },
    forest: { ground: '#3f7a3a', ground2: '#356a31', path: '#a9825a', pathEdge: '#76553a', decor: ['🌲','🌲','🌳','🍄','🪨'] },
    swamp:  { ground: '#4a6640', ground2: '#3e5836', path: '#7d6b4b', pathEdge: '#5a4c34', decor: ['🌿','🍄','🪵','🌾','🪨'] },
    rock:   { ground: '#6f7a5c', ground2: '#646e52', path: '#a59a86', pathEdge: '#7a705f', decor: ['🪨','🪨','🌲','🏔️','🌿'] },
    desert: { ground: '#d8b56a', ground2: '#cba75e', path: '#b08a52', pathEdge: '#8d6b3c', decor: ['🌵','🌵','🪨','🦴','🌴'] },
    canyon: { ground: '#b5673f', ground2: '#a65d38', path: '#d8a46e', pathEdge: '#9b6a3f', decor: ['🪨','🌵','🦴','🪨','🌾'] },
    snow:   { ground: '#dfe9f0', ground2: '#cfdde7', path: '#a8b6c4', pathEdge: '#7f8fa0', decor: ['🌲','⛄','🪨','❄️','🌲'] },
    lava:   { ground: '#4a3530', ground2: '#3f2c28', path: '#8a5a3a', pathEdge: '#e0662a', decor: ['🌋','🪨','🔥','🪨','🦴'] },
    castle: { ground: '#3d3b4f', ground2: '#353344', path: '#7c7591', pathEdge: '#575170', decor: ['🪦','🕯️','🪨','🦇','🪦'] }
  },

  /* ---------------- CHIẾN DỊCH (10 màn) ----------------
     Mỗi đợt là chuỗi "loại:số_lượng" ngăn cách bởi dấu phẩy.
     Có thể thêm "@hệ_số_máu", ví dụ "boss:1@0.5" = boss 50% máu.
     hpMul = hệ số máu quái của cả màn. */
  stages: [
    { name: 'Đồi Cỏ Xanh',     path: 's_curve',  theme: 'grass',  hpMul: 1.0,  rewardGold: 150,
      waves: ['goblin:6', 'goblin:10', 'goblin:8,skeleton:3', 'goblin:12,skeleton:5'] },
    { name: 'Rừng Thông',      path: 'zigzag',   theme: 'forest', hpMul: 1.0,  rewardGold: 200,
      waves: ['goblin:8', 'goblin:8,skeleton:4', 'skeleton:8,goblin:6', 'goblin:12,skeleton:6', 'orc:2,goblin:10'] },
    { name: 'Thung Lũng Sương', path: 'hook',    theme: 'grass',  hpMul: 1.05, rewardGold: 250,
      waves: ['goblin:10', 'skeleton:8', 'orc:2,goblin:10', 'skeleton:10,orc:3', 'goblin:16,orc:4'] },
    { name: 'Đầm Lầy Đen',     path: 'snake',    theme: 'swamp',  hpMul: 1.15, rewardGold: 300,
      waves: ['skeleton:12', 'goblin:15,orc:3', 'orc:6,skeleton:8', 'goblin:20,skeleton:10', 'orc:6,skeleton:10', 'giant:1,goblin:10'] },
    { name: 'Pháo Đài Đá',     path: 's_curve',  theme: 'rock',   hpMul: 1.2,  rewardGold: 400,
      waves: ['goblin:15', 'skeleton:12,orc:3', 'orc:8', 'giant:1,skeleton:10', 'orc:8,goblin:15', 'boss:1@0.45,goblin:10'] },
    { name: 'Sa Mạc Vàng',     path: 'zigzag',   theme: 'desert', hpMul: 1.3,  rewardGold: 450,
      waves: ['goblin:20', 'skeleton:15,orc:4', 'orc:10', 'giant:2', 'orc:8,skeleton:15', 'giant:2,orc:6'] },
    { name: 'Hẻm Núi Đỏ',      path: 'hook',     theme: 'canyon', hpMul: 1.4,  rewardGold: 500,
      waves: ['skeleton:20', 'orc:10,goblin:10', 'giant:2,skeleton:10', 'orc:15', 'goblin:30,orc:5', 'giant:3', 'boss:1@0.6,orc:6'] },
    { name: 'Đồng Băng',       path: 'snake',    theme: 'snow',   hpMul: 1.5,  rewardGold: 600,
      waves: ['goblin:20,skeleton:10', 'orc:12', 'giant:2,orc:6', 'skeleton:25', 'orc:15,goblin:15', 'giant:3,skeleton:10', 'giant:4'] },
    { name: 'Núi Lửa',         path: 'fortress', theme: 'lava',   hpMul: 1.6,  rewardGold: 700,
      waves: ['orc:10,skeleton:10', 'giant:2,goblin:20', 'orc:20', 'skeleton:30', 'giant:3,orc:8', 'orc:20,skeleton:10', 'giant:5', 'boss:1@0.8,giant:1'] },
    { name: 'Thành Quỷ Vương', path: 's_curve',  theme: 'castle', hpMul: 1.6,  rewardGold: 1000,
      waves: ['goblin:10', 'goblin:15', 'goblin:10,skeleton:5', 'goblin:20,skeleton:10', 'orc:5,goblin:10',
              'skeleton:20,orc:5', 'orc:10,skeleton:10', 'orc:20', 'orc:10,giant:2', 'boss:1'] }
  ],

  // Khoảng cách xuất hiện mặc định giữa 2 quái cùng loại (giây)
  spawnInterval: { goblin: 0.9, skeleton: 1.0, orc: 1.6, giant: 4, boss: 1 }
};
