# Canh Cổng – Kỷ Nguyên Bóng Tối

Game thủ thành cho điện thoại, viết bằng HTML5 Canvas + JavaScript thuần (không cần thư viện, chơi offline được như app).

## Đưa lên GitHub Pages
1. Tạo repo Public, tải **toàn bộ** nội dung thư mục này lên (index.html nằm ngoài cùng).
2. Settings → Pages → Deploy from a branch → `main` / `(root)` → Save.
3. Mở `https://TÊN-TÀI-KHOẢN.github.io/TÊN-REPO/` trên điện thoại → "Thêm vào màn hình chính".

Mỗi lần sửa code: đổi `CACHE_NAME` trong `service-worker.js` (v4 → v5...) để máy tải bản mới.

## Cách chơi
- Chạm ô đất có cọc gỗ → menu vòng tròn → chọn trụ. Chạm trụ để nâng cấp / bán / dời cờ (doanh trại).
- 4 trụ, mỗi trụ 4 cấp (đổi hình): Cung Elf, Doanh Trại, Pháp Sư, Pháo Người Lùn.
- Anh hùng: chạm anh hùng (hoặc ảnh góc trái) rồi chạm bản đồ để di chuyển; nút mặt trời = Thánh Quang.
- Bấm đầu lâu đỏ ở cửa vào để gọi đợt quái (gọi sớm được thưởng vàng).
- Kéo để di chuyển bản đồ, chụm 2 ngón (hoặc lăn chuột) để phóng to.
- Sao (1–3 mỗi màn theo số mạng còn lại) dùng để nâng cấp trụ vĩnh viễn.

## Chỉnh game
Mọi thông số nằm trong `js/config.js`: `towers`, `hero`, `enemies`, `upgrades`, `levels` (đường đi là các điểm điều khiển, đợt quái dạng `"orc:6,goblin:10"`, thêm `/1` để chọn cửa vào), `themes`.

## Cấu trúc
- `art-kit.js` bộ vẽ hoạt hình · `art-chars.js` nhân vật · `art-towers.js` trụ · `art.js` bộ đệm khung hình
- `level.js` đường đi, ô xây, vẽ bản đồ · `camera.js` kéo/phóng to
- `enemies.js`, `units.js` (lính + anh hùng), `towers.js`, `combat.js`, `waves.js`, `game.js`, `ui.js`


## Anime V4
- Tỷ lệ humanoid semi-anime: thân/chân cao hơn, đầu nhỏ hơn.
- Mắt có catchlight, tóc có lọn và highlight.
- Tower phóng lớn/cao hơn, thêm class halo/spire.
- Không đổi combat, damage, AI hoặc hitbox logic.


## Anime V5
Bản V5 đổi silhouette thật sự: character render cao +34%, tower +22%, cache-busting và Service Worker version riêng. Góc phải dưới game phải hiện `ANIME V5 • 2026-10-03`; nếu không thấy badge này thì bạn đang mở bản/cache cũ.

## Anime V7 Redesign
- Rebuilt hero, goblin, orc and boss silhouettes as separate SVG art rather than recolors.
- Rebuilt archer/mage/barracks/cannon towers with distinct architecture.
- Added attack presentation FX and stronger walk/idle motion in js/sprites.js.
- Cache/version: anime-v7 / canh-cong-anime-v7-redesign-20261003.


## ANIME FINAL
- Complete sprite coverage: hero, 4 barracks soldier tiers, goblin, orc, orc archer, black orc, warg, wraith, troll and boss.
- Distinct tower sprites for archer, mage, barracks and artillery.
- Final environment presentation pass: warm light, magical motes, petals and vignette.
- Cache version: canh-cong-anime-final-20261003.
- Gameplay values and hitboxes are unchanged.
