// Ship database for the Ships tab. Built from the Star Citizen Wiki API (stats read from the game files)
// plus UEX (landing pad and the cargo box sizes each ship takes). Ship stats only change with patches,
// so this runs about once a day; the other runs republish the previous file.

const WIKI_API = 'https://api.star-citizen.wiki/api/v2';
export const SHIPS_FORMAT = 1;
const MAX_AGE_MS = 23 * 60 * 60 * 1000;

// Item catalogues, used for weapon sizes and for the class (Military, Civilian…) of components.
const ITEM_TYPES = ['WeaponGun', 'PowerPlant', 'Cooler', 'Shield', 'QuantumDrive'];
// Components listed in a ship's detail, in this order.
const COMPONENT_TYPES = ['PowerPlant', 'Cooler', 'Shield', 'QuantumDrive', 'Radar', 'LifeSupportGenerator',
  'QuantumInterdictionGenerator', 'EMP', 'TractorBeam', 'WeaponMining', 'ToolArm', 'UtilityTurret', 'DockingCollar'];
const GRADES = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
const SIZE_BY_CLASS = { 1: 'Small', 2: 'Small', 3: 'Medium', 4: 'Large', 5: 'Large', 6: 'Capital' };

async function getAllPages(getJson, endpoint) {
  const out = [];
  for (let page = 1; ; page++) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const body = await getJson(`${WIKI_API}/${endpoint}${sep}page%5Bsize%5D=50&page%5Bnumber%5D=${page}`);
    out.push(...body.data);
    if (page >= (body.meta?.last_page || 1)) return out;
  }
}

const round = (n, d = 0) => (n == null || isNaN(n) ? null : Math.round(n * 10 ** d) / 10 ** d);
const title = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : null);
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Count identical entries: [{ n: 'X' }, { n: 'X' }] -> [{ n: 'X', c: 2 }].
function grouped(list, key) {
  const map = new Map();
  for (const x of list) {
    const k = key(x);
    if (map.has(k)) map.get(k).c++;
    else map.set(k, { ...x, c: 1 });
  }
  return [...map.values()];
}

function shapeShip(v, items, uexByName) {
  const byName = (name) => items.byName.get(name);
  const byClass = (cls) => items.byClass.get(cls);
  const uex = uexByName.get(norm(v.game_name)) || uexByName.get(norm(v.name));
  const kind = v.is_vehicle || v.is_gravlev ? 'ground' : 'ship';
  const w = v.weaponry || {};

  const pilot = grouped((w.fixed_weapons?.weapons || []).map((x) => ({ n: x.name, s: byName(x.name)?.size ?? null, dps: round(x.dps) })), (x) => x.n);
  const turretList = [];
  for (const [t, list] of Object.entries(v.turrets || {})) {
    for (const tu of list || []) {
      const guns = grouped((tu.weapons || []).map((x) => ({ n: x.name, s: byClass(x.class_name)?.size ?? null })), (x) => x.n);
      if (!guns.length) continue;
      turretList.push({ t, s: tu.size, w: guns, dps: round(tu.dps_total) });
    }
  }
  // Identical turrets are listed once with a count (dps stays per turret).
  const turrets = grouped(turretList, (x) => JSON.stringify([x.t, x.s, x.w]));

  const ports = (v.ports || []).filter((p) => p.equipped_item);
  const racks = grouped(ports.filter((p) => p.type === 'MissileLauncher' || p.type === 'BombLauncher')
    .map((p) => ({ n: p.equipped_item.name, s: p.equipped_item.size })), (x) => x.n);
  const cm = grouped(ports.filter((p) => p.type === 'WeaponDefensive').map((p) => ({ n: p.equipped_item.name })), (x) => x.n);
  const comp = grouped(ports.filter((p) => COMPONENT_TYPES.includes(p.type)).map((p) => {
    const it = p.equipped_item;
    const cat = byClass(it.class_name);
    return { t: p.type, n: it.name, s: it.size, g: GRADES[it.grade] || cat?.grade || null, cl: cat?.class || null };
  }), (x) => `${x.t}|${x.n}|${x.s}`).sort((a, b) => COMPONENT_TYPES.indexOf(a.t) - COMPONENT_TYPES.indexOf(b.t));

  const grids = (v.cargo_grids || []).map((g) => [round(g.scu, 2), g.max_scu_box ?? null]);
  const boxes = grids.map((g) => g[1]).filter((x) => x != null);
  const desc = (v.description?.en_EN || v.game_description?.en_EN || '').split(/\n\s*\n/)[0].trim();
  const shopRows = (rows) => (rows || []).map((r) => ({ t: r.terminal_name, p: r.price_buy ?? r.price_rent, sys: r.starmap_location?.star_system_name || null }))
    .filter((r) => r.p).sort((a, b) => a.p - b.p);

  return {
    id: v.slug,
    n: v.name,
    full: v.game_name || v.name,
    mk: v.manufacturer?.name || null,
    kind,
    career: v.career || null,
    role: v.role || null,
    size: kind === 'ground' ? 'Vehicle' : title(v.size?.en_EN) || SIZE_BY_CLASS[v.size_class] || null,
    status: v.production_status?.en_EN || null,
    msrp: v.msrp || null,
    crew: [v.crew?.min ?? null, v.crew?.max ?? null],
    dims: [round(v.dimension?.length, 1), round(v.dimension?.width, 1), round(v.dimension?.height, 1)],
    mass: round(v.mass_total || v.mass),
    pad: uex?.pad_type || null,
    cargo: round(v.cargo_capacity, 2) || 0,
    grids,
    maxBox: boxes.length ? Math.max(...boxes) : null,
    uexBoxes: uex?.container_sizes || null,
    inv: v.vehicle_inventory ? round(v.vehicle_inventory / 1e6, 1) : null,
    hp: round(v.health),
    shield: v.shield?.hp ? { hp: round(v.shield.hp), regen: round(v.shield.regeneration), type: v.shield.face_type || null } : null,
    armor: v.armor?.damage_multipliers ? {
      hp: round(v.armor.health),
      phys: v.armor.damage_multipliers.physical, energy: v.armor.damage_multipliers.energy, dist: v.armor.damage_multipliers.distortion,
    } : null,
    speed: v.speed?.scm ? {
      scm: round(v.speed.scm), max: round(v.speed.max), boost: round(v.speed.boost_forward), back: round(v.speed.boost_backward),
      toScm: round(v.speed.zero_to_scm, 1), toMax: round(v.speed.zero_to_max, 1),
    } : null,
    agility: v.agility?.pitch ? [round(v.agility.pitch), round(v.agility.yaw), round(v.agility.roll)] : null,
    qt: v.quantum?.quantum_speed ? {
      speed: round(v.quantum.quantum_speed), spool: round(v.quantum.quantum_spool_time, 1),
      fuel: round(v.quantum.quantum_fuel_capacity, 1), range: round(v.quantum.quantum_range),
    } : null,
    h2: round(v.fuel?.capacity, 1),
    sig: { ir: round(v.emission?.ir), em: round(v.emission?.em_max), cs: round(v.cross_section_max) },
    weap: {
      dps: round(w.pilot_dps), tdps: round(w.turret_dps),
      pilot, turrets, racks,
      missiles: w.missiles?.count ? { c: w.missiles.count, dmg: round(w.missiles.damage?.total) } : null,
      cm,
    },
    comp,
    ins: v.insurance?.claim_time ? [round(v.insurance.claim_time, 1), round(v.insurance.expedite_time, 1), round(v.insurance.expedite_cost)] : null,
    buy: shopRows(v.uex_prices?.purchase),
    rent: shopRows(v.uex_prices?.rental).slice(0, 6),
    img: v.images?.[0]?.thumbnail_url || uex?.url_photo || null,
    url: v.pledge_url || null,
    wiki: v.web_url || null,
    desc: desc.length > 700 ? desc.slice(0, 700).replace(/\s+\S*$/, '') + '…' : desc,
  };
}

