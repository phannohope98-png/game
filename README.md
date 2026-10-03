# 🏰 Canh Cổng – Game thủ thành trên điện thoại

Game 2D thủ thành viết bằng HTML5 Canvas + JavaScript thuần. Không cần server, không cần cài đặt, chạy thẳng trên GitHub Pages và có thể "Thêm vào màn hình chính" như app thật (PWA, chơi được offline).

## Đưa game lên GitHub Pages

1. Tạo repository mới trên GitHub (ví dụ `canh-cong`), để **Public**.
2. Bấm **Add file → Upload files**, kéo **toàn bộ nội dung** thư mục này vào (giữ nguyên cấu trúc: `index.html` phải nằm ở ngoài cùng, cạnh `style.css`, thư mục `js/`, `assets/`).
3. Vào **Settings → Pages → Build and deployment**: chọn *Deploy from a branch*, nhánh `main`, thư mục `/ (root)` → **Save**.
4. Chờ 1–2 phút, mở `https://TÊN-TÀI-KHOẢN.github.io/canh-cong/` trên điện thoại.
5. Cài ra màn hình chính: Android Chrome bấm ⋮ → *Thêm vào màn hình chính*; iPhone Safari bấm Chia sẻ → *Thêm vào MH chính*.

> **Khi cập nhật code:** mở `service-worker.js`, đổi `canh-cong-v1` thành `canh-cong-v2` (v3, v4…) để điện thoại tải bản mới thay vì dùng bản cũ trong bộ nhớ đệm.

## Chạy thử trên máy tính

Mở file trực tiếp (`file://`) vẫn chơi được nhưng không có chế độ offline. Để test đầy đủ:

```bash
python -m http.server 8000
# mở http://localhost:8000
```

## Cấu trúc thư mục

```
├── index.html            Khung giao diện
├── style.css             Toàn bộ giao diện
├── manifest.json         Cấu hình PWA
├── service-worker.js     Lưu bộ nhớ đệm để chơi offline
├── js/
│   ├── config.js         ⭐ TẤT CẢ thông số cân bằng game (sửa ở đây)
│   ├── save.js           Lưu/tải localStorage
│   ├── player.js         Tiến trình: vàng, kim cương, EXP, cấp, nâng cấp
│   ├── audio.js          Âm thanh (tổng hợp sẵn, thay được bằng file)
│   ├── sprites.js        Lớp hình ảnh (emoji tạm ↔ ảnh thật)
│   ├── effects.js        Hạt, số sát thương, nổ, rung màn hình (object pool)
│   ├── map.js            Đường đi, ô xây, chướng ngại, vẽ nền
│   ├── gate.js           Cổng thành
│   ├── combat.js         Công thức sát thương, đạn bay
│   ├── enemies.js        Quái & AI
│   ├── units.js          Lính & cách chọn mục tiêu
│   ├── buildings.js      Công trình
│   ├── waves.js          Đợt quái
│   ├── game.js           Vòng lặp, điều khiển cảm ứng, thắng/thua
│   ├── ui.js             Menu, HUD, bảng xây, tạm dừng, kết quả
│   └── main.js           Khởi động
└── assets/               Hình & âm thanh thật (đặt vào khi có)
```

## Cách chơi

- Quái đi theo con đường xuống cổng thành. Cổng hết máu là thua, trụ hết các đợt là thắng.
- Chạm ô **➕** cạnh đường để xây: Trại cung thủ, Tháp phù thủy, Trại Orc (tự sinh lính miễn phí), Mỏ vàng (sinh vàng).
- Chạm công trình đã xây để **nâng cấp** hoặc **bán**.
- Nút lính phía dưới: gửi ngay Cung thủ / Phù thủy / Orc ra trận.
- **Nhấn giữ** lên con đường để dời cờ tập kết 🚩 – lính sẽ ra đứng ở đó.
- Kỹ năng: 🔥 Cầu lửa, ❄️ Bão băng (cần Phù thủy trên sân), 😡 Cuồng nộ (cần Orc), 🔧 Sửa cổng.
- **Gọi đợt sớm** khi đang nghỉ để nhận thêm vàng.
- Sao: cổng ≥80% máu = ⭐⭐⭐, ≥50% = ⭐⭐, còn sống = ⭐.

## Chỉnh cân bằng game

Mọi con số nằm trong `js/config.js`:

- `units` – máu, sát thương, tầm, giá, chi phí nâng cấp từng cấp của lính.
- `enemies` – máu, tốc độ, thưởng vàng/EXP của quái.
- `buildings` – giá xây, tốc độ sinh lính, thu nhập mỏ vàng.
- `gate` – máu & giáp cổng từng cấp.
- `stages` – 10 màn. Mỗi đợt viết dạng `'goblin:10,skeleton:5'`, thêm `@0.5` để đổi hệ số máu (ví dụ `'boss:1@0.5'`).
- `paths` – hình dạng đường đi (toạ độ 0..1).

### Thêm loại lính mới (ví dụ Hiệp sĩ)

Thêm 1 khối vào `CONFIG.units` (copy từ `orc`, đổi tên/biểu tượng/thông số) – nút gửi lính, màn hình Quân lính và nâng cấp sẽ tự xuất hiện. Muốn có trại riêng thì thêm 1 khối vào `CONFIG.buildings` với `unitType: 'knight'`.

### Thêm quái mới

Thêm vào `CONFIG.enemies` rồi dùng tên đó trong các đợt của `stages`.

## Thay hình & âm thanh thật

- **Hình:** đặt ảnh PNG vào `assets/enemies/`… rồi trong `config.js` thêm `image`, ví dụ:
  `sprite: { emoji: '👺', image: 'assets/enemies/goblin.png' }`. Emoji vẫn được dùng khi ảnh chưa tải xong.
- **Âm thanh:** đặt file vào `assets/sounds/` rồi điền đường dẫn trong `CONFIG.audioFiles`, ví dụ `arrow: 'assets/sounds/arrow.mp3'`, `music: 'assets/sounds/nhac-nen.mp3'`.

## Ghi chú kỹ thuật

- Mô phỏng theo bước cố định 1/60 giây nên tốc độ 2x vẫn tính đúng va chạm và sát thương.
- Quái, lính, đạn, hạt, chữ sát thương đều dùng object pool để tránh giật do dọn rác bộ nhớ.
- Khung hình tự co giãn theo màn hình (320×568 tới desktop), HUD tách khỏi vùng chơi nên không che bản đồ.
- Tự tạm dừng khi chuyển sang ứng dụng khác.
