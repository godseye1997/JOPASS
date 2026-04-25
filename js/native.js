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

    // Hardware back button
    const AppPlugin = window.Capacitor?.Plugins?.App;
    if (AppPlugin) {
      let _backPressedOnce = false;
      AppPlugin.addListener('backButton', () => {
        if (window._navBack && window._navBack()) return;
        // On home screen — tap twice to exit
        if (_backPressedOnce) {
          AppPlugin.exitApp();
          return;
        }
        _backPressedOnce = true;
        const t = document.createElement('div');
        t.textContent = 'Press back again to exit';
        t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.75);color:#fff;padding:10px 18px;border-radius:20px;font-size:.85rem;z-index:9999;pointer-events:none;';
        document.body.appendChild(t);
        setTimeout(() => { t.remove(); _backPressedOnce = false; }, 2000);
      });
    }
  });

  /* ── Navigation history (used by app.js + owner.js) ── */
  const _navStack = [];
  let _navigatingBack = false;

  window._navPush = function (view) {
    if (_navigatingBack) return;
    if (_navStack[_navStack.length - 1] !== view) _navStack.push(view);
  };

  window._navBack = function () {
    if (_navStack.length <= 1) return false;
    _navStack.pop();
    const prev = _navStack[_navStack.length - 1];
    _navigatingBack = true;
    if (typeof navigateTo === 'function')  navigateTo(prev);
    else if (typeof ownerNav === 'function') ownerNav(prev);
    _navigatingBack = false;
    return true;
  };
})();
