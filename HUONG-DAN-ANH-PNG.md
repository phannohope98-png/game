# Hướng dẫn thay nhân vật & trụ bằng ảnh PNG

Game tự tìm ảnh theo **đúng tên file** dưới đây. Có ảnh → dùng ảnh. Chưa có → dùng hình vẽ bằng code như cũ.
Vì vậy bạn có thể làm dần từng ảnh, không cần làm đủ một lần.

Sau khi tải ảnh lên GitHub, mở `https://TÊN-TÀI-KHOẢN.github.io/TÊN-REPO/kiem-tra-hinh.html`
để xem ảnh nào game đã nhận và trông ra sao khi chuyển động.

## Yêu cầu ảnh

- Định dạng **PNG**, mỗi ảnh **một** nhân vật hoặc **một** trụ, không có chữ, không khung.
- **Nền trong suốt** là tốt nhất. Nếu công cụ không xuất được nền trong suốt, dùng **nền một màu trơn** (trắng hoặc xanh lá) và màu nền phải khác hẳn màu nhân vật. Game tự xoá nền trơn. Nền có cảnh vật (cỏ, lâu đài phía sau…) thì **không** xoá được.
- Không cần căn lề: game tự cắt khoảng trống thừa.
- Kích thước khoảng 768–1024 px là đủ. Ảnh lớn hơn sẽ làm game tải chậm trên điện thoại.
- Nên tạo tất cả ảnh bằng **cùng một prompt phong cách** (bên dưới) để nhìn đồng bộ.

### Nhân vật (thư mục `assets/characters/`)
- **Toàn thân**, đứng thẳng, **quay mặt sang PHẢI** (góc 3/4), không bị cắt chân.
- Cầm vũ khí. Không vẽ bóng đổ to dưới chân (game tự vẽ bóng).
- Game tự tạo chuyển động: nhún khi đi, ngả người khi chém, thở khi đứng, và tự lật khi đi sang trái.

### Trụ (thư mục `assets/buildings/`)
- Góc nhìn 3/4 từ trên xuống, giống ô "Trụ … (cấp 3)" trong ảnh concept, đặt trên một bệ tròn.
- **Trụ Cung, Trụ Pháp, Trụ Pháo:** vẽ **luôn** lính đứng trên trụ (2 cung thủ Elf / 1 phù thủy / 1 người lùn cạnh pháo).
- **Trụ Thành, Trụ Thú:** **không** vẽ lính, vì lính chạy ra đường riêng.
- Pháo nên chĩa nòng **sang phải, hơi hướng lên**.

## Danh sách file

| File | Là gì |
|---|---|
| `characters/linh-1.png` … `linh-4.png` | Lính kiếm Con Người cấp 1 → 4 (giáp nhẹ → hiệp sĩ giáp bạc–xanh–vàng) |
| `characters/anh-hung.png` | Anh hùng Aldric Tóc Bạc |
| `characters/orc-soi-1.png` … `orc-soi-4.png` | Orc cưỡi sói cấp 1 → 4 |
| `buildings/thanh-1.png` … `thanh-4.png` | Trụ Thành (Con Người) cấp 1 → 4 |
| `buildings/cung-1.png` … `cung-4.png` | Trụ Cung (Elf) |
| `buildings/phap-1.png` … `phap-4.png` | Trụ Pháp (Phù Thủy) |
| `buildings/phao-1.png` … `phao-4.png` | Trụ Pháo (Người Lùn) |
| `buildings/thu-1.png` … `thu-4.png` | Trụ Thú (Orc) |
| *(không bắt buộc)* `characters/quai-yeu-tinh.png`, `quai-orc.png`, `quai-orc-cung.png`, `quai-soi.png`, `quai-bong-ma.png`, `quai-hac-orc.png`, `quai-troll.png`, `quai-vua-troll.png` | Quái |

