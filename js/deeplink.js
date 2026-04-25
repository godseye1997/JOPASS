/* ── Deep link handler for password recovery ── */
(function () {

  function showPasswordResetOverlay() {
    const existing = document.getElementById('pwResetOverlay');
    if (existing) return; // already showing

    const overlay = document.createElement('div');
    overlay.id = 'pwResetOverlay';
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:9999;
      background:var(--surface, #fff);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      padding:32px 24px;
    `;
    overlay.innerHTML = `
      <img src="logo.png" style="height:56px; object-fit:contain; margin-bottom:24px;" onerror="this.style.display='none'">
      <h2 style="font-size:1.3rem; font-weight:800; margin-bottom:8px; color:#0C5467;">Set New Password</h2>
      <p style="font-size:.85rem; color:#888; margin-bottom:24px; text-align:center;">Choose a new password for your account.</p>
      <div style="width:100%; max-width:360px; display:flex; flex-direction:column; gap:14px;">
        <div>
          <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:5px;">New Password</label>
          <input id="pwResetNew" type="password" placeholder="At least 6 characters"
            style="width:100%; padding:12px 14px; border:1.5px solid #ddd; border-radius:10px; font-size:.95rem; background:#f8f9fa; color:#1a1a2e; box-sizing:border-box;">
        </div>
        <div>
          <label style="font-size:.82rem; font-weight:600; display:block; margin-bottom:5px;">Confirm Password</label>
          <input id="pwResetConfirm" type="password" placeholder="••••••••"
            style="width:100%; padding:12px 14px; border:1.5px solid #ddd; border-radius:10px; font-size:.95rem; background:#f8f9fa; color:#1a1a2e; box-sizing:border-box;">
        </div>
        <p id="pwResetMsg" style="font-size:.82rem; display:none; margin:0;"></p>
        <button id="pwResetBtn" onclick="submitPasswordReset()"
          style="width:100%; padding:14px; background:#0C5467; color:#fff; border:none; border-radius:10px; font-size:.95rem; font-weight:700; cursor:pointer;">
          Set New Password
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  window.submitPasswordReset = async function () {
    const pass    = document.getElementById('pwResetNew').value;
    const confirm = document.getElementById('pwResetConfirm').value;
    const msgEl   = document.getElementById('pwResetMsg');
    const btn     = document.getElementById('pwResetBtn');

    if (pass.length < 6) {
      msgEl.textContent = 'Password must be at least 6 characters.';
      msgEl.style.color = '#e17055'; msgEl.style.display = 'block'; return;
    }
    if (pass !== confirm) {
      msgEl.textContent = 'Passwords do not match.';
      msgEl.style.color = '#e17055'; msgEl.style.display = 'block'; return;
    }

    btn.disabled = true; btn.textContent = 'Updating…';
    const { error } = await _supabase.auth.updateUser({ password: pass });
    if (error) {
      msgEl.textContent = error.message;
      msgEl.style.color = '#e17055'; msgEl.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Set New Password';
    } else {
      await _supabase.auth.signOut();
      document.getElementById('pwResetOverlay').remove();
      window.location.href = 'index.html';
    }
  };

  // Supabase fires PASSWORD_RECOVERY when the recovery token is in the URL
  document.addEventListener('DOMContentLoaded', () => {
    // Listen for Supabase auth state changes (handles both web and native)
    if (typeof _supabase !== 'undefined') {
      _supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') showPasswordResetOverlay();
      });
    }

    // Handle deep link when app is opened cold (native)
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
      const AppPlugin = Capacitor.Plugins?.App;
      if (AppPlugin) {
        AppPlugin.addListener('appUrlOpen', (event) => {
          if (!event.url.includes('type=recovery')) return;
          // Extract hash and update location so Supabase can parse tokens
          const hashIdx = event.url.indexOf('#');
          if (hashIdx !== -1) {
            const hash = event.url.slice(hashIdx + 1);
            history.replaceState(null, '', window.location.pathname + '#' + hash);
            // Re-init Supabase session from the new hash
            _supabase.auth.getSession();
          }
          showPasswordResetOverlay();
        });
      }
    }
  });
})();
