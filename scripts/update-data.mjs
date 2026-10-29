// Runs every 15 minutes on GitHub Actions (see .github/workflows/update-data.yml).
// Fetches the latest UEX data, adds it to the 24 h history, and writes the site plus its data to an output folder.
//
//   node scripts/update-data.mjs <out-dir>
//
// The previous history is read back from the published site (SITE_URL), so nothing has to be committed.

import { createRequire } from 'node:module';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { UEX_API, shapeData, appendSnapshot } = require('../shape.js');

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] || '_site');
const SITE_URL = process.env.SITE_URL || 'https://ziirqoh.github.io/sc-trade-companion';
const SITE_FILES = ['index.html', 'style.css', 'app.js', 'salvage.js', 'shape.js'];

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'sc-companion-updater' }, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

async function getApi(endpoint) {
  const body = await getJson(`${UEX_API}/${endpoint}`);
  if (body.status !== 'ok') throw new Error(`${endpoint}: ${body.status}`);
  return body.data;
}

// Last published file, or null on the very first run.
async function getPublished(name) {
  try { return await getJson(`${SITE_URL}/data/${name}?t=${Date.now()}`); } catch { return null; }
}

const now = Date.now();
let latest;
let history = await getPublished('history.json');

try {
  const [commodities, terminals, prices, vehicles] = await Promise.all([
    getApi('commodities'),
    getApi('terminals?type=commodity'),
    getApi('commodities_prices_all'),
    getApi('vehicles'),
  ]);
  latest = shapeData({ commodities, terminals, prices, vehicles }, now);
  history = appendSnapshot(history, prices, now);
  console.log(`UEX: ${prices.length} prices, ${terminals.length} terminals, ${latest.vehicles.length} salvage ships. History: ${history.times.length} snapshots.`);
} catch (err) {
  // UEX is down: republish the last good data so the site keeps working, and fail the run so it shows up in Actions.
  console.error(`UEX fetch failed: ${err.message}`);
  latest = await getPublished('latest.json');
  if (!latest) throw new Error('No UEX data and nothing published yet.');
  process.exitCode = 1;
}

await mkdir(path.join(OUT, 'data'), { recursive: true });
for (const file of SITE_FILES) await copyFile(path.join(ROOT, file), path.join(OUT, file));
await writeFile(path.join(OUT, 'data', 'latest.json'), JSON.stringify(latest));
await writeFile(path.join(OUT, 'data', 'history.json'), JSON.stringify(history || { times: [], series: {} }));
await writeFile(path.join(OUT, 'data', 'meta.json'), JSON.stringify({ fetchedAt: latest.fetchedAt, snapshots: history?.times.length || 0 }));
await writeFile(path.join(OUT, '.nojekyll'), '');
console.log(`Wrote site to ${OUT}`);
