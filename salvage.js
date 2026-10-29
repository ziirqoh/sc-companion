// SC Companion — Salvage Companion.
// Uses the shared data and helpers from app.js (data, sellByCommodity, terminalsById, fmt, esc, ...).

const SALVAGE_PREFS_KEY = 'sc-companion-salvage';
const RMC = 'Recycled Material Composite';
const CMAT = 'Construction Materials';

let salvageShips = null;      // salvage ships from the UEX vehicles list, loaded once
let salvageShipsLoading = false;
let svQty = loadSalvagePrefs().qty || null; // { commodityId: SCU }

function loadSalvagePrefs() {
  try { return JSON.parse(localStorage.getItem(SALVAGE_PREFS_KEY)) || {}; } catch { return {}; }
}

function saveSalvagePrefs() {
  try {
    localStorage.setItem(SALVAGE_PREFS_KEY, JSON.stringify({ qty: svQty, system: $('sv-system').value, age: $('sv-age').value }));
  } catch {}
}

// Salvage outputs you can sell: commodities of kind "Scrap" that some shop buys (RMC, Construction Materials, Scrap).
function salvageMaterials() {
  const order = (c) => (c.name === RMC ? 0 : c.name === CMAT ? 1 : 2);
  return data.commodities
    .filter((c) => c.kind === 'Scrap' && sellByCommodity.has(c.id))
    .sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
}

const shortName = (c) => (c.name === RMC ? 'RMC' : c.name === CMAT ? 'Construction Mat.' : c.name);

// ---------- ship data & guides ----------

// Salvage ships come with the data (shape.js keeps only salvage vehicles).
async function loadSalvageShips() {
  if (data?.vehicles?.length) {
    salvageShips = [...data.vehicles].sort((a, b) => (a.scu || 0) - (b.scu || 0));
    return;
  }
  if (salvageShips || salvageShipsLoading) return;
  salvageShipsLoading = true;
  try {
    const vehicles = await getApi('vehicles');
    salvageShips = vehicles
      .filter((v) => v.is_salvage && !/best in show/i.test(v.name_full))
      .sort((a, b) => (a.scu || 0) - (b.scu || 0));
  } catch {
    salvageShips = [];
  } finally {
    salvageShipsLoading = false;
    if (data) renderSalvage();
  }
}

