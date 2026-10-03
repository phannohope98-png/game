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
├── assets/fonts/          Phông chữ Alegreya (có tiếng Việt, chơi offline)
├── js/
│   ├── config.js         ⭐ TẤT CẢ thông số cân bằng game (sửa ở đây)
│   ├── save.js           Lưu/tải localStorage
│   ├── player.js         Tiến trình: vàng, kim cương, EXP, cấp, nâng cấp
│   ├── audio.js          Âm thanh (tổng hợp sẵn, thay được bằng file)
│   ├── icons.js          Bộ biểu tượng SVG cho giao diện
│   ├── art.js            Vẽ nhân vật, quái, công trình, cây đá bằng code
│   ├── sprites.js        Nạp ảnh PNG thật (tuỳ chọn)
│   ├── effects.js        Hạt, số sát thương, nổ, rung màn hình (object pool)
│   ├── map.js            Lưới ô, đường đi, ô xây, chướng ngại, vẽ nền
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

## Cách chơi (phiên bản 2.0)

- Quái đi theo con đường xuống cổng thành. Cổng hết máu là thua, trụ hết các đợt là thắng.
- **4 loại trụ**, xây trên các ô đất cạnh đường. Chọn trụ ở thanh dưới rồi chạm ô, hoặc chạm ô trước rồi chọn trụ.
  - **Trụ Người**: ra 2 kiếm sĩ chặn đường.
  - **Trụ Elf**: xạ thủ bắn từng mũi tên mạnh, tầm vừa.
  - **Trụ Phù thủy**: bắn xa nhất, nổ lan, bỏ qua giáp, mỗi phát yếu hơn Elf.
  - **Trụ Orc**: ra 1 Orc cưỡi sói.
- Trụ **không bị tấn công, không có máu**. Mỗi trụ có 3 cấp, **nâng cấp thì trụ đổi hình dạng**.
- Lính chỉ ra **1 lần khi mua trụ**. Lính chết thì hồi sinh tại trụ sau `respawn` giây.
- Hết mỗi đợt quái, lính còn sống mà bị thương **chạy về thành hồi đầy máu rồi quay ra** vị trí.
- Chạm trụ đã xây để nâng cấp, bán, hoặc **dời điểm tập kết** của lính.
- Kỹ năng: Cầu lửa & Bão băng (cần Trụ Phù thủy), Cuồng nộ (cần Orc cưỡi sói trên sân), Sửa cổng.

## Chỉnh cân bằng game

Mọi con số nằm trong `js/config.js`:

- `towers` – giá, giá nâng cấp, chỉ số 3 cấp, thời gian hồi sinh lính, tên từng cấp.
- `soldiers` – bán kính, tốc độ, tốc đánh của kiếm sĩ / Orc cưỡi sói.
- `heal` – lính về thành: `onlyInjured` (chỉ lính bị thương), `runSpeed`, `time` (giây hồi máu).
- `research` – nâng cấp vĩnh viễn trong menu Công trình.
- `enemies`, `stages`, `paths`, `themes` – như trước.

## Đồ hoạ

- `js/art-kit.js` – bộ công cụ vẽ có đổ sáng.
- `js/art-chars.js` – nhân vật & quái (có hoạt ảnh đi / đánh / đứng).
- `js/art-towers.js` – 4 trụ × 3 cấp.
- `js/art.js` – vẽ sẵn khung hình vào bộ nhớ đệm để chạy mượt trên điện thoại.

## Thay hình & âm thanh thật

- **Hình:** nhân vật, quái và công trình hiện được vẽ bằng code trong `js/art.js`. Muốn dùng ảnh PNG thật, đặt ảnh vào `assets/enemies/`… rồi trong `config.js` điền ví dụ
  `sprite: { image: 'assets/enemies/goblin.png' }` (với lính thì thêm trường `sprite` vào khối lính). Ảnh chưa tải xong thì game tự dùng hình vẽ.
- **Âm thanh:** đặt file vào `assets/sounds/` rồi điền đường dẫn trong `CONFIG.audioFiles`, ví dụ `arrow: 'assets/sounds/arrow.mp3'`, `music: 'assets/sounds/nhac-nen.mp3'`.

## Ghi chú kỹ thuật

- Mô phỏng theo bước cố định 1/60 giây nên tốc độ 2x vẫn tính đúng va chạm và sát thương.
- Quái, lính, đạn, hạt, chữ sát thương đều dùng object pool để tránh giật do dọn rác bộ nhớ.
- Khung hình tự co giãn theo màn hình (320×568 tới desktop), HUD tách khỏi vùng chơi nên không che bản đồ.
- Tự tạm dừng khi chuyển sang ứng dụng khác.
