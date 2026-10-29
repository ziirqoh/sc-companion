# SC Companion

A free Star Citizen helper website: static files (`index.html`, `style.css`, `shape.js`, `app.js`, `salvage.js`) published on GitHub Pages, plus a scheduled job that keeps the data fresh.

The front page (`#/`) shows live stats and a highlight from each tool. The tools are grouped under **Trade Companion** (`#/trade/...`) and **Salvage Companion** (`#/salvage/...`).

## Trade Companion

| Tab | What it does |
|---|---|
| **Sell Finder** | Choose your location. It lists every item the shop sells, with its price, current stock (▲▼ changes, 24 h chart) and the best place to sell it, plus your profit for your cargo and budget. Click an item to see every place that buys it. A section below shows what the shop buys from you. |
| **Best Routes** | Enter your investment and cargo space. It recommends what to buy, how many SCU, where to buy it and where to sell it, and can mix several goods on one route to fill your hold. Each route shows stock at the buy shop and demand at the sell shop. You can filter by start location, system, data age and illegal goods. |
| **Commodity Guide** | Lists every commodity with its kind, risks (illegal, QT-volatile, perishable, explosive), cheapest buy, best sell and a wiki link. |

## Salvage Companion

| Tab | What it does |
|---|---|
| **Sell Salvage** | Enter how many SCU of RMC, Construction Materials and other salvage goods you carry. It ranks the best single place to sell all of it, compares that with selling each material at its own best price, and lists the top buyers for each material. You can fill the quantities from a salvage ship's capacity in one click. |
| **Salvage Ships** | Every salvage ship from UEX with cargo, crew, pad size and fracture limit, what a full hold of RMC is worth now, and a step-by-step guide for each ship. It also covers salvaging on foot with the multi-tool, Cambio and MaxLift. |
| **Cargo Crates** | For crates found in wrecks and derelicts: add what each crate holds and how many SCU. It ranks the best single place to sell everything, compares that with selling each item at its own best place, and shows the top buyers for each item. Illegal goods are flagged. It also explains where to find crates, how to take them and what is legal. |
| **Salvage Guide** | How salvage works, salvaging a wreck step by step, salvage contracts and how to complete them, legality, scraper modules, refining and selling, and where to start. It's written for Alpha 4.10 from the Star Citizen wiki. |

## How the data works

- **Every 15 minutes, even when nobody has the site open,** the GitHub Actions workflow in  runs . It:
  1. fetches the latest data from the public [UEX Corp](https://uexcorp.space) API (players report this data, because the game has no official API),
  2. adds it to a 24 h history, read back from the live site so nothing is committed,
  3. publishes the site together with ,  and .
- The page loads those files and shows the same data and stock charts to everyone. When the next update is due, it checks for it every 30 seconds.
- If the published data is missing or more than 25 minutes old, the page fetches UEX directly instead. This happens when GitHub runs late or when you're testing locally. The ↻ button does the same, limited to once a minute.
- GitHub's scheduler can run a few minutes late when it's busy. It also pauses scheduled runs in a repo with no activity for 60 days. Re-enable it from the Actions tab if that happens.

### Testing locally

\UEX: 2580 prices, 161 terminals, 5 salvage ships. History: 1 snapshots.
Wrote site to C:UsersenoiDesktopCodeStar Citizen_site
## Is it bannable?

No. The site follows the rules that matter for Star Citizen's Terms of Service:

- It never touches the game. It doesn't read game memory or files, inject anything, run macros or automate input, and doesn't need the game to be running.
- It's an ordinary website, the same kind as UEX Corp, SC Trade Tools or Erkul, which the community has used openly for years.
- The footer includes the disclaimer that CIG's fan-site guidelines require.

To stay safe, keep it this way. Don't add features that read the game client, its memory or log files, or that automate actions in game (buying, selling, flying).

## Run or host it

- **Locally:** double-click `index.html`, or serve the folder with any static server.
- **Free hosting:** upload the three files to GitHub Pages, Netlify (drag the folder onto app.netlify.com/drop) or Cloudflare Pages.
