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



## Bản vẽ lại Anime 2 (2026-10-03)
- Nhân vật, quái, trụ, bản đồ vẽ lại hoàn toàn bằng Canvas (không dùng ảnh SVG tĩnh nữa): mắt anime, tóc có vòng sáng, chuyển động đi/đánh/chớp mắt.
- Kích thước so với đường đi (rộng 66): yêu tinh 32, lính 40–43, orc 44, anh hùng 48, hắc orc 50, troll 64, vua troll 96.
- Sửa lỗi `TAU is not defined` làm hình bị nhoè/mờ mỗi khung.
- Thông số chơi không đổi. Bộ nhớ đệm: canh-cong-anime2-20261003.
