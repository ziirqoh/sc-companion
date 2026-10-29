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

async function loadSalvageShips() {
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
  renderSalvageHome(keep);
}

function renderSalvageSell(materials, keep) {
  const load = materials.filter((c) => svQty[c.id] > 0);
  const totalScu = load.reduce((s, c) => s + svQty[c.id], 0);

  // Ship buttons fill RMC with the ship's capacity.
  const rmc = materials.find((c) => c.name === RMC);
  $('sv-ship-buttons').innerHTML = (salvageShips || []).map((v) =>
    `<button class="chip" data-ship-scu="${v.scu}">${esc(v.name)} · ${fmt(v.scu)} SCU</button>`).join('') || '<span class="muted">loading ships…</span>';
  $('sv-ship-buttons').dataset.rmc = rmc?.id || '';

  // Every terminal that buys at least one material you carry.
  const shops = new Map();
  for (const c of load) {
    for (const p of sellByCommodity.get(c.id) || []) {
      if (!keep(p)) continue;
      if (!shops.has(p.id_terminal)) shops.set(p.id_terminal, { t: terminalsById.get(p.id_terminal), rows: new Map() });
      shops.get(p.id_terminal).rows.set(c.id, p);
    }
  }
  const stops = [...shops.values()].map((shop) => {
    let total = 0;
    const limited = [];
    for (const c of load) {
      const p = shop.rows.get(c.id);
      if (!p) continue;
      const scu = p.scu_sell > 0 ? Math.min(svQty[c.id], p.scu_sell) : svQty[c.id];
      if (scu < svQty[c.id]) limited.push(`${esc(shortName(c))}: only ${fmt(scu)} SCU`);
      total += scu * p.price_sell;
    }
    const missing = load.filter((c) => !shop.rows.has(c.id));
    const oldest = Math.min(...[...shop.rows.values()].map((p) => p.date_modified));
    return { ...shop, total, missing, limited, oldest };
  }).sort((a, b) => b.total - a.total);

  // Selling each material where it's worth the most, counting how much each shop will actually take.
  const sellValue = (p, qty) => p.price_sell * (p.scu_sell > 0 ? Math.min(qty, p.scu_sell) : qty);
  const perMaterial = load.map((c) => {
    const best = (sellByCommodity.get(c.id) || []).filter(keep)
      .reduce((a, p) => (!a || sellValue(p, svQty[c.id]) > sellValue(a, svQty[c.id]) ? p : a), null);
    return { c, best, value: best ? sellValue(best, svQty[c.id]) : 0 };
  });
  const splitTotal = perMaterial.reduce((s, x) => s + x.value, 0);
  const top = stops[0];

  $('sv-summary').innerHTML = !load.length ? '<div class="card">Enter how many SCU of each material you carry.</div>' : `
    <div class="card"><div class="label">Your load</div><div class="value">${fmt(totalScu)} SCU</div><div class="sub">${load.map((c) => `${fmt(svQty[c.id])} ${esc(shortName(c))}`).join(' · ')}</div></div>
    ${top ? `<div class="card highlight"><div class="label">Best single stop</div><div class="value">${esc(terminalName(top.t) || '')}</div><div class="sub"><span class="good">${fmt(top.total)} aUEC</span> · ${esc(terminalPlace(top.t))}${top.missing.length ? ` · <span class="warn">doesn't buy ${top.missing.map((c) => esc(shortName(c))).join(', ')}</span>` : ''}</div></div>` : ''}
    ${load.length > 1 ? `<div class="card"><div class="label">Selling each at its best price</div><div class="value">${fmt(splitTotal)} aUEC</div><div class="sub">${perMaterial.map((x) => x.best ? `${esc(shortName(x.c))} at ${esc(terminalName(terminalsById.get(x.best.id_terminal)) || x.best.terminal_name)}` : `${esc(shortName(x.c))}: nowhere`).join(' · ')}${top ? ` · <span class="${splitTotal > top.total ? 'good' : 'muted'}">${splitTotal > top.total ? '+' + fmt(splitTotal - top.total) + ' vs one stop' : 'no gain vs one stop'}</span>` : ''}</div></div>` : ''}`;

  $('sv-table').innerHTML = !stops.length ? '<tr><td class="empty">No shop buys these materials with these filters. Try a wider system or older prices.</td></tr>' : `
    <thead><tr>
      <th>#</th><th>Sell at</th>${load.map((c) => `<th class="num">${esc(shortName(c))} / SCU</th>`).join('')}
      <th class="num">Your load is worth</th><th>Notes</th><th>Max box</th><th>Oldest report</th>
    </tr></thead>
    <tbody>${stops.slice(0, 30).map((s, i) => `
      <tr class="${i === 0 ? 'top' : ''}">
        <td class="muted">${i + 1}</td>
        <td><div class="loc">${esc(terminalName(s.t) || [...s.rows.values()][0].terminal_name)}</div><div class="sub">${esc(terminalPlace(s.t))}</div></td>
        ${load.map((c) => {
          const p = s.rows.get(c.id);
          return `<td class="num">${p ? fmt(p.price_sell) + delta(p.price_sell, p.prev?.price_sell) + `<div>${statusPill(p.status_sell, true)}</div>` : '<span class="muted">doesn\'t buy</span>'}</td>`;
        }).join('')}
        <td class="num good"><b>${fmt(s.total)}</b></td>
        <td class="sub">${[...s.limited, ...(s.missing.length ? [`<span class="warn">no ${s.missing.map((c) => esc(shortName(c))).join(', ')}</span>`] : [])].join('<br>') || '—'}</td>
        <td>${s.t?.max_container_size ? s.t.max_container_size + ' SCU' : '—'}</td>
        <td class="${ageClass(s.oldest)}">${ago(s.oldest)}</td>
      </tr>`).join('')}
    </tbody>`;

  // One card per material with its top buyers.
  $('sv-materials').innerHTML = materials.map((c) => {
    const rows = (sellByCommodity.get(c.id) || []).filter(keep).slice(0, 8);
    const qty = svQty[c.id] || 0;
    return `
      <div class="material-card">
        <h3>${esc(c.name)}</h3>
        <div class="sub">${c.name === RMC ? 'From hull scraping. Sell as is.' : c.name === CMAT ? 'From structural salvage, after refining.' : 'Sold and bought at shops like a trade good.'}</div>
        ${rows.length ? `
        <table class="inner">
          <thead><tr><th>Location</th><th class="num">Price</th><th>Storage</th>${qty ? `<th class="num">${fmt(qty)} SCU</th>` : ''}</tr></thead>
          <tbody>${rows.map((p, i) => `
            <tr${i === 0 ? ' class="top"' : ''}>
              <td>${locCell(p)}<div class="sub ${ageClass(p.date_modified)}">reported ${ago(p.date_modified)}</div></td>
              <td class="num">${fmt(p.price_sell)}</td>
              <td>${statusPill(p.status_sell, true)}</td>
              ${qty ? `<td class="num good">${fmt(p.price_sell * (p.scu_sell > 0 ? Math.min(qty, p.scu_sell) : qty))}</td>` : ''}
            </tr>`).join('')}
          </tbody>
        </table>` : '<div class="empty">No buyer with these filters.</div>'}
      </div>`;
  }).join('');
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
