import { describe, expect, it } from 'vitest';
import { buildShareUrl, readShareState } from './share';

const defaults = {
  symbol: 'NPN.JO',
  start: '2018-01-01',
  end: '2026-10-28',
  returnType: 'simple' as const,
};

describe('readShareState', () => {
  it('reads valid state', () => {
    const state = readShareState(
      '?symbol=STXGOV.JO&start=2020-01-01&end=2024-12-31&type=log',
      defaults,
    );

    expect(state).toEqual({
      symbol: 'STXGOV.JO',
      start: '2020-01-01',
      end: '2024-12-31',
      returnType: 'log',
    });
  });

  it('falls back to defaults for invalid values', () => {
    const state = readShareState(
      '?symbol=BAD%20SYMBOL&start=2024-02-31&end=2024-01-01&type=other',
      defaults,
    );

    expect(state).toEqual(defaults);
  });

  it('rejects a reversed date range', () => {
    const state = readShareState(
      '?symbol=NPN.JO&start=2024-01-01&end=2023-01-01&type=simple',
      defaults,
    );

    expect(state.start).toBe(defaults.start);
    expect(state.end).toBe(defaults.end);
  });

  it('uppercases the symbol', () => {
    const state = readShareState(
      '?symbol=npn.jo&start=2020-01-01&end=2024-01-01&type=simple',
      defaults,
    );

    expect(state.symbol).toBe('NPN.JO');
  });
});

describe('buildShareUrl', () => {
  it('writes all state into the URL', () => {
    const url = buildShareUrl('https://example.com/app?foo=bar', {
      symbol: 'STX40.JO',
      start: '2020-01-01',
      end: '2024-12-31',
      returnType: 'log',
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get('symbol')).toBe('STX40.JO');
    expect(parsed.searchParams.get('start')).toBe('2020-01-01');
    expect(parsed.searchParams.get('end')).toBe('2024-12-31');
    expect(parsed.searchParams.get('type')).toBe('log');
    expect(parsed.searchParams.get('foo')).toBe('bar');
  });
});
