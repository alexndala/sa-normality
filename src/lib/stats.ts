import type {
  Curve,
  Diagnostics,
  HistogramDensity,
  ReturnType,
} from './types';

export const TRADING_DAYS = 252;

export function computeReturns(prices: number[], type: ReturnType): number[] {
  const returns: number[] = [];

  for (let i = 1; i < prices.length; i += 1) {
    const previous = prices[i - 1];
    const current = prices[i];

    if (!Number.isFinite(previous) || !Number.isFinite(current)) continue;
    if (previous <= 0 || current <= 0) continue;

    returns.push(type === 'log' ? Math.log(current / previous) : current / previous - 1);
  }

  return returns;
}

export function sampleStd(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  let sumSquares = 0;

  for (const value of values) {
    const deviation = value - mean;
    sumSquares += deviation * deviation;
  }

  return Math.sqrt(sumSquares / (values.length - 1));
}

export function quantileSorted(sorted: number[], probability: number): number {
  if (sorted.length === 0) return Number.NaN;
  if (sorted.length === 1) return sorted[0];

  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const weight = position - lower;

  return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
}

export function erf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * x);
  const polynomial =
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
    t;

  return sign * (1 - polynomial * Math.exp(-x * x));
}

export function normalCdf(value: number): number {
  return 0.5 * (1 + erf(value / Math.SQRT2));
}

