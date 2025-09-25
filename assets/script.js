/* ==========================================================================
   Portfolio Script — i18n Edition (EN/FR)
   ========================================================================== */

/* 1) DOM HELPERS & CONSTANTS */
const $  = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => [...el.querySelectorAll(q)];

const cards    = $('#cards');
const tpl      = $('#card-tpl');
const filters  = $('#filters');
const langBtn  = $('#langToggle');

const SUPPORTED = ['en','fr'];
const DEFAULT_LANG = 'en';

/* 2) FOOTER YEAR */
(() => { const y = $('#year'); if (y) y.textContent = String(new Date().getFullYear()); })();

/* 3) I18N CORE (state, load, apply) */
const i18n = { /* unchanged */ };

/* 4) LANGUAGE TOGGLE BUTTON */
function updateLangButton() { /* unchanged */ }

langBtn?.addEventListener('click', async () => {
  const next = i18n.lang === 'fr' ? 'en' : 'fr';
  await switchLanguage(next);
});

async function switchLanguage(lang) {
  try {
    await i18n.load(lang);
    localStorage.setItem('lang', lang);
    i18n.apply();
    updateLangButton();

    // Reload projects in the chosen language
    let projects = await loadProjects(lang);

    // ✅ Sort by date (newest first)
    projects = sortByDate(projects);

    buildFilters(projects);
    render(projects);
  } catch (e) {
    console.error('Language switch failed:', e);
  }
}

/* 5) PROJECT CARD RENDERING */
function render(list){
  if (!cards || !tpl) return;
  cards.innerHTML = '';
  const frag = document.createDocumentFragment();

  list.forEach(p => {
    const node = tpl.content.cloneNode(true);
    const img = node.querySelector('img');
    if (img) {
      img.src = p.image || '';
      img.alt = (p.title || 'Project') + ' cover';
      img.loading = 'lazy';
      img.decoding = 'async';
    }
    const h3 = node.querySelector('h3');
    if (h3) h3.textContent = p.title || '';
    const desc = node.querySelector('.desc');
    if (desc) desc.textContent = p.description || '';

    // Date (localized)
    const dateEl = node.querySelector('.date');
    if (dateEl && p.date) {
      const d = new Date(p.date);
      dateEl.textContent = d.toLocaleDateString(i18n.lang === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    }

    const chips = node.querySelector('.chips');
    if (chips) {
      (p.tags || []).forEach(t => {
        const c = document.createElement('span');
        c.className = 'chip';
        c.textContent = t;
        chips.appendChild(c);
      });
    }

    const actions = node.querySelector('.actions');
    if (actions) {
      Object.entries(p.links || {}).forEach(([label, href]) => {
        const a = document.createElement('a');
        a.href = href; a.target = '_blank'; a.rel = 'noopener';
        a.textContent = label;
        actions.appendChild(a);
      });
    }

    frag.appendChild(node);
  });

  cards.appendChild(frag);
}

/* 6) FILTERS (BUILD + APPLY) */
function buildFilters(projects){
  if (!filters) return;

  const allTags = new Set();
  projects.forEach(p => (p.tags || []).forEach(t => allTags.add(t)));

  filters.innerHTML = '';
  const makeBtn = (label) => Object.assign(document.createElement('button'), { textContent: label });

  const allLabel = i18n.t('filters.all');
  const tags = [allLabel, ...allTags];
  const buttons = tags.map(tag => {
    const b = makeBtn(tag);
    b.addEventListener('click', ()=> applyFilter(tag, buttons, projects, allLabel));
    filters.appendChild(b);
    return b;
  });
  buttons[0].classList.add('active');
}

function applyFilter(tag, buttons, projects, allLabel){
  buttons.forEach(b => b.classList.toggle('active', b.textContent === tag));
  if (tag === allLabel) {
    render(projects); 
    return;
  }
  // ✅ Filter but keep sorted order
  const filtered = projects.filter(p => (p.tags || []).includes(tag));
  render(filtered);
}

/* 7) DATA LOADING BY LANGUAGE */
async function loadProjects(lang){
  const tryUrls = [
    `assets/project-data.${lang}.json`,
    'assets/project-data.en.json',
    'assets/project-data.json'
  ];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();
      return data.projects || [];
    } catch {}
  }
  return [];
}

/* ✅ Utility: sort projects newest → oldest */
function sortByDate(list){
  return list.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/* 8) INIT */
(async function init(){
  const startLang = i18n.detect();
  await i18n.load(startLang);
  i18n.apply();
  updateLangButton();

  let projects = await loadProjects(startLang);

  // ✅ Always sort before rendering
  projects = sortByDate(projects);

  buildFilters(projects);
  render(projects);
})();
