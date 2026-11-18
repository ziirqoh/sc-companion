// SC Companion — Ships → Loadout Builder: pick a ship, swap its weapons, missiles and components,
// and see what changes, what it costs and where to buy each part in game.
// Data comes from data/loadout.json (built by scripts/loadout.mjs about once a day): the swappable slots
// of every ship, and every part with its stats and the shops that sell it (aUEC prices from UEX).
// Ship names and pictures come from data/ships.json (ships.js).

let loData = null;      // { fetchedAt, ships: { id: slots }, items }
let loLoading = null;
let loError = null;
let loItems = null;     // Map(class name -> part)
let loShip = null;      // id of the ship being built
let loPicks = {};       // slot index -> part id, only for slots that differ from stock
let loOpenSlot = null;  // slot index whose part list is open
let loComboActive = -1;
let loMissing = null;   // name of a ship from the URL that has no swappable parts

const LO_SECTIONS = [
  { k: 'WeaponGun', label: 'Guns' },
  { k: 'Missile', label: 'Missiles' },
  { k: 'WeaponMining', label: 'Mining lasers' },
  { k: 'Shield', label: 'Shield generators' },
  { k: 'PowerPlant', label: 'Power plants' },
  { k: 'Cooler', label: 'Coolers' },
  { k: 'QuantumDrive', label: 'Quantum drives' },
  { k: 'Radar', label: 'Radar' },
];
const LO_PART_LABELS = { WeaponGun: 'Gun', Missile: 'Missile', WeaponMining: 'Mining laser', Shield: 'Shield generator', PowerPlant: 'Power plant', Cooler: 'Cooler', QuantumDrive: 'Quantum drive', Radar: 'Radar' };

