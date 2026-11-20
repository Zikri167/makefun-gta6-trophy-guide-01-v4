// Leonida Legend — guide-first tracker for the 55 official GTA VI trophies.
// The guide is the product: every trophy card opens a full guide with steps,
// a missable verdict and named sources. The checklist is a thin layer on top:
// earned ticks and per-trophy counters, saved in localStorage, exportable.
const STORAGE_KEY = 'leonida-legend-progress-v1';

const doc = await (await fetch('data/trophies.json')).json();
const TROPHIES = doc.trophies;
const byName = new Map(TROPHIES.map((t) => [t.name, t]));

const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
const state = {
  earned: new Set(saved.earned ?? []),
  counts: new Map(Object.entries(saved.counts ?? {})),
  spoiler: saved.spoiler ?? false,
  kind: 'all',
  grade: 'all',
  query: '',
  hideEarned: false,
  selected: null,
};

const $ = (id) => document.getElementById(id);
const listEl = $('trophy-list');
const detailEl = $('detail-pane');

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    earned: [...state.earned],
    counts: Object.fromEntries(state.counts),
    spoiler: state.spoiler,
  }));
}

function isSpoilerHidden(t) {
  return state.spoiler && t.kinds.includes('story') && !state.earned.has(t.name);
}

function kindMatches(t) {
  if (state.kind === 'all') return true;
  if (state.kind === 'missable') return t.missable !== 'no';
  return t.kinds.includes(state.kind);
}

function visibleTrophies() {
  const q = state.query.trim().toLowerCase();
  return TROPHIES.filter((t) => {
    if (!kindMatches(t)) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.hideEarned && state.earned.has(t.name)) return false;
    if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function missableBadge(t) {
  const label = t.missable === 'likely' ? 'Missable: likely' : t.missable === 'possible' ? 'Missable: possible' : 'Not missable';
  return `<span class="badge badge-${t.missable}">${label}</span>`;
}

function renderProgress() {
  const n = state.earned.size;
  $('progress-count').textContent = `${n} of ${TROPHIES.length} earned`;
  $('progress-fill').style.width = `${(n / TROPHIES.length) * 100}%`;
  const tally = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const name of state.earned) {
    const t = byName.get(name);
    if (t) tally[t.grade] += 1;
  }
  $('grade-tally').textContent =
    `Platinum ${tally.platinum}/1 · Gold ${tally.gold}/2 · Silver ${tally.silver}/6 · Bronze ${tally.bronze}/46`;
}

function renderList() {
  const rows = visibleTrophies();
  $('list-summary').textContent =
    `Showing ${rows.length} of ${TROPHIES.length} trophies` +
    (state.spoiler ? ' · spoiler shield on: unearned story trophies are masked' : '');
  listEl.replaceChildren();
  for (const t of rows) {
    const hidden = isSpoilerHidden(t);
    const earned = state.earned.has(t.name);
    const card = document.createElement('div');
    card.className = 'card' + (earned ? ' earned' : '') + (state.selected === t.name ? ' selected' : '');
    card.setAttribute('role', 'button');
    card.tabIndex = 0;

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned;
    box.title = `Mark ${t.name} earned`;
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) state.earned.add(t.name);
      else state.earned.delete(t.name);
      persist();
      renderAll();
    });

    const dot = document.createElement('span');
    dot.className = `grade-dot grade-${t.grade}`;

    const text = document.createElement('span');
    const count = state.counts.get(t.name) ?? 0;
    text.innerHTML =
      `<span class="card-name">${hidden ? 'Hidden story trophy' : t.name}</span>` +
      `<span class="card-desc">${hidden ? 'Name and description hidden by the spoiler shield until earned.' : t.description}</span>` +
      (t.target && count > 0 ? `<span class="count-chip">${count} / ${t.target} ${t.targetLabel ?? ''}</span>` : '');

    const meta = document.createElement('span');
    meta.className = 'card-meta';
    meta.innerHTML = missableBadge(t) + `<span class="badge badge-stage">Stage ${t.stage}</span>`;

    card.append(box, dot, text, meta);
    card.addEventListener('click', () => { state.selected = t.name; renderList(); renderDetail(); });
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') { state.selected = t.name; renderList(); renderDetail(); } });
    listEl.append(card);
  }
}

