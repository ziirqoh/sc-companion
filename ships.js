// SC Companion — Ships tab: every ship and vehicle with its full specs.
// Data comes from data/ships.json (built by scripts/ships.mjs about once a day) and is only
// downloaded when the tab is first opened.

let shipsData = null;     // { fetchedAt, version, ships }
let shipsLoading = null;  // promise while downloading
let shipsError = null;
let shipSort = null;      // { key, dir } or null for A–Z
let openShip = null;      // id of the expanded ship

const fmt1 = (n, d = 1) => (n == null || isNaN(n) ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d }));
const cheapestBuy = (s) => (s.buy.length ? s.buy[0].p : null);

// Clicking a header cycles: highest first → lowest first → back to A–Z (text columns start A–Z).
const SHIP_COLUMNS = [
  { key: 'name', label: 'Ship', value: (s) => s.n },
  { key: 'career', label: 'Role', value: (s) => s.career },
  { key: 'size', label: 'Size', value: (s) => s.size },
  { key: 'crew', label: 'Crew', num: true, value: (s) => s.crew[1] ?? s.crew[0] },
  { key: 'cargo', label: 'Cargo (SCU)', num: true, value: (s) => s.cargo || null },
  { key: 'box', label: 'Largest box', num: true, value: (s) => s.maxBox },
  { key: 'scm', label: 'SCM speed', num: true, value: (s) => s.speed?.scm ?? null },
  { key: 'max', label: 'Max speed', num: true, value: (s) => s.speed?.max ?? null },
  { key: 'hp', label: 'Hull HP', num: true, value: (s) => s.hp },
  { key: 'shield', label: 'Shield HP', num: true, value: (s) => s.shield?.hp ?? null },
  { key: 'dps', label: 'Pilot DPS', num: true, value: (s) => s.weap.dps },
  { key: 'qt', label: 'Quantum speed', num: true, value: (s) => s.qt?.speed ?? null },
  { key: 'pad', label: 'Pad', value: (s) => s.pad },
  // Sorts by the in-game price; the pledge price is shown underneath.
  { key: 'price', label: 'Where to buy', num: true, value: cheapestBuy },
];

const COMPONENT_LABELS = {
  PowerPlant: 'Power plant', Cooler: 'Cooler', Shield: 'Shield generator', QuantumDrive: 'Quantum drive', Radar: 'Radar',
  LifeSupportGenerator: 'Life support', QuantumInterdictionGenerator: 'Quantum interdiction', EMP: 'EMP',
  TractorBeam: 'Tractor beam', WeaponMining: 'Mining laser', ToolArm: 'Tool arm', UtilityTurret: 'Utility turret', DockingCollar: 'Docking collar',
};
const TURRET_LABELS = { manned: 'Manned turret', remote: 'Remote turret', pdc: 'Point defense' };

async function loadShips() {
  if (shipsData || shipsLoading) return shipsLoading;
  shipsLoading = (async () => {
    try {
      shipsData = await getPublished('ships.json');
      shipsError = null;
      initShipFilters();
    } catch (err) {
      shipsError = err.message;
    }
    shipsLoading = null;
    renderShips();
    showShipFromHash();
  })();
  renderShips();
  return shipsLoading;
}

function initShipFilters() {
  const fill = (id, values) => {
    const el = $(id);
    const keep = el.value;
    // Keep the first option ("All …") as it is, so its translation keeps working.
    while (el.options.length > 1) el.remove(1);
    el.insertAdjacentHTML('beforeend', [...new Set(values.filter(Boolean))].sort().map((v) => `<option>${esc(v)}</option>`).join(''));
    el.value = keep;
  };
  fill('sh-career', shipsData.ships.map((s) => s.career));
  fill('sh-size', shipsData.ships.map((s) => s.size));
  fill('sh-maker', shipsData.ships.map((s) => s.mk));
}

function cycleShipSort(key) {
  const col = SHIP_COLUMNS.find((c) => c.key === key);
  const first = col.num ? 'desc' : 'asc';
  if (shipSort?.key !== key) shipSort = { key, dir: first };
  else if (shipSort.dir === first) shipSort = { key, dir: first === 'desc' ? 'asc' : 'desc' };
  else shipSort = null;
  renderShips();
}