// One entry per ship name: paint and event editions (BIS, Collector…) share stats with the base ship.
function dedupe(vehicles) {
  const best = new Map();
  for (const v of vehicles) {
    if (/_Display$/i.test(v.class_name)) continue;
    const cur = best.get(v.name);
    const score = (x) => (x.uex_prices?.purchase?.length ? 0 : 1000) + x.class_name.length;
    if (!cur || score(v) < score(cur)) best.set(v.name, v);
  }
  return [...best.values()];
}

// Returns fresh ship data, or the previous file when it's recent or the wiki can't be reached.
export async function updateShips({ previous, uexVehicles, getJson, now = Date.now() }) {
  if (previous?.format === SHIPS_FORMAT && now - previous.fetchedAt < MAX_AGE_MS) {
    console.log(`Ships: reusing data from ${new Date(previous.fetchedAt).toISOString()}.`);
    return previous;
  }
  try {
    const vehicles = await getAllPages(getJson, 'vehicles');
    const items = { byName: new Map(), byClass: new Map() };
    for (const type of ITEM_TYPES) {
      for (const it of await getAllPages(getJson, `items?filter%5Btype%5D=${type}`)) {
        const info = { size: it.size, grade: it.grade || null, class: it.class || null };
        items.byClass.set(it.class_name, info);
        if (type === 'WeaponGun' && !items.byName.has(it.name)) items.byName.set(it.name, info);
      }
    }
    const uexByName = new Map();
    for (const u of uexVehicles || []) {
      uexByName.set(norm(u.name_full), u);
      if (!uexByName.has(norm(u.name))) uexByName.set(norm(u.name), u);
    }
    const ships = dedupe(vehicles).map((v) => shapeShip(v, items, uexByName)).sort((a, b) => a.n.localeCompare(b.n));
    const version = vehicles.find((v) => v.version)?.version || null;
    console.log(`Ships: ${ships.length} ships from the wiki (${version}).`);
    return { format: SHIPS_FORMAT, fetchedAt: now, version, ships };
  } catch (err) {
    console.error(`Ships fetch failed: ${err.message}`);
    process.exitCode = 1;
    return previous;
  }
}
