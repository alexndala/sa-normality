import { normalCdf, normalInv, quantileSorted, sampleStd } from './stats';
import type { RiskMetrics } from './types';

const CONFIDENCE_95 = 0.95;
const CONFIDENCE_99 = 0.99;

const Z_95 = normalInv(CONFIDENCE_95);
const Z_99 = normalInv(CONFIDENCE_99);

function normalPdf(value: number): number {
  return Math.exp(-0.5 * value * value) / Math.sqrt(2 * Math.PI);
}

function maxDrawdown(prices: number[]): number {
  if (prices.length === 0) return 0;

  let peak = prices[0];
  let drawdown = 0;

  for (const price of prices) {
    if (!Number.isFinite(price) || price <= 0) continue;
    if (price > peak) peak = price;

    const current = price / peak - 1;
    if (current < drawdown) drawdown = current;
  }

  return drawdown;
}

function historicalTail(
  sortedReturns: number[],
  probability: number,
): { valueAtRisk: number; conditionalValueAtRisk: number } {
  const quantile = quantileSorted(sortedReturns, probability);
  const tail = sortedReturns.filter((value) => value <= quantile);
  const meanTail =
    tail.length > 0
      ? tail.reduce((sum, value) => sum + value, 0) / tail.length
      : quantile;

  return {
    valueAtRisk: Math.max(0, -quantile),
    conditionalValueAtRisk: Math.max(0, -meanTail),
  };
}

function normalTail(
  mean: number,
  std: number,
  confidence: number,
  z: number,
): { valueAtRisk: number; conditionalValueAtRisk: number } {
  if (!Number.isFinite(std) || std <= 0) {
    return { valueAtRisk: 0, conditionalValueAtRisk: 0 };
  }

  const valueAtRisk = Math.max(0, -(mean - z * std));
  const expectedShortfall = Math.max(
    0,
    -mean + (std * normalPdf(z)) / (1 - confidence),
  );

  return {
    valueAtRisk,
    conditionalValueAtRisk: expectedShortfall,
  };
}

function ratio(actual: number, normal: number): number {
  if (!Number.isFinite(normal) || normal <= 1e-12) return 0;
  return actual / normal;
}

export function computeRiskMetrics(
  returns: number[],
  prices: number[],
): RiskMetrics {
  const n = returns.length;

  if (n === 0) {
    return {
      var95: 0,
      var99: 0,
      cvar95: 0,
      cvar99: 0,
      normalVar95: 0,
      normalVar99: 0,
      normalCvar95: 0,
      normalCvar99: 0,
      var99Ratio: 0,
      cvar99Ratio: 0,
      worstDay: 0,
      maxDrawdown: 0,
      exceed2Sigma: 0,
      expected2Sigma: 0,
      exceed3Sigma: 0,
      expected3Sigma: 0,
    };
  }

  const sorted = [...returns].sort((a, b) => a - b);
  const mean = returns.reduce((sum, value) => sum + value, 0) / n;
  const std = sampleStd(returns);
  const tail95 = historicalTail(sorted, 1 - CONFIDENCE_95);
  const tail99 = historicalTail(sorted, 1 - CONFIDENCE_99);
  const normal95 = normalTail(mean, std, CONFIDENCE_95, Z_95);
  const normal99 = normalTail(mean, std, CONFIDENCE_99, Z_99);

  const lower2Sigma = mean - 2 * std;
  const lower3Sigma = mean - 3 * std;

  return {
    var95: tail95.valueAtRisk,
    var99: tail99.valueAtRisk,
    cvar95: tail95.conditionalValueAtRisk,
    cvar99: tail99.conditionalValueAtRisk,
    normalVar95: normal95.valueAtRisk,
    normalVar99: normal99.valueAtRisk,
    normalCvar95: normal95.conditionalValueAtRisk,
    normalCvar99: normal99.conditionalValueAtRisk,
    var99Ratio: ratio(tail99.valueAtRisk, normal99.valueAtRisk),
    cvar99Ratio: ratio(
      tail99.conditionalValueAtRisk,
      normal99.conditionalValueAtRisk,
    ),
    worstDay: Math.min(...returns),
    maxDrawdown: maxDrawdown(prices),
    exceed2Sigma: returns.filter((value) => value < lower2Sigma).length,
    expected2Sigma: n * normalCdf(-2),
    exceed3Sigma: returns.filter((value) => value < lower3Sigma).length,
    expected3Sigma: n * normalCdf(-3),
  };
}
