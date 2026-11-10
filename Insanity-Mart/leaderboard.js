window.InsanityLeaderboard = (() => {
  let pending = null;
  const config = () => window.INSANITY_LEADERBOARD || {};
  async function request(path, options = {}) {
    const {url, publicKey} = config();
    if (!url || !publicKey) throw new Error('Shared leaderboard is awaiting its online connection.');
    const response = await fetch(url.replace(/\/$/, '') + '/rest/v1/' + path, {
      ...options, headers: {apikey: publicKey, 'Content-Type': 'application/json', ...options.headers},
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error('The leaderboard is unavailable. Please try again.');
    return response.status === 204 ? null : response.json();
  }
  function mount(panel, result) {
    // A retry without newly earned points must not create duplicate submissions.
    if (!pending || pending.score !== result.score) pending = {...result, id: crypto.randomUUID(), saved: false};
    else if (!pending.saved) pending.level = Math.max(pending.level, result.level);
    const entry = pending;
    const section = document.createElement('section');
    section.id = 'leaderboard';
    section.innerHTML = '<h3>SHARED LEADERBOARD</h3><form><label for="initials">Your initials (1–3 letters)</label> <input id="initials" name="initials" maxlength="3" pattern="[A-Za-z]{1,3}" autocomplete="off" required aria-label="Your initials"><button id="save-score" type="submit">SAVE SCORE</button></form><p id="score-status" role="status"></p><table><caption>Top 10 · score, then level reached</caption><thead><tr><th scope="col">Rank</th><th scope="col">Initials</th><th scope="col">Score</th><th scope="col">Level</th></tr></thead><tbody></tbody></table>';
    panel.append(section);
    const form = section.querySelector('form'), input = section.querySelector('input');
    const button = section.querySelector('button'), status = section.querySelector('[role=status]');
    input.addEventListener('input', () => {input.value = input.value.replace(/[^a-z]/gi,'').toUpperCase();});
    const ready = !!(config().url && config().publicKey);
    button.disabled = !ready || entry.saved || entry.score === 0;
    async function refresh() {
      const rows = await request('insanity_scores?select=initials,score,level&order=score.desc,level.desc,created_at.asc&limit=10');
      const body = section.querySelector('tbody');
      body.replaceChildren();
      rows.forEach((row, index) => {
        const tr = document.createElement('tr');
        [index + 1, row.initials, row.score, row.level].forEach(value => {
          const td = document.createElement('td'); td.textContent = value; tr.append(td);
        });
        body.append(tr);
      });
      if (!rows.length) status.textContent = 'No scores yet. Be the first!';
    }
    form.onsubmit = async event => {
      event.preventDefault();
      if (entry.saved || !/^[A-Z]{1,3}$/.test(input.value) || entry.score <= 0) return;
      button.disabled = true;
      status.textContent = 'Saving…';
      try {
        await request('insanity_scores?on_conflict=id', {method:'POST', headers:{Prefer:'resolution=ignore-duplicates,return=minimal'}, body:JSON.stringify({id:entry.id,initials:input.value,score:entry.score,level:entry.level})});
        entry.saved = true;
        status.textContent = 'Score saved!';
        try {await refresh();} catch {status.textContent = 'Score saved. Rankings could not refresh; try again later.';}
      } catch (error) {status.textContent = error.message; button.disabled = false;}
    };
    refresh().catch(error => {status.textContent = error.message;});
  }
  return {mount};
})();