function filteredShips() {
  const q = $('sh-search').value.trim().toLowerCase();
  const kind = $('sh-kind').value, career = $('sh-career').value, size = $('sh-size').value, maker = $('sh-maker').value;
  const buy = $('sh-buy').value;
  const buyable = (s) => !buy
    || (buy === 'game' && s.buy.length)
    || (buy === 'pledge' && s.pledge?.onSale)
    || (buy === 'none' && !s.buy.length && !s.pledge?.onSale);
  const col = SHIP_COLUMNS.find((c) => c.key === shipSort?.key);
  return shipsData.ships
    .filter((s) => !kind || s.kind === kind)
    .filter((s) => !career || s.career === career)
    .filter((s) => !size || s.size === size)
    .filter((s) => !maker || s.mk === maker)
    .filter(buyable)
    .filter((s) => !q || `${s.n} ${s.full} ${s.mk} ${s.role} ${s.career}`.toLowerCase().includes(q))
    .sort((a, b) => {
      if (col) {
        const va = col.value(a), vb = col.value(b);
        // Empty values always go last, whatever the direction.
        if (va == null || vb == null) return va == null ? (vb == null ? 0 : 1) : -1;
        const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
        if (cmp) return shipSort.dir === 'asc' ? cmp : -cmp;
      }
      return a.n.localeCompare(b.n);
    });
}

function renderShips() {
  const table = $('sh-table');
  if (!shipsData) {
    $('sh-summary').textContent = '';
    table.innerHTML = `<tr><td class="empty">${shipsError ? "Couldn't load the ship database. Try again later." : 'Loading ships…'}</td></tr>`;
    return;
  }
  const list = filteredShips();
  $('sh-summary').innerHTML = `${list.length} of ${shipsData.ships.length} ships · <span title="Game version of the stats">Stats from ${esc(shipsData.version?.replace(/-LIVE.*/, '') || 'the game files')}</span> · ${ago(shipsData.fetchedAt / 1000)}`;

  const header = (c) => {
    const active = shipSort?.key === c.key;
    const arrow = active ? (shipSort.dir === 'asc' ? ' ▲' : ' ▼') : '';
    return `<th class="sortable${c.num ? ' num' : ''}${active ? ' sorted' : ''}" data-sort="${c.key}" title="Click to sort">${c.label}${arrow}</th>`;
  };
  const dash = '<span class="muted">—</span>';
  table.innerHTML = `
    <thead><tr>${SHIP_COLUMNS.map(header).join('')}</tr></thead>
    <tbody>${list.length ? list.map((s) => {
      const open = openShip === s.id;
      const price = cheapestBuy(s);
      return `
      <tr class="clickable${open ? ' selected' : ''}" data-ship="${esc(s.id)}">
        <td><div class="loc">${open ? '▾' : '▸'} ${esc(s.n)}</div><div class="sub">${esc(s.mk || '')}</div></td>
        <td><div>${esc(s.career || '—')}</div><div class="sub">${esc(s.role || '')}</div></td>
        <td>${esc(s.size || '—')}</td>
        <td class="num">${s.crew[0] == null ? dash : s.crew[1] && s.crew[1] !== s.crew[0] ? `${s.crew[0]}–${s.crew[1]}` : s.crew[0]}</td>
        <td class="num">${s.cargo ? fmt1(s.cargo) : dash}</td>
        <td class="num">${s.maxBox ? `${s.maxBox} SCU` : dash}</td>
        <td class="num">${s.speed ? `${fmt(s.speed.scm)} m/s` : dash}</td>
        <td class="num">${s.speed ? `${fmt(s.speed.max)} m/s` : dash}</td>
        <td class="num">${s.hp ? fmt(s.hp) : dash}</td>
        <td class="num">${s.shield ? fmt(s.shield.hp) : dash}</td>
        <td class="num">${s.weap.dps ? fmt(s.weap.dps) : dash}</td>
        <td class="num">${s.qt ? `${fmt(s.qt.speed / 1000)} km/s` : dash}</td>
        <td>${esc(s.pad || '—')}</td>
        <td class="num">${price ? `${fmt(price)} aUEC` : ''}${s.pledge?.onSale ? `<div class="sub">Pledge $${fmt(s.pledge.price)}</div>` : ''}${!price && !s.pledge?.onSale ? dash : ''}</td>
      </tr>
      ${open ? `<tr class="detail"><td colspan="${SHIP_COLUMNS.length}">${shipDetail(s)}</td></tr>` : ''}`;
    }).join('') : `<tr><td class="empty" colspan="${SHIP_COLUMNS.length}">No ship matches these filters.</td></tr>`}
    </tbody>`;
}

