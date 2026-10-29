// SC Companion — front end.

const $ = (id) => document.getElementById(id);

const STATUS = { 1: 'Out of stock', 2: 'Very low', 3: 'Low', 4: 'Medium', 5: 'High', 6: 'Very high', 7: 'Max' };
// For a shop that buys from you, an empty inventory is good news (it pays full price), so colours flip.
const SELL_STATUS = { 1: 'Empty', 2: 'Very low', 3: 'Low', 4: 'Medium', 5: 'High', 6: 'Very high', 7: 'Full' };
// Storage keys keep the old name so players don't lose saved settings and history after the rename.
const PREFS_KEY = 'sc-trade-companion';

let data = null;            // { commodities, terminals, prices, fetchedAt }
let terminalsById = new Map();
let commoditiesById = new Map();
let sellByCommodity = new Map(); // commodity id -> price rows of shops that buy it from you
let historyIndex = new Map();    // "terminal:commodity" -> [{ t, scu_buy, scu_sell_stock }]
let openSellRow = null;     // commodity id expanded in the Sell Finder
let openGroup = null;       // commodity id expanded in Best Routes
let openRoute = null;       // route key expanded inside that commodity

// ---------- helpers ----------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n) => (n == null || isNaN(n) ? '—' : Math.round(n).toLocaleString('en-US'));
// Reads a number input, ignoring the thousands separators shown in money fields.
const num = (el) => {
  const digits = el.value.replace(/[^\d]/g, '');
  return digits === '' ? null : Number(digits);
};

// Money fields show "1,250,000" while you type. The caret stays after the same digit.
function formatMoneyInput(el) {
  const digitsBeforeCaret = el.value.slice(0, el.selectionStart ?? el.value.length).replace(/[^\d]/g, '').length;
  const digits = el.value.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
  el.value = digits ? Number(digits).toLocaleString('en-US') : '';
  let pos = 0;
  for (let seen = 0; pos < el.value.length && seen < digitsBeforeCaret; pos++) if (/\d/.test(el.value[pos])) seen++;
  if (document.activeElement === el) el.setSelectionRange(pos, pos);
}

document.querySelectorAll('input.money').forEach((el) => {
  el.addEventListener('input', () => formatMoneyInput(el));
  formatMoneyInput(el);
});

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

function locCell(row) {
  const t = terminalsById.get(row.id_terminal);
  return `<div class="loc">${esc(t ? terminalName(t) : row.terminal_name)}</div><div class="sub">${esc(terminalPlace(t))}</div>`;
}

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

function cargoWarnings(c) {
  return [
    c?.is_illegal && '<span class="badge bad">Illegal</span>',
    c?.is_volatile_qt && '<span class="badge warn">QT volatile</span>',
    c?.is_volatile_time && '<span class="badge warn">Perishable</span>',
    c?.is_explosive && '<span class="badge warn">Explosive</span>',
  ].filter(Boolean).join('');
}

const PREF_VALUES = ['s-location', 's-cargo', 's-budget', 's-sort', 'p-budget', 'p-cargo', 'p-from', 'p-system', 'p-age'];
const PREF_CHECKS = ['s-cross', 'p-same', 'p-mix', 'p-illegal'];

function savePrefs() {
  const prefs = {};
  for (const id of PREF_VALUES) prefs[id] = $(id).value;
  for (const id of PREF_CHECKS) prefs[id] = $(id).checked;
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
}

function setOptions(select, options) {
  const current = select.value;
  select.innerHTML = options;
  if ([...select.options].some((o) => o.value === current)) select.value = current;
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
      .map((t) => {
        const rest = terminalPlace(t).split(' › ').filter((part) => part !== sys).join(' › ');
        return `<option value="${t.id}">${esc(terminalName(t))}${rest ? ' — ' + esc(rest) : ''}</option>`;
      })
      .join('') +
    '</optgroup>'
  ).join('');
}

// A shop reporting "out of stock" with 0 SCU really has nothing; 0 SCU with another status just means unknown.
const outOfStock = (b) => b.status_buy === 1 && !(b.scu_buy > 0);

// How many SCU you can actually move on a route.
function tradeableScu({ cargo, budget, buyPrice, buyStock, sellDemand }) {
  let scu = cargo;
  if (buyStock > 0) scu = Math.min(scu, buyStock);
  if (sellDemand > 0) scu = Math.min(scu, sellDemand);
  if (budget > 0 && buyPrice > 0) scu = Math.min(scu, Math.floor(budget / buyPrice));
  return Math.max(0, scu);
}

