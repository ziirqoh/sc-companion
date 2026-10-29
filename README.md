# SC Trade Companion

A free Star Citizen trading website. It's three static files (`index.html`, `style.css` and `app.js`) with no server and no build step.

## Features

| Tab | What it does |
|---|---|
| **Sell Finder** | Choose a commodity, where you buy it, and the price you paid. It lists every place that buys it back, ranked by sell price or total profit, with margin, ROI, demand, storage level and max container size. |
| **Best Routes** | Shows the 100 most profitable buy → sell routes for your cargo SCU and budget. You can filter by system or starting location and include or exclude illegal goods. |
| **Shop Inventory** | Shows what a commodity shop has in storage: stock, prices, and ▲▼ changes since the last refresh. Click a row to see its stock history. |
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