**Mẹo bắt đầu nhanh:** nếu chỉ có 1 ảnh cho mỗi loại, cứ chép ảnh đó ra cả 4 tên (`-1` đến `-4`). Sau này có ảnh từng cấp thì thay dần.

## Prompt mẫu

Prompt viết bằng tiếng Anh vì đa số công cụ tạo ảnh hiểu tiếng Anh tốt hơn.
Ghép **phần phong cách chung** + **phần mô tả riêng**.

**Phong cách chung – nhân vật:**
> anime 3D cinematic game character render, full body, standing, facing right in three-quarter view, holding weapon, single character, plain white background, no text, no shadow on ground, high detail, vibrant fantasy colors

**Phong cách chung – trụ:**
> anime 3D cinematic fantasy tower defense building, isometric three-quarter top-down view, on a round stone base, single building centered, plain white background, no text, high detail, vibrant colors

**Mô tả riêng:**
- **linh-1:** young human swordsman, brown messy hair, blue tunic, leather armor, round wooden shield painted blue, short sword
- **linh-4:** young human knight, brown hair, ornate silver and royal-blue plate armor with gold trim, flowing blue cape, blue kite shield with gold cross and star, longsword
- **anh-hung:** heroic young knight, spiky silver-white hair, blue eyes, white and gold plate armor, dark blue cape, glowing blue greatsword
- **orc-soi-1:** green-skinned orc warrior with black topknot and tusks, leather armor, red loincloth, battle axe, riding a grey wolf with a simple saddle
- **orc-soi-4:** huge green orc chieftain with horned iron helmet, fur mantle, red and gold armor, giant double-bladed axe, riding a big dark wolf wearing red armor with spikes
- **thanh-1:** small white stone guardhouse with blue roof and blue banner
- **thanh-4:** grand white stone castle with three towers, blue conical roofs with gold trim, blue banners with gold cross crest, flags
- **cung-1:** small elven treehouse watch post on a young tree, wooden platform, two blonde elf archers in green standing on top
- **cung-4:** majestic elven tree tower, ivory carved trunk with gold vines and glowing green runes, leafy canopy, two blonde elf archers in white-green armor with golden bows on the platform
- **phap-1:** small dark stone wizard tower with purple windows, a silver-haired witch in a big purple witch hat on top
- **phap-4:** tall dark stone arcane tower crowned with glowing purple crystals, floating purple magic orb, magic circle at the base, silver-haired witch with crystal staff on top
- **phao-1:** wooden platform with sandbags and a small iron cannon, red-bearded dwarf gunner with goggles beside it
- **phao-4:** dark iron and gold dwarven forge fortress with glowing furnace vents and chimneys, huge gold cannon with star emblem pointing right, red-bearded dwarf gunner
- **thu-1:** small orc hide tent with wooden stakes, bones and a red rag flag
- **thu-4:** large orc war pavilion, red tent with black and gold stripes, giant ivory tusks at the entrance, horned skulls, spiked wooden palisade, burning braziers, red war banners

Cấp 2 và 3 thì mô tả ở mức giữa cấp 1 và cấp 4.

## Tinh chỉnh (nếu ảnh hơi to/nhỏ hoặc quay sai hướng)

Mở `js/sprites.js`, tìm mục `TUNE` và thêm dòng, ví dụ:

```js
const TUNE = {
  'linh-1': { scale: 1.1 },          // to hơn 10%
  'cung-4': { scale: 0.95, dy: 4 },  // nhỏ hơn 5%, hạ xuống 4 đơn vị
  'orc-soi-2': { flip: true },       // ảnh quay mặt sang trái → lật lại
};
```

Mỗi lần cập nhật ảnh, đổi `CACHE_NAME` trong `service-worker.js` (ví dụ thêm `-2`) để điện thoại tải ảnh mới.

**Lưu ý:** trong bảng điều khiển trình duyệt (Console) sẽ có vài dòng lỗi 404 cho những ảnh chưa có. Việc này bình thường và không ảnh hưởng game.
