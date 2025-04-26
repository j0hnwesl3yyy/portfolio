import { fetchJSON, renderProjects, fetchGithubData } from './global.js';

(async () => {
  try {
    // Fetch and display latest 3 projects
    const projects = await fetchJSON('./lib/projects.json');
    const latestProjects = projects.slice(0, 3);
    const projectsContainer = document.querySelector('.projects');
    renderProjects(latestProjects, projectsContainer, 'h2');

    // Fetch and display GitHub stats
    const githubData = await fetchGithubData('j0hnwesl3yyy');
    const profileStats = document.querySelector('#profile-stats');

    if (profileStats && githubData) {
        profileStats.innerHTML = `
          <dt>FOLLOWERS</dt><dd>${githubData.followers}</dd>
          <dt>FOLLOWING</dt><dd>${githubData.following}</dd>
          <dt>PUBLIC REPOS</dt><dd>${githubData.public_repos}</dd>
          <dt>PUBLIC GISTS</dt><dd>${githubData.public_gists}</dd>
        `;
      }      
  } catch (error) {
    console.error('🚨 Error loading content:', error);
  }
})();
