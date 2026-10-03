/* =========================================================
 * icons.js – Bộ biểu tượng SVG (thay cho emoji)
 * Dùng: Icon('coin') → chuỗi <svg>. Màu theo currentColor.
 * ========================================================= */
(function () {
  const P = {
    bomb:   '<circle cx="11" cy="14" r="7.5" fill="currentColor"/><path d="M15.5 8.5l2.5-2.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M18.5 3.5l1 1.6 1.8.2-1.3 1.2.4 1.8-1.6-.9-1.6.9.4-1.8-1.3-1.2 1.8-.2z" fill="#ffd040"/><circle cx="8.5" cy="11.5" r="2" fill="rgba(255,255,255,.45)"/>',
    sun:    '<circle cx="12" cy="12" r="5" fill="currentColor"/><path d="M12 1.5v3.5M12 19v3.5M1.5 12H5M19 12h3.5M4.6 4.6l2.4 2.4M17 17l2.4 2.4M4.6 19.4L7 17M17 7l2.4-2.4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    info:   '<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 10.5v6.5" stroke="#2a1630" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="7" r="1.6" fill="#2a1630"/>',
    close:  '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>',
    check:  '<path d="M4.5 12.5l5 5 10-11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
    sword:  '<path d="M19.5 3.5l-1 4.5L9 17.5 6.5 15 16 5.5z" fill="currentColor"/><path d="M5 13.5l5.5 5.5M4 20l3-3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    tree:   '<path d="M12 2.5l6 7h-3l4 5h-4l3 4H6l3-4H5l4-5H6z" fill="currentColor"/><rect x="10.8" y="18" width="2.4" height="4" fill="currentColor"/>',
    heart:  '<path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.2 1.8-2 3.3-3.2 5.4-3.2 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z" fill="currentColor"/>',
    coin:   '<circle cx="12" cy="12" r="9" fill="currentColor"/><circle cx="12" cy="12" r="6" fill="none" stroke="#5a3a0a" stroke-width="1.6"/><path d="M12 8.5v7M10 10h3.2a1.3 1.3 0 010 2.6H10.8a1.3 1.3 0 000 2.6H14" fill="none" stroke="#5a3a0a" stroke-width="1.4" stroke-linecap="round"/>',
    gem:    '<path d="M6 3h12l4 6-10 12L2 9z" fill="currentColor"/><path d="M2 9h20M9 3l3 18M15 3l-3 18M6 3l3 6 3-6 3 6 3-6" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/>',
    skull:  '<path d="M12 2.5c-4.7 0-8 3.3-8 7.7 0 2.6 1.2 4.3 2.8 5.4V19c0 .8.7 1.5 1.5 1.5h7.4c.8 0 1.5-.7 1.5-1.5v-3.4c1.6-1.1 2.8-2.8 2.8-5.4 0-4.4-3.3-7.7-8-7.7z" fill="currentColor"/><circle cx="8.8" cy="11" r="2.2" fill="#1a1418"/><circle cx="15.2" cy="11" r="2.2" fill="#1a1418"/><path d="M10.5 20.5v-2.5M13.5 20.5v-2.5M11 15l1-1.6 1 1.6z" stroke="#1a1418" stroke-width="1.2" fill="#1a1418"/>',
    pause:  '<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor"/>',
    play:   '<path d="M7 4.5l13 7.5-13 7.5z" fill="currentColor"/>',
    fast:   '<path d="M3 5.5l9 6.5-9 6.5zM12 5.5l9 6.5-9 6.5z" fill="currentColor"/>',
    fire:   '<path d="M12 2.5c1 3.6 5.5 5.4 5.5 10.7A5.5 5.5 0 016.5 13.6c0-2.4 1.2-3.9 2.4-5 .1 1.8.8 3.1 2 3.6-.6-3.3.2-6.6 1.1-9.7z" fill="currentColor"/><path d="M12 13c.6 1.6 2.5 2.3 2.5 4.3a2.5 2.5 0 01-5 0c0-1.3.7-2 1.3-2.6.2.8.6 1.2 1.2 1.3-.2-1.1-.1-2 0-3z" fill="#fff3c4"/>',
    frost:  '<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M12 2l-2.5 2.5M12 2l2.5 2.5M12 22l-2.5-2.5M12 22l2.5-2.5M3.3 7l3.4.9M3.3 7l.9 3.4M20.7 17l-3.4-.9M20.7 17l-.9-3.4M3.3 17l.9-3.4M3.3 17l3.4-.9M20.7 7l-.9 3.4M20.7 7l-3.4.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    rage:   '<path d="M4 4l4.5 3.5L12 3l3.5 4.5L20 4l-1.5 8.5c-.6 4.2-3.3 7.5-6.5 9-3.2-1.5-5.9-4.8-6.5-9z" fill="currentColor"/><path d="M8 11.5l2.6 1.2M16 11.5l-2.6 1.2M9.5 16.5c1.6-1 3.4-1 5 0" fill="none" stroke="#1a1418" stroke-width="1.6" stroke-linecap="round"/>',
    hammer: '<path d="M13.5 3.5l7 7-2.5 2.5-2.5-2.5-8.8 8.8a2 2 0 01-2.8-2.8L12.7 7.7 10.5 5.5z" fill="currentColor"/>',
    bow:    '<path d="M6 3c7 2.5 11 8.5 11 9s-4 6.5-11 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M6 3v18" stroke="currentColor" stroke-width="1"/><path d="M3 12h17M17 9.5l3 2.5-3 2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    staff:  '<path d="M8 22L15.5 9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="17" cy="6.5" r="4" fill="currentColor"/><circle cx="17" cy="6.5" r="1.6" fill="#fff"/>',
    axe:    '<path d="M7 21.5L16 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M13 3.5c3-1.4 7.2.3 8.2 4.6-2.5-.6-4.4.2-5.7 2.6z" fill="currentColor"/>',
    tower:  '<path d="M6 21V9h12v12zM5 9V4h2.5v2h2V4h5v2h2V4H19v5z" fill="currentColor"/><path d="M10.5 21v-4a1.5 1.5 0 013 0v4" fill="#1a1418"/>',
    map:    '<path d="M3 6l6-2.5 6 2.5 6-2.5v14.5L15 20.5l-6-2.5-6 2.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 3.5V18M15 6v14.5" stroke="currentColor" stroke-width="1.6"/>',
    swords: '<path d="M4 3l10.5 10.5M20 3L9.5 13.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M12 15l-4.5 4.5M12 15l4.5 4.5M6 15.5l2.5 2.5M18 15.5l-2.5 2.5M4.5 19.5l1-1M19.5 19.5l-1-1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    up:     '<path d="M12 3l8 9h-5v9H9v-9H4z" fill="currentColor"/>',
    gear:   '<path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2l1.6 2.8 3.2-.6.6 3.2L20.2 9l-1.5 3 1.5 3-2.8 1.6-.6 3.2-3.2-.6L12 22l-1.6-2.8-3.2.6-.6-3.2L3.8 15l1.5-3-1.5-3 2.8-1.6.6-3.2 3.2.6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    star:   '<path d="M12 2.5l2.9 6.2 6.6.7-5 4.6 1.4 6.6L12 17.3l-5.9 3.3 1.4-6.6-5-4.6 6.6-.7z" fill="currentColor"/>',
    lock:   '<rect x="5" y="10.5" width="14" height="10.5" rx="1.5" fill="currentColor"/><path d="M8 10.5V7.5a4 4 0 018 0v3" fill="none" stroke="currentColor" stroke-width="2.2"/>',
    back:   '<path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
    restart:'<path d="M4.5 12a7.5 7.5 0 102.2-5.3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M4 3.5v5h5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    home:   '<path d="M3 11l9-7.5 9 7.5M5.5 9.5V20h5v-5.5h3V20h5V9.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
    exp:    '<path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" fill="currentColor"/>',
    shield: '<path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z" fill="currentColor"/>',
    clock:  '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    target: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
    burst:  '<path d="M12 2l1.8 5 4.7-2.6-2.1 5 5.6.6-4.4 3.4 4.4 3.6-5.6.3 1.9 5.2-4.6-2.9L12 22l-1.7-5-4.6 2.9 1.9-5.2-5.6-.3L6.4 11 2 7.6l5.6-.6-2.1-5L10.2 7z" fill="currentColor"/>',
    sound:  '<path d="M4 9.5h3.5L13 5v14l-5.5-4.5H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 010 7M18.8 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    music:  '<path d="M9 18V5.5l11-2.5v12.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6.5" cy="18" r="3" fill="currentColor"/><circle cx="17.5" cy="15.5" r="3" fill="currentColor"/>',
    shake:  '<rect x="7.5" y="3" width="9" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 8v8M20.5 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    trash:  '<path d="M4 6.5h16M9.5 6.5V4h5v2.5M6 6.5l1 14h10l1-14" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    sell:   '<path d="M3 12.5L12.5 3H21v8.5L11.5 21z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="16.5" cy="7.5" r="1.6" fill="currentColor"/>',
    bag:    '<path d="M8.5 6.5L7 3h10l-1.5 3.5M5 21h14c.6-6-1.6-11.2-5-14.5h-4C6.6 9.8 4.4 15 5 21z" fill="currentColor"/>',
    chest:  '<path d="M3 10.5c0-3.6 2.7-6 9-6s9 2.4 9 6V20H3z" fill="currentColor"/><path d="M3 11h18M10.5 11v3h3v-3" fill="none" stroke="#1a1418" stroke-width="1.6"/>',
    crown:  '<path d="M3 7.5l4.5 4L12 4.5l4.5 7 4.5-4-1.8 11H4.8z" fill="currentColor"/>',
    flag:   '<path d="M5 21V3.5M5 4h13l-3 4.5 3 4.5H5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
    install:'<rect x="6.5" y="2.5" width="11" height="19" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v7M9 11l3 3 3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    book:   '<path d="M12 6.5C9.5 4.5 6 4 3 4.5V19c3-.5 6.5 0 9 2 2.5-2 6-2.5 9-2V4.5c-3-.5-6.5 0-9 2zM12 6.5V21" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
  };

  function Icon(name, cls) {
    return `<svg class="ico ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || P.star}</svg>`;
  }
  Icon.has = n => !!P[n];

  /** Gắn icon vào mọi phần tử có data-icon trong HTML tĩnh */
  Icon.hydrate = (root) => {
    (root || document).querySelectorAll('[data-icon]').forEach(el => {
      if (!el.dataset.iconDone) { el.insertAdjacentHTML('afterbegin', Icon(el.dataset.icon)); el.dataset.iconDone = '1'; }
    });
  };

  window.Icon = Icon;
})();
