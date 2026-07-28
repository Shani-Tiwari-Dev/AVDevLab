// AV DevLabs — light/dark theme toggle.
// The "apply immediately" snippet (see theme-init.js) runs earlier in <head>
// to avoid a flash of the wrong theme; this file just wires up the button.
(function () {
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('av_theme', theme);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    });
  });
})();
