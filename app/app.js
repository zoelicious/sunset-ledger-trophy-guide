// Sunset Ledger — tracker + guide for the 55 GTA VI trophies.
// Loads data/trophies.json (same origin, offline), keeps earned ticks in
// localStorage, and renders the dashboard, the per-category cards, the detail
// panel and the 8-phase roadmap. No network requests at run time.
const KEY = 'sunset-ledger-progress-v1';
const CIRC = 2 * Math.PI * 84;

const CATEGORY_ORDER = ['Platinum & 100%', 'Story', 'Side story', 'Activities', 'Collections', 'Crime & combat', 'Money & grind', 'One-off moments'];
const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };
const KIND_LABEL = { story: 'Story', side: 'Side story', activities: 'Activities', collectibles: 'Collectibles', crime: 'Crime & combat', money: 'Money & grind', misc: 'One-off moment', platinum: 'Platinum & 100%' };

// The platinum roadmap: 8 phases, built from the official descriptions and the
// cited guides (PowerPyx roadmap, OutputLag list). Phase 0 is the safety net:
// there is no mission replay and no New Game+, so manual saves are the plan.
const ROADMAP = [
  { phase: 0, title: 'Before you start', hours: '30 minutes', trophies: [], text: 'Do not use cheats on your trophy save — cheats disable trophies and saving. Make a manual save at the start of every chapter, plus one more before the final mission. Turn the spoiler setting on, so the 12 hidden story trophies stay hidden until you earn them. One playthrough is enough; everything is offline.' },
  { phase: 1, title: 'Story, Chapters 1–4', hours: '~60–80 hours', trophies: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], text: 'Play the story through. In every chapter, do the optional missions as they appear, meditate at EVERY meditation spot the moment you see one (above all the early Chapter 1 spot — the one missable), and scan vehicles and study animals with binoculars as you go: both count toward 100%. Pick up collectibles you pass.' },
  { phase: 2, title: 'Side stories & strangers', hours: '~15 hours', trophies: [22, 23, 24, 25, 26, 27, 29, 20], text: 'Finish the 8 stranger strands, the final mission for each contact (Andy, Kenton, Billy, Randy, Tyrone), Bret\'s hunting quests and Cal\'s fishing challenge. Side content has no expiry signal and stays available after the credits, so this phase can also run after the story — but do strands as they appear and they will not pile up.' },
  { phase: 3, title: 'Activities & sport', hours: '~15 hours', trophies: [15, 16, 17, 18, 19, 21, 46], text: 'Gold all 42 Shooting Range challenges, win a Top Fun drone race at all 14 locations, win 20 different races, finish one arcade game, bowl at Kolt & Associates\', and try all 9 activity types once. Shooting ranges and drone races must be complete in full for the 100% checklist.' },
  { phase: 4, title: 'Collections & exploration', hours: '~20 hours', trophies: [28, 30, 31, 35, 42], text: 'Meditate at any remaining spots (check 18/18), complete 3 card sets, check in with WAiNK at 100 locations, discover 100 vehicles and explore all 52 areas of Leonida. These three counters climb together if you explore methodically instead of fast-travelling past everything.' },
  { phase: 5, title: 'Crime & combat', hours: '~15 hours', trophies: [33, 34, 36, 37, 38, 39, 40, 41, 43], text: 'Lose a 4-star wanted level with your partner, rob 3 shops back-to-back on one wanted level, take down 5 enemies in one Combat Focus, rob a jewelry store unseen, rob 5 bank vaults, an armored truck and one illegal operation per gang (9), and make the unscheduled departure at VCIA. Robberies also feed the Marked Bills laundering in Phase 6.' },
  { phase: 6, title: 'Money & grind', hours: '~30 hours', trophies: [52, 53, 54, 55, 32, 48, 15], text: 'Launder $250,000 of Marked Bills through your contacts, spend $100,000 across all shops, buy all 8 garage properties, register 10 vehicles on the Scooter Bros app, complete 50 challenges and keep making choices toward 500. The long counters (stunts, choices) should be nearly done by now if you played actively from the start.' },
  { phase: 7, title: 'Cleanup & platinum', hours: '~10 hours', trophies: [14, 1, 44, 45, 49, 50, 51], text: 'Open Progress > Stats > 100% Completion and finish what is left — A Long Road (gold) is the last gate before the platinum pops. The five trophies labelled “Trigger not yet confirmed” sit here with honest labels: check a fresh published guide for their confirmed triggers rather than guessing.' },
];

