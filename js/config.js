/* =========================================================
 * CANH CỔNG – KỶ NGUYÊN BÓNG TỐI · Cấu hình game
 * Mọi thông số cân bằng nằm ở đây.
 * Giáp (armor) & kháng phép (mres) tính theo % giảm sát thương (0 – 0.8).
 * ========================================================= */
window.CONFIG = {
  world: { width: 960, height: 1500 },
  pathWidth: 66,

  match: {
    lives: 20,
    firstWaveDelay: 0,          // 0 = chờ người chơi bấm nút bắt đầu
    nextWaveDelay: 14,
    earlyCallBonusPerSec: 2,    // vàng thưởng / giây khi gọi đợt sớm
    sellRefund: 0.6,
    stars: { three: 18, two: 10 } // số mạng còn lại để đạt sao
  },

  /* ---------------- TRỤ ----------------
     cost[i] = giá xây (i=0) / giá nâng lên cấp i+1.
     Cấp 4 có kỹ năng đặc biệt. */
  towers: {
    archer: {
      name: 'Tháp Cung Elf', short: 'Cung Elf', icon: 'bow', color: '#3f9a52', kind: 'shooter',
      projectile: 'arrow', targetsAir: true, damageType: 'physical',
      cost: [70, 110, 160, 230],
      tierNames: ['Chòi Canh', 'Tháp Gỗ', 'Tháp Ngân Lâm', 'Thánh Điện Thần Xạ'],
      levels: [
        { damage: [6, 9], range: 165, rate: 0.6 },
        { damage: [11, 15], range: 175, rate: 0.55 },
        { damage: [17, 24], range: 190, rate: 0.5 },
        { damage: [26, 34], range: 210, rate: 0.45, special: 'pierce' }
      ],
      desc: 'Bắn nhanh, trúng cả quân bay. Cấp 4: cứ 4 phát có 1 mũi tên thần gây sát thương gấp 3.'
    },
    barracks: {
      name: 'Doanh Trại', short: 'Doanh trại', icon: 'shield', color: '#3d6fc0', kind: 'barracks',
      soldiers: 3, respawn: 10, engage: 85, rallyRange: 165,
      cost: [70, 110, 160, 230],
      tierNames: ['Trại Lính', 'Đồn Bộ Binh', 'Pháo Đài', 'Sảnh Hiệp Sĩ'],
      levels: [
        { hp: 60, damage: [3, 5], armor: 0, art: 'soldier1' },
        { hp: 100, damage: [6, 9], armor: 0.15, art: 'soldier2' },
        { hp: 160, damage: [10, 14], armor: 0.3, art: 'soldier3' },
        { hp: 250, damage: [16, 22], armor: 0.45, art: 'soldier4', special: 'knight' }
      ],
      desc: 'Gửi 3 lính ra chặn đường. Lính chết hồi sinh sau 10 giây, đứng yên thì tự hồi máu. Cấp 4: hiệp sĩ giáp nặng.'
    },
    mage: {
      name: 'Tháp Pháp Sư', short: 'Pháp sư', icon: 'staff', color: '#5a4ac8', kind: 'shooter',
      projectile: 'bolt', targetsAir: true, damageType: 'magic',
      cost: [100, 140, 190, 260],
      tierNames: ['Tháp Tập Sự', 'Tháp Phù Thủy', 'Tháp Huyền Bí', 'Đài Tinh Tú'],
      levels: [
        { damage: [12, 20], range: 150, rate: 1.5 },
        { damage: [24, 38], range: 160, rate: 1.45 },
        { damage: [40, 60], range: 170, rate: 1.4 },
        { damage: [62, 86], range: 180, rate: 1.35, special: 'chain' }
      ],
      desc: 'Phép thuật xuyên giáp, cực mạnh với quái giáp dày. Cấp 4: tia phép nảy sang 3 quái.'
    },
    artillery: {
      name: 'Pháo Người Lùn', short: 'Pháo lùn', icon: 'bomb', color: '#c0502a', kind: 'shooter',
      projectile: 'bomb', targetsAir: false, damageType: 'physical',
      cost: [110, 150, 200, 270],
      tierNames: ['Ụ Súng Cối', 'Pháo Đồng', 'Pháo Đài Sắt', 'Lò Rèn Sấm Sét'],
      levels: [
        { damage: [8, 15], range: 165, rate: 3.0, aoe: 55 },
        { damage: [16, 28], range: 170, rate: 3.0, aoe: 60 },
        { damage: [28, 44], range: 180, rate: 2.9, aoe: 66 },
        { damage: [42, 66], range: 190, rate: 2.8, aoe: 74, special: 'cluster' }
      ],
      desc: 'Bắn đạn nổ lan cả đám. Không bắn được quân bay. Cấp 4: đạn chùm nổ thêm 3 quả nhỏ.'
    },
    beast: {
      name: 'Trại Thú Orc', short: 'Thú Orc', icon: 'axe', color: '#9a2a22', kind: 'barracks',
      soldiers: 1, respawn: 12, engage: 95, rallyRange: 165, speed: 105,
      cost: [120, 160, 210, 280],
      tierNames: ['Lều Săn', 'Trại Sói', 'Doanh Trại Chiến', 'Đại Trướng Thú Vương'],
      levels: [
        { hp: 200, damage: [12, 18], armor: 0.1, art: 'orcRider1' },
        { hp: 320, damage: [20, 28], armor: 0.2, art: 'orcRider2' },
        { hp: 480, damage: [30, 42], armor: 0.3, art: 'orcRider3' },
        { hp: 720, damage: [44, 60], armor: 0.4, art: 'orcRider4' }
      ],
      desc: 'Gửi 1 chiến binh Orc cưỡi sói ra chặn đường: máu trâu, đánh mạnh, chạy nhanh. Chết hồi sinh sau 12 giây.'
    }
  },

  /* ---------------- ANH HÙNG ---------------- */
  hero: {
    name: 'Aldric Tóc Bạc', title: 'Hiệp sĩ Bình Minh', art: 'hero',
    hp: 380, damage: [16, 24], armor: 0.4, speed: 95, attackRate: 0.9, regen: 12, respawn: 15, radius: 15,
    perLevel: 0.08, maxLevel: 10, levelXp: [0, 120, 300, 560, 900, 1350, 1900, 2600, 3500, 4600],
    skill: { name: 'Thánh Quang', cooldown: 18, radius: 95, damage: 90, heal: 0.35 },
    desc: 'Chạm vào anh hùng rồi chạm đường để di chuyển. Kỹ năng Thánh Quang gây sát thương xung quanh và hồi máu cho quân ta.'
  },

  /* ---------------- QUÁI ----------------
     lives: số mạng bị trừ khi lọt qua. flying: bay (lính không chặn được, pháo không bắn được).
     ranged: bắn tên vào lính. */
  enemies: {
    goblin:    { name: 'Yêu Tinh',      hp: 55,   speed: 68, armor: 0,   mres: 0,   damage: [2, 4],   rate: 1.0, reward: 9,   lives: 1, radius: 12, desc: 'Nhỏ, nhanh, yếu. Đi thành bầy đông.' },
    orc:       { name: 'Chiến Binh Orc', hp: 145, speed: 50, armor: 0.3, mres: 0,   damage: [6, 10],  rate: 1.1, reward: 20,  lives: 1, radius: 15, desc: 'Giáp vừa. Pháp sư khắc chế tốt.' },
    orcArcher: { name: 'Cung Thủ Orc',  hp: 100,  speed: 52, armor: 0.1, mres: 0,   damage: [5, 8],   rate: 1.4, reward: 19,  lives: 1, radius: 14, ranged: 120, desc: 'Bắn tên vào lính ta từ xa.' },
    warg:      { name: 'Sói Warg',      hp: 85,  speed: 112, armor: 0,  mres: 0,   damage: [5, 8],   rate: 0.8, reward: 15,  lives: 1, radius: 16, desc: 'Cực nhanh. Cần lính chặn hoặc tháp cung.' },
    wraith:    { name: 'Bóng Ma',       hp: 130,  speed: 54, armor: 0,   mres: 0.3, damage: [0, 0],   rate: 1.0, reward: 28,  lives: 1, radius: 13, flying: true, desc: 'Bay qua đầu lính. Pháo không bắn được, kháng phép.' },
    blackOrc:  { name: 'Hắc Orc',       hp: 375,  speed: 42, armor: 0.6, mres: 0,   damage: [14, 20], rate: 1.3, reward: 45,  lives: 2, radius: 17, desc: 'Giáp cực dày. Dùng phép để hạ.' },
    troll:     { name: 'Troll Hang',    hp: 935, speed: 30, armor: 0.1, mres: 0.25, damage: [30, 45], rate: 2.0, reward: 112,  lives: 3, radius: 24, regen: 6, desc: 'Khổng lồ, tự hồi máu. Tập trung hoả lực.' },
    trollKing: { name: 'Vua Troll Đá',  hp: 5950, speed: 22, armor: 0.3, mres: 0.3, damage: [70, 100], rate: 2.2, reward: 500, lives: 20, radius: 30, boss: true, slam: { every: 8, radius: 110, damage: 60 }, desc: 'Chúa tể vùng núi. Đập đất làm choáng và gây sát thương cả nhóm lính.' }
  },

  /* ---------------- NÂNG CẤP BẰNG SAO ---------------- */
  upgrades: {
    archer:    { name: 'Cung Elf',  icon: 'bow',    cost: [1, 1, 2, 2], perLevel: { damage: 0.08, range: 0.04 }, text: '+8% sát thương, +4% tầm' },
    barracks:  { name: 'Doanh trại', icon: 'shield', cost: [1, 1, 2, 2], perLevel: { hp: 0.1, damage: 0.06 },   text: '+10% máu lính, +6% sát thương' },
    mage:      { name: 'Pháp sư',   icon: 'staff',  cost: [1, 1, 2, 2], perLevel: { damage: 0.08, range: 0.04 }, text: '+8% sát thương, +4% tầm' },
    artillery: { name: 'Pháo lùn',  icon: 'bomb',   cost: [1, 1, 2, 2], perLevel: { damage: 0.08, aoe: 0.05 },  text: '+8% sát thương, +5% vùng nổ' },
    beast:     { name: 'Thú Orc',   icon: 'axe',    cost: [1, 1, 2, 2], perLevel: { hp: 0.1, damage: 0.08 },    text: '+10% máu Orc cưỡi sói, +8% sát thương' }
  },

  /* ---------------- CHIẾN DỊCH ----------------
     paths: các điểm điều khiển (đường cong mềm), thế giới 960 × 1500, lối thoát ở dưới.
     waves: mỗi đợt là danh sách nhóm "loại:số[:giãn cách][/cửa]" cách nhau dấu phẩy. */
  levels: [
    { name: 'Thung Lũng Gió', theme: 'meadow', gold: 320,
      story: 'Bầy yêu tinh tràn xuống thung lũng. Hãy dựng tháp canh giữ con đường về thành!',
      paths: [[[300, -80], [300, 150], [600, 270], [690, 470], [380, 600], [230, 800], [470, 960], [720, 1110], [520, 1290], [480, 1440]]],
      waves: ['goblin:6', 'goblin:10', 'goblin:8,orc:2', 'orc:4,goblin:10', 'goblin:12,orc:5', 'warg:5,orc:4,goblin:8'] },
    { name: 'Rừng Cổ Thụ', theme: 'forest', gold: 400,
      story: 'Trong rừng sâu, sói Warg và cung thủ Orc đang săn mồi.',
      paths: [[[770, -80], [740, 200], [400, 260], [210, 460], [440, 640], [760, 720], [730, 960], [380, 1040], [290, 1230], [480, 1330], [480, 1440]]],
      waves: ['goblin:7,warg:3', 'orc:4,orcArcher:3', 'warg:7', 'orc:5,orcArcher:4,goblin:7', 'warg:5,orc:7', 'orcArcher:7,orc:7,warg:5', 'blackOrc:2,orc:8'] },
    { name: 'Cầu Đá Sông Bạc', theme: 'river', gold: 460,
      story: 'Giữ cây cầu đá – bóng ma đầu tiên đã xuất hiện trên bầu trời.',
      river: [[-60, 640], [260, 700], [600, 650], [1020, 720]],
      paths: [[[210, -80], [230, 230], [530, 360], [520, 600], [300, 800], [330, 1010], [700, 1120], [560, 1300], [480, 1440]]],
      waves: ['orc:5,goblin:6', 'wraith:3', 'orc:6,orcArcher:3', 'wraith:4,warg:5', 'blackOrc:2,orc:6', 'wraith:5,orcArcher:5,orc:5', 'troll:1,orc:8', 'blackOrc:2,wraith:4,warg:5'] },
    { name: 'Đầm Lầy Sương Mù', theme: 'swamp', gold: 520,
      story: 'Hai đạo quân tiến vào từ hai phía đầm lầy. Chia quân hợp lý!',
      paths: [[[150, -80], [190, 300], [420, 470], [480, 580], [300, 790], [470, 1000], [710, 1160], [500, 1320], [480, 1440]],
              [[830, -80], [780, 300], [560, 460], [480, 580], [300, 790], [470, 1000], [710, 1160], [500, 1320], [480, 1440]]],
      waves: ['goblin:9', 'orc:6,warg:4', 'wraith:4,orcArcher:4', 'blackOrc:3,orc:8', 'troll:2,goblin:10', 'warg:9,wraith:4', 'blackOrc:3,orcArcher:5', 'troll:1,blackOrc:3,wraith:5'] },
    { name: 'Đèo Tuyết Trắng', theme: 'snow', gold: 580,
      story: 'Đèo núi băng giá – Troll Hang đã thức giấc.',
      paths: [[[480, -80], [480, 140], [200, 240], [190, 440], [760, 520], [770, 760], [210, 850], [220, 1080], [680, 1180], [480, 1440]]],
      waves: ['orc:7,warg:4', 'troll:1,orc:6', 'wraith:6,orcArcher:6', 'blackOrc:4,warg:7', 'troll:1,blackOrc:3', 'wraith:7,orc:9', 'troll:1,warg:9', 'blackOrc:4,troll:1,wraith:5', 'troll:2,blackOrc:3'] },
    { name: 'Vùng Đất Tro Tàn', theme: 'ash', gold: 660,
      story: 'Trận chiến cuối cùng. Vua Troll Đá đích thân dẫn quân!',
      paths: [[[180, -80], [160, 260], [420, 380], [470, 560], [270, 760], [480, 960], [720, 1100], [500, 1300], [480, 1440]],
              [[800, -80], [830, 260], [600, 400], [470, 560], [270, 760], [480, 960], [720, 1100], [500, 1300], [480, 1440]]],
      waves: ['orc:9,goblin:9', 'blackOrc:3,orcArcher:6', 'wraith:7,warg:7', 'troll:1,orc:9', 'blackOrc:6,wraith:6', 'troll:2,warg:10', 'blackOrc:7,orcArcher:7', 'troll:3,wraith:9', 'trollKing:1,orc:12,blackOrc:3'] }
  ],

  spawnInterval: { goblin: 0.8, orc: 1.3, orcArcher: 1.3, warg: 0.7, wraith: 1.4, blackOrc: 2.0, troll: 4.0, trollKing: 1 },

  /* Màu từng vùng */
  themes: {
    meadow: { grass: '#7cb342', grass2: '#689f38', dirt: '#c9a26b', dirtEdge: '#8d6e45', tree: ['#5a9a3a', '#4a8a32', '#6aaa42'], rock: '#9e9a92', water: '#4aa8d8', flowers: true },
    forest: { grass: '#5f9a3a', grass2: '#4f8a30', dirt: '#b8915c', dirtEdge: '#7a5a38', tree: ['#3f7a2e', '#2f6a26', '#4f8a36'], rock: '#8e8a82', water: '#3a98c8', flowers: true, dense: true },
    river:  { grass: '#78b048', grass2: '#62983a', dirt: '#ccab78', dirtEdge: '#8d6e45', tree: ['#5a9a3a', '#4a8a32', '#6aaa42'], rock: '#a8a49a', water: '#46a6dc', flowers: true },
    swamp:  { grass: '#6a8a48', grass2: '#58783a', dirt: '#8f7a52', dirtEdge: '#5a4a30', tree: ['#4a6a36', '#3e5c2e', '#5a7a3e'], rock: '#7e7a72', water: '#5a8a6a', mush: true },
    snow:   { grass: '#e6eef4', grass2: '#d2dee8', dirt: '#a9b4c0', dirtEdge: '#6e7a88', tree: ['#3f7a52', '#2f6a46', '#4a8a5a'], rock: '#9aa4b0', water: '#7ac0e8', snow: true },
    ash:    { grass: '#6a5a50', grass2: '#5a4a42', dirt: '#8a6a52', dirtEdge: '#c0502a', tree: ['#4a3a32', '#3a2e28', '#5a4a40'], rock: '#6a6060', water: '#e0602a', lava: true, dead: true }
  },

  audioFiles: { music: null }
};
