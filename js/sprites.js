/* =========================================================
 * sprites.js – Lớp trung gian hình ảnh
 * Mỗi sprite là { emoji } (hình tạm) hoặc { image: 'assets/...png' }.
 * Gameplay chỉ gọi Sprites.draw(), nên thay ảnh thật không cần sửa logic.
 * Emoji được vẽ sẵn lên canvas phụ (cache) để vẽ nhanh mỗi khung hình.
 * ========================================================= */
(function () {
  const FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';

  const Sprites = {
    cache: new Map(), images: new Map(), res: 1,

    setResolution(r) {
      r = Math.max(0.5, Math.min(3, r));
      if (Math.abs(r - this.res) > 0.05) { this.res = r; this.cache.clear(); }
    },

    get(def, size) {
      if (def.image) {
        let img = this.images.get(def.image);
        if (!img) { img = new Image(); img.src = def.image; this.images.set(def.image, img); }
        if (img.complete && img.naturalWidth) return img;
      }
      const key = def.emoji + '|' + Math.round(size);
      let c = this.cache.get(key);
      if (!c) {
        c = document.createElement('canvas');
        const px = Math.ceil(size * 1.3 * this.res);
        c.width = c.height = px;
        const g = c.getContext('2d');
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `${Math.round(size * this.res)}px ${FONT}`;
        g.fillText(def.emoji || '?', px / 2, px / 2 + size * this.res * 0.08);
        this.cache.set(key, c);
      }
      return c;
    },

    /** Vẽ sprite với tâm (x, y), kích thước size (đơn vị thế giới) */
    draw(ctx, def, x, y, size, flipX) {
      const img = this.get(def, size), s = size * 1.3;
      if (flipX) {
        ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
        ctx.drawImage(img, -s / 2, -s / 2, s, s); ctx.restore();
      } else {
        ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
      }
    }
  };

  window.Sprites = Sprites;
})();
