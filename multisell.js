// SC Companion — Multi-Sell: several commodities you carry, and the one place that buys them all
// for the biggest total profit. Each row says where it was bought, so the profit counts what you paid.

const MULTI_PREFS_KEY = 'sc-companion-multisell';
const MULTI_MAX_ROWS = 6;

function loadMultiPrefs() {
  try { return JSON.parse(localStorage.getItem(MULTI_PREFS_KEY)) || {}; } catch { return {}; }
}

let multiRows = loadMultiPrefs().rows || [{ cid: null, qty: 0, from: null }, { cid: null, qty: 0, from: null }];
let multiUiReady = false;
let buyByCommodity = new Map(); // commodity id -> price rows of shops that sell it, cheapest first

function saveMultiPrefs() {
  const prefs = { rows: multiRows, system: $('m-system').value, at: $('m-at').value, age: $('m-age').value };
  try { localStorage.setItem(MULTI_PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

const multiShopName = (t, p) => esc(terminalName(t) || p?.terminal_name || '');

// The shops that sell a commodity, for the "Bought at" list.
function indexBuys() {
  buyByCommodity = new Map();
  for (const p of data.prices) {
    if (!(p.price_buy > 0)) continue;
    if (!buyByCommodity.has(p.id_commodity)) buyByCommodity.set(p.id_commodity, []);
    buyByCommodity.get(p.id_commodity).push(p);
  }
  for (const list of buyByCommodity.values()) list.sort((a, b) => a.price_buy - b.price_buy);
}

// Where you probably bought it: your Sell Finder location if it sells it, otherwise the cheapest shop.
function defaultFrom(cid) {
  const list = buyByCommodity.get(cid) || [];
  const here = Number($('s-location').value);
  return (list.find((p) => p.id_terminal === here) || list[0])?.id_terminal ?? null;
}

function drawMultiRows() {
  const choices = data.commodities.filter((c) => sellByCommodity.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  $('m-rows').innerHTML = multiRows.map((r, i) => {
    const buys = r.cid ? buyByCommodity.get(r.cid) || [] : [];
    return `
    <div class="crate-row" data-index="${i}">
      <label class="wide">Commodity
        <select data-field="cid">
          <option value="">Choose a commodity…</option>
          ${choices.map((c) => `<option value="${c.id}"${c.id === r.cid ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}
        </select>
      </label>
      <label>SCU
        <input type="number" min="0" step="1" data-field="qty" value="${r.qty || ''}" placeholder="0">
      </label>
      <label class="wide">Bought at
        <select data-field="from"${r.cid ? '' : ' disabled'}>
          <option value="">Not counted (no purchase cost)</option>
          ${buys.map((p) => `<option value="${p.id_terminal}"${p.id_terminal === r.from ? ' selected' : ''}>${multiShopName(terminalsById.get(p.id_terminal), p)} · ${fmt(p.price_buy)} / SCU</option>`).join('')}
        </select>
      </label>
      <button class="remove" data-remove="${i}" title="Remove this commodity"${multiRows.length === 1 ? ' disabled' : ''}>✕</button>
    </div>`;
  }).join('');
  $('m-add').disabled = multiRows.length >= MULTI_MAX_ROWS;
}

function initMultiUi() {
  const systems = [...new Set(data.terminals.map((t) => t.star_system_name).filter(Boolean))].sort();
  const sys = $('m-system');
  while (sys.options.length > 1) sys.remove(1);
  sys.insertAdjacentHTML('beforeend', systems.map((s) => `<option>${esc(s)}</option>`).join(''));
  const prefs = loadMultiPrefs();
  if (prefs.system && systems.includes(prefs.system)) sys.value = prefs.system;
  if (prefs.age != null && [...$('m-age').options].some((o) => o.value === prefs.age)) $('m-age').value = prefs.age;
  multiUiReady = true;
}

// Your load, one entry per commodity: SCU, what it cost, and where it came from.
function multiItems() {
  const merged = new Map();
  for (const r of multiRows) {
    const c = r.cid && commoditiesById.get(r.cid);
    if (!c || !(r.qty > 0) || !sellByCommodity.has(c.id)) continue;
    const buy = r.from ? (buyByCommodity.get(c.id) || []).find((p) => p.id_terminal === r.from) : null;
    const it = merged.get(c.id) || { c, qty: 0, cost: 0, counted: true, from: [] };
    it.qty += r.qty;
    if (buy) { it.cost += buy.price_buy * r.qty; it.from.push(buy); } else it.counted = false;
    merged.set(c.id, it);
  }
  return [...merged.values()];
}

// Fill the "Sell at" list with the places that buy at least one of your goods.
function fillSellAt(items, keep) {
  const sel = $('m-at');
  const wanted = sel.value || loadMultiPrefs().at || '';
  const ids = new Set();
  for (const { c } of items) for (const p of sellByCommodity.get(c.id) || []) if (keep(p)) ids.add(p.id_terminal);
  const list = [...ids].map((id) => terminalsById.get(id)).filter(Boolean).sort((a, b) => terminalName(a).localeCompare(terminalName(b)));
  while (sel.options.length > 1) sel.remove(1);
  sel.insertAdjacentHTML('beforeend', list.map((t) => `<option value="${t.id}">${esc(terminalName(t))} — ${esc(terminalPlace(t))}</option>`).join(''));
  sel.value = list.some((t) => String(t.id) === wanted) ? wanted : '';
}

function renderMultiSell() {
  if (!data) return;
  indexBuys();
  if (!multiUiReady) initMultiUi();
  if (!document.querySelector('#m-rows .crate-row') || $('m-rows').dataset.version !== String(data.fetchedAt)) {
    $('m-rows').dataset.version = data.fetchedAt;
    drawMultiRows();
  }

  const maxAgeHours = Number($('m-age').value) || null;
  const minDate = maxAgeHours ? Date.now() / 1000 - maxAgeHours * 3600 : 0;
  const system = $('m-system').value;
  const keep = (p) => p.date_modified >= minDate && (!system || terminalsById.get(p.id_terminal)?.star_system_name === system);

  const items = multiItems();
  fillSellAt(items, keep);
  $('m-results').hidden = !items.length;
  $('m-empty').hidden = !!items.length;
  $('m-illegal').hidden = !items.some(({ c }) => c.is_illegal);
  if (!items.length) return;

  const totalScu = items.reduce((s, x) => s + x.qty, 0);
  const totalCost = items.reduce((s, x) => s + x.cost, 0);
  const costPerScu = (it) => (it.qty ? it.cost / it.qty : 0);

  // Every place that buys at least one of your goods, with revenue and profit for what it will take.
  const shops = new Map();
  for (const { c } of items) {
    for (const p of sellByCommodity.get(c.id) || []) {
      if (!keep(p)) continue;
      if (!shops.has(p.id_terminal)) shops.set(p.id_terminal, { t: terminalsById.get(p.id_terminal), rows: new Map() });
      shops.get(p.id_terminal).rows.set(c.id, p);
    }
  }
  const stops = [...shops.values()].map((shop) => {
    let revenue = 0, profit = 0;
    const limited = [], lines = [];
    for (const it of items) {
      const p = shop.rows.get(it.c.id);
      if (!p) { lines.push({ it, p: null }); continue; }
      const scu = p.scu_sell > 0 ? Math.min(it.qty, p.scu_sell) : it.qty;
      if (scu < it.qty) limited.push(`${esc(it.c.name)}: only ${fmt(scu)} SCU`);
      const rev = scu * p.price_sell;
      const prof = rev - scu * costPerScu(it);
      revenue += rev;
      profit += prof;
      lines.push({ it, p, scu, rev, prof });
    }
    const missing = items.filter(({ c }) => !shop.rows.has(c.id)).map((x) => x.c);
    const oldest = Math.min(...[...shop.rows.values()].map((p) => p.date_modified));
    return { ...shop, revenue, profit, missing, limited, lines, oldest };
  }).sort((a, b) => (a.missing.length === 0) !== (b.missing.length === 0) ? (a.missing.length === 0 ? -1 : 1) : b.profit - a.profit);

  // Each commodity at the place where it makes the most, for comparison.
  const perItem = items.map((it) => {
    const best = (sellByCommodity.get(it.c.id) || []).filter(keep).reduce((a, p) => (!a || sellValue(p, it.qty) > sellValue(a, it.qty) ? p : a), null);
    const scu = best ? (best.scu_sell > 0 ? Math.min(it.qty, best.scu_sell) : it.qty) : 0;
    return { it, best, profit: best ? sellValue(best, it.qty) - scu * costPerScu(it) : 0 };
  });
  const splitProfit = perItem.reduce((s, x) => s + x.profit, 0);
  const splitStops = new Set(perItem.filter((x) => x.best).map((x) => x.best.id_terminal)).size;

  const chosenId = Number($('m-at').value) || null;
  const chosen = chosenId ? stops.find((s) => s.t?.id === chosenId) : null;
  const target = chosen || stops.find((s) => !s.missing.length) || stops[0];
  const cls = (n) => (n >= 0 ? 'good' : 'bad');
  const signed = (n) => (n >= 0 ? '+' : '−') + fmt(Math.abs(n));
  const counted = items.every((x) => x.counted);

  // Systems you'd jump from: where your goods were bought vs where you sell.
  const jumpNote = (shop) => {
    const from = new Set(items.flatMap((x) => x.from.map((p) => terminalsById.get(p.id_terminal)?.star_system_name)).filter(Boolean));
    const to = shop?.t?.star_system_name;
    const other = [...from].filter((s) => s !== to);
    return to && other.length ? `Needs a jump: ${other.map(esc).join(', ')} → ${esc(to)}.` : '';
  };

  let mainCard = '';
  if (target) {
    const soldCost = target.lines.reduce((s, l) => s + (l.scu || 0) * costPerScu(l.it), 0);
    const roiPct = soldCost > 0 ? ` · ${((target.profit / soldCost) * 100).toFixed(1)}% return` : '';
    const label = chosen ? 'Selling at your chosen place' : target.missing.length ? 'No single place buys all of these. Best partial stop:' : '✓ Sell everything in one stop';
    const gap = splitProfit - target.profit;
    mainCard = `
      <div class="card highlight one-stop">
        <div class="label">${label}</div>
        <div class="value">${multiShopName(target.t, [...target.rows.values()][0])}${autoloadTag(target.t)}</div>
        <div class="sub">${esc(terminalPlace(target.t))}${target.t?.max_container_size ? ` · max box ${target.t.max_container_size} SCU` : ''}</div>
        <div class="big ${cls(target.profit)}">${signed(target.profit)} aUEC</div>
        <div class="sub">Revenue ${fmt(target.revenue)} aUEC${roiPct}</div>
        ${target.missing.length ? `<div class="sub"><span class="warn">Doesn't buy ${target.missing.map((c) => esc(c.name)).join(', ')}</span></div>` : ''}
        ${target.limited.length ? `<div class="sub"><span class="warn">${target.limited.join(' · ')}</span></div>` : ''}
        ${!target.missing.length && items.length > 1 ? `<div class="sub">${gap > 0 ? `Only ${fmt(gap)} aUEC less profit than going to ${splitStops} separate places.` : 'Same as the best price for every item: no reason to go anywhere else.'}</div>` : ''}
        ${jumpNote(target) ? `<div class="sub">${jumpNote(target)}</div>` : ''}
      </div>`;
  }

  $('m-summary').innerHTML = `
    <div class="card"><div class="label">Your load</div><div class="value">${fmt(totalScu)} SCU</div>
      <div class="sub">${items.map((x) => `${fmt(x.qty)} ${esc(x.c.name)}`).join(' · ')}</div>
      <div class="sub">${totalCost ? `Paid ${fmt(totalCost)} aUEC` : 'Purchase cost not counted'}${totalCost && !counted ? ' <span class="warn">(some goods not counted)</span>' : ''}</div></div>
    ${mainCard}
    ${items.length > 1 ? `<div class="card"><div class="label">Selling each at its best place (${splitStops} stop${splitStops > 1 ? 's' : ''})</div>
      <div class="value ${cls(splitProfit)}">${signed(splitProfit)} aUEC</div>
      <div class="sub">${perItem.map((x) => x.best ? `${esc(x.it.c.name)} at ${multiShopName(terminalsById.get(x.best.id_terminal), x.best)}` : `${esc(x.it.c.name)}: nowhere`).join('<br>')}</div></div>` : ''}`;

  // Commodity by commodity at the place shown in the main card.
  $('m-breakdown-title').textContent = target ? `Commodity by commodity at ${terminalName(target.t) || ''}` : '';
  $('m-breakdown').innerHTML = !target ? '' : `
    <thead><tr><th>Commodity</th><th class="num">SCU</th><th>Bought at</th><th class="num">Paid / SCU</th><th class="num">Sells for / SCU</th><th class="num">Margin / SCU</th><th class="num">Revenue</th><th class="num">Profit</th><th>Notes</th></tr></thead>
    <tbody>${target.lines.map((l) => {
      const paid = l.it.qty ? l.it.cost / l.it.qty : null;
      const from = l.it.from.length ? l.it.from.map((p) => multiShopName(terminalsById.get(p.id_terminal), p)).join(', ') : '<span class="muted">not counted</span>';
      const alt = perItem.find((x) => x.it === l.it);
      const note = !l.p
        ? `<span class="warn">Doesn't buy it.</span>${alt?.best ? ` Best elsewhere: ${multiShopName(terminalsById.get(alt.best.id_terminal), alt.best)} (${fmt(alt.best.price_sell)} / SCU)` : ''}`
        : l.scu < l.it.qty ? `<span class="warn">Only buys ${fmt(l.scu)} SCU</span>` : '';
      return `
      <tr>
        <td><div class="loc">${esc(l.it.c.name)}</div><div class="sub">${cargoWarnings(l.it.c)}</div></td>
        <td class="num">${fmt(l.it.qty)}</td>
        <td class="sub">${from}</td>
        <td class="num">${l.it.counted && paid != null ? fmt(paid) : '—'}</td>
        <td class="num">${l.p ? fmt(l.p.price_sell) + delta(l.p.price_sell, l.p.prev?.price_sell) + `<div>${statusPill(l.p.status_sell, true)}</div>` : '<span class="muted">doesn\'t buy</span>'}</td>
        <td class="num ${l.p && l.it.counted ? cls(l.p.price_sell - paid) : ''}">${l.p && l.it.counted ? signed(l.p.price_sell - paid) : '—'}</td>
        <td class="num">${l.p ? fmt(l.rev) : '—'}</td>
        <td class="num ${l.p ? cls(l.prof) : ''}"><b>${l.p ? signed(l.prof) : '—'}</b></td>
        <td class="sub">${note || '—'}</td>
      </tr>`;
    }).join('')}
    </tbody>`;

  $('m-table').innerHTML = !stops.length ? '<tr><td class="empty">No shop buys this with these filters. Try a wider system or older prices.</td></tr>' : `
    <thead><tr>
      <th>#</th><th>Sell at</th>${items.length > 1 ? '<th>Buys</th>' : ''}${items.map(({ c }) => `<th class="num">${esc(c.name)} / SCU</th>`).join('')}
      <th class="num">Revenue</th><th class="num">Profit</th><th>Notes</th><th>Max box</th><th>Oldest report</th>
    </tr></thead>
    <tbody>${stops.slice(0, 30).map((s, i) => `
      <tr class="clickable${s === target ? ' top' : ''}" data-terminal="${s.t?.id ?? ''}" title="Show this place in detail">
        <td class="muted">${i + 1}</td>
        <td><div class="loc">${multiShopName(s.t, [...s.rows.values()][0])}${autoloadTag(s.t)}</div><div class="sub">${esc(terminalPlace(s.t))}${s.t?.is_nqa ? ' · <span class="bad">no questions asked</span>' : ''}</div></td>
        ${items.length > 1 ? `<td>${s.missing.length ? `<span class="warn">${items.length - s.missing.length} of ${items.length}</span>` : '<span class="good">✓ all</span>'}</td>` : ''}
        ${items.map(({ c }) => {
          const p = s.rows.get(c.id);
          return `<td class="num">${p ? fmt(p.price_sell) + delta(p.price_sell, p.prev?.price_sell) + `<div>${statusPill(p.status_sell, true)}</div>` : '<span class="muted">doesn\'t buy</span>'}</td>`;
        }).join('')}
        <td class="num">${fmt(s.revenue)}</td>
        <td class="num ${cls(s.profit)}"><b>${signed(s.profit)}</b></td>
        <td class="sub">${[...s.limited, ...(s.missing.length ? [`<span class="warn">no ${s.missing.map((c) => esc(c.name)).join(', ')}</span>`] : [])].join('<br>') || '—'}</td>
        <td>${s.t?.max_container_size ? s.t.max_container_size + ' SCU' : '—'}</td>
        <td class="${ageClass(s.oldest)}">${ago(s.oldest)}</td>
      </tr>`).join('')}
    </tbody>`;
}

// ---------- wiring ----------

const multiRow = (el) => multiRows[Number(el.closest('.crate-row')?.dataset.index)];

$('m-rows').addEventListener('change', (e) => {
  const r = multiRow(e.target);
  if (!r || !data) return;
  if (e.target.dataset.field === 'cid') {
    r.cid = Number(e.target.value) || null;
    r.from = r.cid ? defaultFrom(r.cid) : null;
    drawMultiRows();
    document.querySelector(`#m-rows .crate-row[data-index="${multiRows.indexOf(r)}"] [data-field="qty"]`)?.focus();
  } else if (e.target.dataset.field === 'from') {
    r.from = Number(e.target.value) || null;
  }
  saveMultiPrefs();
  renderMultiSell();
});

// Typing a quantity only redraws the results, so the field keeps focus.
$('m-rows').addEventListener('input', (e) => {
  if (e.target.dataset.field !== 'qty' || !data) return;
  multiRow(e.target).qty = Math.max(0, Number(e.target.value) || 0);
  saveMultiPrefs();
  renderMultiSell();
});

$('m-rows').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remove]');
  if (!btn || !data || multiRows.length === 1) return;
  multiRows.splice(Number(btn.dataset.remove), 1);
  drawMultiRows();
  saveMultiPrefs();
  renderMultiSell();
});

$('m-add').addEventListener('click', () => {
  if (!data || multiRows.length >= MULTI_MAX_ROWS) return;
  multiRows.push({ cid: null, qty: 0, from: null });
  drawMultiRows();
  saveMultiPrefs();
  renderMultiSell();
  document.querySelector('#m-rows .crate-row:last-child [data-field="cid"]')?.focus();
});

['m-system', 'm-age', 'm-at'].forEach((id) => $(id).addEventListener('change', () => {
  if (!data) return;
  saveMultiPrefs();
  renderMultiSell();
}));

// Clicking a place in the ranking shows it in detail.
$('m-table').addEventListener('click', (e) => {
  const row = e.target.closest('tr[data-terminal]');
  if (!row || !row.dataset.terminal) return;
  $('m-at').value = row.dataset.terminal;
  saveMultiPrefs();
  renderMultiSell();
  $('m-summary').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