// Written from the Star Citizen wiki (Alpha 4.10). Matched to UEX ships by name.
const SHIP_GUIDES = [
  {
    match: /salvation/i,
    size: 'Light',
    crew: 'Solo',
    fracture: 'Up to Freelancer size',
    facts: [
      'Two extendable salvage arms.',
      'An internal processor turns material straight into SCU crates and moves them to the 6 SCU cargo grid, so you never leave the pilot seat.',
      'Produces RMC and Rubble (raw construction material to refine).',
    ],
    steps: [
      'Quantum to the wreck and scan it: check the owner ("Gamerules" = abandoned) and that its shields are down.',
      'Switch to salvage mode (default <kbd>M</kbd>) and extend the arms.',
      'Sweep the hull with both beams. The processor crates the RMC into your grid on its own.',
      'For small wrecks (up to Freelancer size), fracture the stripped hull, then disintegrate the chunks for Rubble.',
      'At 6 SCU you\'re full: fly to the nearest sell point, sell the RMC, and refine the Rubble.',
    ],
    tips: ['It fills up fast, so pick wrecks close to a sell point.', 'The cheapest way to learn beams and fracturing.'],
  },
  {
    match: /fortune/i,
    size: 'Light',
    crew: 'Solo',
    fracture: null,
    facts: [
      'An automated external container dispenser holds up to twelve 1 SCU boxes.',
      'A rear elevator gives access to one extra 4 SCU cargo grid.',
      'Built for one player doing quick scraping runs.',
    ],
    steps: [
      'Fly to the wreck and scan it for owner and shields.',
      'Switch to salvage mode (default <kbd>M</kbd>) and scrape the hull.',
      'Material is packed into 1 SCU boxes on the external dispenser automatically.',
      'Use the rear elevator\'s 4 SCU grid for components or extra boxes.',
      'When the twelve boxes are full, go sell. 1 SCU boxes fit every terminal.',
    ],
    tips: ['1 SCU boxes are accepted everywhere, even small outposts.', 'Check in-game how big a wreck the Fortune can fracture in the current patch.'],
  },
  {
    match: /vulture/i,
    size: 'Light',
    crew: 'Solo',
    fracture: 'Up to Mercury Star Runner size',
    facts: [
      'The pilot seat runs both flight and salvage.',
      '13 SCU material buffer that empties into a 12 SCU cargo grid.',
      'Two scraper heads you can swap (Abrade, Cinch, Hart…). Has a tractor beam.',
    ],
    steps: [
      'Approach the wreck and scan it for owner, shields and power.',
      'Press <kbd>M</kbd> (default) for salvage mode. The arms unfold.',
      'Scrape with both heads, keeping them on bare plating. Widen or narrow the beam spacing to match the panels.',
      'The 13 SCU buffer packs into boxes on the 12 SCU grid. Keep the grid clear. If a box jams, step out and move it with a multi-tool or MaxLift tractor beam.',
      'Small wrecks: fracture, then disintegrate the chunks for Rubble.',
      'Return to sell RMC and refine the Rubble when the grid is full.',
    ],
    tips: ['The grid fills after a few small fractures, so scrape first and fracture last.', 'Cinch or Hart heads keep 100% of the material.'],
  },
  {
    match: /moth/i,
    size: 'Medium',
    crew: '1–4',
    fracture: 'Up to Origin 600i / Starfarer size',
    facts: [
      'Pilot-operated structural salvage arms.',
      'Three retractable turrets, each with a size 2 salvage laser, operated by crew.',
      'External filler stations: 64 SCU buffer and a 192 SCU external grid (twelve 8 SCU boxes per side).',
      'Structural salvage produces Pieces (medium refining time and yield).',
    ],
    steps: [
      'Crew up: a pilot plus up to three turret operators.',
      'The pilot parks alongside the wreck. The turret operators scrape the hull for RMC.',
      'Once the plating is bare, the pilot fractures the hull and disintegrates the chunks with the arms.',
      'The filler stations pack material into 8 SCU boxes on the external racks.',
      'Fly to a sell point that accepts 8 SCU boxes. Sell the RMC and refine the Pieces.',
    ],
    tips: ['Check the sell terminal\'s max box size: 8 SCU boxes don\'t fit everywhere.', 'It can work solo, but turrets make scraping much faster.'],
  },
  {
    match: /reclaimer/i,
    size: 'Heavy',
    crew: '3–5 recommended',
    fracture: 'Any size',
    facts: [
      '420 SCU of combined cargo capacity.',
      'A large claw that can fracture any vehicle.',
      'Two filler stations pack RMC and Construction Materials into 1, 2, 4, 8 and 16 SCU boxes.',
      'Controls, claw and scraper are on separate seats. Two cargo elevators reach the hold.',
      'Structural salvage produces Salvage (slowest refining, highest yield). Needs an XL landing pad.',
    ],
    steps: [
      'Assign roles: pilot, scraper operator, claw/tractor operator and a cargo manager.',
      'The pilot brings the Reclaimer alongside the wreck and holds position.',
      'The tractor operator pulls off components and cargo. The scraper operator strips the hull for RMC.',
      'The claw operator fractures the bare hull and disintegrates the chunks.',
      'The cargo manager runs the filler stations and stacks boxes in the hold.',
      'Land at an XL pad or station hangar, sell the RMC and components, and refine the Salvage material.',
    ],
    tips: ['Boxes bigger than 24 SCU are hard to move through the elevators. Stick to 16 SCU.', 'One Reclaimer run can be worth millions: protect it with an escort in risky space.'],
  },
];

const shipGuide = (v) => SHIP_GUIDES.find((g) => g.match.test(v.name_full || v.name));

// ---------- best prices ----------

function salvageFilters() {
  const system = $('sv-system').value;
  const maxAgeHours = Number($('sv-age').value) || null;
  const minDate = maxAgeHours ? Date.now() / 1000 - maxAgeHours * 3600 : 0;
  return (p) => p.date_modified >= minDate && (!system || terminalsById.get(p.id_terminal)?.star_system_name === system);
}

function bestSell(cid, keep = () => true) {
  return (sellByCommodity.get(cid) || []).find(keep) || null;
}

// ---------- rendering ----------

let salvageUiReady = false;