function renderDetail() {
  const t = byName.get(state.selected) ?? TROPHIES[24]; // Strangers & Freaks: the guide's centrepiece warning
  state.selected = t.name;
  const hidden = isSpoilerHidden(t);
  const earned = state.earned.has(t.name);
  const count = state.counts.get(t.name) ?? 0;
  const sources = t.sources.map((s) =>
    `<li>${s.url ? `<a href="${s.url}">${s.label}</a>` : s.label}</li>`).join('');
  const steps = t.steps.map((s) => `<li>${s}</li>`).join('');
  detailEl.innerHTML = `
    <h2>${hidden ? 'Hidden story trophy' : t.name}</h2>
    <p><span class="detail-grade" style="color: var(--${t.grade})">${t.grade}</span>
       · Roadmap stage ${t.stage} · ${missableBadge(t)}</p>
    <p class="detail-desc">“${hidden ? 'Description hidden by the spoiler shield until this trophy is earned.' : t.description}”</p>
    ${hidden ? '<p>Turn the spoiler shield off, or mark the trophy earned, to read its guide.</p>' : `
    <h3>The guide</h3>
    <p>${t.guide}</p>
    <h3>Steps</h3>
    <ol>${steps}</ol>
    ${t.target ? `
    <h3>Progress — ${t.targetLabel}</h3>
    <div class="counter-row">
      <button type="button" id="count-down" aria-label="Decrease count">−</button>
      <span class="counter-value">${count} / ${t.target}</span>
      <button type="button" id="count-up" aria-label="Increase count">+</button>
    </div>` : ''}
    <h3>When it can be missed</h3>
    <p>${t.missableNote}</p>
    <h3>Sources</h3>
    <ul class="sources-list">${sources}</ul>`}
    <label class="earned-row"><input type="checkbox" id="detail-earned" ${earned ? 'checked' : ''}> Earned — tick it off</label>`;
  const detailBox = $('detail-earned');
  detailBox.addEventListener('change', () => {
    if (detailBox.checked) state.earned.add(t.name);
    else state.earned.delete(t.name);
    persist();
    renderAll();
  });
  if (t.target && !hidden) {
    $('count-down').addEventListener('click', () => {
      state.counts.set(t.name, Math.max(0, (state.counts.get(t.name) ?? 0) - 1));
      persist(); renderDetail(); renderList();
    });
    $('count-up').addEventListener('click', () => {
      state.counts.set(t.name, Math.min(t.target, (state.counts.get(t.name) ?? 0) + 1));
      persist(); renderDetail(); renderList();
    });
  }
}

// --- Roadmap -------------------------------------------------------------
// Stages, difficulty and time are this guide's own analysis, built from the
// official descriptions alone (the method the Missables view explains).
const STAGES = [
  {
    n: 1, title: 'Story Playthrough',
    goal: 'Play the story once, in order, and treat it as the only chance for one-off content: complete every named mission as it is offered, start every stranger strand the moment you meet its owner, finish the five character finales (Andy, Kenton, Billy, Randy, Tyrone) before the endgame, and keep a rolling manual save before chapters end and choices land. The partner trophies and the free-roam crimes that sit naturally in this stretch are banked here too.',
  },
  {
    n: 2, title: 'Stranger & Cleanup Sweep',
    goal: 'Straight after the credits, close what the story left open: bring Strangers & Freaks to its 8 completed strands, meditate at every spot, and run Bret\'s unique-animal hunt. Anything story-locked that survived the credits is finished now, before the long grinds begin.',
  },
  {
    n: 3, title: 'Collectibles & Discovery',
    goal: 'A map sweep in regions: complete 3 Collectible Card sets, WAiNK It at all 100 locations, and discover 100 vehicles. Fixed-location content rewards system over speed — one region finished beats five regions started.',
  },
  {
    n: 4, title: 'Activities, Mastery & Money',
    goal: 'The long tail: 250 stunts, gold in all 42 Shooting Range challenges, a Top Fun win at every location, 20 different race wins, 50 challenges, and the economy totals — $250,000 laundered, $100,000 spent, every garage bought, 10 vehicles registered — finishing with the full exploration of Leonida.',
  },
  {
    n: 5, title: '100% & the Platinum',
    goal: 'Attain 100% Completion (A Long Road) by hunting the last percent on the in-game checklist; the platinum, Vice Got a Price!, unlocks with the 54th other trophy.',
  },
];

function renderRoadmap() {
  const el = $('roadmap');
  const likely = TROPHIES.filter((t) => t.missable === 'likely').length;
  const possible = TROPHIES.filter((t) => t.missable === 'possible').length;
  let html = `
    <div class="roadmap-head">
      <h2>Roadmap to the Platinum</h2>
      <p>One story playthrough, then a sweep, then the grind. The order below is built from the official descriptions: what they make one-off goes first, what they make repeatable goes last.</p>
      <div class="roadmap-stats">
        <span>Difficulty <strong>5.5 / 10</strong></span>
        <span>Time to platinum <strong>75–95 hours</strong></span>
        <span>Missables <strong>${likely} likely · ${possible} possible</strong></span>
        <span>Difficulty trophies <strong>none</strong> (no hard-mode or all-gold-missions trophy exists)</span>
      </div>
      <p>Why 5.5/10: the skill ceiling is The Shootist's 42 range golds and Gunslinger's five-in-one-Focus; everything else is volume (250 stunts, 100 WAiNK spots) or money. The real difficulty is organisational — two trophies are rated Likely missable, and both are beaten by the Stage 1 habits, not by reflexes.</p>
    </div>`;
  for (const s of STAGES) {
    const members = TROPHIES.filter((t) => t.stage === s.n);
    const chips = members.map((t) =>
      `<button type="button" class="stage-chip${state.earned.has(t.name) ? ' done' : ''}" data-jump="${t.name}">
         <span class="grade-dot grade-${t.grade}"></span>${t.name}</button>`).join('');
    const doneCount = members.filter((t) => state.earned.has(t.name)).length;
    html += `
    <div class="stage">
      <h3>Stage ${s.n} — ${s.title} <span class="badge badge-stage">${doneCount}/${members.length} earned</span></h3>
      <p class="stage-goal">${s.goal}</p>
      <div class="stage-chips">${chips}</div>
    </div>`;
  }
  el.innerHTML = html;
  el.querySelectorAll('[data-jump]').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.selected = chip.getAttribute('data-jump');
      switchView('guide');
      renderList();
      renderDetail();
      detailEl.scrollIntoView({ block: 'start' });
    });
  });
}

