// Parts database for the Loadout Builder (Ships → Loadout Builder). Built from the Star Citizen Wiki API:
// every swappable slot on each ship (with its size and stock part), and every part that can go in one,
// with its stats and the in-game shops that sell it (aUEC prices reported to UEX).
// Like ships.json it only changes with patches, so it's rebuilt about once a day.

const WIKI_API = 'https://api.star-citizen.wiki/api/v2';
export const LOADOUT_FORMAT = 1;
const MAX_AGE_MS = 23 * 60 * 60 * 1000;

// Part types you can swap at a ship terminal or in the hangar, in the order they're shown.
export const PART_TYPES = ['WeaponGun', 'Missile', 'WeaponMining', 'Shield', 'PowerPlant', 'Cooler', 'QuantumDrive', 'Radar'];

async function getAllPages(getJson, endpoint) {
  const out = [];
  for (let page = 1; ; page++) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const body = await getJson(`${WIKI_API}/${endpoint}${sep}page%5Bsize%5D=50&page%5Bnumber%5D=${page}`);
    out.push(...body.data);
    if (page >= (body.meta?.last_page || 1)) return out;
  }
}

// Runs fn over list with a few requests at a time.
async function pool(list, size, fn) {
  const out = new Array(list.length);
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < list.length) {
      const i = next++;
      out[i] = await fn(list[i]);
    }
  }));
  return out;
}

const round = (n, d = 0) => (n == null || isNaN(n) ? null : Math.round(n * 10 ** d) / 10 ** d);
const GRADES = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };

// Power and coolant a part uses when it's on (ship power is counted in segments, "pips").
function usage(it) {
  const online = it.resource_network?.states?.find((s) => s.name === 'Online') || it.resource_network?.states?.[0];
  let power = 0, coolant = 0;
  for (const d of online?.deltas || []) {
    if (d.type !== 'Conversion' && d.type !== 'Consumption') continue;
    if (d.resource === 'Power') power += d.rate || 0;
    if (d.resource === 'Coolant') coolant += d.rate || 0;
  }
  return { pw: round(power, 1) || null, co: round(coolant, 1) || null };
}

// The stats that matter for each kind of part, with short keys (see STAT_DEFS in loadout.js).
function stats(it) {
  const st = { hp: round(it.durability?.health), em: round(it.emission?.em_max), ir: round(it.emission?.ir) || null, ...usage(it) };
  switch (it.type) {
    case 'WeaponGun': {
      const w = it.vehicle_weapon || {};
      const dps = w.damage?.dps || {};
      const main = Object.entries(dps).sort((a, b) => b[1] - a[1])[0];
      Object.assign(st, {
        dps: round(w.damage?.burst ?? w.modes?.[0]?.damage_per_second), sus: round(w.damage?.sustained_60s),
        alpha: round(w.damage?.alpha_total ?? w.damage_per_shot, 1), dmg: main && main[1] > 0 ? main[0] : null,
        kind: w.type || null, rng: round(w.range ?? it.ammunition?.range), rpm: round(w.rpm), ammo: w.capacity || null,
        spd: round(it.ammunition?.speed),
      });
      break;
    }
    case 'Missile': {
      const m = it.missile || {};
      Object.assign(st, {
        dmg: round(m.damage_total), sig: m.signal_type || null, lock: round(m.lock_range_max ?? m.target_lock?.range_max),
        lockt: round(m.lock_time, 1), spd: round(m.speed ?? m.flight?.speed),
      });
      break;
    }
    case 'WeaponMining': {
      const l = it.mining_laser || {};
      Object.assign(st, {
        pow: round(l.laser_power?.max), ext: round(l.extraction_throughput), opt: round(l.optimal_range), rng: round(l.maximum_range),
        mods: l.module_slots ?? null,
        fx: (l.modifiers || []).filter((m) => m.value).map((m) => [m.display_name || m.name, round(m.value, 1)]),
      });
      break;
    }
    case 'Shield': {
      const s = it.shield || {};
      Object.assign(st, { shp: round(s.max_health), regen: round(s.regen_rate), delay: round(s.regen_delay?.damage, 1), down: round(s.regen_delay?.downed, 1) });
      break;
    }
    case 'PowerPlant': st.gen = round(it.power_plant?.power_segment_generation ?? it.power_plant?.power_output); break;
    case 'Cooler': st.cool = round(it.cooler?.coolant_segment_generation ?? it.cooler?.cooling_rate); break;
    case 'QuantumDrive': {
      const q = it.quantum_drive || {};
      const j = q.standard_jump || q.modes?.[0] || {};
      Object.assign(st, { qs: round(j.drive_speed), spool: round(j.spool_up_time, 1), cd: round(j.cooldown_time, 1), eff: round(q.fuel_efficiency), t10: q.travel_time_10gm?.seconds ?? null });
      break;
    }
    case 'Radar': {
      const r = it.radar || {};
      Object.assign(st, { aim: round(r.aim_assist?.distance_max_assignment), sens: round(r.sensitivity?.infrared, 2), cd: round(r.cooldown, 1) });
      break;
    }
  }
  for (const k of Object.keys(st)) if (st[k] == null) delete st[k];
  return st;
}

