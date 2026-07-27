
  function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  function oauthClick(provider) {
    showToast('Redirecting to ' + provider + '…');
    setTimeout(() => {
      setUser(provider + ' User');
      showPage('dashboard');
      showToast('Signed in with ' + provider + '!');
    }, 1200);
  }

  function setUser(name) {
    const parts = name.split(' ');
    const initials = parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('user-avatar').textContent = initials;
    document.getElementById('user-display').textContent = name;
  }

  function handleSignup() {
    const first = document.getElementById('signup-first').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    if (!first || !email) { showToast('Please fill in all fields'); return; }
    const last = document.getElementById('signup-last').value.trim();
    setUser(first + ' ' + (last ? last[0] : ''));
    showPage('dashboard');
    showToast('Account created! Welcome aboard 🎉');
  }

  function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if (!email || !pass) { showToast('Please enter your credentials'); return; }
    const name = email.split('@')[0].replace(/[._]/g, ' ');
    setUser(name.charAt(0).toUpperCase() + name.slice(1));
    showPage('dashboard');
    showToast('Welcome back!');
  }