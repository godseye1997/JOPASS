/* Hide the Phone/Desktop toggle and force mobile mode in native Capacitor app */
(function () {
  if (!window.Capacitor?.isNativePlatform()) return;

  // Inject CSS immediately so the toggle never flashes
  const style = document.createElement('style');
  style.textContent = '#viewToggle { display: none !important; } .phone-frame { box-shadow: none !important; border-radius: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; } body { background: var(--surface, #fff) !important; }';
  document.head.appendChild(style);

  // Force mobile mode as soon as body exists
  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.remove('mode-desktop');
    document.body.classList.add('mode-mobile');
  });
})();