function initSalvageUi(materials) {
  const prefs = loadSalvagePrefs();
  if (!svQty) {
    svQty = {};
    for (const c of materials) svQty[c.id] = c.name === RMC ? 12 : 0;
  }
  $('sv-qty').innerHTML = materials.map((c) => `
    <label>${esc(shortName(c))} (SCU)
      <input type="number" min="0" step="1" data-material="${c.id}" value="${svQty[c.id] || 0}">
    </label>`).join('');

  const systems = [...new Set(data.terminals.map((t) => t.star_system_name).filter(Boolean))].sort();
  $('sv-system').innerHTML = '<option value="">All systems</option>' + systems.map((s) => `<option>${esc(s)}</option>`).join('');
  if (prefs.system && systems.includes(prefs.system)) $('sv-system').value = prefs.system;
  if (prefs.age != null && [...$('sv-age').options].some((o) => o.value === prefs.age)) $('sv-age').value = prefs.age;
  salvageUiReady = true;
}

function renderSalvage() {
  if (!data) return;
  loadSalvageShips();
  const materials = salvageMaterials();
  if (!salvageUiReady) initSalvageUi(materials);

  const keep = salvageFilters();
  renderSalvageSell(materials, keep);
  renderSalvageShips(keep);
  renderCrates(keep);
  renderSalvageHome(keep);
}

function renderSalvageSell(materials, keep) {
  const load = materials.filter((c) => svQty[c.id] > 0);

  // Ship buttons fill RMC with the ship's capacity.
  const rmc = materials.find((c) => c.name === RMC);
  $('sv-ship-buttons').innerHTML = (salvageShips || []).map((v) =>
    `<button class="chip" data-ship-scu="${v.scu}">${esc(v.name)} · ${fmt(v.scu)} SCU</button>`).join('') || '<span class="muted">loading ships…</span>';
  $('sv-ship-buttons').dataset.rmc = rmc?.id || '';

  const items = load.map((c) => ({ c, qty: svQty[c.id] }));
  const cards = materials.map((c) => ({ c, qty: svQty[c.id] || 0 }));
  renderSellAll(items, keep, { summary: 'sv-summary', table: 'sv-table', cards: 'sv-materials' }, cards, salvageNote);
  if (!load.length) $('sv-summary').innerHTML = '<div class="card">Enter how many SCU of each material you carry.</div>';
}

