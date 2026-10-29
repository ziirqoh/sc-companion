// SC Companion — the shape of the data the site uses.
// Shared by the browser (app.js) and the 15-minute updater (scripts/update-data.mjs),
// so both trim the UEX API responses the same way.

const UEX_API = 'https://api.uexcorp.space/2.0';
const HISTORY_KEEP = 96; // 96 snapshots x 15 min = 24 h

const COMMODITY_FIELDS = [
  'id', 'name', 'code', 'kind', 'weight_scu', 'price_buy', 'price_sell',
  'is_buyable', 'is_sellable', 'is_illegal', 'is_volatile_qt', 'is_volatile_time',
  'is_explosive', 'is_raw', 'is_refined', 'is_refinable', 'is_mineral',
  'is_harvestable', 'is_fuel', 'is_temporary', 'wiki',
];

const TERMINAL_FIELDS = [
  'id', 'name', 'displayname', 'fullname', 'nickname', 'star_system_name', 'planet_name',
  'moon_name', 'orbit_name', 'space_station_name', 'city_name', 'outpost_name',
  'faction_name', 'max_container_size', 'has_loading_dock', 'has_freight_elevator',
  'has_docking_port', 'is_auto_load', 'is_refuel', 'is_repair', 'is_nqa', 'is_jump_point',
];

const VEHICLE_FIELDS = ['id', 'name', 'name_full', 'scu', 'crew', 'pad_type', 'container_sizes', 'url_photo', 'url_store', 'is_salvage'];

const pickFields = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));

// Trims raw UEX responses to what the site needs. Only salvage ships are kept from the vehicle list.
function shapeData({ commodities, terminals, prices, vehicles }, fetchedAt) {
  return {
    fetchedAt,
    commodities: commodities.filter((c) => c.is_visible).map((c) => pickFields(c, COMMODITY_FIELDS)),
    terminals: terminals.map((t) => pickFields(t, TERMINAL_FIELDS)),
    prices,
    vehicles: (vehicles || [])
      .filter((v) => v.is_salvage && !/best in show/i.test(v.name_full))
      .map((v) => pickFields(v, VEHICLE_FIELDS)),
  };
}

// History is stored as changes only, so 24 h of snapshots stays small:
// { times: [t0, t1, ...], series: { "terminal:commodity": [[snapshotIndex, priceBuy, priceSell, scuBuy, scuSellStock, scuSell], ...] } }
const priceKey = (p) => `${p.id_terminal}:${p.id_commodity}`;
const priceValues = (p) => [p.price_buy, p.price_sell, p.scu_buy, p.scu_sell_stock, p.scu_sell];

function appendSnapshot(history, prices, t) {
  const h = { times: [...(history?.times || [])], series: { ...(history?.series || {}) } };

  // A run minutes after the last one replaces it instead of adding a near-duplicate point.
  if (h.times.length && t - h.times[h.times.length - 1] < 5 * 60 * 1000) {
    const last = h.times.length - 1;
    h.times.pop();
    for (const key of Object.keys(h.series)) {
      h.series[key] = h.series[key].filter((e) => e[0] !== last);
      if (!h.series[key].length) delete h.series[key];
    }
  }

  const index = h.times.length;
  h.times.push(t);
  for (const p of prices) {
    const key = priceKey(p);
    const values = priceValues(p);
    const list = h.series[key] ? [...h.series[key]] : [];
    const prev = list[list.length - 1];
    if (!prev || values.some((v, i) => v !== prev[i + 1])) list.push([index, ...values]);
    h.series[key] = list;
  }

  // Drop snapshots older than 24 h, keeping each series' last known value as its new starting point.
  const drop = h.times.length - HISTORY_KEEP;
  if (drop > 0) {
    h.times = h.times.slice(drop);
    for (const [key, list] of Object.entries(h.series)) {
      const before = list.filter((e) => e[0] < drop);
      const kept = list.filter((e) => e[0] >= drop);
      const base = before[before.length - 1];
      if (base && (!kept.length || kept[0][0] !== drop)) kept.unshift([drop, ...base.slice(1)]);
      if (kept.length) h.series[key] = kept.map((e) => [e[0] - drop, ...e.slice(1)]);
      else delete h.series[key];
    }
  }
  return h;
}

// The values of one series at every snapshot, carrying the last change forward: [{ t, values }] (from its first point).
function expandSeries(history, list) {
  const out = [];
  let j = 0;
  let current = null;
  for (let i = 0; i < history.times.length; i++) {
    while (j < list.length && list[j][0] <= i) current = list[j++].slice(1);
    if (current) out.push({ t: history.times[i], values: current });
  }
  return out;
}

if (typeof module !== 'undefined') {
  module.exports = { UEX_API, HISTORY_KEEP, shapeData, appendSnapshot, expandSeries, priceKey };
}