function shapePart(it) {
  const buy = new Map();
  for (const r of it.uex_prices?.purchase || []) {
    if (!(r.price_buy > 0)) continue;
    const t = r.terminal_name;
    if (!buy.has(t) || buy.get(t).p > r.price_buy) {
      buy.set(t, { t, p: round(r.price_buy), sys: r.starmap_location?.star_system_name || null, at: r.date_updated ? Math.round(Date.parse(r.date_updated) / 1000) : null });
    }
  }
  return {
    id: it.class_name,
    n: it.name,
    t: it.type,
    s: it.size ?? null,
    g: typeof it.grade === 'number' ? GRADES[it.grade] || null : it.grade || null,
    cl: it.class || null,
    mk: it.manufacturer?.name && it.manufacturer.name !== 'Unknown Manufacturer' ? it.manufacturer.name : null,
    base: it.is_base_variant !== false,
    loot: !!it.is_lootable,
    craft: !!it.is_craftable,
    // Tags the slot must offer (bespoke parts, e.g. the Vanguard nose guns), and tags the part offers.
    req: it.required_tags?.length ? it.required_tags : undefined,
    tags: it.tags?.length ? it.tags : undefined,
    st: stats(it),
    buy: [...buy.values()].sort((a, b) => a.p - b.p),
    wiki: it.web_url || null,
  };
}

// Turns a hardpoint name into a short position: "hardpoint_gun_left_wing" -> "left wing".
const NOISE = new Set(['hardpoint', 'weapon', 'weapons', 'gun', 'guns', 'laser', 'class', 'attach', 'missilerack', 'missile', 'rack',
  'shield', 'generator', 'cooler', 'power', 'powerplant', 'plant', 'quantum', 'drive', 'radar', 'mining', 'turret', 'base', 'mount', 'scitem']);
function position(name) {
  return String(name || '').replace(/^\$/, '').split(/[_\s]+/).map((w) => w.toLowerCase())
    .filter((w) => w && !NOISE.has(w)).map((w) => (/^0*\d+$/.test(w) ? String(Number(w)) : w)).join(' ');
}

