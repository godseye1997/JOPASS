/* ── Native Capacitor overrides ── */
(function () {
  if (!window.Capacitor?.isNativePlatform()) return;

  const style = document.createElement('style');
  style.textContent = `
    #viewToggle { display: none !important; }

    html, body {
      height: 100% !important;
      overflow: hidden !important;
      background: var(--surface, #fff) !important;
      overscroll-behavior: none !important;
    }

    /* Phone frame fills entire screen */
    .phone-frame {
      box-shadow: none !important;
      border-radius: 0 !important;
      width: 100% !important;
      height: 100% !important;
      max-width: none !important;
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      overflow: hidden !important;
    }

    /* App container fills phone frame */
    .app {
      height: 100% !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
    }

    /* Smooth momentum scrolling on main content */
    .main {
      flex: 1 !important;
      overflow-y: scroll !important;
      -webkit-overflow-scrolling: touch !important;
      overscroll-behavior-y: contain !important;
      scroll-behavior: smooth !important;
    }

    /* Smooth scrolling on login pages */
    .login-scroll {
      overflow-y: scroll !important;
      -webkit-overflow-scrolling: touch !important;
      overscroll-behavior-y: contain !important;
      height: 100% !important;
    }

    /* Remove phone notch in native */
    .phone-notch { display: none !important; }
  `;
  document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.remove('mode-desktop');
    document.body.classList.add('mode-mobile');
  });
})();
