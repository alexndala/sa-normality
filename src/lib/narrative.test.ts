import { describe, expect, it } from 'vitest';
import { buildNarrative } from './narrative';
import type { Diagnostics, FitSummary, RiskMetrics } from './types';

const diagnostics: Diagnostics = {
  n: 1000,
  meanDaily: 0.0005,
  meanAnnual: 0.126,
  volatilityAnnual: 0.4,
  skewness: 0.4,
  excessKurtosis: 8,
  jbStat: 5000,
  jbPValue: 0,
  minReturn: -0.08,
  maxReturn: 0.08,
  totalReturn: 0.5,
  normalityRejected: true,
};

const risk: RiskMetrics = {
  var95: 0.021,
  var99: 0.042,
  cvar95: 0.035,
  cvar99: 0.061,
  normalVar95: 0.016,
  normalVar99: 0.023,
  normalCvar95: 0.02,
  normalCvar99: 0.029,
  var99Ratio: 1.8,
  cvar99Ratio: 2.1,
  worstDay: -0.08,
  maxDrawdown: -0.32,
  exceed2Sigma: 30,
  expected2Sigma: 23,
  exceed3Sigma: 12,
  expected3Sigma: 1.35,
};

const fit: FitSummary = {
  normal: { logLik: -1000, aic: 2004, bic: 2014 },
  studentT: {
    mu: 0,
    sigma: 0.01,
    df: 3.2,
    logLik: -900,
    aic: 1806,
    bic: 1821,
    method: 'mle',
  },
  deltaAIC: 198,
  tPreferred: true,
};

describe('buildNarrative', () => {
  it('describes a rejected, fat-tailed sample', () => {
    const text = buildNarrative({
      diagnostics,
      risk,
      fit,
      meta: { name: 'Naspers', symbol: 'NPN.JO' },
    });

    expect(text).toContain('Normality is rejected');
    expect(text).toContain('fat-tailed');
    expect(text).toContain('understates');
    expect(text).toContain('Student-t');
    expect(text).toContain('NPN.JO');
  });

  it('handles a normal-looking sample', () => {
    const text = buildNarrative({
      diagnostics: {
        ...diagnostics,
        skewness: 0,
        excessKurtosis: 0,
        jbPValue: 0.4,
        normalityRejected: false,
      },
      risk: {
        ...risk,
        var99Ratio: 1,
        cvar99Ratio: 1,
        exceed3Sigma: 0,
        expected3Sigma: 1.35,
      },
      fit: { ...fit, studentT: null, deltaAIC: null, tPreferred: false },
      meta: { name: 'Bond ETF', symbol: 'STXGOV.JO' },
    });

    expect(text).toContain('not rejected');
    expect(text).toContain('broadly in line');
    expect(text).not.toContain('understates');
  });

  it('adds a small-sample caveat', () => {
    const text = buildNarrative({
      diagnostics: { ...diagnostics, n: 40 },
      risk,
      fit,
      meta: { name: 'Small', symbol: 'SMALL.JO' },
    });

    expect(text).toContain('40 observations');
    expect(text).toContain('indicative');
  });

  it('handles a conservative normal estimate', () => {
    const text = buildNarrative({
      diagnostics,
      risk: { ...risk, var99Ratio: 0.8 },
      fit: { ...fit, studentT: null, deltaAIC: null, tPreferred: false },
      meta: { name: 'Asset', symbol: 'ASSET.JO' },
    });

    expect(text).toContain('conservative');
  });
});