// Every swappable slot on a ship. Walks the hardpoint tree so guns on gimbals and in turrets,
// missiles on racks and mining lasers on their arms are all found.
function shipSlots(v) {
  const slots = [];
  const shipTags = v.port_tags || [];
  const walk = (port, chain) => {
    const type = port.type || port.compatible_types?.[0]?.type;
    const here = [...chain, port];
    if (PART_TYPES.includes(type) && port.editable !== false) {
      const turret = chain.find((p) => p.type === 'TurretBase' || /Manned|Remote|PDC/i.test(p.sub_type || ''));
      // The rack a missile sits on, or the mount/turret a gun sits on, names the slot.
      const holder = chain.filter((p) => p.type !== 'TurretBase').pop();
      const where = [turret && position(turret.name), position(holder?.name || port.name)].filter(Boolean);
      const tags = [...new Set([...shipTags, ...chain.flatMap((p) => p.port_tags || []), ...(port.port_tags || [])])];
      slots.push({
        k: type,
        s: [port.sizes?.min ?? port.equipped_item?.size ?? null, port.sizes?.max ?? port.equipped_item?.size ?? null],
        d: port.equipped_item?.class_name || null,
        dn: port.equipped_item?.name || null,
        l: [...new Set(where)].join(' · ') || null,
        tu: turret ? 1 : undefined,
        rack: type === 'Missile' && holder ? holder.equipped_item?.name || null : undefined,
        req: port.required_tags?.length ? port.required_tags : undefined,
        tags: tags.length ? tags : undefined,
      });
      return; // a part's own sub-ports (barrels, modules) aren't listed
    }
    for (const c of port.ports || []) walk(c, here);
  };
  for (const p of v.ports || []) walk(p, []);

  // Identical slots in the same place (the missiles on one rack) are merged with a count.
  const merged = new Map();
  for (const s of slots) {
    const key = JSON.stringify([s.k, s.s, s.d, s.dn, s.l, s.tu, s.rack, s.req, s.tags]);
    if (merged.has(key)) merged.get(key).c++;
    else merged.set(key, { ...s, c: 1 });
  }
  return [...merged.values()].sort((a, b) => PART_TYPES.indexOf(a.k) - PART_TYPES.indexOf(b.k));
}

// Returns fresh loadout data, or the previous file when it's recent or the wiki can't be reached.
// `ships` is the shaped ship list (ships.mjs): only those ships get slots.
export async function updateLoadout({ previous, ships, version = null, getJson, now = Date.now() }) {
  if (previous?.format === LOADOUT_FORMAT && now - previous.fetchedAt < MAX_AGE_MS) {
    console.log(`Loadout: reusing data from ${new Date(previous.fetchedAt).toISOString()}.`);
    return previous;
  }
  if (!ships?.length) return previous;
  try {
    const parts = new Map();
    for (const type of PART_TYPES) {
      for (const it of await getAllPages(getJson, `items?filter%5Btype%5D=${type}`)) {
        if (it.class_name && !parts.has(it.class_name)) parts.set(it.class_name, shapePart(it));
      }
    }
    let failed = 0;
    const slotsById = {};
    const details = await pool(ships, 6, async (s) => {
      try { return { id: s.id, v: (await getJson(`${WIKI_API}/vehicles/${encodeURIComponent(s.id)}`)).data }; } catch { failed++; return null; }
    });
    for (const d of details) {
      if (!d?.v) continue;
      const slots = shipSlots(d.v);
      if (slots.length) slotsById[d.id] = slots;
    }
    if (failed > ships.length / 4) throw new Error(`${failed} of ${ships.length} ship details failed`);

    // Keep parts you can buy, base versions and anything a ship comes with; drop unsold paint variants and test items.
    const used = new Set(Object.values(slotsById).flatMap((list) => list.map((s) => s.d)));
    const items = [...parts.values()].filter((p) => used.has(p.id) || (!/test/i.test(p.id) && (p.buy.length || p.base))).sort((a, b) => a.n.localeCompare(b.n));
    console.log(`Loadout: ${Object.keys(slotsById).length} ships with slots, ${items.length} parts${failed ? `, ${failed} ship details failed` : ''}.`);
    return { format: LOADOUT_FORMAT, fetchedAt: now, version, ships: slotsById, items };
  } catch (err) {
    console.error(`Loadout fetch failed: ${err.message}`);
    process.exitCode = 1;
    return previous;
  }
}
