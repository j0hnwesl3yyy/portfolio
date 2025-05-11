console.log("IT’S ALIVE!");

// Utility
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Navigation links using absolute URLs
const pages = [
  { url: '/index.html', title: 'Home' },
  { url: '/projects/index.html', title: 'Projects' },
  { url: '/contact/index.html', title: 'Contact' },
  { url: '/cv/index.html', title: 'CV' },
  { url: '/meta/index.html', title: 'Meta' },
  { url: 'https://github.com/j0hnwesl3yyy', title: 'GitHub' }
];

// Create nav element and inject
const nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  const a = document.createElement('a');
  a.href = p.url;
  a.textContent = p.title;

  // Mark current page as active
  const linkPath = new URL(p.url, location.origin).pathname;
  const currentPath = location.pathname;
  a.classList.toggle('current', currentPath === linkPath);

  // Open external links in new tab
  a.toggleAttribute('target', a.host !== location.host);
  nav.append(a);
}

// Theme selector (light/dark/auto)
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

const themeSelect = document.getElementById('theme-select');
const root = document.documentElement;

// Load saved or default theme
const savedTheme = localStorage.getItem('theme') || 'auto';
themeSelect.value = savedTheme;
applyTheme(savedTheme);

// Change listener
themeSelect.addEventListener('change', () => {
  const selected = themeSelect.value;
  localStorage.setItem('theme', selected);
  applyTheme(selected);
});

// Apply theme to <html>
function applyTheme(mode) {
  if (mode === 'auto') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', mode);
  }
}

// JSON fetch utility
export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    return await response.json();
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

// GitHub API fetch
export async function fetchGithubData(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    if (!response.ok) throw new Error(`GitHub error: ${response.statusText}`);
    return await response.json();
  } catch (err) {
    console.error('GitHub fetch error:', err);
  }
}

// Render projects
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!Array.isArray(projects)) {
    console.error('Invalid projects array:', projects);
    return;
  }

  if (!containerElement) {
    console.error('Missing container element.');
    return;
  }

  containerElement.innerHTML = '';

  if (projects.length === 0) {
    containerElement.innerHTML = '<p>No projects available right now.</p>';
    return;
  }

  for (const project of projects) {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title || 'Untitled Project'}</${headingLevel}>
      <p><strong>Year:</strong> ${project.year || 'N/A'}</p>
      <img src="${project.image || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="Project image" />
      <p>${project.description || 'No description available.'}</p>
    `;
    containerElement.appendChild(article);
  }
}
