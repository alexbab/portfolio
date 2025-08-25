const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => [...el.querySelectorAll(q)];

// Footer year
$('#year').textContent = new Date().getFullYear();

// Theme toggle with persistence
const themeBtn = document.getElementById('themeToggle');
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
  themeBtn.textContent = next === 'light' ? '☀️' : '🌙';
});

// Project rendering
const cards = $('#cards');
const tpl = $('#card-tpl');
const filters = $('#filters');

function render(list){
  cards.innerHTML = '';
  list.forEach(p => {
    const node = tpl.content.cloneNode(true);
    const img = node.querySelector('img');
    img.src = p.image || '';
    img.alt = (p.title || 'Project') + ' cover';
    node.querySelector('h3').textContent = p.title || '';
    node.querySelector('.desc').textContent = p.description || '';
    const chips = node.querySelector('.chips');
    (p.tags || []).forEach(t => {
      const c = document.createElement('span');
      c.className = 'chip';
      c.textContent = t;
      chips.appendChild(c);
    });
    const actions = node.querySelector('.actions');
    Object.entries(p.links || {}).forEach(([label, href])=>{
      const a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = label;
      actions.appendChild(a);
    });
    cards.appendChild(node);
  });
}

function buildFilters(projects){
  const allTags = new Set();
  projects.forEach(p => (p.tags || []).forEach(t => allTags.add(t)));
  filters.innerHTML = '';
  const mkBtn = (label) => Object.assign(document.createElement('button'), { textContent: label });

  const filterButtons = ['All', ...allTags].map(tag => {
    const b = mkBtn(tag);
    b.addEventListener('click', ()=> applyFilter(tag, filterButtons, projects));
    filters.appendChild(b);
    return b;
  });
  // set initial state
  filterButtons[0].classList.add('active');
}

function applyFilter(tag, buttons, projects){
  buttons.forEach(b=>b.classList.toggle('active', b.textContent===tag));
  if(tag === 'All'){ render(projects); return; }
  render(projects.filter(p => (p.tags || []).includes(tag)));
}

async function init(){
  try{
    const res = await fetch('assets/project-data.json', { cache: 'no-store' });
    const data = await res.json();
    const projects = data.projects || [];
    buildFilters(projects);
    render(projects);
  }catch(e){
    console.error('Failed to load project data:', e);
    // Friendly fallback
    render([]);
    filters.innerHTML = '';
  }
}

init();
