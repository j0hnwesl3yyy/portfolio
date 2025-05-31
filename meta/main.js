import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

/* ─────────────── GLOBAL STATE ─────────────── */
let commits = [];         // Array of { id, url, author, datetime, hourFrac, totalLines, lines: [...] }
let rawData = [];         // Original CSV rows
let filteredFiles = [];   // Array of { name, lines: [...] } after filtering by commit

let xScale, yScale;
const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
/* ────────────────────────────────────────────── */

/* ─────────── LOAD & PROCESS DATA ─────────── */
async function loadData() {
  const rows = await d3.csv('loc.csv', (r) => ({
    ...r,
    line:      +r.line,
    depth:     +r.depth,
    length:    +r.length,
    datetime:  new Date(r.datetime),
  }));
  return rows;
}

function processCommits(rows) {
  // Group by commit hash, extract metadata
  return d3
    .groups(rows, (d) => d.commit)
    .map(([id, lines]) => {
      const dt = lines[0].datetime;
      return {
        id,
        url: `https://github.com/vis-society/lab-7/commit/${id}`,
        author: lines[0].author,
        datetime: dt,
        hourFrac: dt.getHours() + dt.getMinutes() / 60,
        totalLines: lines.length,
        lines,
      };
    })
    .sort((a, b) => a.datetime - b.datetime);
}

function computeFilesData(commitSubset) {
  // Flatten all “lines” arrays of commits up to a certain point
  const allLines = commitSubset.flatMap((c) => c.lines);

  // Group by file name, return array of { name, lines[...] }
  return d3
    .groups(allLines, (d) => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);
}
/* ────────────────────────────────────────────── */

/* ───────────── SUMMARY CARD RENDER ───────────── */
function renderCommitInfo(rows, commitsArr) {
  // rows: filtered CSV rows up to the selected commit
  // commitsArr: array of commit objects up to that point
  const root = d3.select('#stats').html('');
  const card = root.append('div').attr('class', 'stats-card');
  card.append('div').attr('class', 'stats-title').text('Summary');

  const dl = card.append('dl').attr('class', 'stats');

  function add(dt, dd) {
    dl.append('dt').text(dt);
    dl.append('dd').text(dd);
  }

  add('Commits',      commitsArr.length);
  add('Files',        d3.groups(rows, (d) => d.file).length);
  add('Total LOC',    rows.length);
  add('Max depth',    d3.max(rows, (d) => d.depth) ?? '—');
  add('Longest line', d3.max(rows, (d) => d.line) ?? '—');
  add('Max lines',    d3.max(commitsArr, (d) => d.totalLines) ?? '—');
}
/* ────────────────────────────────────────────── */

/* ───────────── UPDATE FILE‐DOT VISUALIZATION ───────────── */
function updateFileDisplay(filesArr) {
  // filesArr: [ { name, lines:[ … ] }, … ] for the currently selected commit range
  const rows = d3
    .select('#files')
    .selectAll('div')
    .data(filesArr, (d) => d.name)
    .join(
      (enter) =>
        enter.append('div').call((div) => {
          div.append('dt');
          div.append('dd');
        }),
      (update) => update,
      (exit) => exit.remove()
    );

  // Fill in <dt> with file name + line count
  rows.select('dt').html((d) => {
    return `<code>${d.name}</code><small>${d.lines.length} lines</small>`;
  });

  // Bind each file’s “lines” array to <dd> and create one .loc dot per line
  rows
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', (d) => `--color:${colorScale(d.type)}`);
}
/* ───────────────────────────────────────────────────── */