// Small inline chart of a shop's stock over the last 24 h of refreshes.
function sparkline(terminal, commodity, key) {
  const series = historyIndex.get(`${terminal}:${commodity}`) || [];
  if (series.length < 2) return '<span class="muted sub" title="Builds up while this page is open: one point every 15 minutes">collecting…</span>';
  const W = 110, H = 26;
  const vals = series.map((s) => s[key] || 0);
  const max = Math.max(...vals, 1);
  const t0 = series[0].t, t1 = series[series.length - 1].t;
  const pts = series.map((s, i) => `${(((s.t - t0) / Math.max(1, t1 - t0)) * (W - 4) + 2).toFixed(1)},${(H - 3 - (vals[i] / max) * (H - 6)).toFixed(1)}`).join(' ');
  const first = vals[0], last = vals[vals.length - 1];
  const title = `${fmt(first)} → ${fmt(last)} SCU over ${series.length} refreshes (${new Date(t0).toLocaleTimeString()} – ${new Date(t1).toLocaleTimeString()})`;
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><title>${esc(title)}</title><polyline points="${pts}" fill="none" stroke="#3fc1ff" stroke-width="1.5"/></svg>`;
}

// ---------- data loading ----------
// The site talks to the public UEX Corp API straight from the browser (it allows cross-origin reads),
// so it can be hosted as plain static files. Nothing here touches the game client.

const API = 'https://api.uexcorp.space/2.0';
const REFRESH_MS = 15 * 60 * 1000;
const HISTORY_KEEP = 96; // 96 snapshots x 15 min = 24 h

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));

// Compact snapshots: { t, rows: [[terminal, commodity, priceBuy, priceSell, scuBuy, scuSellStock, scuSell]] }
let snapshots = [];
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

    // A page reload minutes after the last refresh replaces that snapshot instead of adding a near-duplicate.
    if (snapshots.length && Date.now() - snapshots[snapshots.length - 1].t < 5 * 60 * 1000) snapshots.pop();
    // Previous snapshot, so tables can show what changed.
    const prev = new Map();
    const last = snapshots[snapshots.length - 1];
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

    snapshots.push({
      t: fetchedAt,
      rows: prices.map((p) => [p.id_terminal, p.id_commodity, p.price_buy, p.price_sell, p.scu_buy, p.scu_sell_stock, p.scu_sell]),
    });
    if (snapshots.length > HISTORY_KEEP) snapshots.splice(0, snapshots.length - HISTORY_KEEP);
    historyStore.save(snapshots);

    buildIndexes();
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

function buildIndexes() {
  terminalsById = new Map(data.terminals.map((t) => [t.id, t]));
  commoditiesById = new Map(data.commodities.map((c) => [c.id, c]));

  sellByCommodity = new Map();
  for (const p of data.prices) {
    if (!(p.price_sell > 0)) continue;
    if (!sellByCommodity.has(p.id_commodity)) sellByCommodity.set(p.id_commodity, []);
    sellByCommodity.get(p.id_commodity).push(p);
  }
  for (const list of sellByCommodity.values()) list.sort((a, b) => b.price_sell - a.price_sell);

  historyIndex = new Map();
  for (const snap of snapshots) {
    for (const r of snap.rows) {
      const key = `${r[0]}:${r[1]}`;
      if (!historyIndex.has(key)) historyIndex.set(key, []);
      historyIndex.get(key).push({ t: snap.t, scu_buy: r[4], scu_sell_stock: r[5] });
    }
  }
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
  const sellsSomething = new Set(data.prices.filter((p) => p.price_buy > 0).map((p) => p.id_terminal));
  const shops = data.terminals.filter((t) => sellsSomething.has(t.id));
  setOptions($('s-location'), terminalOptions(shops));
  setOptions($('p-from'), '<option value="">Anywhere</option>' + terminalOptions(shops));

  const systems = [...new Set(data.terminals.map((t) => t.star_system_name).filter(Boolean))].sort();
  setOptions($('p-system'), '<option value="">All systems</option>' + systems.map((s) => `<option>${esc(s)}</option>`).join(''));

  const kinds = [...new Set(data.commodities.map((c) => c.kind).filter(Boolean))].sort();
  setOptions($('c-kind'), '<option value="">All kinds</option>' + kinds.map((k) => `<option>${esc(k)}</option>`).join(''));

  if (!selectorsReady) {
    const prefs = loadPrefs();
    for (const [id, v] of Object.entries(prefs)) {
      const el = $(id);
      if (!el) continue;
      if (typeof v === 'boolean') el.checked = v;
      else if (el.tagName !== 'SELECT' || [...el.options].some((o) => o.value === v)) el.value = v;
    }
    document.querySelectorAll('input.money').forEach(formatMoneyInput);
    if (!prefs['s-location']) {
      const levski = shops.find((t) => terminalName(t) === 'Levski');
      if (levski) $('s-location').value = levski.id;
    }
    selectorsReady = true;
  }
}

// ---------- Sell Finder ----------

function renderSell() {
  const tid = Number($('s-location').value);
  const here = terminalsById.get(tid);
  const cargo = num($('s-cargo')) || 0;
  const budget = num($('s-budget'));
  const cross = $('s-cross').checked;
  const sortBy = $('s-sort').value;
  const rows = data.prices.filter((p) => p.id_terminal === tid);

  const goods = rows
    .filter((p) => p.price_buy > 0)
    .map((g) => {
      const dests = (sellByCommodity.get(g.id_commodity) || []).filter((s) =>
        s.id_terminal !== tid && (cross || terminalsById.get(s.id_terminal)?.star_system_name === here?.star_system_name));
      const best = dests[0];
      const margin = best ? best.price_sell - g.price_buy : null;
      const scu = best ? tradeableScu({ cargo, budget, buyPrice: g.price_buy, buyStock: g.scu_buy, sellDemand: best.scu_sell }) : 0;
      return { g, c: commoditiesById.get(g.id_commodity), dests, best, margin, scu, profit: margin != null ? margin * scu : null };
    })
    .sort((a, b) => {
      const ka = sortBy === 'profit' ? a.profit : a.margin;
      const kb = sortBy === 'profit' ? b.profit : b.margin;
      return (kb ?? -Infinity) - (ka ?? -Infinity);
    });

  // Summary
  const features = [];
  if (here?.has_loading_dock) features.push('Loading dock');
  if (here?.has_freight_elevator) features.push('Freight elevator');
  if (here?.is_auto_load) features.push('Auto-load');
  if (here?.is_refuel) features.push('Refuel');
  if (here?.is_repair) features.push('Repair');
  if (here?.is_nqa) features.push('<span class="bad">No questions asked</span>');
  const top = goods
    .filter((x) => x.margin > 0 && x.scu > 0 && !outOfStock(x.g))
    .reduce((a, b) => (!a || b.profit > a.profit ? b : a), null);
  $('s-summary').innerHTML = !here ? '' : `
    <div class="card"><div class="label">You are at</div><div class="value">${esc(terminalName(here))}</div><div class="sub">${esc(terminalPlace(here))}${here.faction_name ? ' · ' + esc(here.faction_name) : ''}</div></div>
    <div class="card"><div class="label">Shop</div><div class="value">${goods.length} goods for sale</div><div class="sub">Max box ${here.max_container_size ? here.max_container_size + ' SCU' : '—'}${features.length ? ' · ' + features.join(' · ') : ''}</div></div>
    ${top ? `<div class="card highlight"><div class="label">Best buy here for ${fmt(top.scu)} SCU</div><div class="value">${esc(top.c?.name || top.g.commodity_name)} → ${esc(terminalName(terminalsById.get(top.best.id_terminal)) || top.best.terminal_name)}</div><div class="sub"><span class="good">+${fmt(top.margin)} / SCU · ${fmt(top.profit)} aUEC profit</span> for ${fmt(top.g.price_buy * top.scu)} invested</div></div>` : ''}`;

  // Goods for sale here
  if (!goods.length) {
    $('s-table').innerHTML = '<tr><td class="empty">This shop has no goods for sale.</td></tr>';
  } else {
    const COLS = 11;
    $('s-table').innerHTML = `
      <thead><tr>
        <th>Commodity</th><th class="num">Buy price / SCU</th><th class="num">In stock (SCU)</th><th>Stock level</th><th>24 h stock</th>
        <th>Best place to sell</th><th class="num">Sell price / SCU</th><th class="num">Profit / SCU</th>
        <th class="num">You can carry</th><th class="num">Est. profit</th><th>Reported</th>
      </tr></thead>
      <tbody>${goods.map((x) => {
        const open = openSellRow === x.g.id_commodity;
        const empty = outOfStock(x.g);
        return `
        <tr class="clickable${open ? ' selected' : ''}${empty ? ' dim' : ''}" data-commodity="${x.g.id_commodity}">
          <td><div class="loc">${open ? '▾' : '▸'} ${esc(x.c?.name || x.g.commodity_name)}</div><div class="sub">${cargoWarnings(x.c)}</div></td>
          <td class="num">${fmt(x.g.price_buy)}${delta(x.g.price_buy, x.g.prev?.price_buy)}</td>
          <td class="num">${fmt(x.g.scu_buy)}${delta(x.g.scu_buy, x.g.prev?.scu_buy)}</td>
          <td>${statusPill(x.g.status_buy)}</td>
          <td>${sparkline(tid, x.g.id_commodity, 'scu_buy')}</td>
          <td>${x.best ? locCell(x.best) : '<span class="muted">nowhere known</span>'}</td>
          <td class="num">${x.best ? fmt(x.best.price_sell) : '—'}</td>
          <td class="num ${x.margin > 0 ? 'good' : 'bad'}">${x.margin == null ? '—' : (x.margin > 0 ? '+' : '') + fmt(x.margin)}</td>
          <td class="num">${x.best ? fmt(x.scu) : '—'}</td>
          <td class="num ${x.profit > 0 ? 'good' : 'bad'}">${x.profit == null ? '—' : fmt(x.profit)}</td>
          <td class="${ageClass(x.g.date_modified)}">${ago(x.g.date_modified)}</td>
        </tr>
        ${open ? `<tr class="detail"><td colspan="${COLS}">${sellDetail(x, cargo, budget)}</td></tr>` : ''}`;
      }).join('')}
      </tbody>`;
  }

  // What this shop buys
  const buys = rows.filter((p) => p.price_sell > 0).sort((a, b) => a.commodity_name.localeCompare(b.commodity_name));
  $('s-buys-wrap').querySelector('summary').textContent = `What this shop buys from you (${buys.length})`;
  $('s-buys').innerHTML = !buys.length ? '<tr><td class="empty">This shop buys nothing.</td></tr>' : `
    <thead><tr>
      <th>Commodity</th><th class="num">Pays / SCU</th><th class="num">Their storage (SCU)</th><th>Storage level</th><th>24 h storage</th><th class="num">Will buy (SCU)</th><th>Reported</th>
    </tr></thead>
    <tbody>${buys.map((p) => `
      <tr>
        <td class="loc">${esc(p.commodity_name)}</td>
        <td class="num">${fmt(p.price_sell)}${delta(p.price_sell, p.prev?.price_sell)}</td>
        <td class="num">${fmt(p.scu_sell_stock)}${delta(p.scu_sell_stock, p.prev?.scu_sell_stock)}</td>
        <td>${statusPill(p.status_sell, true)}</td>
        <td>${sparkline(tid, p.id_commodity, 'scu_sell_stock')}</td>
        <td class="num">${p.scu_sell > 0 ? fmt(p.scu_sell) : '<span class="muted">unknown</span>'}</td>
        <td class="${ageClass(p.date_modified)}">${ago(p.date_modified)}</td>
      </tr>`).join('')}
    </tbody>`;
}

// Every place that buys one commodity, shown when a Sell Finder row is expanded.
function sellDetail(x, cargo, budget) {
  if (!x.dests.length) return '<div class="empty">No known shop buys this commodity.</div>';
  return `
    <table class="inner">
      <thead><tr>
        <th>#</th><th>Sell at</th><th class="num">Sell price / SCU</th><th class="num">Profit / SCU</th><th class="num">ROI</th>
        <th class="num">Will buy (SCU)</th><th>Their storage</th><th>24 h storage</th><th class="num">Est. profit</th><th>Max box</th><th>Reported</th>
      </tr></thead>
      <tbody>${x.dests.map((s, i) => {
        const t = terminalsById.get(s.id_terminal);
        const margin = s.price_sell - x.g.price_buy;
        const scu = tradeableScu({ cargo, budget, buyPrice: x.g.price_buy, buyStock: x.g.scu_buy, sellDemand: s.scu_sell });
        return `
        <tr>
          <td class="muted">${i + 1}</td>
          <td>${locCell(s)}</td>
          <td class="num">${fmt(s.price_sell)}${delta(s.price_sell, s.prev?.price_sell)}</td>
          <td class="num ${margin > 0 ? 'good' : 'bad'}">${margin > 0 ? '+' : ''}${fmt(margin)}</td>
          <td class="num">${x.g.price_buy > 0 ? ((margin / x.g.price_buy) * 100).toFixed(1) + '%' : '—'}</td>
          <td class="num">${s.scu_sell > 0 ? fmt(s.scu_sell) : '<span class="muted">unknown</span>'}</td>
          <td>${statusPill(s.status_sell, true)}</td>
          <td>${sparkline(s.id_terminal, s.id_commodity, 'scu_sell_stock')}</td>
          <td class="num ${margin > 0 ? 'good' : 'bad'}">${fmt(margin * scu)}</td>
          <td>${t?.max_container_size ? t.max_container_size + ' SCU' : '—'}</td>
          <td class="${ageClass(s.date_modified)}">${ago(s.date_modified)}</td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>`;
}

// ---------- Best Routes (investment planner) ----------

// Fill one cargo hold for a buy → sell pair. Greedy by profit per SCU (best when cargo is the limit)
// and by return on investment (best when money is the limit); keep whichever earns more.
function fillHold(items, cargo, budget, mix) {
  const run = (order) => {
    let space = cargo, money = budget > 0 ? budget : Infinity;
    const lines = [];
    for (const it of order) {
      let scu = Math.min(space, Math.floor(money / it.b.price_buy));
      if (it.b.scu_buy > 0) scu = Math.min(scu, it.b.scu_buy);
      if (it.s.scu_sell > 0) scu = Math.min(scu, it.s.scu_sell);
      if (scu <= 0) continue;
      lines.push({ ...it, scu });
      space -= scu;
      money -= scu * it.b.price_buy;
      if (!mix || space <= 0) break;
    }
    const profit = lines.reduce((s, l) => s + l.margin * l.scu, 0);
    const cost = lines.reduce((s, l) => s + l.b.price_buy * l.scu, 0);
    return { lines, profit, cost, scu: cargo - space };
  };
  const byMargin = run([...items].sort((a, b) => b.margin - a.margin));
  const byRoi = run([...items].sort((a, b) => b.margin / b.b.price_buy - a.margin / a.b.price_buy));
  return byRoi.profit > byMargin.profit ? byRoi : byMargin;
}

function planRoutes() {
  const budget = num($('p-budget'));
  const cargo = num($('p-cargo')) || 0;
  const fromId = Number($('p-from').value) || null;
  const system = $('p-system').value;
  const sameSystem = $('p-same').checked;
  const mix = $('p-mix').checked;
  const illegal = $('p-illegal').checked;
  const maxAgeHours = Number($('p-age').value) || null;
  const minDate = maxAgeHours ? Date.now() / 1000 - maxAgeHours * 3600 : 0;
  const inSystem = (t) => !system || t?.star_system_name === system;

  // Group every profitable (buy row, sell row) by the pair of shops.
  const pairs = new Map();
  for (const b of data.prices) {
    if (!(b.price_buy > 0) || outOfStock(b) || b.date_modified < minDate) continue;
    if (fromId && b.id_terminal !== fromId) continue;
    const c = commoditiesById.get(b.id_commodity);
    if (!c || (c.is_illegal && !illegal)) continue;
    const bt = terminalsById.get(b.id_terminal);
    if (!inSystem(bt)) continue;
    for (const s of sellByCommodity.get(b.id_commodity) || []) {
      if (s.price_sell <= b.price_buy) break; // sorted by price, nothing further is profitable
      if (s.id_terminal === b.id_terminal || s.date_modified < minDate) continue;
      const st = terminalsById.get(s.id_terminal);
      if (!inSystem(st) || (sameSystem && bt?.star_system_name !== st?.star_system_name)) continue;
      const key = `${b.id_terminal}>${s.id_terminal}`;
      if (!pairs.has(key)) pairs.set(key, { key, bt, st, buyId: b.id_terminal, sellId: s.id_terminal, items: [] });
      pairs.get(key).items.push({ c, b, s, margin: s.price_sell - b.price_buy });
    }
  }

  const plans = [];
  for (const pair of pairs.values()) {
    const fill = fillHold(pair.items, cargo, budget, mix);
    if (fill.profit > 0) plans.push({ ...pair, ...fill });
  }
  plans.sort((a, b) => b.profit - a.profit);
  return { plans, budget, cargo };
}

function routeName(row, t) {
  return esc(t ? terminalName(t) : row.terminal_name);
}

function planLines(plan) {
  return `
    <table class="inner">
      <thead><tr>
        <th>Buy</th><th class="num">SCU</th><th class="num">Buy / SCU</th><th class="num">Cost</th>
        <th class="num">Stock at ${routeName(plan.lines[0].b, plan.bt)}</th><th>Stock level</th><th>24 h stock</th>
        <th class="num">Sell / SCU</th><th class="num">They'll buy</th><th>Their storage</th><th class="num">Profit</th><th>Reported</th>
      </tr></thead>
      <tbody>${plan.lines.map((l) => {
        const oldest = Math.min(l.b.date_modified, l.s.date_modified);
        return `
        <tr>
          <td><div class="loc">${esc(l.c.name)}</div><div class="sub">${cargoWarnings(l.c)}</div></td>
          <td class="num"><b>${fmt(l.scu)}</b></td>
          <td class="num">${fmt(l.b.price_buy)}${delta(l.b.price_buy, l.b.prev?.price_buy)}</td>
          <td class="num">${fmt(l.b.price_buy * l.scu)}</td>
          <td class="num">${fmt(l.b.scu_buy)}${delta(l.b.scu_buy, l.b.prev?.scu_buy)}</td>
          <td>${statusPill(l.b.status_buy)}</td>
          <td>${sparkline(l.b.id_terminal, l.b.id_commodity, 'scu_buy')}</td>
          <td class="num">${fmt(l.s.price_sell)}${delta(l.s.price_sell, l.s.prev?.price_sell)}</td>
          <td class="num">${l.s.scu_sell > 0 ? fmt(l.s.scu_sell) : '<span class="muted">unknown</span>'}</td>
          <td>${statusPill(l.s.status_sell, true)}</td>
          <td class="num good">${fmt(l.margin * l.scu)}</td>
          <td class="${ageClass(oldest)}">${ago(oldest)}</td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>`;
}

function renderRoutes() {
  const { plans, budget, cargo } = planRoutes();
  const best = plans[0];

  if (!best) {
    $('p-plan').innerHTML = '<div class="card empty">No profitable route with this investment and these filters. Try a bigger budget, more cargo space or fewer filters.</div>';
    $('p-table').innerHTML = '';
    return;
  }

  const roi = (p) => (p.cost > 0 ? ((p.profit / p.cost) * 100).toFixed(1) + '%' : '—');
  const boxNote = best.st?.max_container_size ? ` · max box ${best.st.max_container_size} SCU` : '';
  $('p-plan').innerHTML = `
    <div class="plan">
      <div class="plan-head">
        <div>
          <div class="label">Recommended for ${budget ? fmt(budget) + ' aUEC' : 'any budget'} and ${fmt(cargo)} SCU</div>
          <div class="route">
            <span>${routeName(best.lines[0].b, best.bt)}<small>${esc(terminalPlace(best.bt))}</small></span>
            <span class="arrow">→</span>
            <span>${routeName(best.lines[0].s, best.st)}<small>${esc(terminalPlace(best.st))}${boxNote}</small></span>
          </div>
        </div>
        <div class="plan-stats">
          <div><div class="label">Invest</div><div class="value">${fmt(best.cost)}</div></div>
          <div><div class="label">Profit</div><div class="value good">+${fmt(best.profit)}</div></div>
          <div><div class="label">Return</div><div class="value">${roi(best)}</div></div>
          <div><div class="label">Cargo used</div><div class="value">${fmt(best.scu)} / ${fmt(cargo)}</div></div>
        </div>
      </div>
      ${planLines(best)}
    </div>`;

  // One line per commodity (the item that earns the most on each route); click it for all its routes.
  const groups = new Map();
  for (const p of plans.slice(1)) {
    const main = p.lines.reduce((a, l) => (l.margin * l.scu > a.margin * a.scu ? l : a));
    if (!groups.has(main.c.id)) groups.set(main.c.id, { c: main.c, plans: [] });
    groups.get(main.c.id).plans.push(p);
  }
  const oldestOf = (p) => Math.min(...p.lines.flatMap((l) => [l.b.date_modified, l.s.date_modified]));
  const COLS = 10;

  $('p-table').innerHTML = `
    <thead><tr>
      <th>#</th><th>Commodity</th><th>Best buy at</th><th>Best sell at</th><th class="num">Invest</th><th class="num">Profit</th>
      <th class="num">Return</th><th class="num">Cargo used</th><th class="num">Routes</th><th>Oldest report</th>
    </tr></thead>
    <tbody>${[...groups.values()].slice(0, 30).map((g, i) => {
      const p = g.plans[0];
      const open = openGroup === g.c.id;
      return `
      <tr class="clickable${open ? ' selected' : ''}" data-group="${g.c.id}">
        <td class="muted">${open ? '▾' : '▸'} ${i + 1}</td>
        <td><div class="loc">${esc(g.c.name)}</div><div class="sub">${cargoWarnings(g.c)}${p.lines.length > 1 ? ` + ${p.lines.length - 1} other good${p.lines.length > 2 ? 's' : ''}` : ''}</div></td>
        <td>${locCell(p.lines[0].b)}</td>
        <td>${locCell(p.lines[0].s)}</td>
        <td class="num">${fmt(p.cost)}</td>
        <td class="num good">+${fmt(p.profit)}</td>
        <td class="num">${roi(p)}</td>
        <td class="num">${fmt(p.scu)}</td>
        <td class="num">${g.plans.length}</td>
        <td class="${ageClass(oldestOf(p))}">${ago(oldestOf(p))}</td>
      </tr>
      ${open ? `<tr class="detail"><td colspan="${COLS}">${groupRoutes(g, roi, oldestOf)}</td></tr>` : ''}`;
    }).join('')}
    </tbody>`;
}

// Every route for one commodity, best first. Click a route for its full buy list.
function groupRoutes(g, roi, oldestOf) {
  const COLS = 8;
  return `
    <table class="inner">
      <thead><tr>
        <th>Buy at</th><th>Sell at</th><th>What to buy</th><th class="num">Invest</th><th class="num">Profit</th>
        <th class="num">Return</th><th class="num">Cargo used</th><th>Oldest report</th>
      </tr></thead>
      <tbody>${g.plans.slice(0, 25).map((p) => {
        const open = openRoute === p.key;
        return `
        <tr class="clickable${open ? ' selected' : ''}" data-route="${p.key}">
          <td>${locCell(p.lines[0].b)}</td>
          <td>${locCell(p.lines[0].s)}</td>
          <td>${open ? '▾' : '▸'} ${p.lines.map((l) => `${fmt(l.scu)} SCU ${esc(l.c.name)}`).join('<br>')}</td>
          <td class="num">${fmt(p.cost)}</td>
          <td class="num good">+${fmt(p.profit)}</td>
          <td class="num">${roi(p)}</td>
          <td class="num">${fmt(p.scu)}</td>
          <td class="${ageClass(oldestOf(p))}">${ago(oldestOf(p))}</td>
        </tr>
        ${open ? `<tr class="detail"><td colspan="${COLS}">${planLines(p)}</td></tr>` : ''}`;
      }).join('')}
      </tbody>
    </table>
    ${g.plans.length > 25 ? `<div class="sub" style="margin-top:6px">Showing the best 25 of ${g.plans.length} routes.</div>` : ''}`;
}

// ---------- Commodity guide ----------

// Clicking a header cycles: first direction → reversed → back to A–Z by name.
// Numbers start highest first, text starts A–Z.
const COMMODITY_COLUMNS = [
  { key: 'name', label: 'Commodity', value: (c) => c.name },
  { key: 'kind', label: 'Kind', value: (c) => c.kind || null },
  { key: 'traits', label: 'Traits', num: false, first: 'desc', value: (c, s, m, tags) => (tags(c).match(/class="badge/g) || []).length || null },
  { key: 'buy', label: 'Cheapest buy', num: true, value: (c, s) => s.minBuy?.price_buy ?? null },
  { key: 'buyAt', label: 'Where', value: (c, s) => s.minBuy?.terminal_name ?? null },
  { key: 'sell', label: 'Best sell', num: true, value: (c, s) => s.maxSell?.price_sell ?? null },
  { key: 'sellAt', label: 'Where', value: (c, s) => s.maxSell?.terminal_name ?? null },
  { key: 'margin', label: 'Max margin', num: true, value: (c, s, marginOf) => marginOf(s) },
  { key: 'shops', label: 'Shops', num: true, value: (c, s) => s.buyAt + s.sellAt },
  { key: 'wiki' },
];
let commoditySort = null; // { key, dir: 'asc' | 'desc' } or null for the default A–Z

function cycleCommoditySort(key) {
  const col = COMMODITY_COLUMNS.find((k) => k.key === key);
  const first = col.first || (col.num ? 'desc' : 'asc');
  if (commoditySort?.key !== key) commoditySort = { key, dir: first };
  else if (commoditySort.dir === first) commoditySort = { key, dir: first === 'desc' ? 'asc' : 'desc' };
  else commoditySort = null;
  renderCommodities();
}

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

  const tags = (c) => cargoWarnings(c) + [
    c.is_raw && '<span class="badge">Raw ore</span>',
    c.is_refinable && '<span class="badge">Refinable</span>',
    c.is_refined && '<span class="badge">Refined</span>',
    c.is_harvestable && '<span class="badge">Harvestable</span>',
    c.is_fuel && '<span class="badge">Fuel</span>',
    c.is_temporary && '<span class="badge">Event</span>',
  ].filter(Boolean).join('');

  const marginOf = (s) => (s.minBuy && s.maxSell ? s.maxSell.price_sell - s.minBuy.price_buy : null);
  const col = COMMODITY_COLUMNS.find((k) => k.key === commoditySort?.key);
  const list = data.commodities
    .filter((c) => stats.has(c.id))
    .filter((c) => !kind || c.kind === kind)
    .filter((c) => !filter || `${c.name} ${c.code} ${c.kind}`.toLowerCase().includes(filter))
    .sort((a, b) => {
      if (col) {
        const va = col.value(a, stats.get(a.id), marginOf, tags);
        const vb = col.value(b, stats.get(b.id), marginOf, tags);
        // Empty values always go last, whatever the direction.
        if (va == null || vb == null) return va == null ? (vb == null ? 0 : 1) : -1;
        const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
        if (cmp) return commoditySort.dir === 'asc' ? cmp : -cmp;
      }
      return a.name.localeCompare(b.name);
    });

  const header = (k) => {
    if (!k.value) return `<th></th>`;
    const active = commoditySort?.key === k.key;
    const arrow = active ? (commoditySort.dir === 'asc' ? ' ▲' : ' ▼') : '';
    return `<th class="sortable${k.num ? ' num' : ''}${active ? ' sorted' : ''}" data-sort="${k.key}" title="Click to sort">${k.label}${arrow}</th>`;
  };

  $('c-table').innerHTML = `
    <thead><tr>${COMMODITY_COLUMNS.map(header).join('')}</tr></thead>
    <tbody>${list.map((c) => {
      const s = stats.get(c.id);
      const margin = marginOf(s);
      const open = openCommodity === c.id;
      return `
      <tr class="clickable${open ? ' selected' : ''}" data-commodity="${c.id}">
        <td><div class="loc">${open ? '▾' : '▸'} ${esc(c.name)}</div><div class="sub">${esc(c.code)}</div></td>
        <td>${esc(c.kind || '—')}</td>
        <td>${tags(c) || '<span class="muted">—</span>'}</td>
        <td class="num">${s.minBuy ? fmt(s.minBuy.price_buy) : '—'}</td>
        <td class="sub">${s.minBuy ? esc(s.minBuy.terminal_name) : ''}</td>
        <td class="num">${s.maxSell ? fmt(s.maxSell.price_sell) : '—'}</td>
        <td class="sub">${s.maxSell ? esc(s.maxSell.terminal_name) : ''}</td>
        <td class="num ${margin > 0 ? 'good' : ''}">${margin == null ? '—' : fmt(margin)}</td>
        <td class="num">${s.buyAt} buy · ${s.sellAt} sell</td>
        <td>${c.wiki ? `<a href="${esc(c.wiki)}" target="_blank" rel="noopener">wiki</a>` : ''}</td>
      </tr>
      ${open ? `<tr class="detail"><td colspan="${COMMODITY_COLUMNS.length}"><div id="c-explorer">${commodityExplorer(c)}</div></td></tr>` : ''}`;
    }).join('')}
    </tbody>`;
  return list;
}

// ---------- Commodity explorer: every buy and sell location, pick a pair, see profit or loss ----------

let openCommodity = null;
let explorer = { buyId: null, sellId: null, scu: null }; // picked terminals and quantity (null = automatic)

function explorerRows(c) {
  const buys = data.prices.filter((p) => p.id_commodity === c.id && p.price_buy > 0).sort((a, b) => a.price_buy - b.price_buy);
  const sells = sellByCommodity.get(c.id) || [];
  const buy = buys.find((p) => p.id_terminal === explorer.buyId) || buys.find((p) => !outOfStock(p)) || buys[0] || null;
  const sell = sells.find((p) => p.id_terminal === explorer.sellId) || sells.find((p) => p.id_terminal !== buy?.id_terminal) || null;
  return { buys, sells, buy, sell };
}

// Default quantity: 96 SCU, capped by the shop's stock and the buyer's demand when known.
function explorerScu(buy, sell) {
  if (explorer.scu != null) return explorer.scu;
  let scu = 96;
  if (buy?.scu_buy > 0) scu = Math.min(scu, buy.scu_buy);
  if (sell?.scu_sell > 0) scu = Math.min(scu, sell.scu_sell);
  return Math.max(1, scu);
}

function explorerCalc(c) {
  const { buy, sell } = explorerRows(c);
  if (!buy || !sell) return '';
  const scu = explorerScu(buy, sell);
  const bt = terminalsById.get(buy.id_terminal);
  const st = terminalsById.get(sell.id_terminal);
  const margin = sell.price_sell - buy.price_buy;
  const cost = buy.price_buy * scu;
  const revenue = sell.price_sell * scu;
  const profit = revenue - cost;
  const cls = profit >= 0 ? 'good' : 'bad';

  const notes = [];
  if (buy.scu_buy > 0 && scu > buy.scu_buy) notes.push(`<span class="warn">${esc(terminalName(bt))} only has ${fmt(buy.scu_buy)} SCU in stock.</span>`);
  if (sell.scu_sell > 0 && scu > sell.scu_sell) notes.push(`<span class="warn">${esc(terminalName(st))} only buys ${fmt(sell.scu_sell)} SCU.</span>`);
  if (bt && st && bt.star_system_name !== st.star_system_name) notes.push(`Needs a jump: ${esc(bt.star_system_name)} → ${esc(st.star_system_name)}.`);
  const boxes = [bt?.max_container_size, st?.max_container_size].filter(Boolean);
  if (boxes.length) notes.push(`Use boxes of ${Math.min(...boxes)} SCU or smaller.`);
  const oldest = Math.min(buy.date_modified, sell.date_modified);
  notes.push(`<span class="${ageClass(oldest)}">Oldest price reported ${ago(oldest)}.</span>`);

  return `
    <div class="calc-route">
      <div><div class="label">Buy at</div><div class="value">${esc(terminalName(bt) || buy.terminal_name)}</div><div class="sub">${esc(terminalPlace(bt))} · ${fmt(buy.price_buy)} / SCU</div></div>
      <div class="arrow">→</div>
      <div><div class="label">Sell at</div><div class="value">${esc(terminalName(st) || sell.terminal_name)}</div><div class="sub">${esc(terminalPlace(st))} · ${fmt(sell.price_sell)} / SCU</div></div>
    </div>
    <div class="calc-stats">
      <div><div class="label">Per SCU</div><div class="value ${cls}">${margin >= 0 ? '+' : ''}${fmt(margin)}</div></div>
      <div><div class="label">Cost</div><div class="value">${fmt(cost)}</div></div>
      <div><div class="label">Revenue</div><div class="value">${fmt(revenue)}</div></div>
      <div><div class="label">${profit >= 0 ? 'Profit' : 'Loss'}</div><div class="value ${cls}">${profit >= 0 ? '+' : ''}${fmt(profit)} aUEC</div></div>
      <div><div class="label">Return</div><div class="value ${cls}">${cost > 0 ? ((profit / cost) * 100).toFixed(1) + '%' : '—'}</div></div>
    </div>
    <div class="sub calc-notes">${notes.join(' ')}</div>`;
}

function commodityExplorer(c) {
  const { buys, sells, buy, sell } = explorerRows(c);
  const scu = explorerScu(buy, sell);

  const buyTable = !buys.length ? '<div class="empty">No shop sells this commodity. It has to be mined, harvested or looted.</div>' : `
    <table class="inner">
      <thead><tr><th></th><th>Location</th><th class="num">Price</th><th class="num">Stock</th><th>Level</th><th class="num">${sell ? 'Profit' : ''}</th></tr></thead>
      <tbody>${buys.map((p) => {
        const picked = p === buy;
        const m = sell ? sell.price_sell - p.price_buy : null;
        return `
        <tr class="clickable${picked ? ' picked' : ''}${outOfStock(p) ? ' dim' : ''}" data-pick="buy" data-terminal="${p.id_terminal}">
          <td class="pick">${picked ? '●' : '○'}</td>
          <td>${locCell(p)}<div class="sub ${ageClass(p.date_modified)}">reported ${ago(p.date_modified)}</div></td>
          <td class="num">${fmt(p.price_buy)}${delta(p.price_buy, p.prev?.price_buy)}</td>
          <td class="num">${fmt(p.scu_buy)}${delta(p.scu_buy, p.prev?.scu_buy)}</td>
          <td>${statusPill(p.status_buy)}</td>
          <td class="num ${m >= 0 ? 'good' : 'bad'}">${m == null ? '' : (m >= 0 ? '+' : '') + fmt(m)}</td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>`;

  const sellTable = !sells.length ? '<div class="empty">No shop buys this commodity.</div>' : `
    <table class="inner">
      <thead><tr><th></th><th>Location</th><th class="num">Price</th><th class="num">Will buy</th><th>Storage</th><th class="num">${buy ? 'Profit' : ''}</th></tr></thead>
      <tbody>${sells.map((p) => {
        const picked = p === sell;
        const m = buy ? p.price_sell - buy.price_buy : null;
        return `
        <tr class="clickable${picked ? ' picked' : ''}" data-pick="sell" data-terminal="${p.id_terminal}">
          <td class="pick">${picked ? '●' : '○'}</td>
          <td>${locCell(p)}<div class="sub ${ageClass(p.date_modified)}">reported ${ago(p.date_modified)}</div></td>
          <td class="num">${fmt(p.price_sell)}${delta(p.price_sell, p.prev?.price_sell)}</td>
          <td class="num">${p.scu_sell > 0 ? fmt(p.scu_sell) : '<span class="muted">unknown</span>'}</td>
          <td>${statusPill(p.status_sell, true)}</td>
          <td class="num ${m >= 0 ? 'good' : 'bad'}">${m == null ? '' : (m >= 0 ? '+' : '') + fmt(m)}</td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>`;

  return `
    ${buy && sell ? `
    <div class="calc">
      <div class="calc-head">
        <h3>Profit calculator</h3>
        <label>Quantity (SCU) <input id="c-scu" type="number" min="1" step="1" value="${scu}"></label>
      </div>
      <div id="c-calc">${explorerCalc(c)}</div>
    </div>` : ''}
    <div class="explorer">
      <div><h3>Where to buy (${buys.length}) <span class="sub">· click to pick · prices per SCU</span></h3>${buyTable}</div>
      <div><h3>Where to sell (${sells.length}) <span class="sub">· click to pick · prices per SCU</span></h3>${sellTable}</div>
    </div>`;
}

// ---------- wiring ----------

function renderAll() {
  renderSell();
  renderRoutes();
  renderCommodities();
  renderHome();
}

// ---------- Front page ----------

function renderHome() {
  const tradeShops = new Set(data.prices.map((p) => p.id_terminal)).size;
  const tradeable = new Set(data.prices.map((p) => p.id_commodity)).size;
  const fresh = data.prices.filter((p) => Date.now() / 1000 - p.date_modified < 24 * 3600).length;
  $('home-stats').innerHTML = `
    <div><div class="value">${fmt(tradeable)}</div><div class="label">commodities tracked</div></div>
    <div><div class="value">${fmt(tradeShops)}</div><div class="label">trade terminals</div></div>
    <div><div class="value">${fmt(data.prices.length)}</div><div class="label">prices &amp; stock levels</div></div>
    <div><div class="value">${fmt(fresh)}</div><div class="label">reported in the last 24 h</div></div>`;

  // Sell Finder: best buy at the player's saved location, by total profit for their cargo (like the Sell Finder card).
  const here = terminalsById.get(Number($('s-location').value));
  const cargo = num($('s-cargo')) || 0;
  const budget = num($('s-budget'));
  let bestHere = null;
  for (const g of data.prices) {
    if (g.id_terminal !== here?.id || !(g.price_buy > 0) || outOfStock(g)) continue;
    const s = (sellByCommodity.get(g.id_commodity) || []).find((x) => x.id_terminal !== g.id_terminal);
    if (!s || s.price_sell <= g.price_buy) continue;
    const scu = tradeableScu({ cargo, budget, buyPrice: g.price_buy, buyStock: g.scu_buy, sellDemand: s.scu_sell });
    const profit = (s.price_sell - g.price_buy) * scu;
    if (scu > 0 && (!bestHere || profit > bestHere.profit)) bestHere = { g, s, scu, profit };
  }
  $('home-sell').innerHTML = bestHere
    ? `<span class="label">At ${esc(terminalName(here))}:</span> buy ${fmt(bestHere.scu)} SCU <b>${esc(bestHere.g.commodity_name)}</b> for ${fmt(bestHere.g.price_buy)}, sell at ${esc(terminalName(terminalsById.get(bestHere.s.id_terminal)) || bestHere.s.terminal_name)}, <span class="good">+${fmt(bestHere.profit)} aUEC</span>`
    : '';

  // Best Routes: the current recommendation with the player's saved planner settings.
  const plan = planRoutes();
  const p = plan.plans[0];
  $('home-routes').innerHTML = p
    ? `<span class="label">${plan.budget ? fmt(plan.budget) + ' aUEC' : 'Any budget'}, ${fmt(plan.cargo)} SCU:</span> ${p.lines.map((l) => `${fmt(l.scu)} SCU <b>${esc(l.c.name)}</b>`).join(', ')} from ${esc(terminalName(p.bt))} to ${esc(terminalName(p.st))}, <span class="good">+${fmt(p.profit)} aUEC</span>`
    : '';

  // Commodity Guide: the biggest margin anywhere.
  let top = null;
  for (const [cid, sells] of sellByCommodity) {
    const c = commoditiesById.get(cid);
    const minBuy = data.prices.filter((x) => x.id_commodity === cid && x.price_buy > 0).reduce((a, x) => (!a || x.price_buy < a.price_buy ? x : a), null);
    if (c && minBuy && (!top || sells[0].price_sell - minBuy.price_buy > top.margin)) top = { c, margin: sells[0].price_sell - minBuy.price_buy };
  }
  $('home-commodities').innerHTML = top
    ? `<span class="label">Biggest margin right now:</span> <b>${esc(top.c.name)}</b> <span class="good">+${fmt(top.margin)} / SCU</span>${top.c.is_illegal ? ' <span class="badge bad">Illegal</span>' : ''}`
    : '';
}

// ---------- navigation ----------
// Pages live in the URL hash (#/ and #/trade/<tab>) so links, bookmarks and the back button work.

function route() {
  const [, page = '', tab = 'sell'] = location.hash.split('/');
  const current = page === 'trade' ? 'trade' : 'home';
  document.querySelectorAll('.page').forEach((el) => el.classList.toggle('active', el.id === 'page-' + current));
  document.querySelectorAll('.main-nav .tab').forEach((el) => el.classList.toggle('active', el.dataset.page === current));
  document.querySelectorAll('.sub-nav .tab').forEach((el) => el.classList.toggle('active', el.dataset.tab === tab));
  document.querySelectorAll('.panel').forEach((el) => el.classList.toggle('active', el.id === 'tab-' + tab));
  if (current === 'home' && data) renderHome(); // reflect settings changed on the other pages
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();

const on = (ids, evt, fn) => ids.forEach((id) => $(id).addEventListener(evt, () => { if (data) { fn(); savePrefs(); } }));

on(['s-location'], 'change', () => { openSellRow = null; renderSell(); });
on(['s-cargo', 's-budget'], 'input', renderSell);
on(['s-sort', 's-cross'], 'change', renderSell);
on(['p-budget', 'p-cargo'], 'input', () => { openGroup = openRoute = null; renderRoutes(); });
on(['p-from', 'p-system', 'p-age', 'p-same', 'p-mix', 'p-illegal'], 'change', () => { openGroup = openRoute = null; renderRoutes(); });
on(['c-filter'], 'input', () => {
  // Typing a commodity's exact name or code (or narrowing to one result) opens it straight away.
  const filter = $('c-filter').value.trim().toLowerCase();
  const list = renderCommodities();
  const target = filter && (list.find((c) => c.name.toLowerCase() === filter || c.code.toLowerCase() === filter) || (list.length === 1 ? list[0] : null));
  if (target && openCommodity !== target.id) {
    openCommodity = target.id;
    explorer = { buyId: null, sellId: null, scu: null };
    renderCommodities();
  }
});
on(['c-kind'], 'change', renderCommodities);

$('c-table').addEventListener('click', (e) => {
  if (!data || e.target.closest('a, input, label')) return;
  const th = e.target.closest('th[data-sort]');
  if (th) return cycleCommoditySort(th.dataset.sort);

  const pick = e.target.closest('tr[data-pick]');
  if (pick) {
    explorer[pick.dataset.pick === 'buy' ? 'buyId' : 'sellId'] = Number(pick.dataset.terminal);
    const top = $('c-explorer').getBoundingClientRect().top;
    renderCommodities();
    window.scrollBy(0, $('c-explorer').getBoundingClientRect().top - top); // keep the view steady
    return;
  }

  const row = e.target.closest('tr[data-commodity]');
  if (row) {
    const id = Number(row.dataset.commodity);
    openCommodity = openCommodity === id ? null : id;
    explorer = { buyId: null, sellId: null, scu: null };
    renderCommodities();
  }
});

// Quantity changes only redraw the calculator, so the input keeps focus while typing.
$('c-table').addEventListener('input', (e) => {
  if (e.target.id !== 'c-scu') return;
  explorer.scu = Math.max(1, Number(e.target.value) || 1);
  const c = commoditiesById.get(openCommodity);
  if (c) $('c-calc').innerHTML = explorerCalc(c);
});

$('s-table').addEventListener('click', (e) => {
  const tr = e.target.closest('tr[data-commodity]');
  if (!tr) return;
  const id = Number(tr.dataset.commodity);
  openSellRow = openSellRow === id ? null : id;
  renderSell();
});

$('p-table').addEventListener('click', (e) => {
  const route = e.target.closest('tr[data-route]');
  const group = e.target.closest('tr[data-group]');
  if (route) {
    openRoute = openRoute === route.dataset.route ? null : route.dataset.route;
  } else if (group) {
    const id = Number(group.dataset.group);
    openGroup = openGroup === id ? null : id;
    openRoute = null;
  } else return;
  renderRoutes();
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
  snapshots = await historyStore.load();
  await refresh();
  setInterval(tick, 1000);
})();
