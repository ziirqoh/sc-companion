// SC Trade Companion — front end.

const $ = (id) => document.getElementById(id);

const STATUS = { 1: 'Out of stock', 2: 'Very low', 3: 'Low', 4: 'Medium', 5: 'High', 6: 'Very high', 7: 'Max' };
const PREFS_KEY = 'sc-trade-companion';

let data = null;          // { commodities, terminals, prices, fetchedAt, nextRefreshAt }
let terminalsById = new Map();
let commoditiesById = new Map();
let selectedHistory = null; // { terminal, commodity } of the inventory row being charted

// ---------- helpers ----------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n) => (n == null || isNaN(n) ? '—' : Math.round(n).toLocaleString('en-US'));
const num = (el) => (el.value === '' ? null : Number(el.value));

function ago(unixSeconds) {
  if (!unixSeconds) return '—';
  const mins = Math.max(0, Math.round((Date.now() / 1000 - unixSeconds) / 60));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function ageClass(unixSeconds) {
  const hours = (Date.now() / 1000 - unixSeconds) / 3600;
  return hours > 72 ? 'bad' : hours > 24 ? 'warn' : 'muted';
}

function terminalName(t) {
  return t?.displayname || t?.name || 'Unknown';
}

function terminalPlace(t) {
  if (!t) return '';
  const where = t.space_station_name || t.city_name || t.outpost_name;
  const body = t.moon_name || t.planet_name;
  return [t.star_system_name, body, where !== terminalName(t) ? where : null].filter(Boolean).join(' › ');
}

// For a shop that buys from you, an empty inventory is good news (it pays full price), so colours flip.
const SELL_STATUS = { 1: 'Empty', 2: 'Very low', 3: 'Low', 4: 'Medium', 5: 'High', 6: 'Very high', 7: 'Full' };

function statusPill(s, sellSide = false) {
  if (!s) return '<span class="muted">—</span>';
  return sellSide
    ? `<span class="status-pill s${8 - s}">${SELL_STATUS[s]}</span>`
    : `<span class="status-pill s${s}">${STATUS[s]}</span>`;
}

function delta(now, before) {
  if (before == null || now == null || now === before) return '';
  const d = now - before;
  return `<span class="delta ${d > 0 ? 'good' : 'bad'}">${d > 0 ? '▲' : '▼'}${fmt(Math.abs(d))}</span>`;
}

function savePrefs() {
  const prefs = {};
  for (const id of ['r-commodity', 'r-terminal', 'r-cargo', 'r-budget', 'r-sort', 'b-cargo', 'b-budget', 'b-system', 'b-from', 'i-terminal']) prefs[id] = $(id).value;
  for (const id of ['r-cross', 'b-same', 'b-illegal']) prefs[id] = $(id).checked;
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
}

function setOptions(select, options, keepValue = true) {
  const current = select.value;
  select.innerHTML = options;
  if (keepValue && [...select.options].some((o) => o.value === current)) select.value = current;
}

function terminalOptions(terminals) {
  const bySystem = new Map();
  for (const t of terminals) {
    const sys = t.star_system_name || 'Unknown';
    if (!bySystem.has(sys)) bySystem.set(sys, []);
    bySystem.get(sys).push(t);
  }
  return [...bySystem.keys()].sort().map((sys) =>
    `<optgroup label="${esc(sys)}">` +
    bySystem.get(sys)
      .sort((a, b) => terminalName(a).localeCompare(terminalName(b)))
      .map((t) => `<option value="${t.id}">${esc(terminalName(t))}${terminalPlace(t) ? ' — ' + esc(terminalPlace(t).replace(sys + ' › ', '')) : ''}</option>`)
      .join('') +
    '</optgroup>'
  ).join('');
}

// How many SCU you can actually move on a route.
function tradeableScu({ cargo, budget, buyPrice, buyStock, sellDemand }) {
  let scu = cargo;
  if (buyStock > 0) scu = Math.min(scu, buyStock);
  if (sellDemand > 0) scu = Math.min(scu, sellDemand);
  if (budget > 0 && buyPrice > 0) scu = Math.min(scu, Math.floor(budget / buyPrice));
  return Math.max(0, scu);
}

// ---------- data loading ----------
// The site talks to the public UEX Corp API straight from the browser (it allows cross-origin reads),
// so it can be hosted as plain static files. Nothing here touches the game client.

const API = 'https://api.uexcorp.space/2.0';
const REFRESH_MS = 15 * 60 * 1000;
const HISTORY_KEEP = 96; // 96 snapshots x 15 min = 24 h

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));

