// Catalogue filters: show only the scams of one country and/or one channel. Without JS every scam is listed.
const form = document.getElementById('cat-filters');
if (form) {
  const country = document.getElementById('f-country'), channel = document.getElementById('f-channel');
  const count = document.getElementById('f-count');
  const params = new URLSearchParams(location.search);
  if (params.get('country')) country.value = params.get('country');
  if (params.get('channel')) channel.value = params.get('channel');
  const apply = () => {
    let n = 0;
    for (const g of document.querySelectorAll('.cat-group')) {
      let shown = 0;
      const countryOk = !country.value || g.dataset.country === country.value;
      for (const card of g.querySelectorAll('.sp')) {
        const ok = countryOk && (!channel.value || card.dataset.channels.split(' ').includes(channel.value));
        card.hidden = !ok; if (ok) shown++;
      }
      g.hidden = shown === 0; n += shown;
    }
    count.textContent = count.dataset.tpl.replace('{n}', n);
    const q = new URLSearchParams();
    if (country.value) q.set('country', country.value);
    if (channel.value) q.set('channel', channel.value);
    history.replaceState(null, '', q.size ? `?${q}` : location.pathname);
  };
  form.addEventListener('change', apply);
  form.addEventListener('submit', (e) => e.preventDefault());
  apply();
}