// --- Missables -----------------------------------------------------------
function renderMissables() {
  const el = $('missables');
  const likely = TROPHIES.filter((t) => t.missable === 'likely');
  const possible = TROPHIES.filter((t) => t.missable === 'possible');
  const safe = TROPHIES.filter((t) => t.missable === 'no');
  const cardFor = (t) => `
    <div class="miss-card">
      <span class="card-name">${t.name}</span>
      <span class="badge badge-${t.missable}">${t.missable}</span>
      <span class="badge badge-stage">${t.grade} · Stage ${t.stage}</span>
      <p class="official">Official description: “${t.description}”</p>
      <p>${t.missableNote}</p>
    </div>`;
  el.innerHTML = `
    <div class="missables-head">
      <h2>Missables — read this before you play</h2>
      <p>Every verdict below is reasoned from the trophy's official description alone, because that is what can be checked: a description that names a single mission and promises no replay is a risk; a description that counts a repeatable thing is not. <strong>${likely.length} likely, ${possible.length} possible, ${safe.length} not missable.</strong> The two habits that defeat the whole list: start every stranger strand when you meet it, and keep a manual save before chapters end.</p>
    </div>
    <div class="miss-group"><h3>Likely missable — plan around these</h3>${likely.map(cardFor).join('')}</div>
    <div class="miss-group"><h3>Possible — cheap insurance exists</h3>${possible.map(cardFor).join('')}</div>
    <div class="miss-group"><h3>Not missable — grind at your leisure</h3>
      <p class="safe-names">${safe.map((t) => t.name).join(' · ')}</p>
    </div>`;
}

// --- Views, toolbar, export/import --------------------------------------
function switchView(name) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  for (const v of ['guide', 'roadmap', 'missables']) $('view-' + v).hidden = v !== name;
  if (name === 'roadmap') renderRoadmap();
  if (name === 'missables') renderMissables();
}

document.querySelectorAll('.tab').forEach((b) =>
  b.addEventListener('click', () => switchView(b.dataset.view)));

$('kind-chips').querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    state.kind = chip.dataset.kind;
    $('kind-chips').querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === chip));
    renderList();
  });
});
$('grade-filter').addEventListener('change', (e) => { state.grade = e.target.value; renderList(); });
$('search').addEventListener('input', (e) => { state.query = e.target.value; renderList(); });
$('hide-earned').addEventListener('change', (e) => { state.hideEarned = e.target.checked; renderList(); });
const spoilerToggle = $('spoiler-toggle');
spoilerToggle.checked = state.spoiler;
spoilerToggle.addEventListener('change', () => { state.spoiler = spoilerToggle.checked; persist(); renderList(); renderDetail(); });

$('export').addEventListener('click', () => {
  const payload = JSON.stringify({
    app: 'leonida-legend',
    earned: [...state.earned],
    counts: Object.fromEntries(state.counts),
    spoiler: state.spoiler,
  }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const data = JSON.parse(await file.text());
  const earnedList = Array.isArray(data) ? data : data.earned ?? [];
  state.earned = new Set(earnedList.filter((n) => byName.has(n)));
  state.counts = new Map(Object.entries(data.counts ?? {}).filter(([n]) => byName.has(n)));
  if (typeof data.spoiler === 'boolean') { state.spoiler = data.spoiler; spoilerToggle.checked = data.spoiler; }
  persist();
  renderAll();
});

// --- Next up ---------------------------------------------------------------
// One-glance answer to "what should I do next?": the earliest unearned trophy
// in roadmap order (stage first, then list order), with a jump to its guide.
function renderNextUp() {
  let el = $('next-up');
  if (!el) {
    el = document.createElement('div');
    el.id = 'next-up';
    el.className = 'next-up';
    $('view-guide').prepend(el);
  }
  const next = [...TROPHIES]
    .sort((a, b) => a.stage - b.stage || a.id - b.id)
    .find((t) => !state.earned.has(t.name));
  if (!next) {
    el.innerHTML = '<strong>Platinum earned.</strong> Every trophy is ticked — Vice City is yours, Legend.';
    return;
  }
  el.innerHTML =
    `<span><strong>Next up:</strong> ${next.name} ` +
    `<span class="badge badge-stage">Stage ${next.stage}</span> — ${next.description}</span>`;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Open its guide';
  btn.addEventListener('click', () => { state.selected = next.name; renderList(); renderDetail(); });
  el.append(btn);
}

function renderAll() {
  renderProgress();
  renderNextUp();
  renderList();
  renderDetail();
}

renderAll();
