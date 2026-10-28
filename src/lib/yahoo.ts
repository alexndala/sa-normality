const YAHOO_HOSTS = [
  'https://query1.finance.yahoo.com',
  'https://query2.finance.yahoo.com',
];

const REQUEST_TIMEOUT_MS = 15_000;

export class YahooError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'YahooError';
    this.status = status;
    this.code = code;
  }
}

export interface YahooPriceSeries {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  dates: string[];
  values: number[];
  priceScale: number;
}

interface YahooChartResult {
  meta?: {
    symbol?: string;
    longName?: string;
    shortName?: string;
    currency?: string;
    exchangeName?: string;
    fullExchangeName?: string;
  };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{ close?: Array<number | null> }>;
    adjclose?: Array<{ adjclose?: Array<number | null> }>;
  };
}

interface YahooChartPayload {
  chart?: {
    result?: YahooChartResult[] | null;
    error?: { code?: string; description?: string } | null;
  };
}

function isoDateFromTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function normaliseExchange(exchange: string): string {
  const aliases: Record<string, string> = {
    CCY: 'FX',
    CCC: 'Crypto',
    CMX: 'COMEX',
    NYM: 'NYMEX',
  };

  return aliases[exchange] ?? exchange;
}

function parseChartPayload(
  payload: YahooChartPayload,
  requestedSymbol: string,
): YahooPriceSeries {
  const chartError = payload.chart?.error;

  if (chartError) {
    const description =
      chartError.description || chartError.code || 'Upstream data error';
    const notFound =
      chartError.code === 'Not Found' ||
      /not found|no data|delisted/i.test(description);

    throw new YahooError(
      notFound
        ? `No Yahoo Finance data found for ${requestedSymbol}.`
        : `Yahoo Finance error: ${description}`,
      notFound ? 404 : 502,
      notFound ? 'NOT_FOUND' : 'UPSTREAM',
    );
  }

  const result = payload.chart?.result?.[0];

  if (!result) {
    throw new YahooError(
      `No Yahoo Finance data found for ${requestedSymbol}.`,
      404,
      'NO_DATA',
    );
  }

  const timestamps = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0] ?? {};
  const adjustedClose = result.indicators?.adjclose?.[0]?.adjclose ?? [];
  const close = quote.close ?? [];
  const rawCurrency = String(result.meta?.currency ?? '');

  const priceScale =
    rawCurrency === 'ZAc' || rawCurrency === 'GBp' ? 0.01 : 1;
  const currency =
    rawCurrency === 'ZAc' ? 'ZAR' : rawCurrency === 'GBp' ? 'GBP' : rawCurrency;

  const byDate = new Map<string, number>();

  for (let i = 0; i < timestamps.length; i += 1) {
    const adjusted = adjustedClose[i];
    const raw = close[i];
    const price = Number(adjusted ?? raw);

    if (!Number.isFinite(price) || price <= 0) continue;

    const date = isoDateFromTimestamp(timestamps[i]);
    byDate.set(date, price * priceScale);
  }

  const entries = [...byDate.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const dates = entries.map(([date]) => date);
  const values = entries.map(([, value]) => value);

  if (dates.length === 0) {
    throw new YahooError(
      `Yahoo Finance returned no usable price history for ${requestedSymbol}.`,
      404,
      'NO_DATA',
    );
  }

  return {
    symbol: String(result.meta?.symbol ?? requestedSymbol),
    name:
      result.meta?.longName ||
      result.meta?.shortName ||
      requestedSymbol,
    currency: currency || 'ZAR',
    exchange: normaliseExchange(
      result.meta?.fullExchangeName || result.meta?.exchangeName || '',
    ),
    dates,
    values,
    priceScale,
  };
}

async function requestChart(
  host: string,
  symbol: string,
  startIso: string,
  endIso: string,
): Promise<YahooPriceSeries> {
  const period1 = Math.floor(
    Date.parse(`${startIso}T00:00:00Z`) / 1000,
  );
  const period2 = Math.floor(
    (Date.parse(`${endIso}T00:00:00Z`) + 86_400_000) / 1000,
  );

  const url = new URL(
    `/v8/finance/chart/${encodeURIComponent(symbol)}`,
    host,
  );
  url.searchParams.set('period1', String(period1));
  url.searchParams.set('period2', String(period2));
  url.searchParams.set('interval', '1d');
  url.searchParams.set('events', 'div,splits');
  url.searchParams.set('includeAdjustedClose', 'true');

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    if ([429, 500, 502, 503, 504].includes(response.status)) {
      throw new YahooError(
        `Yahoo Finance is temporarily unavailable (HTTP ${response.status}).`,
        response.status === 429 ? 429 : 502,
        response.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM',
      );
    }

    if (response.status === 404) {
      throw new YahooError(
        `No Yahoo Finance data found for ${symbol}.`,
        404,
        'NOT_FOUND',
      );
    }

    throw new YahooError(
      `Yahoo Finance request failed (HTTP ${response.status}).`,
      502,
      'UPSTREAM',
    );
  }

  const payload = (await response.json()) as YahooChartPayload;
  return parseChartPayload(payload, symbol);
}

export async function fetchPriceSeries(
  symbol: string,
  startIso: string,
  endIso: string,
): Promise<YahooPriceSeries> {
  let lastError: unknown = null;

  for (const host of YAHOO_HOSTS) {
    try {
      return await requestChart(host, symbol, startIso, endIso);
    } catch (error) {
      lastError = error;

      if (error instanceof YahooError) {
        const retryable =
          error.code === 'RATE_LIMITED' || error.code === 'UPSTREAM';
        if (!retryable) throw error;
      }
    }
  }

  if (lastError instanceof YahooError) throw lastError;

  const timedOut =
    lastError instanceof Error &&
    (lastError.name === 'TimeoutError' ||
      lastError.name === 'AbortError');

  throw new YahooError(
    timedOut
      ? 'The Yahoo Finance request timed out. Please try again.'
      : 'Could not reach Yahoo Finance. Please try again shortly.',
    timedOut ? 504 : 502,
    timedOut ? 'TIMEOUT' : 'NETWORK',
  );
}
