import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

(async () => {
  try {
    // Fetch project data
    const projects = await fetchJSON('../lib/projects.json');
    const projectsContainer = document.querySelector('.projects');

    // Render the projects dynamically
    renderProjects(projects, projectsContainer, 'h2');

    // Variable to track selected slice index
    let selectedIndex = -1;
    let filteredProjects = projects; // Store filtered projects

    // Function to render the pie chart based on filtered projects
    function renderPieChart(projectsGiven) {
      // Re-calculate rolled data
      let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,  // Count number of projects per year
        (d) => d.year     // Group by year
      );

      // Re-calculate data
      let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
      });

      // Re-calculate pie chart generator
      const width = 200;
      const height = 200;
      const radius = Math.min(width, height) / 2;

      let total = 0;
      for (let d of newData) {
        total += d.value;
      }

      let angle = 0;
      let arcData = [];

      for (let d of newData) {
        let endAngle = angle + (d.value / total) * 2 * Math.PI;
        arcData.push({ startAngle: angle, endAngle: endAngle, label: d.label });
        angle = endAngle;
      }

      const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

      const svg = d3
        .select('#projects-pie-plot')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

      // Clear previous paths
      svg.selectAll('path').remove();

      // Add paths for each slice
      const arcs = arcData.map((d) => arcGenerator(d));

      const colorScale = d3.scaleOrdinal(d3.schemeCategory10); // Use D3 color scale

      arcs.forEach((arc, idx) => {
        svg
          .append('path')
          .attr('d', arc)
          .attr('fill', colorScale(idx))
          .attr('stroke', 'white')
          .attr('stroke-width', 1)
          .on('mouseover', function() {
            d3.select(this).style('opacity', 0.8); // On hover, reduce opacity
          })
          .on('mouseout', function() {
            d3.select(this).style('opacity', 1); // On mouse out, reset opacity
          })
          .on('click', function(event, i) {
            // Toggle selectedIndex for highlighting the clicked slice
            selectedIndex = selectedIndex === i ? -1 : i;
            // Filter projects by selected year (if any)
            if (selectedIndex !== -1) {
              const selectedYear = newData[selectedIndex].label;
              filteredProjects = projects.filter(project => project.year === selectedYear);
            } else {
              filteredProjects = projects;
            }
            renderPieChart(filteredProjects); // Re-render the pie chart with the updated selection
            renderProjects(filteredProjects, projectsContainer, 'h2');
          });
      });

      // Clear the legend and re-render
      const legend = d3.select('.legend');
      legend.selectAll('li').remove();

      newData.forEach((d, idx) => {
        legend
          .append('li')
          .attr('style', `color:${colorScale(idx)}`)
          .html(
            `<span class="swatch" style="background-color:${colorScale(idx)}"></span> ${d.label} (${d.value})`
          )
          .on('click', function() {
            // Toggle selection when a legend item is clicked
            selectedIndex = selectedIndex === idx ? -1 : idx;
            // Filter projects by selected year (if any)
            if (selectedIndex !== -1) {
              const selectedYear = newData[selectedIndex].label;
              filteredProjects = projects.filter(project => project.year === selectedYear);
            } else {
              filteredProjects = projects;
            }
            renderPieChart(filteredProjects); // Re-render pie chart with the updated selection
            renderProjects(filteredProjects, projectsContainer, 'h2');
          });
      });

      // Apply highlight for the selected slice
      svg.selectAll('path')
        .classed('selected', (d, i) => i === selectedIndex); // Apply the 'selected' class to the selected slice
    }

    // Handle search input
    const searchInput = document.querySelector('.searchBar');
    searchInput.addEventListener('input', (event) => {
      const query = event.target.value.toLowerCase();

      // Filter projects based on query
      filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query);
      });

      // Re-render projects and pie chart with filtered projects
      renderProjects(filteredProjects, projectsContainer, 'h2');
      renderPieChart(filteredProjects);
    });

    // Initial pie chart rendering with all projects
    renderPieChart(filteredProjects);

  } catch (error) {
    console.error('Error loading or rendering projects:', error);
  }
})();
