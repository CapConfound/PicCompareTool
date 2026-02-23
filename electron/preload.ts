// Preload script — runs in the renderer context with contextIsolation enabled.
// No Node.js APIs are exposed to the renderer; all communication goes through HTTP.

// Signal to the renderer that it's running inside Electron so CSS can apply
// the traffic-light inset padding for hiddenInset title bar style.
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.setAttribute('data-electron', '');
});
