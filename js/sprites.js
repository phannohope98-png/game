/* =========================================================
 * sprites.js – Nạp ảnh thật (tuỳ chọn)
 * Nếu config có sprite.image thì vẽ ảnh đó; nếu không, art.js
 * tự vẽ bằng code. Gameplay không phụ thuộc vào ảnh.
 * ========================================================= */
(function () {
  const Sprites = {
    images: new Map(),
    /** Trả về ảnh đã tải xong, hoặc null */
    image(def) {
      if (!def || !def.image) return null;
      let img = this.images.get(def.image);
      if (!img) { img = new Image(); img.src = def.image; this.images.set(def.image, img); }
      return img.complete && img.naturalWidth ? img : null;
    },
    draw(ctx, img, x, y, size, flipX) {
      if (flipX) { ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.drawImage(img, -size / 2, -size / 2, size, size); ctx.restore(); }
      else ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    },
    setResolution() { /* giữ tương thích */ }
  };
  window.Sprites = Sprites;
})();