const SOURCES = [
  ['Exophase — GTA VI trophy list (official 55, verified 55/55)', 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/'],
  ['PSNProfiles — GTA VI trophies (names, descriptions, PSN counters)', 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi'],
  ['PowerPyx — GTA 6 Trophy Guide & Roadmap (~200 hours, 4/10, missable flag)', 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/'],
  ['OutputLag — GTA 6 trophy list', 'https://outputlag.com/guides/gta-6-trophy-list/'],
  ['eGamers — GTA 6 trophy list & hardest trophies', 'https://egamers.io/gta-6-trophy-list-all-55-trophies-and-achievements-plus-the-hardest-ones/'],
  ['KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap', 'https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/'],
  ['GTA Zone — GTA 6 trophies & achievements', 'https://gta-zone.com/news/gta-6-trophies-achievements/'],
  ['U7BUY — GTA 6 trophies', 'https://www.u7buy.com/blog/gta-6-trophies/'],
  ['GTAViceCityHub — GTA VI achievements', 'https://www.gtavicecityhub.com/achievements'],
  ['HowToVideoGame — GTA 6 trophies', 'https://howtovideogame.com/gta-6-trophies/'],
  ['GTAVice.net — Trophies & achievements', 'https://www.gtavice.net/guides/trophies-and-achievements'],
  ['CryptoGames — GTA 6 trophies & 100% completion checklist', 'https://cryptogames.gg/gta-6-trophies-achievements-full-list/'],
  ['CryptoGames — GTA 6 100% completion checklist', 'https://cryptogames.gg/gta-6-100-completion-checklist/'],
  ['LeonidaHub — 55 PS5 trophies, platinum included', 'https://leonidahub.org/en/news/gta-vi-reportedly-has-55-ps5-trophies-platinum-included-as-xbox-and-playstation-data-line-up'],
];

let trophies = [];
let byId = new Map();
let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
let selectedId = 28;

const $ = (id) => document.getElementById(id);

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
}

function isEarned(t) { return earned.has(t.name); }

// A story trophy is masked while the spoiler setting is on and it is unearned.
function masked(t) { return t.hidden && $('spoiler').checked && !isEarned(t); }

function medal(t) {
  const s = document.createElement('span');
  s.className = 'medal ' + t.grade;
  s.textContent = GRADE_LETTER[t.grade];
  s.title = t.grade;
  return s;
}

function badge(text, cls) {
  const s = document.createElement('span');
  s.className = 'badge ' + cls;
  s.textContent = text;
  return s;
}

function renderDashboard() {
  const total = trophies.length;
  const n = earned.size;
  const pct = total ? Math.round((n / total) * 100) : 0;
  $('ringCount').textContent = n + '/' + total;
  $('ringPct').textContent = pct + '% to platinum';
  $('ringArc').style.strokeDashoffset = String(CIRC * (1 - n / total));
  $('dashLine').textContent = n + ' earned · ' + (total - n) + ' to go · platinum ' + pct + '% there';

  const gb = $('gradeBars');
  gb.replaceChildren();
  for (const g of GRADE_ORDER) {
    const list = trophies.filter((t) => t.grade === g);
    const got = list.filter(isEarned).length;
    const wrap = document.createElement('div');
    wrap.className = 'grade-bar ' + g;
    const lbl = document.createElement('div');
    lbl.className = 'lbl';
    const a = document.createElement('span'); a.textContent = g[0].toUpperCase() + g.slice(1);
    const b = document.createElement('span'); b.textContent = got + '/' + list.length;
    lbl.append(a, b);
    const track = document.createElement('div');
    track.className = 'track';
    const fill = document.createElement('div');
    fill.className = 'fill';
    fill.style.width = (list.length ? (got / list.length) * 100 : 0) + '%';
    track.append(fill);
    wrap.append(lbl, track);
    gb.append(wrap);
  }

  const cb = $('catBars');
  cb.replaceChildren();
  for (const c of CATEGORY_ORDER) {
    const list = trophies.filter((t) => t.category === c);
    const got = list.filter(isEarned).length;
    const row = document.createElement('div');
    row.className = 'cat-bar';
    const name = document.createElement('span'); name.textContent = c;
    const track = document.createElement('div');
    track.className = 'track';
    const fill = document.createElement('div');
    fill.className = 'fill';
    fill.style.width = (list.length ? (got / list.length) * 100 : 0) + '%';
    track.append(fill);
    const num = document.createElement('span');
    num.className = 'num'; num.textContent = got + '/' + list.length;
    row.append(name, track, num);
    cb.append(row);
  }
}

function matchesFilters(t) {
  const q = $('search').value.trim().toLowerCase();
  if (q) {
    const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.category).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  const kind = $('kind').value;
  if (kind === 'missable') { if (t.missable === 'none') return false; }
  else if (kind === 'online') { return false; }
  else if (kind !== 'all' && t.kind !== kind) { return false; }
  if ($('grade').value !== 'all' && t.grade !== $('grade').value) return false;
  if ($('category').value !== 'all' && t.category !== $('category').value) return false;
  if ($('earnedOnly').checked && !isEarned(t)) return false;
  if ($('notEarned').checked && isEarned(t)) return false;
  return true;
}

function renderList() {
  const groups = $('groups');
  groups.replaceChildren();
  const shown = trophies.filter(matchesFilters);
  if ($('kind').value === 'online') {
    const d = document.createElement('div');
    d.className = 'empty';
    d.innerHTML = '<strong>No online trophies.</strong> All 55 GTA VI trophies are offline, single-player — there is nothing to earn online. (Source: PowerPyx trophy guide &amp; roadmap.)';
    groups.append(d);
  } else if (shown.length === 0) {
    const d = document.createElement('div');
    d.className = 'empty';
    d.textContent = 'No trophies match these filters. Clear the search or widen the filters.';
    groups.append(d);
  }
  let totalShown = 0;
  for (const cat of CATEGORY_ORDER) {
    const list = shown.filter((t) => t.category === cat);
    if (!list.length) continue;
    totalShown += list.length;
    const h = document.createElement('h3');
    h.className = 'cat-head';
    const title = document.createElement('span'); title.textContent = cat;
    const cnt = document.createElement('span');
    cnt.className = 'cnt';
    cnt.textContent = list.filter(isEarned).length + '/' + trophies.filter((t) => t.category === cat).length + ' earned';
    h.append(title, cnt);
    groups.append(h);
    const grid = document.createElement('div');
    grid.className = 'cards';
    for (const t of list) grid.append(card(t));
    groups.append(grid);
  }
  const spoilerNote = $('spoiler').checked ? ' Spoilers on: story trophies stay hidden until earned.' : ' Spoilers off: every name and description is shown.';
  $('status').textContent = 'Showing ' + totalShown + ' of ' + trophies.length + ' trophies (' + earned.size + ' earned).' + spoilerNote;
}

function card(t) {
  const el = document.createElement('article');
  el.className = 'card' + (isEarned(t) ? ' earned' : '') + (t.id === selectedId ? ' selected' : '');
  el.tabIndex = 0;
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(t);
  box.setAttribute('aria-label', 'Earned: ' + t.name);
  box.addEventListener('click', (e) => {
    e.stopPropagation();
    if (box.checked) earned.add(t.name); else earned.delete(t.name);
    save(); renderAll();
  });
  const body = document.createElement('div');
  body.className = 'card-body';
  const h = document.createElement('h4');
  if (masked(t)) {
    h.textContent = 'Hidden story trophy';
  } else {
    h.textContent = t.name;
    if (isEarned(t)) {
      const d = document.createElement('span');
      d.className = 'done'; d.textContent = ' ✓ earned';
      h.append(d);
    }
  }
  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = masked(t) ? 'Hidden on PSN — earn it to reveal.' : t.description;
  body.append(h, desc);
  const badges = document.createElement('div');
  badges.className = 'badges';
  badges.append(badge(t.grade, 'grade-' + t.grade));
  badges.append(badge(KIND_LABEL[t.kind] || t.kind, ''));
  if (t.hidden) badges.append(badge('Hidden on PSN', 'hiddenb'));
  if (t.missable === 'strong') badges.append(badge('⚠ Missable', 'miss'));
  if (t.missable === 'watch') badges.append(badge('Do early', 'watch'));
  if (t.unconfirmed) badges.append(badge('Trigger not yet confirmed', 'unconf'));
  body.append(badges);
  if (t.target && !masked(t)) {
    const tl = document.createElement('div');
    tl.className = 'target-line';
    tl.textContent = 'PSN target: 0/' + t.target.total + (t.target.unit ? ' ' + t.target.unit : '') + ' ' + t.target.label;
    body.append(tl);
  }
  el.append(box, medal(t), body);
  const open = () => { selectedId = t.id; renderAll(); };
  el.addEventListener('click', open);
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  return el;
}

function renderDetail() {
  const d = $('detail');
  const t = byId.get(selectedId) || trophies[0];
  if (!t) { d.textContent = ''; return; }
  d.replaceChildren();
  const gl = document.createElement('div');
  gl.className = 'grade-line';
  gl.append(medal(t));
  gl.append(badge(t.grade, 'grade-' + t.grade));
  gl.append(badge(KIND_LABEL[t.kind] || t.kind, ''));
  if (t.missable === 'strong') gl.append(badge('⚠ Missable', 'miss'));
  if (t.unconfirmed) gl.append(badge('Trigger not yet confirmed', 'unconf'));
  d.append(gl);
  const h = document.createElement('h3');
  h.textContent = masked(t) ? 'Hidden story trophy' : t.name;
  d.append(h);
  const off = document.createElement('p');
  off.className = 'official';
  off.textContent = masked(t) ? 'Hidden on PSN — earn it to reveal.' : 'Official description: “' + t.description + '”';
  d.append(off);
  if (t.target) {
    const tg = document.createElement('p');
    tg.className = 'target-line';
    tg.textContent = 'PSN target: 0/' + t.target.total + (t.target.unit ? ' ' + t.target.unit : '') + ' ' + t.target.label + '  ·  Category: ' + t.category;
    d.append(tg);
  }
  if (!masked(t)) {
    const gh = document.createElement('h5'); gh.textContent = 'Guide — in our own words';
    const gp = document.createElement('p'); gp.className = 'guide'; gp.textContent = t.guide;
    d.append(gh, gp);
    if (t.steps && t.steps.length) {
      const sh = document.createElement('h5'); sh.textContent = 'Steps';
      const ol = document.createElement('ol');
      for (const s of t.steps) {
        const li = document.createElement('li'); li.textContent = s; ol.append(li);
      }
      d.append(sh, ol);
    }
  }
  const mh = document.createElement('h5'); mh.textContent = 'Can it be missed?';
  const mb = document.createElement('div');
  const missCls = t.missable === 'strong' ? 'yes' : (t.unconfirmed ? 'unknown' : 'no');
  mb.className = 'miss-box ' + missCls;
  mb.textContent = masked(t) ? 'Hidden until earned.' : t.canItBeMissed;
  d.append(mh, mb);
  if (!masked(t)) {
    const sh = document.createElement('h5'); sh.textContent = 'Sources';
    const ul = document.createElement('ul');
    ul.className = 'sources';
    for (const s of t.sources) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = s.url; a.textContent = s.name; a.target = '_blank'; a.rel = 'noopener';
      li.append('↗ ', a);
      ul.append(li);
    }
    d.append(sh, ul);
  }
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'earn-btn' + (isEarned(t) ? ' earned' : '');
  btn.textContent = isEarned(t) ? '✓ Earned — click to unmark' : 'Mark as earned';
  btn.addEventListener('click', () => {
    if (isEarned(t)) earned.delete(t.name); else earned.add(t.name);
    save(); renderAll();
  });
  d.append(btn);
}

function renderRoadmap() {
  const tl = $('timeline');
  tl.replaceChildren();
  for (const ph of ROADMAP) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    const tag = document.createElement('span');
    tag.className = 'ph'; tag.textContent = 'Phase ' + ph.phase;
    h.append(tag, document.createTextNode(ph.title));
    const hrs = document.createElement('div');
    hrs.className = 'hours'; hrs.textContent = ph.hours;
    const p = document.createElement('p'); p.textContent = ph.text;
    li.append(h, hrs, p);
    if (ph.trophies.length) {
      const done = ph.trophies.filter((id) => isEarned(byId.get(id))).length;
      const prog = document.createElement('div');
      prog.className = 'phase-prog';
      prog.textContent = done + '/' + ph.trophies.length + ' trophies in this phase earned';
      li.append(prog);
      const chips = document.createElement('div');
      chips.className = 'tchips';
      for (const id of ph.trophies) {
        const tr = byId.get(id);
        if (!tr) continue;
        const c = document.createElement('span');
        c.className = 'tchip' + (isEarned(tr) ? ' done' : '');
        c.textContent = (isEarned(tr) ? '✓ ' : '') + tr.name;
        chips.append(c);
      }
      li.append(chips);
    }
    tl.append(li);
  }
}