function renderSalvageShips(keep) {
  const box = $('sv-ships');
  if (!salvageShips) { box.innerHTML = '<div class="card empty">Loading salvage ships…</div>'; return; }
  if (!salvageShips.length) { box.innerHTML = '<div class="card empty">Couldn\'t load the ship list from UEX. Try ↻ Refresh.</div>'; return; }

  const rmc = data.commodities.find((c) => c.name === RMC);
  const bestRmc = rmc && bestSell(rmc.id, keep);

  box.innerHTML = salvageShips.map((v) => {
    const g = shipGuide(v) || { size: '', crew: v.crew || '—', fracture: null, facts: [], steps: [], tips: [] };
    const full = bestRmc && v.scu ? v.scu * bestRmc.price_sell : null;
    return `
      <div class="ship-card">
        ${v.url_photo ? `<img class="ship-photo" src="${esc(v.url_photo)}" alt="${esc(v.name_full)}" loading="lazy" onerror="this.remove()">` : ''}
        <div class="ship-body">
          <div class="ship-title">
            <h3>${esc(v.name_full)}</h3>
            ${g.size ? `<span class="badge">${g.size}</span>` : ''}
          </div>
          <div class="ship-stats">
            <div><div class="label">Cargo</div><div class="value">${fmt(v.scu)} SCU</div></div>
            <div><div class="label">Crew</div><div class="value">${esc(g.crew || v.crew || '—')}</div></div>
            <div><div class="label">Pad</div><div class="value">${esc(v.pad_type || '—')}</div></div>
            <div><div class="label">Fractures</div><div class="value small">${esc(g.fracture || 'check in-game')}</div></div>
          </div>
          ${full ? `<div class="feature-live"><span class="label">A full hold of RMC is worth about</span> <span class="good"><b>${fmt(full)} aUEC</b></span> <span class="sub">at ${esc(terminalName(terminalsById.get(bestRmc.id_terminal)) || bestRmc.terminal_name)}</span></div>` : ''}
          <ul class="facts">${g.facts.map((f) => `<li>${f}</li>`).join('')}</ul>
          ${g.steps.length ? `
          <details class="how-to">
            <summary>How to salvage with the ${esc(v.name)}</summary>
            <ol class="steps">${g.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
            ${g.tips.length ? `<div class="tips">${g.tips.map((t) => `<div>💡 ${t}</div>`).join('')}</div>` : ''}
          </details>` : ''}
          ${v.url_store ? `<a class="sub" href="${esc(v.url_store)}" target="_blank" rel="noopener">Official ship page ↗</a>` : ''}
        </div>
      </div>`;
  }).join('');
}

function renderSalvageHome(keep) {
  const parts = [];
  for (const name of [RMC, CMAT]) {
    const c = data.commodities.find((x) => x.name === name);
    const best = c && bestSell(c.id, keep);
    if (best) parts.push(`${esc(shortName(c))} up to <span class="good">${fmt(best.price_sell)}</span> at ${esc(terminalName(terminalsById.get(best.id_terminal)) || best.terminal_name)}`);
  }
  $('home-salvage-sell').innerHTML = parts.length ? `<span class="label">Best prices now:</span> ${parts.join(' · ')}` : '';

  const rmc = data.commodities.find((c) => c.name === RMC);
  const bestRmc = rmc && bestSell(rmc.id, keep);
  const biggest = (salvageShips || []).reduce((a, v) => (!a || v.scu > a.scu ? v : a), null);
  $('home-salvage-ships').innerHTML = salvageShips
    ? `<span class="label">${salvageShips.length} ships.</span>${biggest && bestRmc ? ` A full ${esc(biggest.name)} of RMC ≈ <span class="good">${fmt(biggest.scu * bestRmc.price_sell)} aUEC</span>` : ''}`
    : '';
}

// ---------- Selling a mixed load: shared by Sell Salvage and Cargo Crates ----------

// What each item sells for at a shop, counting how much the shop will actually take.
const sellValue = (p, qty) => p.price_sell * (p.scu_sell > 0 ? Math.min(qty, p.scu_sell) : qty);

function salvageNote(c) {
  if (c.name === RMC) return 'From hull scraping. Sell as is.';
  if (c.name === CMAT) return 'From structural salvage, after refining.';
  return c.kind === 'Scrap' ? 'Sold and bought at shops like a trade good.' : esc(c.kind || '');
}

// items: [{ c, qty }] with qty > 0 → summary cards, "sell everything" table, and one card per entry of cardItems.
function renderSellAll(items, keep, ids, cardItems, note) {
  const totalScu = items.reduce((s, x) => s + x.qty, 0);

  // Every terminal that buys at least one thing you carry, and what your load is worth there.
  const shops = new Map();
  for (const { c } of items) {
    for (const p of sellByCommodity.get(c.id) || []) {
      if (!keep(p)) continue;
      if (!shops.has(p.id_terminal)) shops.set(p.id_terminal, { t: terminalsById.get(p.id_terminal), rows: new Map() });
      shops.get(p.id_terminal).rows.set(c.id, p);
    }
  }
  const stops = [...shops.values()].map((shop) => {
    let total = 0;
    const limited = [];
    for (const { c, qty } of items) {
      const p = shop.rows.get(c.id);
      if (!p) continue;
      const scu = p.scu_sell > 0 ? Math.min(qty, p.scu_sell) : qty;
      if (scu < qty) limited.push(`${esc(shortName(c))}: only ${fmt(scu)} SCU`);
      total += scu * p.price_sell;
    }
    const missing = items.filter(({ c }) => !shop.rows.has(c.id)).map((x) => x.c);
    const oldest = Math.min(...[...shop.rows.values()].map((p) => p.date_modified));
    return { ...shop, total, missing, limited, oldest };
  }).sort((a, b) => (a.missing.length === 0) !== (b.missing.length === 0) ? (a.missing.length === 0 ? -1 : 1) : b.total - a.total);
  // Places that buy everything you carry, so you only make one stop.
  const full = stops.filter((s) => !s.missing.length);

  // Selling each item where it's worth the most.
  const perItem = items.map(({ c, qty }) => {
    const best = (sellByCommodity.get(c.id) || []).filter(keep).reduce((a, p) => (!a || sellValue(p, qty) > sellValue(a, qty) ? p : a), null);
    return { c, best, value: best ? sellValue(best, qty) : 0 };
  });
  const splitTotal = perItem.reduce((s, x) => s + x.value, 0);
  const splitStops = new Set(perItem.filter((x) => x.best).map((x) => x.best.id_terminal)).size;
  const top = stops[0];
  const shopName = (s) => esc(terminalName(s.t) || [...s.rows.values()][0].terminal_name);
  const priceList = (s) => items.map(({ c }) => s.rows.get(c.id) ? `${esc(shortName(c))} ${fmt(s.rows.get(c.id).price_sell)}` : null).filter(Boolean).join(' · ');

  // When no single place buys everything, the best pair of places that does.
  let pair = null;
  if (items.length > 1 && !full.length) {
    const candidates = stops.slice(0, 80);
    const valueAt = (s, c, qty) => (s.rows.get(c.id) ? sellValue(s.rows.get(c.id), qty) : 0);
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i], b = candidates[j];
        if (!items.every(({ c }) => a.rows.has(c.id) || b.rows.has(c.id))) continue;
        const total = items.reduce((sum, { c, qty }) => sum + Math.max(valueAt(a, c, qty), valueAt(b, c, qty)), 0);
        if (!pair || total > pair.total) {
          const at = (s) => items.filter(({ c, qty }) => valueAt(s, c, qty) > 0 && valueAt(s, c, qty) >= valueAt(s === a ? b : a, c, qty)).map(({ c }) => esc(shortName(c)));
          pair = { a, b, total, sellAtA: at(a), sellAtB: at(b) };
        }
      }
    }
  }

  let oneStopCard = '';
  if (items.length === 1 && top) {
    oneStopCard = `<div class="card highlight"><div class="label">Best place to sell</div><div class="value">${shopName(top)}</div><div class="sub"><span class="good">${fmt(top.total)} aUEC</span> · ${esc(terminalPlace(top.t))}</div></div>`;
  } else if (full.length) {
    const f = full[0];
    const gap = splitTotal - f.total;
    oneStopCard = `
      <div class="card highlight one-stop">
        <div class="label">✓ Sell everything in one stop</div>
        <div class="value">${shopName(f)}</div>
        <div class="sub">${esc(terminalPlace(f.t))}${f.t?.max_container_size ? ` · max box ${f.t.max_container_size} SCU` : ''}</div>
        <div class="big good">${fmt(f.total)} aUEC</div>
        <div class="sub">${priceList(f)} per SCU</div>
        <div class="sub">${gap > 0 ? `Only ${fmt(gap)} aUEC (${((gap / splitTotal) * 100).toFixed(1)}%) less than going to ${splitStops} separate places.` : 'Same as the best price for every item: no reason to go anywhere else.'}${f.limited.length ? ` <span class="warn">${f.limited.join(' · ')}</span>` : ''}</div>
      </div>`;
  } else if (pair) {
    oneStopCard = `
      <div class="card highlight one-stop">
        <div class="label">No single place buys all of these. Best two stops:</div>
        <div class="value">${shopName(pair.a)} + ${shopName(pair.b)}</div>
        <div class="sub">Sell ${pair.sellAtA.join(', ')} at ${shopName(pair.a)}; ${pair.sellAtB.join(', ')} at ${shopName(pair.b)}</div>
        <div class="big good">${fmt(pair.total)} aUEC</div>
      </div>`;
  }

  $(ids.summary).innerHTML = !items.length ? '' : `
    <div class="card"><div class="label">Your load</div><div class="value">${fmt(totalScu)} SCU</div><div class="sub">${items.map(({ c, qty }) => `${fmt(qty)} ${esc(shortName(c))}`).join(' · ')}</div></div>
    ${oneStopCard}
    ${items.length > 1 ? `<div class="card"><div class="label">Selling each at its best place (${splitStops} stop${splitStops > 1 ? 's' : ''})</div><div class="value">${fmt(splitTotal)} aUEC</div><div class="sub">${perItem.map((x) => x.best ? `${esc(shortName(x.c))} at ${esc(terminalName(terminalsById.get(x.best.id_terminal)) || x.best.terminal_name)}` : `${esc(shortName(x.c))}: nowhere`).join('<br>')}</div></div>` : ''}`;

  $(ids.table).innerHTML = !items.length ? '' : !stops.length ? '<tr><td class="empty">No shop buys this with these filters. Try a wider system or older prices.</td></tr>' : `
    <thead><tr>
      <th>#</th><th>Sell at</th>${items.length > 1 ? '<th>Buys</th>' : ''}${items.map(({ c }) => `<th class="num">${esc(shortName(c))} / SCU</th>`).join('')}
      <th class="num">Your load is worth</th><th>Notes</th><th>Max box</th><th>Oldest report</th>
    </tr></thead>
    <tbody>${stops.slice(0, 30).map((s, i) => `
      <tr class="${i === 0 ? 'top' : ''}">
        <td class="muted">${i + 1}</td>
        <td><div class="loc">${esc(terminalName(s.t) || [...s.rows.values()][0].terminal_name)}${autoloadTag(s.t)}</div><div class="sub">${esc(terminalPlace(s.t))}${s.t?.is_nqa ? ' · <span class="bad">no questions asked</span>' : ''}</div></td>
        ${items.length > 1 ? `<td>${s.missing.length ? `<span class="warn">${items.length - s.missing.length} of ${items.length}</span>` : '<span class="good">✓ all</span>'}</td>` : ''}
        ${items.map(({ c }) => {
          const p = s.rows.get(c.id);
          return `<td class="num">${p ? fmt(p.price_sell) + delta(p.price_sell, p.prev?.price_sell) + `<div>${statusPill(p.status_sell, true)}</div>` : '<span class="muted">doesn\'t buy</span>'}</td>`;
        }).join('')}
        <td class="num good"><b>${fmt(s.total)}</b></td>
        <td class="sub">${[...s.limited, ...(s.missing.length ? [`<span class="warn">no ${s.missing.map((c) => esc(shortName(c))).join(', ')}</span>`] : [])].join('<br>') || '—'}</td>
        <td>${s.t?.max_container_size ? s.t.max_container_size + ' SCU' : '—'}</td>
        <td class="${ageClass(s.oldest)}">${ago(s.oldest)}</td>
      </tr>`).join('')}
    </tbody>`;

  // One card per item with its top buyers.
  $(ids.cards).innerHTML = cardItems.map(({ c, qty }) => {
    const rows = (sellByCommodity.get(c.id) || []).filter(keep).slice(0, 8);
    return `
      <div class="material-card">
        <h3>${esc(c.name)} ${cargoWarnings(c)}</h3>
        <div class="sub">${note(c)}</div>
        ${rows.length ? `
        <table class="inner">
          <thead><tr><th>Location</th><th class="num">Price</th><th>Storage</th>${qty ? `<th class="num">${fmt(qty)} SCU</th>` : ''}</tr></thead>
          <tbody>${rows.map((p, i) => `
            <tr${i === 0 ? ' class="top"' : ''}>
              <td>${locCell(p)}<div class="sub ${ageClass(p.date_modified)}">reported ${ago(p.date_modified)}</div></td>
              <td class="num">${fmt(p.price_sell)}</td>
              <td>${statusPill(p.status_sell, true)}</td>
              ${qty ? `<td class="num good">${fmt(sellValue(p, qty))}</td>` : ''}
            </tr>`).join('')}
          </tbody>
        </table>` : '<div class="empty">No buyer with these filters.</div>'}
      </div>`;
  }).join('');
}

