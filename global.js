console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'cv/', title: 'CV' },
  { url: 'https://github.com/j0hnwesl3yyy', title: 'GitHub' }
];

const BASE_PATH = location.hostname === "localhost" || location.hostname === "127.0.0.1"
  ? "/"
  : "/portfolio/"; 

const nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  if (!url.startsWith("http")) {
    url = BASE_PATH + url;
  }

  const a = document.createElement('a');
  a.href = url;
  a.textContent = p.title;

  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  a.toggleAttribute("target", a.host !== location.host);

  nav.append(a);
}


document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
        Theme:
        <select id="theme-select">
          <option value="auto">Automatic</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    `
  );
  
  // DOM references
  const themeSelect = document.getElementById('theme-select');
  const root = document.documentElement;
  
  // Check and apply saved theme
  const savedTheme = localStorage.getItem('theme') || 'auto';
  themeSelect.value = savedTheme;
  applyTheme(savedTheme);
  
  // Handle selection change
  themeSelect.addEventListener('change', () => {
    const selected = themeSelect.value;
    localStorage.setItem('theme', selected);
    applyTheme(selected);
  });
  
  function applyTheme(mode) {
    if (mode === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', mode);
    }
  }
  