function renderSources() {
  const ul = $('srcList');
  ul.replaceChildren();
  for (const [name, url] of SOURCES) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = url; a.textContent = name; a.target = '_blank'; a.rel = 'noopener';
    li.append(a);
    ul.append(li);
  }
}

function renderAll() {
  renderDashboard();
  renderList();
  renderDetail();
  renderRoadmap();
}

function showView(name) {
  for (const v of ['tracker', 'roadmap', 'sources']) {
    $('view-' + v).hidden = v !== name;
    $('tab-' + v).classList.toggle('active', v === name);
  }
  if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
}

function initTabs() {
  for (const b of document.querySelectorAll('.tab')) {
    b.addEventListener('click', () => showView(b.dataset.view));
  }
  const hash = (location.hash || '#tracker').slice(1);
  showView(['tracker', 'roadmap', 'sources'].includes(hash) ? hash : 'tracker');
}

function initControls() {
  for (const id of ['search', 'kind', 'grade', 'category', 'earnedOnly', 'notEarned', 'spoiler']) {
    $(id).addEventListener('input', renderList);
    $(id).addEventListener('change', renderList);
  }
  $('spoiler').addEventListener('change', renderAll);
  const catSel = $('category');
  for (const c of CATEGORY_ORDER) {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    catSel.append(o);
  }
  $('export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned] }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sunset-ledger-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const names = Array.isArray(data) ? data : data.earned;
      earned = new Set(names.filter((n) => trophies.some((t) => t.name === n)));
      save(); renderAll();
    } catch {
      alert('That file is not a valid Sunset Ledger progress export.');
    }
    e.target.value = '';
  });
  $('reset').addEventListener('click', () => {
    if (confirm('Clear all earned ticks?')) { earned = new Set(); save(); renderAll(); }
  });
  $('bannerOpen').addEventListener('click', () => {
    selectedId = 28;
    showView('tracker');
    renderAll();
    $('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

const doc = await (await fetch('data/trophies.json')).json();
trophies = doc.trophies;
byId = new Map(trophies.map((t) => [t.id, t]));
initControls();
initTabs();
renderSources();
renderAll();
