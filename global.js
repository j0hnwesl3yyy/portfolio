console.log("IT’S ALIVE!");

// Utility
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Navigation
const pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'cv/', title: 'CV' },
  { url: 'meta/', title: 'Meta' },
  { url: 'https://github.com/j0hnwesl3yyy', title: 'GitHub' }
];

const BASE_PATH =
  location.hostname.includes('localhost') || location.hostname.includes('127.0.0.1')
    ? '/'
    : '/portfolio/';

const nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }

  const a = document.createElement('a');
  a.href = url;
  a.textContent = p.title;
  a.classList.toggle('current', a.host === location.host && a.pathname === location.pathname);
  a.toggleAttribute('target', a.host !== location.host);
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

const themeSelect = document.getElementById('theme-select');
const root = document.documentElement;

const savedTheme = localStorage.getItem('theme') || 'auto';
themeSelect.value = savedTheme;
applyTheme(savedTheme);

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

// Exported: JSON fetcher
export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    return await response.json();
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

// Exported: GitHub API fetch
export async function fetchGithubData(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    if (!response.ok) throw new Error(`GitHub error: ${response.statusText}`);
    return await response.json();
  } catch (err) {
    console.error('GitHub fetch error:', err);
  }
}

// ──────────────────────────────────────────────────────────────
//  UPDATED SECTION ➜ renderProjects() now links screenshots & titles
// ──────────────────────────────────────────────────────────────
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
    article.className = 'project-card';

    /* ── screenshot ─────────────────────────────────── */
    const imgSrc =
      project.screenshot || // preferred key
      project.image ||      // fallback key
      'https://via.placeholder.com/300x200?text=No+Image';

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = `${project.title || 'Project'} image`;

    if (project.url) {
      const link = document.createElement('a');
      link.href = project.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.appendChild(img);
      article.appendChild(link);
    } else {
      article.appendChild(img);
    }

    /* ── title ───────────────────────────────────────── */
    const Heading = headingLevel.toLowerCase();
    const titleEl = document.createElement(Heading);

    if (project.url) {
      const link = document.createElement('a');
      link.href = project.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = project.title || 'Untitled Project';
      titleEl.appendChild(link);
    } else {
      titleEl.textContent = project.title || 'Untitled Project';
    }
    article.appendChild(titleEl);

    /* ── meta & description ─────────────────────────── */
    const meta = document.createElement('p');
    meta.innerHTML = `<strong>Year:</strong> ${project.year || 'N/A'}`;
    article.appendChild(meta);

    const desc = document.createElement('p');
    desc.textContent = project.description || 'No description available.';
    article.appendChild(desc);

    containerElement.appendChild(article);
  }
}