// ---------- Cargo Crates: boxes found in wrecks and derelicts ----------

let crates = loadSalvagePrefs().crates || [{ name: '', qty: 0 }];
let cratesUiReady = false;

function saveCratePrefs() {
  const prefs = loadSalvagePrefs();
  prefs.crates = crates;
  prefs.crateSystem = $('cr-system').value;
  prefs.crateAge = $('cr-age').value;
  try { localStorage.setItem(SALVAGE_PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

const commodityByName = (name) => data.commodities.find((c) => c.name.toLowerCase() === String(name).trim().toLowerCase());

// Searchable commodity picker. The browser's own <datalist> was unreliable, so this is a small custom dropdown.
let crateChoices = []; // [{ c, best }] for every commodity some shop buys
let comboActive = -1;  // highlighted suggestion while using the keyboard

function comboMatches(query) {
  const q = query.trim().toLowerCase();
  if (!q) return crateChoices.slice(0, 10);
  const starts = crateChoices.filter((x) => x.c.name.toLowerCase().startsWith(q));
  const contains = crateChoices.filter((x) => !x.c.name.toLowerCase().startsWith(q) && `${x.c.name} ${x.c.code}`.toLowerCase().includes(q));
  return [...starts, ...contains].slice(0, 10);
}

function showCombo(input) {
  const list = input.parentElement.querySelector('.combo-list');
  const matches = comboMatches(input.value);
  comboActive = Math.min(comboActive, matches.length - 1);
  list.innerHTML = matches.length ? matches.map((x, i) => `
    <li class="${i === comboActive ? 'active' : ''}" data-name="${esc(x.c.name)}">
      <span>${esc(x.c.name)} ${x.c.is_illegal ? '<span class="badge bad">Illegal</span>' : ''}</span>
      <span class="sub">${esc(x.c.kind || '')}${x.best ? ` · up to ${fmt(x.best.price_sell)} / SCU` : ''}</span>
    </li>`).join('') : '<li class="none">No commodity matches. Try another name.</li>';
  list.hidden = false;
}

function hideCombos() {
  document.querySelectorAll('#cr-rows .combo-list').forEach((l) => (l.hidden = true));
  comboActive = -1;
}

function pickCrateCommodity(input, name) {
  const cr = crates[Number(input.closest('.crate-row').dataset.index)];
  cr.name = name;
  input.value = name;
  hideCombos();
  saveCratePrefs();
  renderCrates();
  input.closest('.crate-row').querySelector('[data-field="qty"]').focus();
}

function drawCrateRows() {
  $('cr-rows').innerHTML = crates.map((cr, i) => `
    <div class="crate-row" data-index="${i}">
      <label class="wide">What's in the crate
        <div class="combo">
          <input type="text" data-field="name" value="${esc(cr.name)}" placeholder="Search a commodity, e.g. Titanium, Agricium…" autocomplete="off" spellcheck="false">
          <ul class="combo-list" hidden></ul>
        </div>
      </label>
      <label>SCU
        <input type="number" min="0" step="1" data-field="qty" value="${cr.qty || ''}" placeholder="0">
      </label>
      <button class="remove" data-remove="${i}" title="Remove this crate"${crates.length === 1 ? ' disabled' : ''}>✕</button>
      <span class="crate-status sub"></span>
    </div>`).join('');
}

function initCratesUi() {
  crateChoices = data.commodities
    .filter((c) => sellByCommodity.has(c.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ c, best: sellByCommodity.get(c.id)[0] }));
  const systems = [...new Set(data.terminals.map((t) => t.star_system_name).filter(Boolean))].sort();
  $('cr-system').innerHTML = '<option value="">All systems</option>' + systems.map((s) => `<option>${esc(s)}</option>`).join('');
  const prefs = loadSalvagePrefs();
  if (prefs.crateSystem && systems.includes(prefs.crateSystem)) $('cr-system').value = prefs.crateSystem;
  if (prefs.crateAge != null && [...$('cr-age').options].some((o) => o.value === prefs.crateAge)) $('cr-age').value = prefs.crateAge;
  drawCrateRows();
  cratesUiReady = true;
}

function renderCrates() {
  if (!cratesUiReady) initCratesUi();
  const maxAgeHours = Number($('cr-age').value) || null;
  const minDate = maxAgeHours ? Date.now() / 1000 - maxAgeHours * 3600 : 0;
  const system = $('cr-system').value;
  const keep = (p) => p.date_modified >= minDate && (!system || terminalsById.get(p.id_terminal)?.star_system_name === system);

  // Merge crates of the same commodity. A name that matches nothing is only flagged once you leave the field.
  const merged = new Map();
  document.querySelectorAll('#cr-rows .crate-row').forEach((row) => {
    const cr = crates[Number(row.dataset.index)];
    const c = cr.name.trim() && commodityByName(cr.name);
    const typing = document.activeElement === row.querySelector('[data-field="name"]');
    const status = row.querySelector('.crate-status');
    if (!cr.name.trim() || (!c && typing)) status.innerHTML = '';
    else if (!c) status.innerHTML = '<span class="warn">Unknown commodity. Pick one from the list.</span>';
    else if (!cr.qty) status.innerHTML = '<span class="muted">Enter how many SCU.</span>';
    else {
      const best = (sellByCommodity.get(c.id) || []).filter(keep).reduce((a, p) => (!a || sellValue(p, cr.qty) > sellValue(a, cr.qty) ? p : a), null);
      status.innerHTML = best
        ? `<span class="good">≈ ${fmt(sellValue(best, cr.qty))} aUEC</span> at ${esc(terminalName(terminalsById.get(best.id_terminal)) || best.terminal_name)}`
        : '<span class="warn">No buyer with these filters.</span>';
    }
    if (c && cr.qty > 0 && sellByCommodity.has(c.id)) merged.set(c.id, { c, qty: (merged.get(c.id)?.qty || 0) + cr.qty });
  });
  const items = [...merged.values()];

  $('cr-results').hidden = !items.length;
  $('cr-empty').hidden = !!items.length;
  renderSellAll(items, keep, { summary: 'cr-summary', table: 'cr-table', cards: 'cr-cards' }, items, (c) => esc(c.kind || ''));
  $('cr-illegal').hidden = !items.some(({ c }) => c.is_illegal);
}

// ---------- wiring ----------

$('sv-qty').addEventListener('input', (e) => {
  const id = e.target.dataset.material;
  if (!id || !data) return;
  svQty[id] = Math.max(0, Number(e.target.value) || 0);
  saveSalvagePrefs();
  renderSalvage();
});

['sv-system', 'sv-age'].forEach((id) => $(id).addEventListener('change', () => {
  if (!data) return;
  saveSalvagePrefs();
  renderSalvage();
}));

$('sv-ship-buttons').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-ship-scu]');
  const rmcId = $('sv-ship-buttons').dataset.rmc;
  if (!btn || !rmcId) return;
  for (const id of Object.keys(svQty)) svQty[id] = 0;
  svQty[rmcId] = Number(btn.dataset.shipScu);
  document.querySelectorAll('#sv-qty input').forEach((el) => (el.value = svQty[el.dataset.material] || 0));
  saveSalvagePrefs();
  renderSalvage();
});