// Compact snapshots: { t, rows: [[terminal, commodity, priceBuy, priceSell, scuBuy, scuSellStock, scuSell]] }
let history = [];
let refreshing = false;
let lastError = null;
let nextRefreshAt = null;
let lastManualRefresh = 0;

// History lives in IndexedDB (too big for localStorage). If storage is blocked, it just stays in memory.
const historyStore = {
  db: null,
  async open() {
    try {
      this.db = await new Promise((resolve, reject) => {
        const req = indexedDB.open('sc-trade-companion', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('kv');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch { this.db = null; }
  },
  async load() {
    if (!this.db) return [];
    try {
      return await new Promise((resolve, reject) => {
        const req = this.db.transaction('kv').objectStore('kv').get('history');
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch { return []; }
  },
  save(value) {
    if (!this.db) return;
    try { this.db.transaction('kv', 'readwrite').objectStore('kv').put(value, 'history'); } catch {}
  },
};

async function getApi(endpoint) {
  const res = await fetch(`${API}/${endpoint}`, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${endpoint}: HTTP ${res.status}`);
  const body = await res.json();
  if (body.status !== 'ok') throw new Error(`${endpoint}: ${body.status}`);
  return body.data;
}

async function refresh() {
  if (refreshing) return;
  refreshing = true;
  updateStatus();
  try {
    const [commodities, terminals, prices] = await Promise.all([
      getApi('commodities'),
      getApi('terminals?type=commodity'),
      getApi('commodities_prices_all'),
    ]);

    // Previous snapshot, so the inventory table can show what changed.
    // A page reload minutes after the last refresh replaces that snapshot instead of adding a near-duplicate.
    if (history.length && Date.now() - history[history.length - 1].t < 5 * 60 * 1000) history.pop();
    const prev = new Map();
    const last = history[history.length - 1];
    if (last) for (const r of last.rows) prev.set(`${r[0]}:${r[1]}`, r);

    const fetchedAt = Date.now();
    data = {
      fetchedAt,
      commodities: commodities
        .filter((c) => c.is_visible)
        .map((c) => pick(c, [
          'id', 'name', 'code', 'kind', 'weight_scu', 'price_buy', 'price_sell',
          'is_buyable', 'is_sellable', 'is_illegal', 'is_volatile_qt', 'is_volatile_time',
          'is_explosive', 'is_raw', 'is_refined', 'is_refinable', 'is_mineral',
          'is_harvestable', 'is_fuel', 'is_temporary', 'wiki',
        ])),
      terminals: terminals.map((t) => pick(t, [
        'id', 'name', 'displayname', 'fullname', 'nickname', 'star_system_name', 'planet_name',
        'moon_name', 'orbit_name', 'space_station_name', 'city_name', 'outpost_name',
        'faction_name', 'max_container_size', 'has_loading_dock', 'has_freight_elevator',
        'has_docking_port', 'is_auto_load', 'is_refuel', 'is_repair', 'is_nqa', 'is_jump_point',
      ])),
      prices: prices.map((p) => {
        const r = prev.get(`${p.id_terminal}:${p.id_commodity}`);
        return { ...p, prev: r ? { price_buy: r[2], price_sell: r[3], scu_buy: r[4], scu_sell_stock: r[5], scu_sell: r[6] } : null };
      }),
    };

    history.push({
      t: fetchedAt,
      rows: prices.map((p) => [p.id_terminal, p.id_commodity, p.price_buy, p.price_sell, p.scu_buy, p.scu_sell_stock, p.scu_sell]),
    });
    if (history.length > HISTORY_KEEP) history.splice(0, history.length - HISTORY_KEEP);
    historyStore.save(history);

    terminalsById = new Map(data.terminals.map((t) => [t.id, t]));
    commoditiesById = new Map(data.commodities.map((c) => [c.id, c]));
    lastError = null;
    initSelectors();
    renderAll();
  } catch (err) {
    lastError = String(err.message || err);
  } finally {
    refreshing = false;
    nextRefreshAt = Date.now() + REFRESH_MS;
    updateStatus();
  }
}

function historyFor(terminal, commodity) {
  const series = [];
  for (const snap of history) {
    const r = snap.rows.find((row) => row[0] === terminal && row[1] === commodity);
    if (r) series.push({ t: snap.t, price_buy: r[2], price_sell: r[3], scu_buy: r[4], scu_sell_stock: r[5], scu_sell: r[6] });
  }
  return series;
}

function updateStatus() {
  const txt = $('status-text');
  if (refreshing) txt.textContent = 'Refreshing…';
  else if (lastError) txt.innerHTML = `<span class="error">Last refresh failed: ${esc(lastError)}</span>`;
  else if (data) txt.textContent = `Updated ${new Date(data.fetchedAt).toLocaleTimeString()}`;
}

// Runs every second: updates the countdown and triggers the 15-minute refresh.
// Checking the clock (instead of one long timer) also catches up after the tab was asleep.
function tick() {
  if (!nextRefreshAt) return;
  if (Date.now() >= nextRefreshAt && !refreshing) refresh();
  const secs = Math.max(0, Math.round((nextRefreshAt - Date.now()) / 1000));
  $('countdown').textContent = `· next in ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

// ---------- selectors ----------

let selectorsReady = false;

function initSelectors() {
  const prefs = selectorsReady ? {} : loadPrefs();

  // Commodities that can be bought somewhere.
  const buyable = new Set(data.prices.filter((p) => p.price_buy > 0).map((p) => p.id_commodity));
  const commodities = data.commodities.filter((c) => buyable.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  setOptions($('r-commodity'), commodities.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join(''));

  const systems = [...new Set(data.terminals.map((t) => t.star_system_name).filter(Boolean))].sort();
  setOptions($('b-system'), '<option value="">All systems</option>' + systems.map((s) => `<option>${esc(s)}</option>`).join(''));

  const tradingTerminals = new Set(data.prices.map((p) => p.id_terminal));
  const shops = data.terminals.filter((t) => tradingTerminals.has(t.id));
  setOptions($('i-terminal'), terminalOptions(shops));
  setOptions($('b-from'), '<option value="">Anywhere</option>' + terminalOptions(shops.filter((t) => data.prices.some((p) => p.id_terminal === t.id && p.price_buy > 0))));

  const kinds = [...new Set(data.commodities.map((c) => c.kind).filter(Boolean))].sort();
  setOptions($('c-kind'), '<option value="">All kinds</option>' + kinds.map((k) => `<option>${esc(k)}</option>`).join(''));

  if (!selectorsReady) {
    for (const [id, v] of Object.entries(prefs)) {
      const el = $(id);
      if (!el) continue;
      if (typeof v === 'boolean') el.checked = v;
      else if (el.tagName !== 'SELECT' || [...el.options].some((o) => o.value === v)) el.value = v;
    }
    // Default to the classic example: Construction Materials bought at Levski.
    if (!prefs['r-commodity']) {
      const cm = commodities.find((c) => c.name === 'Construction Materials');
      if (cm) $('r-commodity').value = cm.id;
    }
  }
  updateRouteTerminals(selectorsReady ? null : prefs['r-terminal'] || 'Levski');
  selectorsReady = true;
}

// Fill "Buying at" with terminals that sell the chosen commodity.
function updateRouteTerminals(preferred) {
  const cid = Number($('r-commodity').value);
  const rows = data.prices.filter((p) => p.id_commodity === cid && p.price_buy > 0);
  const terms = rows.map((p) => terminalsById.get(p.id_terminal) || { id: p.id_terminal, name: p.terminal_name });
  const before = $('r-terminal').value;
  setOptions($('r-terminal'), terminalOptions(terms));
  if (preferred) {
    const match = [...$('r-terminal').options].find((o) => o.value === String(preferred) || o.textContent.startsWith(preferred));
    if (match) $('r-terminal').value = match.value;
  }
  if ($('r-terminal').value !== before || !$('r-price').value) fillRoutePrice();
}

function fillRoutePrice() {
  const row = currentBuyRow();
  $('r-price').value = row ? row.price_buy : '';
}

function currentBuyRow() {
  const cid = Number($('r-commodity').value);
  const tid = Number($('r-terminal').value);
  return data.prices.find((p) => p.id_commodity === cid && p.id_terminal === tid);
}

// ---------- Sell finder ----------

function renderRoute() {
  const cid = Number($('r-commodity').value);
  const buyRow = currentBuyRow();
  const from = terminalsById.get(Number($('r-terminal').value));
  const price = num($('r-price')) ?? buyRow?.price_buy ?? 0;
  const cargo = num($('r-cargo')) || 0;
  const budget = num($('r-budget'));
  const cross = $('r-cross').checked;
  const sortBy = $('r-sort').value;

  const sells = data.prices
    .filter((p) => p.id_commodity === cid && p.price_sell > 0 && p.id_terminal !== buyRow?.id_terminal)
    .map((p) => {
      const t = terminalsById.get(p.id_terminal);
      const scu = tradeableScu({ cargo, budget, buyPrice: price, buyStock: buyRow?.scu_buy, sellDemand: p.scu_sell });
      const margin = p.price_sell - price;
      return { p, t, scu, margin, profit: margin * scu, roi: price > 0 ? (margin / price) * 100 : null };
    })
    .filter((r) => cross || !from || r.t?.star_system_name === from.star_system_name)
    .sort((a, b) => (sortBy === 'profit' ? b.profit - a.profit : b.p.price_sell - a.p.price_sell));

  const best = sells[0];
  const comm = commoditiesById.get(cid);
  const warnings = [];
  if (comm?.is_illegal) warnings.push('<span class="badge bad">Illegal — cargo scans</span>');
  if (comm?.is_volatile_qt) warnings.push('<span class="badge warn">Volatile in quantum</span>');
  if (comm?.is_volatile_time) warnings.push('<span class="badge warn">Decays over time</span>');
  if (comm?.is_explosive) warnings.push('<span class="badge warn">Explosive</span>');

  $('r-summary').innerHTML = !best ? '' : `
    <div class="card"><div class="label">Best sell location</div><div class="value">${esc(terminalName(best.t) || best.p.terminal_name)}</div><div class="sub">${esc(terminalPlace(best.t))}</div></div>
    <div class="card"><div class="label">Max sell price / SCU</div><div class="value good">${fmt(best.p.price_sell)} aUEC</div><div class="sub">margin ${best.margin >= 0 ? '+' : ''}${fmt(best.margin)} / SCU</div></div>
    <div class="card"><div class="label">Est. profit (${fmt(best.scu)} SCU)</div><div class="value ${best.profit >= 0 ? 'good' : 'bad'}">${fmt(best.profit)} aUEC</div><div class="sub">invest ${fmt(price * best.scu)} aUEC</div></div>
    ${buyRow ? `<div class="card"><div class="label">Stock at ${esc(terminalName(from))}</div><div class="value">${fmt(buyRow.scu_buy)} SCU</div><div class="sub">${statusPill(buyRow.status_buy)} reported ${ago(buyRow.date_modified)}</div></div>` : ''}
    ${warnings.length ? `<div class="card"><div class="label">Cargo warnings</div><div style="margin-top:6px">${warnings.join('')}</div></div>` : ''}`;

  if (!sells.length) {
    $('r-table').innerHTML = '<tr><td class="empty">No known place buys this commodity with these filters.</td></tr>';
    return;
  }

  $('r-table').innerHTML = `
    <thead><tr>
      <th>#</th><th>Sell at</th><th class="num">Sell price / SCU</th><th class="num">Margin / SCU</th><th class="num">ROI</th>
      <th class="num">Demand (SCU)</th><th title="How full their storage is. Empty = they pay full price.">Their storage</th><th class="num">You can sell</th><th class="num">Est. profit</th><th>Max box</th><th>Reported</th>
    </tr></thead>
    <tbody>${sells.map((r, i) => `
      <tr class="${i === 0 ? 'top' : ''}">
        <td class="muted">${i + 1}</td>
        <td><div class="loc">${esc(terminalName(r.t) || r.p.terminal_name)}</div><div class="sub">${esc(terminalPlace(r.t))}</div></td>
        <td class="num">${fmt(r.p.price_sell)}</td>
        <td class="num ${r.margin >= 0 ? 'good' : 'bad'}">${r.margin >= 0 ? '+' : ''}${fmt(r.margin)}</td>
        <td class="num">${r.roi == null ? '—' : r.roi.toFixed(1) + '%'}</td>
        <td class="num">${r.p.scu_sell > 0 ? fmt(r.p.scu_sell) : '<span class="muted">unknown</span>'}</td>
        <td>${statusPill(r.p.status_sell, true)}</td>
        <td class="num">${fmt(r.scu)}</td>
        <td class="num ${r.profit >= 0 ? 'good' : 'bad'}">${fmt(r.profit)}</td>
        <td>${r.t?.max_container_size ? r.t.max_container_size + ' SCU' : '—'}</td>
        <td class="${ageClass(r.p.date_modified)}">${ago(r.p.date_modified)}</td>
      </tr>`).join('')}
    </tbody>`;
}

// ---------- Best routes ----------

function renderBest() {
  const cargo = num($('b-cargo')) || 0;
  const budget = num($('b-budget'));
  const system = $('b-system').value;
  const fromId = Number($('b-from').value) || null;
  const sameSystem = $('b-same').checked;
  const illegal = $('b-illegal').checked;

  const byCommodity = new Map();
  for (const p of data.prices) {
    if (!byCommodity.has(p.id_commodity)) byCommodity.set(p.id_commodity, { buys: [], sells: [] });
    const g = byCommodity.get(p.id_commodity);
    if (p.price_buy > 0) g.buys.push(p);
    if (p.price_sell > 0) g.sells.push(p);
  }

  const inSystem = (t) => !system || t?.star_system_name === system;
  const routes = [];
  for (const [cid, g] of byCommodity) {
    const c = commoditiesById.get(cid);
    if (!c || (c.is_illegal && !illegal)) continue;
    for (const b of g.buys) {
      if (fromId && b.id_terminal !== fromId) continue;
      const bt = terminalsById.get(b.id_terminal);
      if (!inSystem(bt)) continue;
      for (const s of g.sells) {
        if (s.price_sell <= b.price_buy || s.id_terminal === b.id_terminal) continue;
        const st = terminalsById.get(s.id_terminal);
        if (!inSystem(st)) continue;
        if (sameSystem && bt?.star_system_name !== st?.star_system_name) continue;
        const scu = tradeableScu({ cargo, budget, buyPrice: b.price_buy, buyStock: b.scu_buy, sellDemand: s.scu_sell });
        if (scu <= 0) continue;
        const margin = s.price_sell - b.price_buy;
        routes.push({ c, b, s, bt, st, scu, margin, profit: margin * scu });
      }
    }
  }
  routes.sort((x, y) => y.profit - x.profit);
  const top = routes.slice(0, 100);

  if (!top.length) {
    $('b-table').innerHTML = '<tr><td class="empty">No profitable routes with these filters.</td></tr>';
    return;
  }

  $('b-table').innerHTML = `
    <thead><tr>
      <th>#</th><th>Commodity</th><th>Buy at</th><th class="num">Buy / SCU</th><th>Sell at</th><th class="num">Sell / SCU</th>
      <th class="num">Margin / SCU</th><th class="num">SCU</th><th class="num">Investment</th><th class="num">Est. profit</th><th>Oldest report</th>
    </tr></thead>
    <tbody>${top.map((r, i) => {
      const oldest = Math.min(r.b.date_modified, r.s.date_modified);
      return `
      <tr class="${i === 0 ? 'top' : ''}">
        <td class="muted">${i + 1}</td>
        <td><div class="loc">${esc(r.c.name)}</div><div class="sub">${esc(r.c.kind || '')}${r.c.is_illegal ? ' · <span class="bad">illegal</span>' : ''}</div></td>
        <td><div class="loc">${esc(terminalName(r.bt) || r.b.terminal_name)}</div><div class="sub">${esc(terminalPlace(r.bt))}</div></td>
        <td class="num">${fmt(r.b.price_buy)}</td>
        <td><div class="loc">${esc(terminalName(r.st) || r.s.terminal_name)}</div><div class="sub">${esc(terminalPlace(r.st))}</div></td>
        <td class="num">${fmt(r.s.price_sell)}</td>
        <td class="num good">+${fmt(r.margin)}</td>
        <td class="num">${fmt(r.scu)}</td>
        <td class="num">${fmt(r.b.price_buy * r.scu)}</td>
        <td class="num good">${fmt(r.profit)}</td>
        <td class="${ageClass(oldest)}">${ago(oldest)}</td>
      </tr>`;
    }).join('')}
    </tbody>`;
}

// ---------- Shop inventory ----------

function renderInventory() {
  const tid = Number($('i-terminal').value);
  const t = terminalsById.get(tid);
  const filter = $('i-filter').value.trim().toLowerCase();
  const rows = data.prices
    .filter((p) => p.id_terminal === tid && (!filter || p.commodity_name.toLowerCase().includes(filter)))
    .sort((a, b) => a.commodity_name.localeCompare(b.commodity_name));

  const features = [];
  if (t?.has_loading_dock) features.push('Loading dock');
  if (t?.has_freight_elevator) features.push('Freight elevator');
  if (t?.has_docking_port) features.push('Docking port');
  if (t?.is_auto_load) features.push('Auto-load');
  if (t?.is_refuel) features.push('Refuel');
  if (t?.is_repair) features.push('Repair');
  if (t?.is_nqa) features.push('<span class="bad">No-questions-asked (accepts illegal)</span>');

  const selling = rows.filter((p) => p.price_buy > 0);
  const totalStock = selling.reduce((s, p) => s + (p.scu_buy || 0), 0);
  $('i-info').innerHTML = !t ? '' : `
    <div class="card"><div class="label">Location</div><div class="value">${esc(terminalName(t))}</div><div class="sub">${esc(terminalPlace(t))}${t.faction_name ? ' · ' + esc(t.faction_name) : ''}</div></div>
    <div class="card"><div class="label">Goods for sale</div><div class="value">${selling.length}</div><div class="sub">${fmt(totalStock)} SCU in storage</div></div>
    <div class="card"><div class="label">Max container</div><div class="value">${t.max_container_size ? t.max_container_size + ' SCU' : '—'}</div><div class="sub">${features.join(' · ') || '&nbsp;'}</div></div>`;

  if (!rows.length) {
    $('i-table').innerHTML = '<tr><td class="empty">No commodity data for this shop.</td></tr>';
    $('i-history').innerHTML = '';
    return;
  }

  $('i-table').innerHTML = `
    <thead><tr>
      <th>Commodity</th>
      <th class="num">Shop sells at</th><th class="num">In stock (SCU)</th><th>Stock level</th>
      <th class="num">Shop buys at</th><th class="num">Shop inventory (SCU)</th><th class="num">Will buy (SCU)</th><th>Storage level</th>
      <th>Reported</th>
    </tr></thead>
    <tbody>${rows.map((p) => {
      const sel = selectedHistory && selectedHistory.terminal === tid && selectedHistory.commodity === p.id_commodity;
      return `
      <tr class="clickable${sel ? ' selected' : ''}" data-commodity="${p.id_commodity}">
        <td class="loc">${esc(p.commodity_name)}</td>
        <td class="num">${p.price_buy > 0 ? fmt(p.price_buy) + delta(p.price_buy, p.prev?.price_buy) : '<span class="muted">—</span>'}</td>
        <td class="num">${p.price_buy > 0 ? fmt(p.scu_buy) + delta(p.scu_buy, p.prev?.scu_buy) : '<span class="muted">—</span>'}</td>
        <td>${p.price_buy > 0 ? statusPill(p.status_buy) : ''}</td>
        <td class="num">${p.price_sell > 0 ? fmt(p.price_sell) + delta(p.price_sell, p.prev?.price_sell) : '<span class="muted">—</span>'}</td>
        <td class="num">${p.price_sell > 0 ? fmt(p.scu_sell_stock) + delta(p.scu_sell_stock, p.prev?.scu_sell_stock) : '<span class="muted">—</span>'}</td>
        <td class="num">${p.price_sell > 0 ? (p.scu_sell > 0 ? fmt(p.scu_sell) : '<span class="muted">unknown</span>') : '<span class="muted">—</span>'}</td>
        <td>${p.price_sell > 0 ? statusPill(p.status_sell, true) : ''}</td>
        <td class="${ageClass(p.date_modified)}">${ago(p.date_modified)}</td>
      </tr>`;
    }).join('')}
    </tbody>`;

  if (selectedHistory?.terminal === tid) renderHistory();
  else $('i-history').innerHTML = '';
}

function renderHistory() {
  const { terminal, commodity } = selectedHistory;
  const series = historyFor(terminal, commodity);
  const name = commoditiesById.get(commodity)?.name || '';
  const box = $('i-history');
  if (series.length < 2) {
    box.innerHTML = `<p class="hint">${esc(name)}: stock history builds up while this page is open (one point every 15 minutes, kept for 24 h in this browser). ${series.length} point so far.</p>`;
    return;
  }

  const isSellShop = series.some((s) => s.price_buy > 0);
  const key = isSellShop ? 'scu_buy' : 'scu_sell_stock';
  const W = 720, H = 180, P = 32;
  const vals = series.map((s) => s[key] || 0);
  const max = Math.max(...vals, 1);
  const t0 = series[0].t, t1 = series[series.length - 1].t;
  const x = (t) => P + ((t - t0) / Math.max(1, t1 - t0)) * (W - 2 * P);
  const y = (v) => H - P - (v / max) * (H - 2 * P);
  const pts = series.map((s) => `${x(s.t).toFixed(1)},${y(s[key] || 0).toFixed(1)}`).join(' ');

  box.innerHTML = `
    <p class="hint">${esc(name)} — ${isSellShop ? 'stock available to buy' : 'shop inventory'} over the last ${series.length} refreshes</p>
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px">
      <line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}" stroke="#24323f"/>
      <text x="${P - 4}" y="${P}" fill="#7f93a5" font-size="11" text-anchor="end">${fmt(max)}</text>
      <text x="${P - 4}" y="${H - P}" fill="#7f93a5" font-size="11" text-anchor="end">0</text>
      <text x="${P}" y="${H - 10}" fill="#7f93a5" font-size="11">${new Date(t0).toLocaleTimeString()}</text>
      <text x="${W - P}" y="${H - 10}" fill="#7f93a5" font-size="11" text-anchor="end">${new Date(t1).toLocaleTimeString()}</text>
      <polyline points="${pts}" fill="none" stroke="#3fc1ff" stroke-width="2"/>
      ${series.map((s) => `<circle cx="${x(s.t).toFixed(1)}" cy="${y(s[key] || 0).toFixed(1)}" r="3" fill="#3fc1ff"><title>${new Date(s.t).toLocaleString()}: ${fmt(s[key])} SCU</title></circle>`).join('')}
    </svg>`;
}

// ---------- Commodity guide ----------

function renderCommodities() {
  const filter = $('c-filter').value.trim().toLowerCase();
  const kind = $('c-kind').value;

  const stats = new Map();
  for (const p of data.prices) {
    if (!stats.has(p.id_commodity)) stats.set(p.id_commodity, { minBuy: null, maxSell: null, buyAt: 0, sellAt: 0 });
    const s = stats.get(p.id_commodity);
    if (p.price_buy > 0) { s.buyAt++; if (!s.minBuy || p.price_buy < s.minBuy.price_buy) s.minBuy = p; }
    if (p.price_sell > 0) { s.sellAt++; if (!s.maxSell || p.price_sell > s.maxSell.price_sell) s.maxSell = p; }
  }

  const list = data.commodities
    .filter((c) => stats.has(c.id))
    .filter((c) => !kind || c.kind === kind)
    .filter((c) => !filter || `${c.name} ${c.code} ${c.kind}`.toLowerCase().includes(filter))
    .sort((a, b) => a.name.localeCompare(b.name));

  const tags = (c) => [
    c.is_illegal && '<span class="badge bad">Illegal</span>',
    c.is_volatile_qt && '<span class="badge warn">QT volatile</span>',
    c.is_volatile_time && '<span class="badge warn">Perishable</span>',
    c.is_explosive && '<span class="badge warn">Explosive</span>',
    c.is_raw && '<span class="badge">Raw ore</span>',
    c.is_refinable && '<span class="badge">Refinable</span>',
    c.is_refined && '<span class="badge">Refined</span>',
    c.is_harvestable && '<span class="badge">Harvestable</span>',
    c.is_fuel && '<span class="badge">Fuel</span>',
    c.is_temporary && '<span class="badge">Event</span>',
  ].filter(Boolean).join('');

  $('c-table').innerHTML = `
    <thead><tr>
      <th>Commodity</th><th>Kind</th><th>Traits</th>
      <th class="num">Cheapest buy</th><th>Where</th><th class="num">Best sell</th><th>Where</th>
      <th class="num">Max margin</th><th class="num">Shops</th><th></th>
    </tr></thead>
    <tbody>${list.map((c) => {
      const s = stats.get(c.id);
      const margin = s.minBuy && s.maxSell ? s.maxSell.price_sell - s.minBuy.price_buy : null;
      return `
      <tr>
        <td><div class="loc">${esc(c.name)}</div><div class="sub">${esc(c.code)}</div></td>
        <td>${esc(c.kind || '—')}</td>
        <td>${tags(c) || '<span class="muted">—</span>'}</td>
        <td class="num">${s.minBuy ? fmt(s.minBuy.price_buy) : '—'}</td>
        <td class="sub">${s.minBuy ? esc(s.minBuy.terminal_name) : ''}</td>
        <td class="num">${s.maxSell ? fmt(s.maxSell.price_sell) : '—'}</td>
        <td class="sub">${s.maxSell ? esc(s.maxSell.terminal_name) : ''}</td>
        <td class="num ${margin > 0 ? 'good' : ''}">${margin == null ? '—' : fmt(margin)}</td>
        <td class="num">${s.buyAt} buy · ${s.sellAt} sell</td>
        <td>${c.wiki ? `<a href="${esc(c.wiki)}" target="_blank" rel="noopener">wiki</a>` : ''}</td>
      </tr>`;
    }).join('')}
    </tbody>`;
}

// ---------- wiring ----------

function renderAll() {
  renderRoute();
  renderBest();
  renderInventory();
  renderCommodities();
}

document.querySelectorAll('nav .tab').forEach((btn) =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('nav .tab').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + btn.dataset.tab));
  })
);

const on = (ids, evt, fn) => ids.forEach((id) => $(id).addEventListener(evt, () => { if (data) { fn(); savePrefs(); } }));

on(['r-commodity'], 'change', () => { updateRouteTerminals(); fillRoutePrice(); renderRoute(); });
on(['r-terminal'], 'change', () => { fillRoutePrice(); renderRoute(); });
on(['r-price', 'r-cargo', 'r-budget'], 'input', renderRoute);
on(['r-sort', 'r-cross'], 'change', renderRoute);
on(['b-cargo', 'b-budget'], 'input', renderBest);
on(['b-system', 'b-from', 'b-same', 'b-illegal'], 'change', renderBest);
on(['i-terminal'], 'change', () => { selectedHistory = null; renderInventory(); });
on(['i-filter'], 'input', renderInventory);
on(['c-filter'], 'input', renderCommodities);
on(['c-kind'], 'change', renderCommodities);

$('i-table').addEventListener('click', (e) => {
  const tr = e.target.closest('tr[data-commodity]');
  if (!tr) return;
  selectedHistory = { terminal: Number($('i-terminal').value), commodity: Number(tr.dataset.commodity) };
  renderInventory();
});

$('refresh-btn').addEventListener('click', async () => {
  // Be polite to the community API: at most one manual refresh per minute.
  if (Date.now() - lastManualRefresh < 60_000) {
    $('status-text').textContent = 'Wait a minute between manual refreshes.';
    return;
  }
  lastManualRefresh = Date.now();
  $('refresh-btn').disabled = true;
  await refresh();
  $('refresh-btn').disabled = false;
});

(async () => {
  await historyStore.open();
  history = await historyStore.load();
  await refresh();
  setInterval(tick, 1000);
})();
