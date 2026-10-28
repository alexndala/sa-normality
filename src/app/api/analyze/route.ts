import { NextRequest, NextResponse } from 'next/server';
import {
  computeKde,
  computeNormalCurve,
  computeQq,
  computeReturns,
  describeReturns,
  histogramDensity,
} from '@/lib/stats';
import type {
  AnalyzeResponse,
  ReturnType,
} from '@/lib/types';
import { YahooError, fetchPriceSeries } from '@/lib/yahoo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_OBSERVATIONS = 30;
const MAX_RANGE_YEARS = 40;
const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;

const cache = new Map<string, { expires: number; payload: AnalyzeResponse }>();

function readCache(key: string): AnalyzeResponse | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (entry.expires < Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.payload;
}

function writeCache(key: string, payload: AnalyzeResponse): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }

  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, payload });
}

function parseIsoDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.toISOString().slice(0, 10) !== value) return null;

  return value;
}

function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json(
    { success: false, error: message, code },
    { status },
  );
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const symbol = (params.get('symbol') ?? '').trim().toUpperCase();
  const start = parseIsoDate(params.get('start'));
  const end = parseIsoDate(params.get('end'));
  const returnTypeParam = params.get('returnType') ?? 'simple';

  if (!/^[A-Z0-9.^=_-]{1,24}$/.test(symbol)) {
    return errorResponse(
      'Enter a valid Yahoo Finance ticker (for example NPN.JO).',
      400,
      'INVALID_SYMBOL',
    );
  }

  if (!start || !end) {
    return errorResponse(
      'Dates must use the YYYY-MM-DD format.',
      400,
      'INVALID_DATE',
    );
  }

  if (start >= end) {
    return errorResponse(
      'The start date must be before the end date.',
      400,
      'INVALID_RANGE',
    );
  }

  const rangeMs =
    Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);

  if (rangeMs > MAX_RANGE_YEARS * 365.25 * 86_400_000) {
    return errorResponse(
      `Select a date range shorter than ${MAX_RANGE_YEARS} years.`,
      400,
      'RANGE_TOO_LONG',
    );
  }

  if (returnTypeParam !== 'simple' && returnTypeParam !== 'log') {
    return errorResponse(
      'Return type must be either simple or log.',
      400,
      'INVALID_RETURN_TYPE',
    );
  }

  const returnType = returnTypeParam as ReturnType;
  const cacheKey = `${symbol}|${start}|${end}|${returnType}`;
  const cached = readCache(cacheKey);

  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control':
          'public, s-maxage=900, stale-while-revalidate=3600',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    const series = await fetchPriceSeries(symbol, start, end);

    if (series.values.length < 2) {
      return errorResponse(
        `Not enough price observations for ${symbol} in this date range.`,
        422,
        'INSUFFICIENT_DATA',
      );
    }

    const returns = computeReturns(series.values, returnType);

    if (returns.length < MIN_OBSERVATIONS) {
      return errorResponse(
        `Only ${returns.length} return observations were found for ${symbol}. ` +
          `Choose a longer date range (at least ${MIN_OBSERVATIONS} observations are required).`,
        422,
        'INSUFFICIENT_DATA',
      );
    }

    const diagnostics = describeReturns(returns);
    diagnostics.totalReturn =
      series.values[series.values.length - 1] / series.values[0] - 1;

    const kde = computeKde(returns);
    const histogram = histogramDensity(returns);
    const minimum = Math.min(...returns);
    const maximum = Math.max(...returns);
    const padding = Math.max(
      kde.bandwidth * 3,
      (maximum - minimum) * 0.02,
      1e-6,
    );
    const normal = computeNormalCurve(
      diagnostics.meanDaily,
      Math.sqrt(
        returns.reduce(
          (sum, value) => sum + (value - diagnostics.meanDaily) ** 2,
          0,
        ) /
          Math.max(1, returns.length - 1),
      ),
      minimum - padding,
      maximum + padding,
    );

    const payload: AnalyzeResponse = {
      success: true,
      meta: {
        symbol: series.symbol,
        name: series.name,
        currency: series.currency,
        exchange: series.exchange,
        returnType,
        requestedStart: start,
        requestedEnd: end,
        firstDate: series.dates[0],
        lastDate: series.dates[series.dates.length - 1],
        observations: returns.length,
        priceScale: series.priceScale,
      },
      price: {
        dates: series.dates,
        values: series.values,
      },
      diagnostics,
      distribution: {
        histogram,
        kde: { x: kde.x, y: kde.y },
        normal,
        bandwidth: kde.bandwidth,
      },
      qq: computeQq(returns),
    };

    writeCache(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control':
          'public, s-maxage=900, stale-while-revalidate=3600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    if (error instanceof YahooError) {
      return errorResponse(error.message, error.status, error.code);
    }

    console.error('Analyze API error:', error);

    return errorResponse(
      'Could not analyse this asset right now. Please try again.',
      500,
      'INTERNAL',
    );
  }
}
