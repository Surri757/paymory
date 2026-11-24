// Paymory · 彩色简笔贴纸（SVG）。每个贴纸先用白色粗描边勾一遍轮廓，做出 die-cut 白边
window.PM = window.PM || {};
PM.stickers = (function () {
  const CUT = 'fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"';
  const ART = {
    // 旺财
    wangcai: `
      <g ${CUT}><path d="M14 21 12.5 9.5c-.3-2.6 2-4 3.9-2.4l7.3 6.2"/><path d="M34 21 35.5 9.5c.3-2.6-2-4-3.9-2.4l-7.3 6.2"/><ellipse cx="24" cy="28" rx="13.5" ry="11.5"/></g>
      <path d="M14 21 12.5 9.5c-.3-2.6 2-4 3.9-2.4l7.3 6.2" fill="#CB8A4C"/>
      <path d="M34 21 35.5 9.5c.3-2.6-2-4-3.9-2.4l-7.3 6.2" fill="#CB8A4C"/>
      <ellipse cx="24" cy="28" rx="13.5" ry="11.5" fill="#EBB26F"/>
      <path d="M24 17.5c2.6 3.2 2.6 7.6.4 11.6-2.6-3.6-3-8-.4-11.6z" fill="#FFF8EE"/>
      <circle cx="18.6" cy="26.6" r="1.8" fill="#3A2A1E"/><circle cx="29.4" cy="26.6" r="1.8" fill="#3A2A1E"/>
      <circle cx="19.2" cy="26" r=".55" fill="#fff"/><circle cx="30" cy="26" r=".55" fill="#fff"/>
      <ellipse cx="24" cy="31.4" rx="2.5" ry="1.8" fill="#2B1D14"/>
      <path d="M24 33.1c-1 2.2-3 2.6-4.2 1.2M24 33.1c1 2.2 3 2.6 4.2 1.2" fill="none" stroke="#3A2A1E" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M22.6 35.2c.3 2.6 2.6 3 3.4.4z" fill="#F08A8A"/>
      <circle cx="14.6" cy="30.6" r="2" fill="#F2A07E" opacity=".6"/><circle cx="33.4" cy="30.6" r="2" fill="#F2A07E" opacity=".6"/>`,
    // 老王麻辣烫
    laowang: `
      <g ${CUT}><path d="M15 8.5 37 18.5" fill="none"/><path d="M17 6 38 15.5" fill="none"/><path d="M9 24H39C38 37 31 41 24 41S10 37 9 24Z"/></g>
      <path d="M15 8.5 37 18.5" stroke="#C08A4E" stroke-width="2.3" stroke-linecap="round" fill="none"/>
      <path d="M17 6 38 15.5" stroke="#A9713B" stroke-width="2.3" stroke-linecap="round" fill="none"/>
      <path d="M9 24H39C38 37 31 41 24 41S10 37 9 24Z" fill="#D5462D"/>
      <path d="M12.2 31.2c6 3.6 17.8 3.6 23.6 0" stroke="#FFF3E0" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="24" cy="24" rx="15" ry="3.5" fill="#F6E3C0"/>
      <ellipse cx="24" cy="24" rx="12.6" ry="2.5" fill="#E2603C"/>
      <circle cx="19.4" cy="23.8" r="1.2" fill="#8FBF6A"/><circle cx="27" cy="24.3" r="1.4" fill="#F2D06B"/>
      <circle cx="31" cy="23.8" r=".9" fill="#B5352A"/><circle cx="23" cy="24.4" r=".8" fill="#8FBF6A"/>`,
    // 那把吉他
    guitar: `
      <g ${CUT}><rect x="21.6" y="2.6" width="4.8" height="17.4" rx="1.6"/><path d="M24 12c7.4 0 8 6 5.6 9.6C39 24.6 39.6 44 24 44 8.4 44 9 24.6 18.4 21.6 16 18 16.6 12 24 12Z"/></g>
      <rect x="21.6" y="2.6" width="4.8" height="17.4" rx="1.6" fill="#8D5A2E"/>
      <rect x="19.6" y="1.4" width="8.8" height="5" rx="1.8" fill="#5B3A1E"/>
      <circle cx="21.2" cy="3.9" r=".75" fill="#F2D9A8"/><circle cx="26.8" cy="3.9" r=".75" fill="#F2D9A8"/>
      <path d="M24 12c7.4 0 8 6 5.6 9.6C39 24.6 39.6 44 24 44 8.4 44 9 24.6 18.4 21.6 16 18 16.6 12 24 12Z" fill="#E5A861"/>
      <path d="M24 12c7.4 0 8 6 5.6 9.6C39 24.6 39.6 44 24 44" fill="none" stroke="#C98A45" stroke-width="1"/>
      <rect x="18.2" y="37" width="11.2" height="2.6" rx="1.2" fill="#5B3A1E"/>
      <circle cx="23.8" cy="28.4" r="4.7" fill="#5A3A1E"/><circle cx="23.8" cy="28.4" r="4.7" fill="none" stroke="#F6E2B8" stroke-width="1"/>
      <path d="M22.3 7.4v29.4M24 7.4v29.4M25.7 7.4v29.4" stroke="#FFF6E4" stroke-width=".55"/>`,
    // 音乐会员（磁带）
    music: `
      <g ${CUT}><rect x="6" y="12.6" width="36" height="23.4" rx="3.4"/></g>
      <rect x="6" y="12.6" width="36" height="23.4" rx="3.4" fill="#5C6FB8"/>
      <rect x="10" y="16.2" width="28" height="10.6" rx="1.8" fill="#F5EFE2"/>
      <path d="M13.6 20.2h21" stroke="#E0574F" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M13.6 23.4h13" stroke="#C9BDA3" stroke-width=".9" stroke-linecap="round"/>
      <rect x="21.4" y="27.6" width="5.2" height="4" rx="1" fill="#9AA8DA"/>
      <circle cx="16.4" cy="29.6" r="4" fill="#2F3654"/><circle cx="16.4" cy="29.6" r="1.5" fill="#F5EFE2"/>
      <circle cx="31.6" cy="29.6" r="4" fill="#2F3654"/><circle cx="31.6" cy="29.6" r="1.5" fill="#F5EFE2"/>
      <circle cx="9.6" cy="32.8" r=".9" fill="#C9D2F0"/><circle cx="38.4" cy="32.8" r=".9" fill="#C9D2F0"/>`,
    // 2026 演唱会（话筒）
    shows: `
      <g ${CUT}><circle cx="30" cy="14.5" r="7.4"/><path d="M31.5 22.8 23.3 40.8Q22.4 42.9 20.6 42.1 18.7 41.3 17.5 38.2L25.7 20.2Z"/><path d="M43 6.5v7M39.5 10h7" fill="none"/></g>
      <path d="M31.5 22.8 23.3 40.8Q22.4 42.9 20.6 42.1 18.7 41.3 17.5 38.2L25.7 20.2Z" fill="#7B5EA7"/>
      <path d="M27.4 24.4 21.4 37.4" stroke="#B49AE0" stroke-width="1.2" stroke-linecap="round" fill="none"/>
      <path d="M26.4 22.6 31.9 25.1 31 27.3 25.5 24.8Z" fill="#F2D488"/>
      <circle cx="30" cy="14.5" r="7.4" fill="#D3D7DE"/>
      <g fill="#8C93A0">${[[-4.5, 0], [-2.25, -2.6], [-2.25, 0], [-2.25, 2.6], [0, -4.6], [0, -1.6], [0, 1.6], [0, 4.6], [2.25, -2.6], [2.25, 0], [2.25, 2.6], [4.5, 0]].map(([x, y]) => `<circle cx="${30 + x}" cy="${14.5 + y}" r=".8"/>`).join('')}</g>
      <path d="M43 6.5v7M39.5 10h7" stroke="#F2C14E" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
    // 林同学（笑脸）
    ta: `
      <g ${CUT}><circle cx="24" cy="24" r="15.5"/></g>
      <circle cx="24" cy="24" r="15.5" fill="#F8CF58"/>
      <path d="M14.2 14.8c2-2.4 4.8-3.6 7.4-3.5" stroke="#FFEAA6" stroke-width="1.7" stroke-linecap="round" fill="none"/>
      <path d="M16.8 21.6c1.2-2.5 3.9-2.5 5.1 0M26.1 21.6c1.2-2.5 3.9-2.5 5.1 0" stroke="#4A3418" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M16.6 27c3.4 4.7 11.4 4.7 14.8 0" stroke="#4A3418" stroke-width="1.9" stroke-linecap="round" fill="none"/>
      <circle cx="14.6" cy="26.4" r="2.2" fill="#F29A7A" opacity=".7"/><circle cx="33.4" cy="26.4" r="2.2" fill="#F29A7A" opacity=".7"/>`,
    // 一点点（奶茶）
    milk: `
      <g ${CUT}><path d="M28.6 2.6 31.7 3.4 29.4 12.6 26.3 11.8Z"/><path d="M14.6 13.4h18.8L31.6 40.6c-.2 1.9-1.8 3.2-3.7 3.2h-7.8c-1.9 0-3.5-1.3-3.7-3.2Z"/><rect x="13" y="11" width="22" height="3.9" rx="1.9"/></g>
      <path d="M28.6 2.6 31.7 3.4 29.4 12.6 26.3 11.8Z" fill="#EE7D92"/>
      <path d="M14.6 13.4h18.8L31.6 40.6c-.2 1.9-1.8 3.2-3.7 3.2h-7.8c-1.9 0-3.5-1.3-3.7-3.2Z" fill="#FBF3E3"/>
      <path d="M16.3 23.6h15.4L31.2 40.2c-.2 1.4-1.2 2.2-2.5 2.2h-9.4c-1.3 0-2.3-.8-2.5-2.2Z" fill="#DBA66A"/>
      <g fill="#4B3222">${[[19.6, 38.6], [23.3, 39.6], [27, 38.8], [30, 36.8], [18.9, 35.2], [22.4, 36.1], [26.1, 35.3], [29.2, 33.4], [20.7, 32], [24.6, 31.8], [27.9, 30.4], [22.2, 28.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7"/>`).join('')}</g>
      <path d="M17.4 17 16.6 25" stroke="#FFF9EE" stroke-width="1.5" stroke-linecap="round" fill="none" opacity=".9"/>
      <rect x="13" y="11" width="22" height="3.9" rx="1.9" fill="#F2A2B6"/>`,
    // 阿强理发（剪刀）
    barber: `
      <g ${CUT}><path d="M23.2 25.4 8.6 13.2C6.4 11.3 7.6 8.4 10.4 9.2L26.2 22.6Z"/><path d="M24.8 25.4 39.4 13.2C41.6 11.3 40.4 8.4 37.6 9.2L21.8 22.6Z"/><ellipse cx="19" cy="36.4" rx="4.6" ry="5.8" transform="rotate(-18 19 36.4)"/><ellipse cx="29" cy="36.4" rx="4.6" ry="5.8" transform="rotate(18 29 36.4)"/><path d="M21.6 26.8 18.4 33.2M26.4 26.8 29.6 33.2" fill="none"/></g>
      <path d="M23.2 25.4 8.6 13.2C6.4 11.3 7.6 8.4 10.4 9.2L26.2 22.6Z" fill="#D5D9DF"/>
      <path d="M24.8 25.4 39.4 13.2C41.6 11.3 40.4 8.4 37.6 9.2L21.8 22.6Z" fill="#C2C7CF"/>
      <path d="M21.6 26.8 18.4 33.2M26.4 26.8 29.6 33.2" stroke="#8F96A3" stroke-width="2" stroke-linecap="round" fill="none"/>
      <ellipse cx="19" cy="36.4" rx="3.3" ry="4.5" transform="rotate(-18 19 36.4)" fill="none" stroke="#5B8DEF" stroke-width="2.4"/>
      <ellipse cx="29" cy="36.4" rx="3.3" ry="4.5" transform="rotate(18 29 36.4)" fill="none" stroke="#5B8DEF" stroke-width="2.4"/>
      <circle cx="24" cy="25.6" r="1.7" fill="#6B7280"/>`,
  };

  return function sticker(id, extra) {
    const art = ART[id] || ART.ta;
    return `<span class="stk${extra ? ' ' + extra : ''}" aria-hidden="true"><svg viewBox="0 0 48 48">${art}</svg></span>`;
  };
})();
