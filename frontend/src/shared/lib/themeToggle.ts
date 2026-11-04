export function getTheme() { return localStorage.getItem('menucraft-theme') || 'default'; }
export function setTheme(t: string) { localStorage.setItem('menucraft-theme', t); document.documentElement.setAttribute('data-theme', t); }
