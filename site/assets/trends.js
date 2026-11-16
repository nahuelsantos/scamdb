// Fills /trends/ from GET /v1/trends?country= (aggregated counts only). Names come from the catalogue index.
const root = document.getElementById('tr');
const S = JSON.parse(root.dataset.strings || '{}');
const sel = document.getElementById('tr-country'), status = document.getElementById('tr-status'), list = document.getElementById('tr-list');
let names = null;
const nameOf = async (id) => {
  if (!names) names = await fetch('/assets/entries.json').then((r) => r.json()).then((d) => new Map(d.entries.map((e) => [e.id, e.name?.en ?? e.id]))).catch(() => new Map());
  return names.get(id) ?? id;
};

async function show(cc) {
  list.replaceChildren();
  status.textContent = S.loading;
  try {
    const d = await fetch(`/v1/trends?country=${encodeURIComponent(cc)}`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
    const totals = {};
    for (const week of Object.values(d.scams)) for (const [id, n] of Object.entries(week)) totals[id] = (totals[id] ?? 0) + n;
    const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (!top.length) { status.textContent = S.empty; return; }
    status.textContent = `${d.reports ?? '5+'} ${S.reports}${d.withheld ? ` · ${d.withheld} ${S.withheld}` : ''}`;
    const max = top[0][1];
    for (const [id, n] of top) {
      const li = document.createElement('li');
      const a = document.createElement('a'); a.href = `/catalogue/${id}/`; a.textContent = await nameOf(id);
      const bar = document.createElement('span'); bar.className = 'tr-bar'; bar.style.width = `${Math.max(4, (n / max) * 100)}%`;
      const num = document.createElement('span'); num.className = 'tr-n'; num.textContent = String(n);
      li.append(a, bar, num);
      list.append(li);
    }
  } catch {
    status.textContent = S.fail;
  }
}
try { const saved = localStorage.getItem('scamdb:trends'); if (saved) sel.value = saved; } catch { /* no storage */ }
sel.addEventListener('change', () => { try { localStorage.setItem('scamdb:trends', sel.value); } catch { /* no storage */ } show(sel.value); });
show(sel.value);
