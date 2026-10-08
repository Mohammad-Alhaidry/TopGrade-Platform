/* Normalize phone browsers that request a desktop layout viewport. */
(() => {
  if (!matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) > 600) return;
  const root = document.documentElement;
  root.classList.add('mobile-view');
  function sync() {
    root.style.zoom = '';
    const narrow = Math.min(screen.width, screen.height);
    const tall = Math.max(screen.width, screen.height);
    const portrait = screen.height >= screen.width;
    root.classList.toggle('landscape-view', !portrait);
    root.classList.toggle('short-view', tall < 700);
    root.classList.toggle('tiny-view', tall < 620);
    if (portrait && window.innerWidth > narrow * 1.25) {
      root.style.zoom = String(Math.min(window.innerWidth / narrow, 3));
    }
  }
  sync();
  addEventListener('orientationchange', () => setTimeout(sync, 80));
})();