// Peter J. Acklam's inverse normal CDF approximation.
export function normalInv(probability: number): number {
  if (probability <= 0) return Number.NEGATIVE_INFINITY;
  if (probability >= 1) return Number.POSITIVE_INFINITY;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];

  const lowerTail = 0.02425;
  const upperTail = 1 - lowerTail;

  if (probability < lowerTail) {
    const q = Math.sqrt(-2 * Math.log(probability));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  if (probability <= upperTail) {
    const q = probability - 0.5;
    const r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }

  const q = Math.sqrt(-2 * Math.log(1 - probability));
  return -(
    (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
}

export interface MomentSummary {
  n: number;
  mean: number;
  populationStd: number;
  sampleStd: number;
  skewness: number;
  excessKurtosis: number;
}

export function describeMoments(values: number[]): MomentSummary {
  const n = values.length;

  if (n === 0) {
    return {
      n: 0,
      mean: 0,
      populationStd: 0,
      sampleStd: 0,
      skewness: 0,
      excessKurtosis: 0,
    };
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / n;

  let m2 = 0;
  let m3 = 0;
  let m4 = 0;

  for (const value of values) {
    const deviation = value - mean;
    const squared = deviation * deviation;
    m2 += squared;
    m3 += squared * deviation;
    m4 += squared * squared;
  }

  const variance = m2 / n;
  const populationStd = Math.sqrt(variance);
  const sampleStd = n > 1 ? Math.sqrt(m2 / (n - 1)) : 0;
  const skewness = populationStd > 0 ? m3 / n / populationStd ** 3 : 0;
  const excessKurtosis =
    variance > 0 ? m4 / n / (variance * variance) - 3 : 0;

  return {
    n,
    mean,
    populationStd,
    sampleStd,
    skewness,
    excessKurtosis,
  };
}

export function jarqueBera(skewness: number, excessKurtosis: number, n: number) {
  const statistic =
    n / 6 * (skewness * skewness + (excessKurtosis * excessKurtosis) / 4);
  // For a chi-squared distribution with 2 degrees of freedom, the survival
  // function is exactly exp(-x / 2).
  const pValue = Math.exp(-statistic / 2);

  return { statistic, pValue };
}

export function describeReturns(values: number[]): Diagnostics {
  const moments = describeMoments(values);
  const { statistic, pValue } = jarqueBera(
    moments.skewness,
    moments.excessKurtosis,
    moments.n,
  );

  return {
    n: moments.n,
    meanDaily: moments.mean,
    meanAnnual: moments.mean * TRADING_DAYS,
    volatilityAnnual: moments.sampleStd * Math.sqrt(TRADING_DAYS),
    skewness: moments.skewness,
    excessKurtosis: moments.excessKurtosis,
    jbStat: statistic,
    jbPValue: pValue,
    minReturn: values.length ? Math.min(...values) : 0,
    maxReturn: values.length ? Math.max(...values) : 0,
    totalReturn: 0,
    normalityRejected: pValue < 0.05,
  };
}

export function histogramDensity(
  values: number[],
  maxBins = 60,
): HistogramDensity {
  const n = values.length;
  if (n === 0) return { x: [], y: [], width: 0 };

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);

  if (minimum === maximum) {
    const width = Math.max(Math.abs(minimum) * 0.02, 1e-6);
    return { x: [minimum], y: [1 / width], width };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantileSorted(sorted, 0.25);
  const q3 = quantileSorted(sorted, 0.75);
  const iqr = q3 - q1;
  const range = maximum - minimum;
  const freedmanDiaconis = 2 * iqr * Math.cbrt(n);

  let width =
    freedmanDiaconis > 0 ? freedmanDiaconis : range / Math.ceil(Math.sqrt(n));
  let binCount = freedmanDiaconis > 0
    ? Math.ceil(range / freedmanDiaconis)
    : Math.ceil(Math.sqrt(n));

  if (!Number.isFinite(binCount) || binCount < 10) {
    binCount = Math.ceil(Math.sqrt(n));
  }

  binCount = Math.max(10, Math.min(maxBins, binCount));
  width = range / binCount;

  const counts = new Array<number>(binCount).fill(0);

  for (const value of values) {
    const index = Math.min(
      binCount - 1,
      Math.max(0, Math.floor((value - minimum) / width)),
    );
    counts[index] += 1;
  }

  return {
    x: counts.map((_, index) => minimum + width * (index + 0.5)),
    y: counts.map((count) => count / (n * width)),
    width,
  };
}

export function computeKde(
  values: number[],
  gridPoints = 256,
): Curve & { bandwidth: number } {
  const n = values.length;
  if (n === 0) return { x: [], y: [], bandwidth: 0 };

  const moments = describeMoments(values);
  const sorted = [...values].sort((a, b) => a - b);

  let bandwidth = 0.9 * moments.sampleStd * n ** -0.2;
  if (!Number.isFinite(bandwidth) || bandwidth <= 0) {
    bandwidth = Math.max(Math.abs(moments.mean) * 0.01, 1e-6);
  }

  const minimum = sorted[0] - 3 * bandwidth;
  const maximum = sorted[n - 1] + 3 * bandwidth;
  const step = (maximum - minimum) / (gridPoints - 1);
  const normaliser = 1 / (n * bandwidth * Math.sqrt(2 * Math.PI));
  const x: number[] = [];
  const y: number[] = [];

  for (let i = 0; i < gridPoints; i += 1) {
    const point = minimum + step * i;
    let density = 0;

    for (const value of values) {
      const z = (point - value) / bandwidth;
      density += Math.exp(-0.5 * z * z);
    }

    x.push(point);
    y.push(density * normaliser);
  }

  return { x, y, bandwidth };
}

export function computeNormalCurve(
  mean: number,
  std: number,
  minimum: number,
  maximum: number,
  gridPoints = 256,
): Curve {
  if (!Number.isFinite(std) || std <= 0) {
    return { x: [mean, mean], y: [0, 0] };
  }

  const step = (maximum - minimum) / (gridPoints - 1);
  const normaliser = 1 / (std * Math.sqrt(2 * Math.PI));
  const x: number[] = [];
  const y: number[] = [];

  for (let i = 0; i < gridPoints; i += 1) {
    const point = minimum + step * i;
    const z = (point - mean) / std;
    x.push(point);
    y.push(normaliser * Math.exp(-0.5 * z * z));
  }

  return { x, y };
}

export interface QqSummary {
  theoretical: number[];
  sample: number[];
  rawReturns: number[];
  line: { x: number[]; y: number[] };
}

export function computeQq(values: number[]): QqSummary {
  const n = values.length;
  if (n === 0) {
    return { theoretical: [], sample: [], rawReturns: [], line: { x: [], y: [] } };
  }

  const moments = describeMoments(values);
  const sorted = [...values].sort((a, b) => a - b);
  const std = moments.sampleStd;
  const theoretical: number[] = [];
  const sample: number[] = [];
  const rawReturns: number[] = [];

  for (let i = 0; i < n; i += 1) {
    const probability = (i + 0.5) / n;
    theoretical.push(normalInv(probability));
    sample.push(std > 0 ? (sorted[i] - moments.mean) / std : 0);
    rawReturns.push(sorted[i]);
  }

  const z1 = normalInv(0.25);
  const z3 = normalInv(0.75);
  const q1 = std > 0 ? (quantileSorted(sorted, 0.25) - moments.mean) / std : 0;
  const q3 = std > 0 ? (quantileSorted(sorted, 0.75) - moments.mean) / std : 0;
  const slope = z3 !== z1 ? (q3 - q1) / (z3 - z1) : 0;
  const intercept = q1 - slope * z1;
  const xStart = theoretical[0];
  const xEnd = theoretical[n - 1];

  return {
    theoretical,
    sample,
    rawReturns,
    line: {
      x: [xStart, xEnd],
      y: [slope * xStart + intercept, slope * xEnd + intercept],
    },
  };
}
