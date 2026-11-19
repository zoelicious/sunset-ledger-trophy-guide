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
  { phase: 7, title: 'Cleanup & platinum', hours: '~10 hours', trophies: [14, 1, 44, 45, 47, 49, 50, 51], text: 'Open Progress > Stats > 100% Completion and finish what is left — A Long Road (gold) is the last gate before the platinum pops. The five trophies labelled “Trigger not yet confirmed” sit here with honest labels: check a fresh published guide for their confirmed triggers rather than guessing.' },
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

// Standard PSN points per grade (Bronze 15, Silver 30, Gold 90, Platinum
// 180). All 55 trophies: 1x180 + 2x90 + 6x30 + 46x15 = 1,230 pts.
const PSN_POINTS = { platinum: 180, gold: 90, silver: 30, bronze: 15 };
const PSN_TOTAL = 1230;

// Per-trophy target counters (e.g. meditation spots 0/18), kept apart from
// the earned ticks so a counter never marks a trophy earned by itself.
const COUNTERS_KEY = 'sunset-ledger-counters-v1';
let counters = new Map(JSON.parse(localStorage.getItem(COUNTERS_KEY) ?? '[]'));

function saveCounters() {
  localStorage.setItem(COUNTERS_KEY, JSON.stringify([...counters]));
  const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const el = $('slimSaved');
  if (el) el.textContent = '✓ Saved in this browser · ' + stamp;
}

// Story chapter per trophy, only where the research verifies it (ids 2-7:
// research §2 table). Every other trophy is done in free roam after the
// story, per the cited guides — no chapter is invented for them.
const STORY_CHAPTER = { 2: 'Chapter 1', 3: 'Chapter 1', 4: 'Chapter 2', 5: 'Chapter 3', 6: 'Chapter 4', 7: 'Final mission' };

