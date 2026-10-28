# SA Normality of Returns

An interactive web app for testing the normality of daily returns on South
African assets. It mirrors the WorldQuant University "Normality of Returns"
app but uses a JSE-focused asset universe.

Select an asset and date range on the left, then inspect:

1. **Price history** — adjusted closing price in ZAR (or USD for global assets).
2. **Distribution of returns** — histogram, Gaussian kernel density estimate,
   and a fitted normal distribution.
3. **Normal Q-Q plot** — standardised returns against theoretical normal
   quantiles, with a quartile reference line.

A diagnostics strip reports observations, daily mean, annualised volatility,
total return, skewness, excess kurtosis, the Jarque–Bera statistic and p-value,
and a normality verdict at the 5% level.

## Stack

- Next.js 14 (App Router, TypeScript)
- Plotly (`plotly.js-basic-dist-min`, loaded on the client)
- Yahoo Finance chart endpoint, proxied through `/api/analyze`
- Vitest for the statistics unit tests

## Local development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

```bash
npm test        # statistics unit tests
npm run lint
npm run build
npm start
```

`npm start` serves the standard production build. The Docker image sets
`BUILD_STANDALONE=1`, which enables Next.js standalone output for the container.

## Asset universe

The curated list lives in `src/lib/assets.ts` and is grouped as:

- JSE indices (All Share, Top 40, Top 40 USD Net TRI)
- JSE equities (Naspers, FirstRand, MTN, Sasol, banks, miners, retailers, property)
- SA ETFs (Satrix 40, sector ETFs, property, MSCI World feeder, TRACI, NewGold)
- ZAR FX pairs
- Commodities priced in USD
- Crypto

Any other Yahoo Finance ticker can be loaded through the custom ticker field.
JSE symbols generally use the `.JO` suffix (for example `NPN.JO`).

## API

`GET /api/analyze?symbol=NPN.JO&start=2018-01-01&end=2026-10-28&returnType=simple`

- `symbol`: Yahoo Finance ticker (case-insensitive)
- `start`, `end`: `YYYY-MM-DD`
- `returnType`: `simple` or `log`

The response contains the price series, diagnostics, histogram/KDE/normal
curves, and Q-Q plot data. Responses are cached in memory for 15 minutes.

`GET /api/health` returns a health payload for Railway.

## Methodology

- Prices: adjusted close, with JSE `ZAc` (cents) converted to ZAR.
- Returns: `simple` (`Pₜ/Pₜ₋₁ − 1`) by default, or `log` (`ln(Pₜ/Pₜ₋₁)`).
- Annualised volatility: sample standard deviation × √252.
- Skewness: third standardised moment.
- Excess kurtosis: fourth standardised moment − 3.
- Jarque–Bera: `n/6 × (S² + K²/4)` with p-value `exp(−JB/2)` (χ² with 2 df).
- KDE: Gaussian kernel, Silverman bandwidth
  `0.9 × min(σ, IQR/1.34) × n^(−1/5)`.
- Q-Q: plotting positions `(i − 0.5)/n`; quartile line through the 25th and
  75th percentiles (equivalent to R's `qqline`).

## Deployment (Railway)

The repo includes a multi-stage `Dockerfile` and `railway.toml`:

```bash
railway up
```

The container listens on `PORT` (default `3000`) and exposes `/api/health`.
`next.config.js` uses `output: 'standalone'` so the runtime image only contains
the production server and static assets.

## Limitations

- Yahoo Finance is an unofficial, delayed data source and may rate-limit
  requests from cloud IPs. The API caches responses and retries `query2` after
  `query1`, but occasional failures are possible.
- Yahoo does not provide a clean SA government-bond total-return index. Use
  `STXTRA.JO` (TRACI cash) or a custom ticker if you have one.
- The normality tests describe the selected historical sample only. They are
  not a forecast and not investment advice.