/* ───── SCATTER‐PLOT RENDER & UPDATE ───── */
function renderScatterPlot(commitsArr) {
  const W = 1000,
    H = 600;
  const m = { top: 20, right: 20, bottom: 40, left: 60 };
  const usable = {
    left: m.left,
    right: W - m.right,
    bottom: H - m.bottom,
    top: m.top,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('width', '100%')
    .attr('height', '100%');

  xScale = d3
    .scaleTime()
    .domain(d3.extent(commitsArr, (d) => d.datetime))
    .range([usable.left, usable.right])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([usable.bottom, usable.top]);

  const rScale = d3
    .scaleSqrt()
    .domain(d3.extent(commitsArr, (d) => d.totalLines))
    .range([2, 30]);

  // Gridlines
  svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usable.left},0)`)
    .call(
      d3
        .axisLeft(yScale)
        .tickSize(-(usable.right - usable.left))
        .tickFormat('')
    );

  // Dots layer
  svg
    .append('g')
    .attr('class', 'dots')
    .selectAll('circle')
    .data(commitsArr, (d) => d.id)
    .join('circle')
      .attr('cx', (d) => xScale(d.datetime))
      .attr('cy', (d) => yScale(d.hourFrac))
      .attr('r',  (d) => rScale(d.totalLines))
      .attr('fill', 'steelblue')
      .attr('opacity', 0.65)
      .on('mouseenter', (e, d) => {
        d3.select(e.currentTarget).attr('opacity', 1);
        showTooltip(e, d);
      })
      .on('mouseleave', hideTooltip)
      .on('mousemove', (e, d) => showTooltip(e, d));

  // X‐axis
  svg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${usable.bottom})`)
    .call(d3.axisBottom(xScale).ticks(10));

  // Y‐axis
  svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usable.left},0)`)
    .call(d3.axisLeft(yScale).ticks(12));
}

function updateScatterPlot(subset) {
  if (subset.length === 0) return;

  // update x‐scale domain
  xScale.domain(d3.extent(subset, (c) => c.datetime));

  const rScale = d3
    .scaleSqrt()
    .domain(d3.extent(subset, (c) => c.totalLines))
    .range([2, 30]);

  const svg = d3.select('#chart svg');

  // update dots
  svg
    .select('.dots')
    .selectAll('circle')
    .data(
      subset.sort((a, b) => b.totalLines - a.totalLines),
      (d) => d.id
    )
    .join(
      (enter) =>
        enter
          .append('circle')
          .attr('cy', (d) => yScale(d.hourFrac))
          .attr('cx', (d) => xScale(d.datetime))
          .attr('r', (d) => rScale(d.totalLines))
          .attr('fill', 'steelblue')
          .attr('opacity', 0.65)
          .on('mouseenter', (e, d) => {
            d3.select(e.currentTarget).attr('opacity', 1);
            showTooltip(e, d);
          })
          .on('mouseleave', hideTooltip)
          .on('mousemove', (e, d) => showTooltip(e, d)),
      (update) =>
        update
          .attr('cx', (d) => xScale(d.datetime))
          .attr('r', (d) => rScale(d.totalLines)),
      (exit) => exit.remove()
    );

  // update x‐axis
  svg.select('.x-axis').call(d3.axisBottom(xScale).ticks(10));

  // update gridlines
  svg
    .select('.gridlines')
    .call(
      d3
        .axisLeft(yScale)
        .tickSize(-(1000 - 60 - 20))
        .tickFormat('')
        .ticks(12)
    );
}

/* ───────────── TOOLTIP ───────────── */
function showTooltip(e, d) {
  d3.select('#commit-link')
    .attr('href', d.url)
    .text(d.id.substring(0, 7));
  d3.select('#commit-date').text(d.datetime.toLocaleString());
  d3.select('#commit-time-tooltip').text(d.datetime.toLocaleTimeString());
  d3.select('#commit-author').text(d.author);
  d3.select('#commit-lines').text(d.totalLines);

  d3.select('#commit-tooltip')
    .style('left', `${e.clientX + 12}px`)
    .style('top', `${e.clientY + 12}px`)
    .attr('hidden', null);
}
function hideTooltip() {
  d3.select('#commit-tooltip').attr('hidden', true);
}

/* ───────────── Build Narrative Steps ───────────── */
function generateSteps(commitArr) {
  const sel = d3
    .select('#scatter-story')
    .selectAll('.step')
    .data(commitArr)
    .join('div')
    .attr('class', 'step');

  // Each step now only shows a text line AND a list of file names
  sel.html((d) => `
    <p>
      I committed this update:
      <strong>${d.totalLines}</strong> lines
      across <strong>${
        d3.groups(d.lines, (l) => l.file).length
      }</strong> file(s).
    </p>
    <ul class="file-list">
      ${d3
        .groups(d.lines, (l) => l.file)
        .map(([file, lines]) => `<li>${file}</li>`)
        .join('')}
    </ul>
  `);
}

/* ───────────── Scrollama Setup ───────────── */
function onStepEnter(response) {
  const current = response.element.__data__;
  const upTo = commits.filter((c) => c.datetime <= current.datetime);

  // 1) update summary
  const filteredRows = rawData.filter((r) => r.datetime <= current.datetime);
  renderCommitInfo(filteredRows, upTo);

  // 2) update scatter
  updateScatterPlot(upTo);

  // 3) update sticky file‐dots
  filteredFiles = computeFilesData(upTo);
  updateFileDisplay(filteredFiles);
}

function initScrollama() {
  scrollama()
    .setup({
      container: '#scrolly-1',
      step: '#scatter-story .step',
      offset: 0.5,
    })
    .onStepEnter(onStepEnter);
}

/* ───────────── Bootstrap Everything ───────────── */
(async function () {
  rawData = await loadData();
  commits = processCommits(rawData);

  // 1) render full scatter plot
  renderScatterPlot(commits);

  // 2) initial summary + initial file‐dots (all commits)
  renderCommitInfo(rawData, commits);
  filteredFiles = computeFilesData(commits);
  updateFileDisplay(filteredFiles);

  // 3) build all narrative steps (now containing only filenames)
  generateSteps(commits);

  // 4) wire up Scrollama
  initScrollama();
})();
