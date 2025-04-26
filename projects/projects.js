import { fetchJSON, renderProjects } from '../global.js';

(async () => {
  try {
    // 1. Fetch the project data from the JSON file
    const projects = await fetchJSON('../lib/projects.json');

    // 2. Select the container with class="projects"
    const projectsContainer = document.querySelector('.projects');

    // 3. Render the projects into the container using <h2> headings
    renderProjects(projects, projectsContainer, 'h2');
  } catch (error) {
    console.error('Error loading or rendering projects:', error);
  }
})();
