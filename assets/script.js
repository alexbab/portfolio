/* ==========================================================================
   Portfolio Script — i18n Edition (EN/FR)
   --------------------------------------------------------------------------
   TABLE OF CONTENTS
   1) DOM HELPERS & CONSTANTS
   2) FOOTER YEAR
   3) I18N CORE (state, load, apply)
   4) LANGUAGE TOGGLE BUTTON
   5) PROJECT CARD RENDERING
   6) FILTERS (BUILD + APPLY)
   7) DATA LOADING BY LANGUAGE
   8) INIT
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
const i18n = {
  lang: null,
  dict: {},

  detect() {
    const saved = localStorage.getItem('lang');
    if (saved && SUPPORTED.includes(saved)) return saved;
    const n = (navigator.language || 'en').toLowerCase();
    return n.startsWith('fr') ? 'fr' : 'en';
  },

  async load(lang) {
    const url = `assets/i18n/${lang}.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`i18n HTTP ${res.status}`);
    this.dict = await res.json();
    this.lang = lang;
  },

  t(key) {
    return this.dict[key] ?? key; // fallback: show key if missing
  },

  apply() {
    $$('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      el.textContent = this.t(key);
    });
  }
};

/* 4) LANGUAGE TOGGLE BUTTON */
function updateLangButton() {
  if (!langBtn) return;
  // Show the *other* language on the button (click to switch)
  langBtn.textContent = i18n.lang === 'fr' ? 'EN' : 'FR';
  langBtn.setAttribute('aria-label', i18n.lang === 'fr' ? 'Switch to English' : 'Passer en français');
}

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
    const projects = await loadProjects(lang);
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
  if (tag === allLabel) { render(projects); return; }
  render(projects.filter(p => (p.tags || []).includes(tag)));
}

/* 7) DATA LOADING BY LANGUAGE */
async function loadProjects(lang){
  // Try language-specific file; fall back to EN; finally fall back to old single file.
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

/* 8) INIT */
(async function init(){
  const startLang = i18n.detect();
  await i18n.load(startLang);
  i18n.apply();
  updateLangButton();

  const projects = await loadProjects(startLang);
  buildFilters(projects);
  render(projects);
})();