// Extra verified launch guides used to fill a detail panel up to 3 linked
// sources (a trophy's own sources come first; these never replace them).
const FILL_SOURCES = [
  ['KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap', 'https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/'],
  ['OutputLag — GTA 6 trophy list', 'https://outputlag.com/guides/gta-6-trophy-list/'],
  ['PowerPyx — GTA 6 Trophy Guide & Roadmap', 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/'],
  ['Exophase — GTA VI trophy list', 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/'],
  ['PSNProfiles — GTA VI trophies', 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi'],
];

const $ = (id) => document.getElementById(id);

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
  const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const el = $('slimSaved');
  if (el) el.textContent = '✓ Saved in this browser · ' + stamp;
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
  updateSlimbar(n, total, pct);
}

// The slim sticky bar: progress that stays visible once the sunset band has
// scrolled away. Grade chips, spoiler toggle with a live count, save stamp.
function updateSlimbar(n, total, pct) {
  $('slimCount').textContent = n + '/' + total + ' · ' + pct + '%';
  const sg = $('slimGrades');
  sg.replaceChildren();
  for (const g of GRADE_ORDER) {
    const list = trophies.filter((t) => t.grade === g);
    const got = list.filter(isEarned).length;
    const c = document.createElement('span');
    c.className = 'slim-chip ' + g;
    c.textContent = GRADE_LETTER[g] + ' ' + got + '/' + list.length;
    sg.append(c);
  }
  const maskedCount = trophies.filter((t) => t.hidden && $('spoiler').checked && !isEarned(t)).length;
  $('slimSpoiler').textContent = $('spoiler').checked
    ? 'Spoilers hidden · ' + maskedCount
    : 'Spoilers shown';
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

// Roadmap phase a trophy belongs to (its stage). A trophy listed in two
// phases (Cunning Stunts) takes the first; anything unlisted falls to the
// cleanup phase, so Roadmap order always shows all 55.
function stageOf(t) {
  for (const ph of ROADMAP) if (ph.trophies.includes(t.id)) return ph;
  return ROADMAP[7];
}

function groupHeader(title, gotCount, totalCount) {
  const h = document.createElement('h3');
  h.className = 'cat-head';
  const titleEl = document.createElement('span'); titleEl.textContent = title;
  const cnt = document.createElement('span');
  cnt.className = 'cnt';
  cnt.textContent = gotCount + '/' + totalCount + ' earned';
  h.append(titleEl, cnt);
  return h;
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
  const mkGrid = (list) => {
    const grid = document.createElement('div');
    grid.className = 'cards';
    for (const t of list) grid.append(card(t));
    return grid;
  };
  if ($('order').value === 'roadmap') {
    // Roadmap order: group the same cards per roadmap stage, with progress
    // per stage, so the checklist follows the platinum route.
    for (const ph of ROADMAP) {
      const inPhase = trophies.filter((t) => stageOf(t) === ph);
      const list = shown.filter((t) => stageOf(t) === ph);
      if (!list.length) continue;
      totalShown += list.length;
      groups.append(groupHeader('Stage ' + ph.phase + ' · ' + ph.title, inPhase.filter(isEarned).length, inPhase.length));
      groups.append(mkGrid(list));
    }
  } else {
    for (const cat of CATEGORY_ORDER) {
      const list = shown.filter((t) => t.category === cat);
      if (!list.length) continue;
      totalShown += list.length;
      groups.append(groupHeader(cat, list.filter(isEarned).length, trophies.filter((t) => t.category === cat).length));
      groups.append(mkGrid(list));
    }
  }
  const spoilerNote = $('spoiler').checked ? ' Spoilers on: story trophies stay hidden until earned.' : ' Spoilers off: every name and description is shown.';
  const orderNote = $('order').value === 'roadmap' ? ' Order: Roadmap.' : ' Order: Category.';
  $('status').textContent = 'Showing ' + totalShown + ' of ' + trophies.length + ' trophies (' + earned.size + ' earned).' + spoilerNote + orderNote;
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
    const have = counters.get(t.id) ?? 0;
    tl.textContent = 'PSN target: ' + have + '/' + t.target.total + (t.target.unit ? ' ' + t.target.unit : '') + ' ' + t.target.label;
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
    const have = counters.get(t.id) ?? 0;
    tg.textContent = 'PSN target: ' + have + '/' + t.target.total + (t.target.unit ? ' ' + t.target.unit : '') + ' ' + t.target.label + '  ·  Category: ' + t.category;
    d.append(tg);
    if (!masked(t)) {
      // Interactive counter stepper: tap - / + to track progress toward the
      // PSN target. It never marks the trophy earned on its own.
      const step = document.createElement('div');
      step.className = 'stepper';
      const minus = document.createElement('button');
      minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', 'Decrease counter');
      minus.addEventListener('click', () => {
        counters.set(t.id, Math.max(0, (counters.get(t.id) ?? 0) - 1));
        saveCounters(); renderAll();
      });
      const val = document.createElement('strong');
      val.textContent = have + '/' + t.target.total;
      const plus = document.createElement('button');
      plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', 'Increase counter');
      plus.addEventListener('click', () => {
        counters.set(t.id, Math.min(t.target.total, (counters.get(t.id) ?? 0) + 1));
        saveCounters(); renderAll();
      });
      const cap = document.createElement('span');
      cap.textContent = t.target.label;
      step.append(minus, val, plus, cap);
      d.append(step);
    }
  }
  if (!masked(t)) {
    // Structured info boxes: where this trophy sits on the roadmap, and the
    // short where/how in our own words (first two sentences of the guide).
    const boxes = document.createElement('div');
    boxes.className = 'info-boxes';
    const ph = stageOf(t);
    const stageBox = document.createElement('div');
    stageBox.className = 'info-box';
    const stageH = document.createElement('h6'); stageH.textContent = 'Roadmap stage · Chapter';
    const stageP = document.createElement('p');
    stageP.textContent = 'Stage ' + ph.phase + ' · ' + ph.title + ' — ' + (STORY_CHAPTER[t.id] ?? 'Free roam');
    stageBox.append(stageH, stageP);
    const whereBox = document.createElement('div');
    whereBox.className = 'info-box';
    const whereH = document.createElement('h6'); whereH.textContent = 'Where / How';
    const whereP = document.createElement('p');
    whereP.textContent = t.guide.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
    whereBox.append(whereH, whereP);
    boxes.append(stageBox, whereBox);
    d.append(boxes);
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
    // Every trophy shows at least 3 linked sources, each with its retrieved
    // date. The trophy's own sources come first; the fill-ins are verified
    // launch guides from the same research, never a guessed URL.
    const shown = [...t.sources];
    for (const [name, url] of FILL_SOURCES) {
      if (shown.length >= 3) break;
      if (shown.some((s) => s.url === url)) continue;
      shown.push({ name, url });
    }
    for (const s of shown) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = s.url; a.textContent = s.name; a.target = '_blank'; a.rel = 'noopener';
      const when = document.createElement('span');
      when.className = 'retrieved';
      when.textContent = ' · retrieved 2026-11-19';
      li.append('↗ ', a, when);
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

// Progress & export tab: PSN points (standard formula), earned-by-grade and
// earned-by-kind bars, the roadmap stages as a mini-grid, and backup
// metadata (last export / import file, time, trophy count).
function barRow(label, got, total) {
  const row = document.createElement('div');
  row.className = 'stat-bar';
  const lbl = document.createElement('div');
  lbl.className = 'lbl';
  const a = document.createElement('span'); a.textContent = label;
  const b = document.createElement('span'); b.textContent = got + '/' + total;
  lbl.append(a, b);
  const track = document.createElement('div');
  track.className = 'track';
  const fill = document.createElement('div');
  fill.className = 'fill';
  fill.style.width = (total ? (got / total) * 100 : 0) + '%';
  track.append(fill);
  row.append(lbl, track);
  return row;
}

function renderProgress() {
  const pts = trophies.filter(isEarned).reduce((sum, t) => sum + (PSN_POINTS[t.grade] ?? 0), 0);
  const pct = Math.round((pts / PSN_TOTAL) * 100);
  $('psnStat').textContent = pts.toLocaleString('en-US') + ' / 1,230 pts · ' + pct + '%';

  const gs = $('gradeStats');
  gs.replaceChildren();
  for (const g of GRADE_ORDER) {
    const list = trophies.filter((t) => t.grade === g);
    gs.append(barRow(g[0].toUpperCase() + g.slice(1), list.filter(isEarned).length, list.length));
  }

  const ks = $('kindStats');
  ks.replaceChildren();
  for (const [kind, label] of Object.entries(KIND_LABEL)) {
    const list = trophies.filter((t) => t.kind === kind);
    if (list.length) ks.append(barRow(label, list.filter(isEarned).length, list.length));
  }

  const sg = $('stageGrid');
  sg.replaceChildren();
  for (const ph of ROADMAP) {
    const inPhase = trophies.filter((t) => stageOf(t) === ph);
    const got = inPhase.filter(isEarned).length;
    const cell = document.createElement('div');
    cell.className = 'stage-cell' + (got === inPhase.length && inPhase.length ? ' done' : '');
    const num = document.createElement('strong');
    num.textContent = 'Stage ' + ph.phase;
    const name = document.createElement('span');
    name.textContent = ph.title;
    const prog = document.createElement('span');
    prog.className = 'stage-prog';
    prog.textContent = inPhase.length ? got + '/' + inPhase.length : 'no trophies — setup only';
    cell.append(num, name, prog);
    sg.append(cell);
  }

  const meta = $('backupMeta');
  const exp = JSON.parse(localStorage.getItem('sunset-ledger-export-meta-v1') ?? 'null');
  const imp = JSON.parse(localStorage.getItem('sunset-ledger-import-meta-v1') ?? 'null');
  const lines = [];
  if (exp) lines.push('Last export ' + exp.file + ' · ' + exp.count + ' trophies · ' + exp.time + ' UTC');
  else lines.push('No export yet in this browser.');
  if (imp) lines.push('Last import ' + imp.file + ' · ' + imp.count + ' trophies · ' + imp.time + ' UTC');
  meta.textContent = lines.join(' — ');
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
  renderProgress();
}

function showView(name) {
  for (const v of ['tracker', 'roadmap', 'missables', 'progress', 'sources']) {
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
  showView(['tracker', 'roadmap', 'missables', 'progress', 'sources'].includes(hash) ? hash : 'tracker');
}

function initControls() {
  for (const id of ['search', 'kind', 'grade', 'category', 'order', 'earnedOnly', 'notEarned', 'spoiler']) {
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
  const doExport = () => {
    const stamp = new Date();
    const file = 'sunset-ledger-progress-' + stamp.toISOString().slice(0, 10) + '.json';
    const payload = {
      format: 'sunset-ledger-progress/v1',
      game: 'Grand Theft Auto VI',
      exportedAt: stamp.toISOString(),
      earned: [...earned],
      counters: Object.fromEntries(counters),
      spoilerHidden: $('spoiler').checked,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file;
    a.click();
    URL.revokeObjectURL(a.href);
    localStorage.setItem('sunset-ledger-export-meta-v1', JSON.stringify({
      file, count: earned.size,
      time: stamp.toISOString().slice(0, 16).replace('T', ' '),
    }));
    renderProgress();
  };
  const doImport = async (input) => {
    const file = input.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const names = Array.isArray(data) ? data : data.earned;
      earned = new Set(names.filter((n) => trophies.some((t) => t.name === n)));
      if (data && typeof data === 'object' && data.counters) {
        counters = new Map(Object.entries(data.counters).map(([k, v]) => [Number(k), v]));
        saveCounters();
      }
      if (data && typeof data === 'object' && typeof data.spoilerHidden === 'boolean') {
        $('spoiler').checked = data.spoilerHidden;
      }
      localStorage.setItem('sunset-ledger-import-meta-v1', JSON.stringify({
        file: file.name, count: earned.size,
        time: new Date().toISOString().slice(0, 16).replace('T', ' '),
      }));
      save(); renderAll();
    } catch {
      alert('That file is not a valid Sunset Ledger progress export.');
    }
    input.value = '';
  };
  $('export').addEventListener('click', doExport);
  $('export2').addEventListener('click', doExport);
  $('import').addEventListener('change', (e) => doImport(e.target));
  $('import2').addEventListener('change', (e) => doImport(e.target));
  $('reset').addEventListener('click', () => {
    if (confirm('Clear all earned ticks?')) { earned = new Set(); save(); renderAll(); }
  });
  $('bannerOpen').addEventListener('click', () => {
    showView('missables');
    window.scrollTo(0, 0);
  });
  // Slim-bar spoiler toggle mirrors the tracker checkbox.
  $('slimSpoiler').addEventListener('click', () => {
    $('spoiler').checked = !$('spoiler').checked;
    renderAll();
  });
  // Reveal the slim bar once the sunset band has scrolled away.
  const hero = document.querySelector('.hero');
  const onScroll = () => {
    $('slimbar').classList.toggle('show', window.scrollY > (hero?.offsetHeight ?? 170));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

const doc = await (await fetch('data/trophies.json')).json();
trophies = doc.trophies;
byId = new Map(trophies.map((t) => [t.id, t]));
initControls();
initTabs();
renderSources();
renderAll();