// Guide table of contents: scroll inside the page instead of changing the page link.
document.querySelectorAll('.guide a[href^="#sv-"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById(a.getAttribute('href').slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  })
);

// Typing only redraws the results, so the crate inputs keep focus.
$('cr-rows').addEventListener('input', (e) => {
  const row = e.target.closest('.crate-row');
  if (!row || !data) return;
  const cr = crates[Number(row.dataset.index)];
  if (e.target.dataset.field === 'name') {
    cr.name = e.target.value;
    comboActive = -1;
    showCombo(e.target);
  } else {
    cr.qty = Math.max(0, Number(e.target.value) || 0);
  }
  saveCratePrefs();
  renderCrates();
});

$('cr-rows').addEventListener('focusin', (e) => {
  if (e.target.dataset.field === 'name' && data) showCombo(e.target);
});

// Leaving the field closes the list and shows a warning if the name matches nothing.
$('cr-rows').addEventListener('focusout', (e) => {
  if (e.target.dataset.field !== 'name' || !data) return;
  setTimeout(() => {
    if (document.activeElement?.dataset.field === 'name') return;
    hideCombos();
    renderCrates();
  }, 120);
});

$('cr-rows').addEventListener('keydown', (e) => {
  const input = e.target;
  if (input.dataset.field !== 'name') return;
  const items = [...input.parentElement.querySelectorAll('.combo-list li[data-name]')];
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!items.length) return;
    comboActive = (comboActive + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    showCombo(input);
  } else if (e.key === 'Enter') {
    const pick = items[comboActive] || (items.length === 1 ? items[0] : null) ||
      items.find((li) => li.dataset.name.toLowerCase() === input.value.trim().toLowerCase());
    if (pick) { e.preventDefault(); pickCrateCommodity(input, pick.dataset.name); }
  } else if (e.key === 'Escape') {
    hideCombos();
  }
});

// mousedown (not click) so the pick happens before the input loses focus.
$('cr-rows').addEventListener('mousedown', (e) => {
  const li = e.target.closest('.combo-list li[data-name]');
  if (!li) return;
  e.preventDefault();
  pickCrateCommodity(li.closest('.combo').querySelector('input'), li.dataset.name);
});

$('cr-rows').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remove]');
  if (!btn || !data || crates.length === 1) return;
  crates.splice(Number(btn.dataset.remove), 1);
  saveCratePrefs();
  drawCrateRows();
  renderCrates();
});

$('cr-add').addEventListener('click', () => {
  if (!data) return;
  crates.push({ name: '', qty: 0 });
  saveCratePrefs();
  drawCrateRows();
  renderCrates();
  document.querySelector('#cr-rows .crate-row:last-child input[data-field="name"]')?.focus();
});

['cr-system', 'cr-age'].forEach((id) => $(id).addEventListener('change', () => {
  if (!data) return;
  saveCratePrefs();
  renderCrates();
}));

// Any click outside a picker closes its list.
document.addEventListener('mousedown', (e) => {
  if (!e.target.closest('.combo')) hideCombos();
});
