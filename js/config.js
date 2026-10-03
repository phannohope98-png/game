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
    rallyProgress: 0.85,    // điểm tập kết mặc định (tỉ lệ chiều dài đường)
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
    swordsman: {
      name: 'Kiếm sĩ', role: 'Cận chiến bảo vệ trụ Người', icon: 'sword', color: '#4777a8',
      attackType: 'melee', projectile: null, targeting: 'nearest', cost: 0,
      attackSpeed: 1.15, range: 42, speed: 78, armor: 10, aoeRadius: 0, radius: 17,
      sound: 'hit', abilities: [], leash: 135,
      desc: 'Hai kiếm sĩ canh giữ quanh trụ Người. Chết sẽ tự hồi sinh.',
      levels: [{hp:240,damage:30},{hp:330,damage:42},{hp:450,damage:58}], upgradeCost:[0,300,700]
    },
    wolfrider: {
      name: 'Orc cưỡi sói', role: 'Kỵ binh cận chiến', icon: 'axe', color: '#628b3d',
      attackType: 'melee', projectile: null, targeting: 'nearest', cost: 0,
      attackSpeed: 1.45, range: 48, speed: 105, armor: 18, aoeRadius: 0, radius: 22,
      sound: 'orc', abilities: ['rage'], leash: 175,
      desc: 'Một Orc cưỡi sói tuần tra quanh trụ Orc. Chết sẽ tự hồi sinh.',
      levels: [{hp:520,damage:58},{hp:720,damage:78},{hp:980,damage:105}], upgradeCost:[0,450,1000]
    }
  },

  /* ---------------- KỸ NĂNG ---------------- */
  skills: {
    fireball: {
      name: 'Cầu lửa', icon: 'fire', requires: 'mage', cooldown: 18,
      damage: 100, radius: 80, targeted: true,
      hint: 'Chạm vào bản đồ để thả Cầu lửa'
    },
    iceStorm: {
      name: 'Bão băng', icon: 'frost', requires: 'mage', cooldown: 30,
      slow: 0.4, duration: 3, radius: 180, damage: 20, targeted: true,
      hint: 'Chạm vào bản đồ để gọi Bão băng'
    },
    rage: {
      name: 'Cuồng nộ', icon: 'rage', requires: 'orc', cooldown: 35,
      damageBonus: 0.5, attackSpeedBonus: 0.3, duration: 5, targeted: false
    }
  },

  /* ---------------- QUÁI ----------------
     Hình được vẽ bằng code (art.js). Muốn dùng ảnh thật: điền
     sprite: { image: 'assets/enemies/goblin.png' } – không cần sửa gameplay. */
  enemies: {
    goblin:   { name: 'Yêu tinh',      hp: 100,   damage: 10,  speed: 80, reward: 10,   exp: 5,   armor: 0,  attackSpeed: 1.0, radius: 15, sprite: {}, size: 30 },
    skeleton: { name: 'Bộ xương',      hp: 150,   damage: 20,  speed: 70, reward: 15,   exp: 8,   armor: 5,  attackSpeed: 1.1, radius: 15, sprite: {}, size: 30 },
    orc:      { name: 'Orc hắc ám',    hp: 400,   damage: 30,  speed: 45, reward: 30,   exp: 15,  armor: 10, attackSpeed: 1.4, radius: 19, sprite: {}, size: 38 },
    giant:    { name: 'Người khổng lồ', hp: 2000, damage: 100, speed: 25, reward: 200,  exp: 50,  armor: 15, attackSpeed: 2.2, radius: 28, sprite: {}, size: 56 },
    boss:     { name: 'Chúa Quỷ',      hp: 10000, damage: 150, speed: 20, reward: 1000, exp: 200, armor: 20, attackSpeed: 2.0, radius: 36, sprite: {}, size: 74,
                isBoss: true,
                skill: { type: 'summon', enemy: 'goblin', count: 3, cooldown: 9 } }
  },

  /* ---------------- CÔNG TRÌNH ----------------
     productionSpeed: 1 = 100%, 1.2 = 120%...
     startLevelCost: giá nâng "cấp khởi điểm" vĩnh viễn ở menu Công trình. */
  buildings: {
    humanTower: {
      name:'Trụ Con Người', icon:'sword', color:'#4777a8', cost:180, mode:'barracks', unitType:'swordsman', unitCount:2, respawnTime:12,
      levels:[{guardRange:145},{guardRange:165},{guardRange:190}], upgradeCost:[0,180,320], startLevelCost:[0,800,2000],
      desc:'Triệu hồi 2 kiếm sĩ bảo vệ khu vực quanh trụ. Kiếm sĩ chết hồi sinh sau 12 giây.'
    },
    elfTower: {
      name:'Trụ Elf', icon:'bow', color:'#3f8b63', cost:170, mode:'tower', projectile:'arrow', attackSpeed:1.05,
      levels:[{range:205,damage:28},{range:245,damage:42},{range:290,damage:62}], upgradeCost:[0,170,300], startLevelCost:[0,800,2000],
      desc:'Trụ bắn cung thuần túy. Tầm bắn tăng rõ rệt khi nâng cấp.'
    },
    orcTower: {
      name:'Trụ Orc', icon:'axe', color:'#628b3d', cost:260, mode:'barracks', unitType:'wolfrider', unitCount:1, respawnTime:18,
      levels:[{guardRange:175},{guardRange:205},{guardRange:235}], upgradeCost:[0,240,420], startLevelCost:[0,1000,2500],
      desc:'Triệu hồi 1 Orc cưỡi sói canh giữ quanh trụ. Chết hồi sinh sau 18 giây.'
    },
    mageTower: {
      name:'Trụ Phù Thủy', icon:'staff', color:'#7550a8', cost:300, mode:'tower', projectile:'magic', attackSpeed:1.75, aoeRadius:52,
      levels:[{range:255,damage:48},{range:310,damage:72},{range:370,damage:105}], upgradeCost:[0,260,450], startLevelCost:[0,1000,2500],
      desc:'Bắn phép AoE gây sát thương lan. Tầm xa hơn Elf và tăng theo cấp.'
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
    startGold: { name: 'Vàng khởi đầu', icon: 'coin', perLevel: 50, maxLevel: 5, cost: [300, 700, 1200, 2000, 3000] }
  },

  stars: { three: 0.8, two: 0.5 }, // % máu cổng

  shop: [
    { id: 'gold_s', name: 'Túi vàng',   icon: 'bag', gems: 10, gold: 300 },
    { id: 'gold_m', name: 'Rương vàng', icon: 'chest', gems: 25, gold: 900 },
    { id: 'gold_l', name: 'Kho báu',    icon: 'crown', gems: 50, gold: 2000 }
  ],

  /* ---------------- ÂM THANH ----------------
     Để trống = dùng âm thanh tổng hợp. Muốn dùng file thật:
     arrow: 'assets/sounds/arrow.mp3' */
  audioFiles: {
    music: null, click: null, arrow: null, magic: null, orc: null, death: null,
    boss: null, victory: null, defeat: null, gold: null, build: null, hit: null
  },

  /* ---------------- BẢN ĐỒ ----------------
     Bản đồ là lưới 9 cột ô vuông. Mỗi điểm đường đi = [cột (0–8), hàng tỉ lệ (0–1)].
     Hàng -1 = ngoài màn hình (nơi quái xuất hiện); hàng 1 = sát cổng thành.
     Các đoạn phải đi thẳng ngang hoặc dọc. Ô xây nhà tự sinh dọc 2 bên đường. */
  paths: {
    s_curve:  [[4,-1],[4,0.1],[1,0.1],[1,0.4],[7,0.4],[7,0.72],[4,0.72],[4,1]],
    zigzag:   [[1,-1],[1,0.22],[7,0.22],[7,0.5],[1,0.5],[1,0.78],[4,0.78],[4,1]],
    hook:     [[7,-1],[7,0.15],[2,0.15],[2,0.55],[6,0.55],[6,0.8],[4,0.8],[4,1]],
    snake:    [[1,-1],[1,0.1],[7,0.1],[7,0.32],[1,0.32],[1,0.56],[7,0.56],[7,0.8],[4,0.8],[4,1]],
    fortress: [[4,-1],[4,0.12],[7,0.12],[7,0.36],[1,0.36],[1,0.62],[5,0.62],[5,0.84],[4,0.84],[4,1]]
  },

  /* Màu & vật trang trí theo vùng. decor: tree | pine | rock | bush | deadtree | cactus | bones | crystal */
  themes: {
    grass:  { ground: '#4d6b34', ground2: '#486531', path: '#8f7552', pathEdge: '#5e4a33', leaf: '#3c6b2f', leaf2: '#2d5424', rock: '#7d7870', decor: ['tree','tree','pine','rock','bush'] },
    forest: { ground: '#3d5a30', ground2: '#39552d', path: '#86704f', pathEdge: '#574530', leaf: '#2f5a2a', leaf2: '#234520', rock: '#6f6b64', decor: ['pine','pine','tree','bush','rock'] },
    swamp:  { ground: '#3e4d35', ground2: '#3a4831', path: '#6b5c45', pathEdge: '#463b2c', leaf: '#4a5a32', leaf2: '#3a4828', rock: '#5f5c55', decor: ['deadtree','bush','rock','deadtree','bones'] },
    rock:   { ground: '#5b6150', ground2: '#565c4b', path: '#8d8576', pathEdge: '#5f594f', leaf: '#3c5a32', leaf2: '#2e4828', rock: '#8a857c', decor: ['rock','rock','pine','rock','bush'] },
    desert: { ground: '#b8955a', ground2: '#b18e54', path: '#d2b27a', pathEdge: '#8d6e44', leaf: '#5b7f3a', leaf2: '#4a6a2e', rock: '#9a8466', decor: ['cactus','rock','rock','bones','cactus'] },
    canyon: { ground: '#8e5034', ground2: '#874b31', path: '#c08a5c', pathEdge: '#6b3e26', leaf: '#5b7f3a', leaf2: '#4a6a2e', rock: '#a0664a', decor: ['rock','rock','deadtree','cactus','bones'] },
    snow:   { ground: '#cdd8e0', ground2: '#c6d2db', path: '#9aa6b2', pathEdge: '#6f7b88', leaf: '#2f5a3a', leaf2: '#234530', rock: '#8e98a3', snow: true, decor: ['pine','pine','rock','tree','pine'] },
    lava:   { ground: '#3a2a26', ground2: '#362723', path: '#6b4a36', pathEdge: '#b4471f', leaf: '#4a3a30', leaf2: '#3a2c24', rock: '#5a4a44', decor: ['rock','deadtree','crystal','rock','bones'] },
    castle: { ground: '#33303d', ground2: '#2f2c38', path: '#6c6680', pathEdge: '#47425a', leaf: '#3a3a4a', leaf2: '#2c2c3a', rock: '#5c5868', decor: ['deadtree','bones','rock','crystal','deadtree'] }
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
