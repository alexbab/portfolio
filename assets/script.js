/* ==========================================================================
   Portfolio Script — Alexandre Babeanu
   --------------------------------------------------------------------------
   TABLE OF CONTENTS
   1) DOM HELPERS & CONSTANTS
   2) FOOTER YEAR
   3) THEME TOGGLE (WITH PERSISTENCE)
   4) PROJECT CARD RENDERING
   5) FILTERS (BUILD + APPLY)
   6) DATA LOADING (project-data.json)
   7) INIT
   ========================================================================== */


/* ==========================================================================
   1) DOM HELPERS & CONSTANTS
   -------------------------------------------------------------------------- */

/** Shorthand querySelector */
const $ = (q, el = document) => el.querySelector(q);
/** Shorthand querySelectorAll (returns Array) */
const $$ = (q, el = document) => [...el.querySelectorAll(q)];

const cards   = $('#cards');
const tpl     = $('#card-tpl');
const filters = $('#filters');
const themeBtn = $('#themeToggle');


/* ==========================================================================
   2) FOOTER YEAR
   -------------------------------------------------------------------------- */

(() => {
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();


/* ==========================================================================
   3) THEME TOGGLE (WITH PERSISTENCE)
   --------------------------------------------------------------------------
   - Respects saved preference in localStorage
   - Falls back to OS preference if none saved
   - Toggles icon (☀️ / 🌙)
   ========================================================================== */

(() => {
  const saved = localStorage.getItem('theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial = saved || (prefersLight ? 'light' : 'dark');

  document.documentElement.setAttribute('data-theme', initial);
  if (themeBtn) themeBtn.textContent = initial === 'light' ? '☀️' : '🌙';

  themeBtn?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    if (themeBtn) themeBtn.textContent = next === 'light' ? '☀️' : '🌙';
  });
})();


/* ==========================================================================
   4) PROJECT CARD RENDERING
   --------------------------------------------------------------------------
   render(projects: Array<Project>)
   - Creates cards from <template id="card-tpl">
   - Populates image, title, description, tags, and action links
   - Keeps DOM writes batched via DocumentFragment
   ========================================================================== */

/**
 * @typedef {Object} Project
 * @property {string} title
 * @property {string} description
 * @property {string} [image]
 * @property {string[]} [tags]
 * @property {Record<string,string>} [links] - { Label: URL }
 */

/**
 * Render a list of projects into the grid.
 * @param {Project[]} list
 */
function render(list) {
  if (!cards || !tpl) return;
  cards.innerHTML = '';

  const frag = document.createDocumentFragment();

  list.forEach(p => {
    const node = tpl.content.cloneNode(true);

    // Image
    const img = node.querySelector('img');
    if (img) {
      img.src = p.image || '';
      img.alt = (p.title || 'Project') + ' cover';
      // Hint to browser to avoid layout shift
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    }

    // Text
    const titleEl = node.querySelector('h3');
    if (titleEl) titleEl.textContent = p.title || '';

    const descEl = node.querySelector('.desc');
    if (descEl) descEl.textContent = p.description || '';

    // Tags
    const chips = node.querySelector('.chips');
    if (chips) {
      (p.tags || []).forEach(t => {
        const c = document.createElement('span');
        c.className = 'chip';
        c.textContent = t;
        chips.appendChild(c);
      });
    }

    // Actions
    const actions = node.querySelector('.actions');
    if (actions) {
      Object.entries(p.links || {}).forEach(([label, href]) => {
        const a = document.createElement('a');
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = label;
        actions.appendChild(a);
      });
    }

    frag.appendChild(node);
  });

  cards.appendChild(frag);
}


/* ==========================================================================
   5) FILTERS (BUILD + APPLY)
   --------------------------------------------------------------------------
   - Extract unique tags from dataset
   - Build clickable buttons (+ active state)
   - Apply filter to re-render matching projects
   ========================================================================== */

/**
 * Build filter buttons from projects and set initial state.
 * @param {Project[]} projects
 */
function buildFilters(projects) {
  if (!filters) return;

  // Collect unique tags
  const allTags = new Set();
  projects.forEach(p => (p.tags || []).forEach(t => allTags.add(t)));

  // Clear then build
  filters.innerHTML = '';
  const makeBtn = (label) => Object.assign(document.createElement('button'), { textContent: label });

  const tags = ['All', ...allTags];
  const filterButtons = tags.map(tag => {
    const b = makeBtn(tag);
    b.addEventListener('click', () => applyFilter(tag, filterButtons, projects));
    filters.appendChild(b);
    return b;
  });

  // Initial state: show all
  filterButtons[0]?.classList.add('active');
}

/**
 * Apply a tag filter and update active button styles.
 * @param {string} tag
 * @param {HTMLButtonElement[]} buttons
 * @param {Project[]} projects
 */
function applyFilter(tag, buttons, projects) {
  buttons.forEach(b => b.classList.toggle('active', b.textContent === tag));
  if (tag === 'All') {
    render(projects);
  } else {
    render(projects.filter(p => (p.tags || []).includes(tag)));
  }
}


/* ==========================================================================
   6) DATA LOADING (project-data.json)
   --------------------------------------------------------------------------
   - Fetches JSON once
   - Graceful fallback if fetch fails
   ========================================================================== */

/**
 * Load projects JSON from assets folder.
 * @returns {Promise<Project[]>}
 */
async function loadProjects() {
  try {
    const res = await fetch('assets/project-data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.projects || [];
  } catch (err) {
    console.error('Failed to load project data:', err);
    return [];
  }
}


/* ==========================================================================
   7) INIT
   --------------------------------------------------------------------------
   - Entry point: load data -> build filters -> render
   ========================================================================== */

(async function init() {
  const projects = await loadProjects();
  buildFilters(projects);
  render(projects);
})();
