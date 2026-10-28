import { describe, expect, it } from 'vitest';
import { computeRiskMetrics } from './risk';

describe('computeRiskMetrics', () => {
  const returns = [-0.1, -0.06, -0.03, -0.01, 0, 0, 0.01, 0.03, 0.06, 0.1];
  const prices = [100, 120, 90, 110, 80];

  it('computes historical VaR and CVaR', () => {
    const risk = computeRiskMetrics(returns, prices);

    expect(risk.var95).toBeCloseTo(0.082, 10);
    expect(risk.var99).toBeCloseTo(0.0964, 10);
    expect(risk.cvar95).toBeCloseTo(0.1, 10);
    expect(risk.cvar99).toBeCloseTo(0.1, 10);
  });

  it('computes normal-implied tail risk', () => {
    const risk = computeRiskMetrics(returns, prices);
    expect(risk.normalVar95).toBeGreaterThan(risk.var95);
    expect(risk.normalVar99).toBeGreaterThan(risk.var99);
    expect(risk.normalCvar99).toBeGreaterThan(risk.normalVar99);
  });

  it('computes drawdown and worst day', () => {
    const risk = computeRiskMetrics(returns, prices);
    expect(risk.maxDrawdown).toBeCloseTo(80 / 120 - 1, 10);
    expect(risk.worstDay).toBe(-0.1);
  });

  it('counts tail exceedances', () => {
    const risk = computeRiskMetrics(returns, prices);
    expect(risk.exceed2Sigma).toBe(0);
    expect(risk.exceed3Sigma).toBe(0);
    expect(risk.expected2Sigma).toBeCloseTo(10 * 0.0227501, 4);
    expect(risk.expected3Sigma).toBeCloseTo(10 * 0.0013499, 5);
  });

  it('handles an empty sample', () => {
    const risk = computeRiskMetrics([], []);
    expect(risk.var95).toBe(0);
    expect(risk.maxDrawdown).toBe(0);
    expect(risk.var99Ratio).toBe(0);
  });
});
