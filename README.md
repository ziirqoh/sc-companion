# SC Companion

A free Star Citizen helper website. It's three static files (`index.html`, `style.css` and `app.js`) with no server and no build step.

The front page (`#/`) shows live stats and a highlight from each tool. The tools are grouped under **Trade Companion** (`#/trade/...`).

## Trade Companion

| Tab | What it does |
|---|---|
| **Sell Finder** | Choose your location. It lists every item the shop sells, with its price, current stock (▲▼ changes, 24 h chart) and the best place to sell it, plus your profit for your cargo and budget. Click an item to see every place that buys it. A section below shows what the shop buys from you. |
| **Best Routes** | Enter your investment and cargo space. It recommends what to buy, how many SCU, where to buy it and where to sell it, and can mix several goods on one route to fill your hold. Each route shows stock at the buy shop and demand at the sell shop. You can filter by start location, system, data age and illegal goods. |
| **Commodity Guide** | Lists every commodity with its kind, risks (illegal, QT-volatile, perishable, explosive), cheapest buy, best sell and a wiki link. |

## How the data works

- Each visitor's browser loads data directly from the public [UEX Corp](https://uexcorp.space) API, which allows cross-origin requests. Players report this data, because the game has no official API.
- The page fetches new data **every 15 minutes** while it's open. The ↻ button forces a refresh, limited to once a minute.
- Stock history (up to 24 h) is saved in each visitor's own browser using IndexedDB. It only builds up while the page is open.

## Is it bannable?

No. The site follows the rules that matter for Star Citizen's Terms of Service:

- It never touches the game. It doesn't read game memory or files, inject anything, run macros or automate input, and doesn't need the game to be running.
- It's an ordinary website, the same kind as UEX Corp, SC Trade Tools or Erkul, which the community has used openly for years.
- The footer includes the disclaimer that CIG's fan-site guidelines require.

To stay safe, keep it this way. Don't add features that read the game client, its memory or log files, or that automate actions in game (buying, selling, flying).

## Run or host it

- **Locally:** double-click `index.html`, or serve the folder with any static server.
- **Free hosting:** upload the three files to GitHub Pages, Netlify (drag the folder onto app.netlify.com/drop) or Cloudflare Pages.