// One labelled value in a spec card; skipped when there's nothing to show.
const spec = (label, value) => (value == null || value === '' || value === '—' ? '' : `<div class="spec"><span class="label">${label}</span><span>${value}</span></div>`);
const specCard = (heading, body) => (body.trim() ? `<div class="spec-card"><h4>${heading}</h4>${body}</div>` : '');
const sized = (x) => `${x.c > 1 ? `${x.c}× ` : ''}${esc(x.n)}${x.s != null ? ` <span class="muted">S${x.s}</span>` : ''}`;
const pct = (m) => (m == null ? null : `${Math.round(m * 100)}%`);

function shipDetail(s) {
  const w = s.weap;
  const dims = s.dims.every((d) => d != null) ? `${fmt1(s.dims[0])} × ${fmt1(s.dims[1])} × ${fmt1(s.dims[2])} m` : null;
  const crew = s.crew[0] == null ? null : s.crew[1] && s.crew[1] !== s.crew[0] ? `${s.crew[0]}–${s.crew[1]}` : String(s.crew[0]);

  const overview = specCard('Overview',
    spec('Manufacturer', esc(s.mk)) + spec('Role', esc(s.role)) + spec('Career', esc(s.career)) + spec('Size', esc(s.size)) +
    spec('Crew', crew) + spec('Landing pad', esc(s.pad)) + spec('Length × width × height', dims) +
    spec('Mass', s.mass ? `${fmt(s.mass / 1000)} t` : null) + spec('Status', esc(s.status)));

  const cargo = specCard('Cargo & storage',
    spec('Cargo capacity', s.cargo ? `${fmt1(s.cargo)} SCU` : '0 SCU') +
    spec('Largest box', s.maxBox ? `${s.maxBox} SCU` : null) +
    (s.grids.length > 1 ? spec('Cargo grids', s.grids.map(([scu, box]) => `${fmt1(scu)} SCU${box ? ` <span class="muted">(boxes up to ${box} SCU)</span>` : ''}`).join('<br>')) : '') +
    spec('Box sizes (UEX)', s.uexBoxes ? `${esc(s.uexBoxes.split(',').join(', '))} SCU` : null) +
    spec('Personal storage', s.inv ? `${fmt1(s.inv)} SCU` : null));

  const flight = s.speed ? specCard('Flight',
    spec('SCM speed', `${fmt(s.speed.scm)} m/s`) + spec('Max speed', `${fmt(s.speed.max)} m/s`) +
    spec('Boost forward', s.speed.boost ? `${fmt(s.speed.boost)} m/s` : null) + spec('Boost backward', s.speed.back ? `${fmt(s.speed.back)} m/s` : null) +
    spec('0 to SCM', s.speed.toScm ? `${fmt1(s.speed.toScm)} s` : null) + spec('0 to max', s.speed.toMax ? `${fmt1(s.speed.toMax)} s` : null) +
    (s.agility ? spec('Pitch / yaw / roll', `${s.agility[0]} / ${s.agility[1]} / ${s.agility[2]} °/s`) : '')) : '';

  const quantum = specCard('Quantum & fuel',
    (s.qt ? spec('Quantum speed', `${fmt(s.qt.speed / 1000)} km/s`) + spec('Spool time', `${fmt1(s.qt.spool)} s`) +
      spec('Quantum fuel', `${fmt1(s.qt.fuel)} SCU`) + spec('Quantum range', s.qt.range ? `${fmt1(s.qt.range / 1e9)} Gm` : null) : '') +
    spec('Hydrogen fuel', s.h2 ? `${fmt1(s.h2)} SCU` : null));

  const durability = specCard('Durability & signature',
    spec('Hull HP', s.hp ? fmt(s.hp) : null) + spec('Armor HP', s.armor?.hp ? fmt(s.armor.hp) : null) +
    spec('Shield HP', s.shield ? fmt(s.shield.hp) : null) + spec('Shield regen', s.shield?.regen ? `${fmt(s.shield.regen)} / s` : null) +
    spec('Shield type', esc(s.shield?.type)) +
    (s.armor ? spec('Damage taken (physical / energy / distortion)', `${pct(s.armor.phys)} / ${pct(s.armor.energy)} / ${pct(s.armor.dist)}`) : '') +
    spec('Infrared signature', s.sig.ir ? fmt(s.sig.ir) : null) + spec('EM signature', s.sig.em ? fmt(s.sig.em) : null) +
    spec('Cross section', s.sig.cs ? fmt(s.sig.cs) : null));

  const weapons = specCard('Weapons',
    (w.pilot.length ? spec('Pilot guns', w.pilot.map((g) => `${sized(g)}${g.dps ? ` <span class="muted">· ${fmt(g.dps)} DPS each</span>` : ''}`).join('<br>')) : '') +
    spec('Pilot DPS', w.dps ? fmt(w.dps) : null) +
    w.turrets.map((t) => spec(`${t.c > 1 ? `${t.c}× ` : ''}${TURRET_LABELS[t.t] || 'Turret'} <span class="muted">S${t.s}</span>`, `${t.w.map(sized).join('<br>')}${t.dps ? ` <span class="muted">· ${fmt(t.dps)} DPS${t.c > 1 ? ' each' : ''}</span>` : ''}`)).join('') +
    spec('Turret DPS', w.tdps ? fmt(w.tdps) : null) +
    spec('Missiles', w.missiles ? `${w.missiles.c} <span class="muted">· ${fmt(w.missiles.dmg)} damage in total</span>` : null) +
    (w.racks.length ? spec('Missile racks', w.racks.map(sized).join('<br>')) : '') +
    (w.cm.length ? spec('Countermeasures', w.cm.map(sized).join('<br>')) : '') +
    (!w.pilot.length && !w.turrets.length && !w.missiles ? spec('Armament', 'Unarmed') : ''));

  const components = s.comp.length ? `
    <div class="spec-card wide"><h4>Components</h4>
      <div class="table-wrap"><table class="compact">
        <thead><tr><th>Type</th><th>Name</th><th class="num">Size</th><th>Grade</th><th>Class</th><th class="num">Count</th></tr></thead>
        <tbody>${s.comp.map((c) => `<tr><td>${esc(COMPONENT_LABELS[c.t] || c.t)}</td><td>${esc(c.n)}</td><td class="num">${c.s ?? '—'}</td><td>${esc(c.g || '—')}</td><td>${esc(c.cl || '—')}</td><td class="num">${c.c}</td></tr>`).join('')}</tbody>
      </table></div>
    </div>` : '';

  const shopList = (rows) => rows.map((r) => `<div class="shop-row"><span>${esc(r.t)}${r.sys ? ` <span class="muted">· ${esc(r.sys)}</span>` : ''}</span><b>${fmt(r.p)} aUEC</b></div>`).join('');
  const inGame = specCard('Rent & insurance',
    (s.ins ? spec('Insurance claim', `${fmt1(s.ins[0])} min`) + spec('Expedite', `${fmt1(s.ins[1])} min · ${fmt(s.ins[2])} aUEC`) : '') +
    (s.rent.length ? `<div class="subhead">Rent at</div>${shopList(s.rent)}` : ''));

  // Where to buy: in-game shops for aUEC, and the pledge store for real money.
  const p = s.pledge;
  const link = (url, text) => `<a href="${esc(url)}" target="_blank" rel="noopener">${text}</a>`;
  const pledgeBody = p ? `
      <div class="shop-row"><span>${p.onSale ? '<span class="good">On sale now</span>' : '<span class="muted">Not on sale right now</span>'}</span><b>${p.price ? `${p.onSale ? '' : 'Last price '}$${fmt(p.price)}` : ''}</b></div>
      ${p.warbond ? `<div class="shop-row"><span>${link(p.warbond.url, 'Warbond offer ↗')}</span><b>$${fmt(p.warbond.p)}</b></div>` : ''}
      ${p.packs.map((k) => `<div class="shop-row"><span>Also in: ${link(k.url, `${esc(k.t)} ↗`)}</span><b>$${fmt(k.p)}</b></div>`).join('')}
      ${p.url ? `<div class="buy-link">${link(p.url, 'Open on the RSI pledge store ↗')}</div>` : ''}`
    : '<div class="shop-row"><span class="muted">Not sold on the pledge store.</span></div>';
  const neither = !s.buy.length && !p;
  const howToGet = /wikelo/i.test(s.n) ? 'Earned in game by trading with Wikelo.'
    : /exec|executive edition/i.test(s.n) ? 'Limited edition from events or rewards. It isn\'t on sale.'
    : 'Not on sale for money or aUEC right now. It may come from missions, events or rewards.';
  const whereToBuy = `
    <div class="spec-card wide where-to-buy"><h4>Where to buy</h4>
      ${neither ? `<p class="sub">${howToGet}</p>` : ''}
      <div class="buy-cols">
        <div>
          <div class="subhead">In game, with aUEC</div>
          ${s.buy.length ? shopList(s.buy) : '<div class="shop-row"><span class="muted">Not sold in any in-game shop.</span></div>'}
        </div>
        <div>
          <div class="subhead">Pledge store, with real money</div>
          ${pledgeBody}
        </div>
      </div>
    </div>`;

  const links = [
    s.url && `<a href="${esc(s.url)}" target="_blank" rel="noopener">Official ship page ↗</a>`,
    s.wiki && `<a href="${esc(s.wiki)}" target="_blank" rel="noopener">Star Citizen Wiki ↗</a>`,
  ].filter(Boolean).join(' · ');

  return `
    <div class="ship-detail">
      <div class="ship-head">
        ${s.img ? `<img src="${esc(s.img)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
        <div>
          <h3>${esc(s.full)}</h3>
          <div class="sub">${esc([s.career, s.role].filter(Boolean).join(' · '))}</div>
          ${s.desc ? `<p class="ship-desc" data-no-i18n>${esc(s.desc)}</p>` : ''}
          ${links ? `<div class="sub">${links}</div>` : ''}
        </div>
      </div>
      <div class="spec-grid">${whereToBuy}${overview}${cargo}${flight}${quantum}${durability}${weapons}${inGame}${components}</div>
    </div>`;
}

// Opens a ship from the URL (#/ships/<id>) and scrolls to it.
function showShipFromHash() {
  const [, page, id] = location.hash.split('/');
  if (page !== 'ships') return;
  loadShips();
  if (id && shipsData) {
    const ship = shipsData.ships.find((s) => s.id === decodeURIComponent(id));
    if (ship && openShip !== ship.id) {
      openShip = ship.id;
      renderShips();
      document.querySelector(`#sh-table tr[data-ship="${CSS.escape(ship.id)}"]`)?.scrollIntoView({ block: 'start' });
    }
  }
}

$('sh-table').addEventListener('click', (e) => {
  const th = e.target.closest('th[data-sort]');
  if (th) return cycleShipSort(th.dataset.sort);
  if (e.target.closest('a, tr.detail')) return;
  const row = e.target.closest('tr[data-ship]');
  if (!row) return;
  openShip = openShip === row.dataset.ship ? null : row.dataset.ship;
  window.history.replaceState(null, '', openShip ? `#/ships/${encodeURIComponent(openShip)}` : '#/ships');
  renderShips();
});
['sh-search'].forEach((id) => $(id).addEventListener('input', () => shipsData && renderShips()));
['sh-kind', 'sh-career', 'sh-size', 'sh-maker', 'sh-buy'].forEach((id) => $(id).addEventListener('change', () => shipsData && renderShips()));
window.addEventListener('hashchange', showShipFromHash);
showShipFromHash();
