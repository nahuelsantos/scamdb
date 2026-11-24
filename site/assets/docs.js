// The docs page: language tabs on code examples (the choice applies to every example and is remembered), a copy
// button on every code block, and the side menu marking the section on screen. Without JS everything still shows.
const S = { copy: 'Copy', copied: 'Copied' };
const LANG_KEY = 'scamdb:docs-lang';

function showLang(lang) {
  for (const box of document.querySelectorAll('[data-ctabs]')) {
    const has = box.querySelector(`[data-lang-tab="${lang}"]`);
    const pick = has ? lang : box.querySelector('[data-lang-tab]').dataset.langTab;
    for (const tab of box.querySelectorAll('[data-lang-tab]')) {
      const on = tab.dataset.langTab === pick;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !on;
    }
  }
}
let saved = null;
try { saved = localStorage.getItem(LANG_KEY); } catch { /* not remembered */ }
for (const box of document.querySelectorAll('[data-ctabs]')) {
  box.classList.add('tabs-on');
  box.querySelector('.ctabs-bar').hidden = false;
  const tabs = [...box.querySelectorAll('[data-lang-tab]')];
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      showLang(tab.dataset.langTab);
      try { localStorage.setItem(LANG_KEY, tab.dataset.langTab); } catch { /* not remembered */ }
    });
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.click(); next.focus();
    });
  });
}
showLang(saved ?? 'curl');

for (const pre of document.querySelectorAll('.docs-body pre.code')) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'copy-code';
  btn.textContent = S.copy;
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(pre.innerText); btn.textContent = S.copied; } catch { btn.textContent = '—'; }
    setTimeout(() => { btn.textContent = S.copy; }, 1500);
  });
  pre.classList.add('has-copy');
  pre.append(btn);
}

// The side menu marks the section being read.
const links = new Map([...document.querySelectorAll('.docs-side a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a]));
if ('IntersectionObserver' in window && links.size) {
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id));
    const first = [...links.keys()].find((id) => visible.has(id));
    if (!first) return;
    for (const [id, a] of links) (id === first ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'));
  }, { rootMargin: '0px 0px -60% 0px' });
  for (const id of links.keys()) { const el = document.getElementById(id); if (el) io.observe(el); }
}
// On phones the menu closes once a section is picked.
for (const a of document.querySelectorAll('.docs-menu a')) a.addEventListener('click', () => { a.closest('details').open = false; });