const n0 = (v) => fmt(Math.round(v));
const SIGNALS = { CrossSection: 'Cross section', Infrared: 'Infrared', Electromagnetic: 'EM' };
// Stats shown for each kind of part. `better` says which way is an upgrade (for the ▲▼ against stock).
const STAT_DEFS = {
  WeaponGun: [
    { k: 'dps', label: 'DPS', better: 'high', f: n0 },
    { k: 'alpha', label: 'Damage per shot', better: 'high', f: (v) => fmt1(v) },
    { k: 'kind', label: 'Type', f: (v, p) => `${esc(v)}${p.st.dmg ? ` <span class="muted">· ${esc(p.st.dmg)}</span>` : ''}` },
    { k: 'rng', label: 'Range', better: 'high', f: (v) => `${n0(v)} m` },
    { k: 'spd', label: 'Projectile speed', better: 'high', f: (v) => `${n0(v)} m/s` },
    { k: 'ammo', label: 'Ammo', better: 'high', f: n0 },
  ],
  Missile: [
    { k: 'dmg', label: 'Damage', better: 'high', f: n0 },
    { k: 'sig', label: 'Tracking', f: (v) => esc(SIGNALS[v] || v) },
    { k: 'lock', label: 'Lock range', better: 'high', f: (v) => `${fmt1(v / 1000)} km` },
    { k: 'lockt', label: 'Lock time', better: 'low', f: (v) => `${fmt1(v)} s` },
    { k: 'spd', label: 'Speed', better: 'high', f: (v) => `${n0(v)} m/s` },
  ],
  WeaponMining: [
    { k: 'pow', label: 'Laser power', better: 'high', f: n0 },
    { k: 'ext', label: 'Extraction', better: 'high', f: n0 },
    { k: 'opt', label: 'Optimal range', better: 'high', f: (v) => `${n0(v)} m` },
    { k: 'mods', label: 'Module slots', better: 'high', f: n0 },
    { k: 'fx', label: 'Modifiers', f: (v) => v.map(([name, val]) => `${esc(name)} ${val > 0 ? '+' : ''}${val}%`).join('<br>') },
  ],
  Shield: [
    { k: 'shp', label: 'Shield HP', better: 'high', f: n0 },
    { k: 'regen', label: 'Regen', better: 'high', f: (v) => `${n0(v)} / s` },
    { k: 'delay', label: 'Regen delay after a hit', better: 'low', f: (v) => `${fmt1(v)} s` },
    { k: 'down', label: 'Regen delay when down', better: 'low', f: (v) => `${fmt1(v)} s` },
  ],
  PowerPlant: [{ k: 'gen', label: 'Power output', better: 'high', f: n0 }],
  Cooler: [{ k: 'cool', label: 'Cooling', better: 'high', f: n0 }],
  QuantumDrive: [
    { k: 'qs', label: 'Quantum speed', better: 'high', f: (v) => `${n0(v / 1000)} km/s` },
    { k: 'spool', label: 'Spool time', better: 'low', f: (v) => `${fmt1(v)} s` },
    { k: 'cd', label: 'Cooldown', better: 'low', f: (v) => `${fmt1(v)} s` },
    { k: 't10', label: 'Time for 10 Gm', better: 'low', f: (v) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` },
    { k: 'eff', label: 'Fuel efficiency', better: 'high', f: n0 },
  ],
  Radar: [
    { k: 'aim', label: 'Aim assist range', better: 'high', f: (v) => `${n0(v)} m` },
    { k: 'sens', label: 'Sensitivity', better: 'high', f: (v) => fmt1(v, 2) },
  ],
};
// Shown for every part, after its own stats.
const COMMON_STATS = [
  { k: 'pw', label: 'Power draw', better: 'low', f: (v) => fmt1(v) },
  { k: 'em', label: 'EM signature', better: 'low', f: n0 },
  { k: 'hp', label: 'Health', better: 'high', f: n0 },
];
const statDefs = (k) => [...(STAT_DEFS[k] || []), ...COMMON_STATS];

async function loadLoadout() {
  if (loData || loLoading) return loLoading;
  loLoading = (async () => {
    try {
      const [d] = await Promise.all([getPublished('loadout.json'), loadShips()]);
      loData = d;
      loItems = new Map(d.items.map((p) => [p.id, p]));
      loError = null;
    } catch (err) {
      loError = err.message;
    }
    loLoading = null;
    showLoadoutFromHash();
  })();
  renderLoadout();
  return loLoading;
}

// ---------- slots, parts and totals ----------

const loSlots = () => (loData && loShip && loData.ships[loShip]) || [];
const shipInfo = (id) => shipsData?.ships.find((s) => s.id === id) || null;
const partOf = (slot, i) => loItems.get(loPicks[i] ?? slot.d) || null;
const stockOf = (slot) => loItems.get(slot.d) || null;
const isChanged = (slot, i) => loPicks[i] != null && loPicks[i] !== slot.d;

function fits(p, slot) {
  if (p.t !== slot.k || p.s == null) return false;
  if (p.s < (slot.s[0] ?? p.s) || p.s > (slot.s[1] ?? p.s)) return false;
  // The slot asks for some tags (bespoke mounts) and the part asks for some; a tag the slot asks for it also offers.
  if ((slot.req || []).some((t) => !(p.tags || []).includes(t))) return false;
  return (p.req || []).every((t) => (slot.tags || []).includes(t) || (slot.req || []).includes(t));
}

// Shops for a part, limited to the chosen star system.
function shopsFor(p) {
  const sys = $('lo-system').value;
  return (p?.buy || []).filter((b) => !sys || b.sys === sys);
}
const bestShop = (p) => shopsFor(p)[0] || null;

function totals(pick) {
  const t = { pilot: 0, turret: 0, missiles: 0, mcount: 0, shield: 0, regen: 0, power: 0, cooling: 0, mining: 0, qt: null };
  loSlots().forEach((slot, i) => {
    const p = pick(slot, i);
    if (!p) return;
    const st = p.st;
    if (slot.k === 'WeaponGun') t[slot.tu ? 'turret' : 'pilot'] += (st.dps || 0) * slot.c;
    if (slot.k === 'Missile') { t.missiles += (st.dmg || 0) * slot.c; t.mcount += slot.c; }
    if (slot.k === 'Shield') { t.shield += (st.shp || 0) * slot.c; t.regen += (st.regen || 0) * slot.c; }
    if (slot.k === 'PowerPlant') t.power += (st.gen || 0) * slot.c;
    if (slot.k === 'Cooler') t.cooling += (st.cool || 0) * slot.c;
    if (slot.k === 'WeaponMining') t.mining += (st.pow || 0) * slot.c;
    if (slot.k === 'QuantumDrive' && !t.qt) t.qt = st;
  });
  return t;
}

// ▲ / ▼ next to a value that differs from stock, green when it's an upgrade.
function delta(now, was, better, f = n0) {
  if (now == null || was == null || typeof now !== 'number' || Math.abs(now - was) < 1e-9 || !better) return '';
  const up = now > was;
  const good = better === 'high' ? up : !up;
  return ` <span class="${good ? 'good' : 'bad'}">${up ? '▲' : '▼'} ${f(Math.abs(now - was))}</span>`;
}

// ---------- ship picker ----------

function pickableShips() {
  if (!loData || !shipsData) return [];
  return shipsData.ships.filter((s) => loData.ships[s.id]);
}

function renderShipCombo() {
  const input = $('lo-ship');
  const list = $('lo-ship-list');
  const q = input.value.trim().toLowerCase();
  const matches = pickableShips().filter((s) => !q || `${s.n} ${s.full} ${s.mk} ${s.career} ${s.role}`.toLowerCase().includes(q)).slice(0, 60);
  loComboActive = Math.min(loComboActive, matches.length - 1);
  list.innerHTML = matches.length
    ? matches.map((s, i) => `<li class="${i === loComboActive ? 'active' : ''}" data-id="${esc(s.id)}"><span>${esc(s.n)}</span><span class="sub">${esc([s.mk, s.career].filter(Boolean).join(' · '))}</span></li>`).join('')
    : '<li class="none">No ship matches.</li>';
  list.hidden = false;
}

function chooseShip(id) {
  if (!loData?.ships[id]) return;
  loShip = id;
  loMissing = null;
  loPicks = {};
  loOpenSlot = null;
  $('lo-ship').value = shipInfo(id)?.n || id;
  $('lo-ship-list').hidden = true;
  saveLoadoutHash();
  renderLoadout();
}

// ---------- URL: #/ships/loadout/<ship id>/<slot>=<part>,… ----------

function saveLoadoutHash() {
  const picks = Object.entries(loPicks).map(([i, id]) => `${i}=${encodeURIComponent(id)}`).join(',');
  const hash = `#/ships/loadout${loShip ? `/${encodeURIComponent(loShip)}${picks ? `/${picks}` : ''}` : ''}`;
  if (location.hash !== hash) window.history.replaceState(null, '', hash);
}

function showLoadoutFromHash() {
  const [, page, tab, id, picks] = location.hash.split('/');
  if (page !== 'ships' || tab !== 'loadout') return;
  if (!loData) { loadLoadout(); return; }
  const shipId = id ? decodeURIComponent(id) : null;
  if (shipId && loData.ships[shipId]) {
    if (loShip !== shipId) loOpenSlot = null;
    loShip = shipId;
    loMissing = null;
    loPicks = {};
    const slots = loSlots();
    for (const pair of (picks || '').split(',')) {
      const [i, part] = pair.split('=');
      const slot = slots[Number(i)];
      const p = part && loItems.get(decodeURIComponent(part));
      if (slot && p && fits(p, slot) && p.id !== slot.d) loPicks[Number(i)] = p.id;
    }
    $('lo-ship').value = shipInfo(shipId)?.n || shipId;
  } else if (shipId) {
    loShip = null;
    loMissing = shipInfo(shipId)?.n || shipId;
  }
  renderLoadout();
}

// ---------- rendering ----------

function renderLoadout() {
  const body = $('lo-body');
  if (!loData) {
    body.innerHTML = `<p class="empty">${loError ? "Couldn't load the parts database. Try again later." : 'Loading parts…'}</p>`;
    return;
  }
  $('lo-summary').innerHTML = `${pickableShips().length} ships · ${fmt(loData.items.length)} parts · <span title="Shop prices are reported by players on UEX">Prices from UEX</span> · ${ago(loData.fetchedAt / 1000)}`;
  if (!loShip) {
    body.innerHTML = loMissing
      ? `<p class="empty">${esc(loMissing)} has no parts you can swap in game.</p>`
      : '<p class="empty">Choose a ship to see its parts and what you can swap.</p>';
    return;
  }
  const ship = shipInfo(loShip);
  const slots = loSlots();
  const stock = totals((slot) => stockOf(slot));
  const now = totals((slot, i) => partOf(slot, i));
  const changed = slots.map((s, i) => i).filter((i) => isChanged(slots[i], i));

  // Cost of the parts you swap in, at the cheapest shop for each.
  let cost = 0, unpriced = 0;
  for (const i of changed) {
    const shop = bestShop(partOf(slots[i], i));
    if (shop) cost += shop.p * slots[i].c; else unpriced += slots[i].c;
  }

  const card = (label, value, sub = '') => `<div class="card"><div class="label">${label}</div><div class="value">${value}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
  const vs = (a, b, better, f = n0) => `${f(a)}${delta(a, b, better, f)}`;
  const cards = [
    stock.pilot || now.pilot ? card('Pilot gun DPS', vs(now.pilot, stock.pilot, 'high'), `Stock ${n0(stock.pilot)}`) : '',
    stock.turret || now.turret ? card('Turret DPS', vs(now.turret, stock.turret, 'high'), `Stock ${n0(stock.turret)}`) : '',
    now.mcount ? card('Missile damage', vs(now.missiles, stock.missiles, 'high'), `${now.mcount} missiles · stock ${n0(stock.missiles)}`) : '',
    stock.mining || now.mining ? card('Mining laser power', vs(now.mining, stock.mining, 'high'), `Stock ${n0(stock.mining)}`) : '',
    stock.shield || now.shield ? card('Shield HP', vs(now.shield, stock.shield, 'high'), `Regen ${n0(now.regen)} / s${delta(now.regen, stock.regen, 'high')}`) : '',
    stock.power || now.power ? card('Power output', vs(now.power, stock.power, 'high'), `Cooling ${n0(now.cooling)}${delta(now.cooling, stock.cooling, 'high')}`) : '',
    now.qt ? card('Quantum speed', `${n0(now.qt.qs / 1000)} km/s${delta(now.qt.qs / 1000, stock.qt?.qs / 1000, 'high')}`, `Spool ${fmt1(now.qt.spool)} s${delta(now.qt.spool, stock.qt?.spool, 'low', (v) => fmt1(v))}`) : '',
    card('Upgrade cost', changed.length ? `${fmt(cost)} aUEC` : '0 aUEC',
      changed.length ? `${changed.length} slot${changed.length > 1 ? 's' : ''} changed${unpriced ? ` · ${unpriced} part${unpriced > 1 ? 's' : ''} not sold in shops` : ''}` : 'Stock loadout'),
  ].join('');

  const sections = LO_SECTIONS.map((sec) => {
    const rows = slots.map((slot, i) => ({ slot, i })).filter((x) => x.slot.k === sec.k);
    if (!rows.length) return '';
    const count = rows.reduce((a, x) => a + x.slot.c, 0);
    return `
      <h2>${sec.label} <small class="muted">· ${count} slot${count > 1 ? 's' : ''}</small></h2>
      <div class="table-wrap"><table class="lo-table">
        <thead><tr><th>Slot</th><th>Part</th><th>Stats</th><th class="num">Cheapest</th><th>Where to buy</th><th></th></tr></thead>
        <tbody>${rows.map(({ slot, i }) => slotRow(slot, i)).join('')}</tbody>
      </table></div>`;
  }).join('');

  body.innerHTML = `
    <div class="ship-head lo-head">
      ${ship?.img ? `<img src="${esc(ship.img)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
      <div>
        <h3>${esc(ship?.full || loShip)}</h3>
        <div class="sub">${esc([ship?.career, ship?.role, ship?.size].filter(Boolean).join(' · '))}</div>
        <div class="lo-actions">
          <button id="lo-reset"${changed.length ? '' : ' disabled'}>Reset to stock</button>
          <button id="lo-copy" title="Copy a link to this loadout">Copy link</button>
          <a href="#/ships/${encodeURIComponent(loShip)}">Ship specs →</a>
        </div>
      </div>
    </div>
    <div class="summary lo-cards">${cards}</div>
    <p class="sub">Click a slot to compare every part that fits it. ▲▼ compare with the stock part. Prices are the cheapest reported in ${$('lo-system').value ? esc($('lo-system').value) : 'any system'}.</p>
    ${sections}
    ${shoppingList(slots, changed)}`;
}

function partName(p, slot) {
  if (!p) return `<span class="muted">${esc(slot?.dn || 'Empty')}</span>`;
  const badges = [p.g && `Grade ${p.g}`, p.cl].filter(Boolean).map((b) => `<span class="badge">${esc(b)}</span>`).join('');
  return `<div class="loc">${esc(p.n)}</div><div class="sub">${p.mk ? `${esc(p.mk)} ` : ''}${badges}</div>`;
}

// The two or three numbers that matter most, with the change against stock.
function keyStats(p, was) {
  if (!p) return '';
  return (STAT_DEFS[p.t] || []).slice(0, 3).filter((d) => p.st[d.k] != null && d.k !== 'fx').map((d) => {
    const v = p.st[d.k];
    const shown = d.f(v, p);
    const dl = typeof v === 'number' && was && was.st[d.k] != null ? delta(v, was.st[d.k], d.better, (x) => d.f(x, p)) : '';
    return `<div><span class="muted">${d.label}</span> ${shown}${dl}</div>`;
  }).join('');
}

function shopCell(p) {
  if (!p) return { price: '', where: '' };
  const shops = shopsFor(p);
  if (!shops.length) {
    const how = [p.craft && 'craft', p.loot && 'loot'].filter(Boolean);
    const elsewhere = p.buy.length ? 'Not sold in this system' : 'Not sold in shops';
    return { price: '<span class="muted">—</span>', where: `<span class="muted">${elsewhere}${how.length ? ` · ${how.join(' or ')}` : ''}</span>` };
  }
  return {
    price: `<b>${fmt(shops[0].p)}</b> <span class="muted">aUEC</span>`,
    where: `${esc(shops[0].t)}${shops.length > 1 ? ` <span class="muted">+${shops.length - 1} more</span>` : ''}`,
  };
}

function slotRow(slot, i) {
  const p = partOf(slot, i);
  const stock = stockOf(slot);
  const changed = isChanged(slot, i);
  const open = loOpenSlot === i;
  const size = slot.s[0] === slot.s[1] ? `S${slot.s[0]}` : `S${slot.s[0]}–${slot.s[1]}`;
  const label = [slot.tu ? 'Turret' : null, slot.l].filter(Boolean).join(' · ');
  const { price, where } = shopCell(p);
  return `
    <tr class="clickable${open ? ' selected' : ''}${changed ? ' lo-changed' : ''}" data-slot="${i}">
      <td><div class="loc">${open ? '▾' : '▸'} ${slot.c > 1 ? `${slot.c}× ` : ''}${size}</div><div class="sub">${esc(label || LO_PART_LABELS[slot.k])}${slot.rack ? ` · ${esc(slot.rack)}` : ''}</div></td>
      <td>${partName(p, slot)}${changed ? `<div class="sub">Stock: ${esc(stock?.n || slot.dn || '—')}</div>` : '<div class="sub"><span class="badge">Stock</span></div>'}</td>
      <td class="lo-stats">${keyStats(p, changed ? stock : null)}</td>
      <td class="num">${price}</td>
      <td>${where}</td>
      <td>${changed ? `<button class="lo-undo" data-undo="${i}" title="Put the stock part back">Undo</button>` : ''}</td>
    </tr>
    ${open ? `<tr class="detail"><td colspan="6">${slotDetail(slot, i)}</td></tr>` : ''}`;
}

// Every part that fits a slot, best first by its main stat, and where to buy the one fitted now.
function slotDetail(slot, i) {
  const current = partOf(slot, i);
  const stock = stockOf(slot);
  const soldOnly = $('lo-sold').checked;
  const defs = statDefs(slot.k).filter((d) => d.k !== 'fx');
  const main = defs[0];
  const keep = (p) => p.id === slot.d || p.id === current?.id;
  // The game files sometimes have two copies of a part under one name: list it once.
  const byName = new Map();
  for (const p of loData.items.filter((x) => fits(x, slot) && (keep(x) || !soldOnly || x.buy.length))) {
    const key = `${p.n}|${p.s}`;
    const had = byName.get(key);
    if (!had || (!keep(had) && (keep(p) || p.buy.length > had.buy.length))) byName.set(key, p);
  }
  const parts = [...byName.values()].sort((a, b) => (b.st[main.k] ?? -Infinity) - (a.st[main.k] ?? -Infinity) || a.n.localeCompare(b.n));
  const shown = defs.filter((d) => parts.some((p) => p.st[d.k] != null));

  const rows = parts.map((p) => {
    const { price, where } = shopCell(p);
    const on = p.id === current?.id;
    return `<tr class="clickable${on ? ' picked' : ''}" data-part="${esc(p.id)}">
      <td class="pick">${on ? '●' : ''}</td>
      <td>${partName(p)}${p.id === slot.d ? '<div class="sub"><span class="badge">Stock</span></div>' : ''}</td>
      <td class="num">S${p.s}</td>
      ${shown.map((d) => {
        const v = p.st[d.k];
        if (v == null) return '<td class="num muted">—</td>';
        const dl = typeof v === 'number' && stock && stock.st[d.k] != null && p.id !== stock.id ? delta(v, stock.st[d.k], d.better, (x) => d.f(x, p)) : '';
        return `<td class="num">${d.f(v, p)}${dl}</td>`;
      }).join('')}
      <td class="num">${price}</td>
      <td>${where}</td>
    </tr>`;
  }).join('');

  const shops = shopsFor(current);
  const shopList = current && current.buy.length ? `
    <div class="lo-shops">
      <div class="subhead">Where to buy ${esc(current.n)}${slot.c > 1 ? ` <span class="muted">(you need ${slot.c})</span>` : ''}</div>
      ${shops.length ? shops.map((b) => `<div class="shop-row"><span>${esc(b.t)}${b.sys ? ` <span class="muted">· ${esc(b.sys)}</span>` : ''}${b.at ? ` <span class="muted">· reported ${ago(b.at)}</span>` : ''}</span><b>${fmt(b.p)} aUEC${slot.c > 1 ? ` <span class="muted">· ${fmt(b.p * slot.c)} for ${slot.c}</span>` : ''}</b></div>`).join('')
        : `<div class="shop-row"><span class="muted">Not sold in ${esc($('lo-system').value)}. Sold in: ${esc([...new Set(current.buy.map((b) => b.sys).filter(Boolean))].join(', '))}.</span></div>`}
    </div>` : '';
  const fx = current?.st.fx?.length ? `<p class="sub">Modifiers: ${STAT_DEFS.WeaponMining[4].f(current.st.fx)}</p>` : '';

  return `
    <div class="lo-detail">
      ${shopList}${fx}
      <div class="subhead">${parts.length <= 1 && !loData.items.some((p) => fits(p, slot) && p.id !== slot.d)
        ? 'This is a bespoke mount: only the stock part fits it.'
        : `${parts.length} part${parts.length > 1 ? 's' : ''} fit this slot${soldOnly ? ' and are sold in shops' : ''}. Click one to fit it${slot.c > 1 ? ` to all ${slot.c}` : ''}.`}</div>
      <div class="table-wrap"><table class="compact lo-parts">
        <thead><tr><th></th><th>Part</th><th class="num">Size</th>${shown.map((d) => `<th class="num">${d.label}</th>`).join('')}<th class="num">Cheapest</th><th>Where</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      ${current?.wiki ? `<div class="sub"><a href="${esc(current.wiki)}" target="_blank" rel="noopener">${esc(current.n)} on the Star Citizen Wiki ↗</a></div>` : ''}
    </div>`;
}

// Parts to buy for the changed slots, grouped by the cheapest shop for each.
function shoppingList(slots, changed) {
  if (!changed.length) return '';
  const byShop = new Map();
  const nowhere = [];
  for (const i of changed) {
    const p = partOf(slots[i], i);
    const shop = bestShop(p);
    if (!shop) { nowhere.push({ p, c: slots[i].c }); continue; }
    if (!byShop.has(shop.t)) byShop.set(shop.t, { shop, lines: new Map() });
    const lines = byShop.get(shop.t).lines;
    const line = lines.get(p.id) || { p, c: 0, price: shop.p };
    line.c += slots[i].c;
    lines.set(p.id, line);
  }
  let total = 0;
  const cards = [...byShop.values()].sort((a, b) => b.lines.size - a.lines.size).map(({ shop, lines }) => {
    const sub = [...lines.values()].reduce((a, l) => a + l.price * l.c, 0);
    total += sub;
    return `<div class="spec-card">
      <h4>${esc(shop.t)}</h4>
      <div class="sub">${esc(shop.sys || '')}</div>
      ${[...lines.values()].map((l) => `<div class="shop-row"><span>${l.c}× ${esc(l.p.n)} <span class="muted">${esc(LO_PART_LABELS[l.p.t])} S${l.p.s}</span></span><b>${fmt(l.price * l.c)} aUEC</b></div>`).join('')}
      <div class="shop-row"><span class="muted">Subtotal</span><b>${fmt(sub)} aUEC</b></div>
    </div>`;
  }).join('');
  const missing = nowhere.length ? `<div class="spec-card"><h4>Not sold in shops</h4>
      ${nowhere.map((x) => `<div class="shop-row"><span>${x.c}× ${esc(x.p.n)}</span><span class="muted">${[x.p.craft && 'Craft', x.p.loot && 'Loot'].filter(Boolean).join(' or ') || 'Rewards or events'}${x.p.buy.length ? ' · sold in another system' : ''}</span></div>`).join('')}
    </div>` : '';
  return `
    <h2>Shopping list <small class="muted">· ${fmt(total)} aUEC at the cheapest shop for each part</small></h2>
    <p class="sub">Buy the parts, then fit them at a ship terminal (Vehicle Loadout Manager) or in your hangar. You can sell the stock parts you remove.</p>
    <div class="spec-grid">${cards}${missing}</div>`;
}

// ---------- events ----------

$('lo-ship').addEventListener('focus', () => loData && renderShipCombo());
$('lo-ship').addEventListener('input', () => { loComboActive = -1; if (loData) renderShipCombo(); });
$('lo-ship').addEventListener('keydown', (e) => {
  const items = [...$('lo-ship-list').querySelectorAll('li[data-id]')];
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!items.length) return;
    loComboActive = (loComboActive + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    renderShipCombo();
  } else if (e.key === 'Enter') {
    const pick = items[loComboActive] || items[0];
    if (pick) chooseShip(pick.dataset.id);
  } else if (e.key === 'Escape') {
    $('lo-ship-list').hidden = true;
  }
});
$('lo-ship-list').addEventListener('mousedown', (e) => {
  const li = e.target.closest('li[data-id]');
  if (li) { e.preventDefault(); chooseShip(li.dataset.id); }
});
$('lo-ship').addEventListener('blur', () => setTimeout(() => {
  $('lo-ship-list').hidden = true;
  if (loShip) $('lo-ship').value = shipInfo(loShip)?.n || loShip;
}, 150));
['lo-system', 'lo-sold'].forEach((id) => $(id).addEventListener('change', () => loData && renderLoadout()));

$('lo-body').addEventListener('click', async (e) => {
  if (e.target.closest('#lo-reset')) { loPicks = {}; saveLoadoutHash(); return renderLoadout(); }
  if (e.target.closest('#lo-copy')) {
    const btn = e.target.closest('#lo-copy');
    try { await navigator.clipboard.writeText(location.href); btn.textContent = 'Link copied'; } catch { btn.textContent = 'Copy the address bar'; }
    return;
  }
  const undo = e.target.closest('[data-undo]');
  if (undo) { delete loPicks[undo.dataset.undo]; saveLoadoutHash(); return renderLoadout(); }
  const part = e.target.closest('tr[data-part]');
  if (part && loOpenSlot != null) {
    if (e.target.closest('a')) return;
    const slot = loSlots()[loOpenSlot];
    if (part.dataset.part === slot.d) delete loPicks[loOpenSlot]; else loPicks[loOpenSlot] = part.dataset.part;
    saveLoadoutHash();
    return renderLoadout();
  }
  if (e.target.closest('a, tr.detail')) return;
  const row = e.target.closest('tr[data-slot]');
  if (!row) return;
  const i = Number(row.dataset.slot);
  loOpenSlot = loOpenSlot === i ? null : i;
  renderLoadout();
});

window.addEventListener('hashchange', showLoadoutFromHash);
showLoadoutFromHash();
