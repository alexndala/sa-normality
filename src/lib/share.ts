import type { ReturnType } from './types';

export interface ShareState {
  symbol: string;
  start: string;
  end: string;
  returnType: ReturnType;
}

const TICKER_PATTERN = /^[A-Z0-9.^=_-]{1,24}$/;

function validIsoDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.toISOString().slice(0, 10) !== value) return null;

  return value;
}

export function readShareState(
  search: string,
  defaults: ShareState,
): ShareState {
  const params = new URLSearchParams(search);
  const symbol = (params.get('symbol') ?? '').trim().toUpperCase();
  const start = validIsoDate(params.get('start'));
  const end = validIsoDate(params.get('end'));
  const type = params.get('type');

  const validSymbol = TICKER_PATTERN.test(symbol) ? symbol : defaults.symbol;
  const validType: ReturnType =
    type === 'log' || type === 'simple' ? type : defaults.returnType;

  if (!start || !end || start >= end) {
    return {
      symbol: validSymbol,
      start: defaults.start,
      end: defaults.end,
      returnType: validType,
    };
  }

  return {
    symbol: validSymbol,
    start,
    end,
    returnType: validType,
  };
}

export function buildShareUrl(baseUrl: string, state: ShareState): string {
  const url = new URL(baseUrl);
  url.searchParams.set('symbol', state.symbol);
  url.searchParams.set('start', state.start);
  url.searchParams.set('end', state.end);
  url.searchParams.set('type', state.returnType);
  return url.toString();
}
