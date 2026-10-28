import { describeMoments } from './stats';
import type { Curve, FitSummary, StudentTFitSummary } from './types';

const LOG_PI = Math.log(Math.PI);
const MIN_DF = 2.05;
const MAX_DF = 200;

const LANCZOS_COEFFICIENTS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

export function logGamma(value: number): number {
  if (value < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * value)) - logGamma(1 - value);
  }

  const x = value - 1;
  let series = LANCZOS_COEFFICIENTS[0];
  const t = x + 7.5;

  for (let i = 1; i < LANCZOS_COEFFICIENTS.length; i += 1) {
    series += LANCZOS_COEFFICIENTS[i] / (x + i);
  }

  return (
    0.5 * Math.log(2 * Math.PI) +
    (x + 0.5) * Math.log(t) -
    t +
    Math.log(series)
  );
}

export function studentTLogPdf(
  value: number,
  mu: number,
  sigma: number,
  df: number,
): number {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(mu) ||
    !Number.isFinite(sigma) ||
    !Number.isFinite(df) ||
    sigma <= 0 ||
    df <= 0
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  const z = (value - mu) / sigma;

  return (
    logGamma((df + 1) / 2) -
    logGamma(df / 2) -
    0.5 * Math.log(df * Math.PI) -
    Math.log(sigma) -
    ((df + 1) / 2) * Math.log1p((z * z) / df)
  );
}

export function studentTPdf(
  value: number,
  mu: number,
  sigma: number,
  df: number,
): number {
  return Math.exp(studentTLogPdf(value, mu, sigma, df));
}

function normalLogLik(returns: number[]): number {
  const n = returns.length;
  if (n === 0) return Number.NEGATIVE_INFINITY;

  const mean = returns.reduce((sum, value) => sum + value, 0) / n;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / n;

  if (!Number.isFinite(variance) || variance <= 0) {
    return Number.NEGATIVE_INFINITY;
  }

  return -0.5 * n * Math.log(2 * Math.PI * variance) - n / 2;
}

function studentTLogLik(
  returns: number[],
  mu: number,
  sigma: number,
  df: number,
): number {
  let total = 0;

  for (const value of returns) {
    const term = studentTLogPdf(value, mu, sigma, df);
    if (!Number.isFinite(term)) return Number.NEGATIVE_INFINITY;
    total += term;
  }

  return total;
}

interface SimplexPoint {
  x: number[];
  f: number;
}

function nelderMead(
  objective: (x: number[]) => number,
  start: number[],
  step: number[],
  maxIterations = 500,
): number[] {
  const n = start.length;
  const evaluate = (x: number[]): SimplexPoint => {
    const value = objective(x);
    return { x, f: Number.isFinite(value) ? value : 1e100 };
  };

  const simplex: SimplexPoint[] = [evaluate([...start])];

  for (let i = 0; i < n; i += 1) {
    const point = [...start];
    point[i] += step[i] || 0.1;
    simplex.push(evaluate(point));
  }

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    simplex.sort((a, b) => a.f - b.f);

    const spread = Math.abs(simplex[n].f - simplex[0].f);
    if (spread < 1e-9 * (1 + Math.abs(simplex[0].f))) break;

    const centroid = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        centroid[j] += simplex[i].x[j] / n;
      }
    }

    const worst = simplex[n];
    const reflectedPoint = centroid.map(
      (value, index) => value + (value - worst.x[index]),
    );
    const reflected = evaluate(reflectedPoint);

    if (reflected.f < simplex[0].f) {
      const expandedPoint = centroid.map(
        (value, index) => value + 2 * (reflected.x[index] - value),
      );
      const expanded = evaluate(expandedPoint);
      simplex[n] = expanded.f < reflected.f ? expanded : reflected;
      continue;
    }

    if (reflected.f < simplex[n - 1].f) {
      simplex[n] = reflected;
      continue;
    }

    let contracted: SimplexPoint;

    if (reflected.f < worst.f) {
      contracted = evaluate(
        centroid.map(
          (value, index) => value + 0.5 * (reflected.x[index] - value),
        ),
      );
      if (contracted.f < reflected.f) {
        simplex[n] = contracted;
        continue;
      }
    } else {
      contracted = evaluate(
        centroid.map(
          (value, index) => value + 0.5 * (worst.x[index] - value),
        ),
      );
      if (contracted.f < worst.f) {
        simplex[n] = contracted;
        continue;
      }
    }

    for (let i = 1; i <= n; i += 1) {
      simplex[i] = evaluate(
        simplex[i].x.map(
          (value, index) =>
            simplex[0].x[index] + 0.5 * (value - simplex[0].x[index]),
        ),
      );
    }
  }

  simplex.sort((a, b) => a.f - b.f);
  return simplex[0].x;
}

function makeFit(
  normalLogLikelihood: number,
  studentT: Omit<StudentTFitSummary, 'aic' | 'bic'>,
  n: number,
): FitSummary {
  const normalAic = 4 - 2 * normalLogLikelihood;
  const normalBic = 2 * Math.log(n) - 2 * normalLogLikelihood;
  const studentTAic = 6 - 2 * studentT.logLik;
  const studentTBic = 3 * Math.log(n) - 2 * studentT.logLik;
  const deltaAIC = normalAic - studentTAic;

  return {
    normal: {
      logLik: normalLogLikelihood,
      aic: normalAic,
      bic: normalBic,
    },
    studentT: {
      ...studentT,
      aic: studentTAic,
      bic: studentTBic,
    },
    deltaAIC,
    tPreferred: deltaAIC > 2,
  };
}

function momentFallback(
  returns: number[],
  mean: number,
  std: number,
  normalLogLikelihood: number,
): FitSummary {
  const moments = describeMoments(returns);
  const df =
    moments.excessKurtosis > 0.05
      ? Math.min(MAX_DF, 4 + 6 / moments.excessKurtosis)
      : 30;
  const sigma = std * Math.sqrt(Math.max(1e-6, (df - 2) / df));
  const logLik = studentTLogLik(returns, mean, sigma, df);

  if (!Number.isFinite(logLik)) {
    return {
      normal: {
        logLik: normalLogLikelihood,
        aic: 4 - 2 * normalLogLikelihood,
        bic: 2 * Math.log(Math.max(1, returns.length)) - 2 * normalLogLikelihood,
      },
      studentT: null,
      deltaAIC: null,
      tPreferred: false,
    };
  }

  return makeFit(
    normalLogLikelihood,
    {
      mu: mean,
      sigma,
      df,
      logLik,
      method: 'moment',
    },
    returns.length,
  );
}

export function fitDistributions(returns: number[]): FitSummary {
  const n = returns.length;
  const mean = n > 0 ? returns.reduce((sum, value) => sum + value, 0) / n : 0;
  const variance =
    n > 0
      ? returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / n
      : 0;
  const std = Math.sqrt(variance);
  const normalLogLikelihood = normalLogLik(returns);

  if (n < 10 || !Number.isFinite(std) || std <= 0) {
    return {
      normal: {
        logLik: normalLogLikelihood,
        aic: Number.isFinite(normalLogLikelihood)
          ? 4 - 2 * normalLogLikelihood
          : 0,
        bic: Number.isFinite(normalLogLikelihood)
          ? 2 * Math.log(Math.max(1, n)) - 2 * normalLogLikelihood
          : 0,
      },
      studentT: null,
      deltaAIC: null,
      tPreferred: false,
    };
  }

  const objective = (parameters: number[]) => {
    const mu = parameters[0];
    const sigma = Math.exp(parameters[1]);
    const df = MIN_DF + Math.exp(parameters[2]);

    if (
      !Number.isFinite(mu) ||
      !Number.isFinite(sigma) ||
      !Number.isFinite(df) ||
      sigma <= 0 ||
      df > 500
    ) {
      return 1e100;
    }

    const logLikelihood = studentTLogLik(returns, mu, sigma, df);
    return Number.isFinite(logLikelihood) ? -logLikelihood : 1e100;
  };

  const start = [mean, Math.log(std), Math.log(2.95)];
  const step = [Math.max(std * 0.5, 1e-4), 0.5, 0.5];
  const best = nelderMead(objective, start, step);

  const mu = best[0];
  const sigma = Math.exp(best[1]);
  const df = Math.min(MAX_DF, MIN_DF + Math.exp(best[2]));
  const logLikelihood = studentTLogLik(returns, mu, sigma, df);

  if (
    !Number.isFinite(mu) ||
    !Number.isFinite(sigma) ||
    !Number.isFinite(df) ||
    !Number.isFinite(logLikelihood) ||
    sigma <= 0
  ) {
    return momentFallback(returns, mean, std, normalLogLikelihood);
  }

  return makeFit(
    normalLogLikelihood,
    {
      mu,
      sigma,
      df,
      logLik: logLikelihood,
      method: 'mle',
    },
    n,
  );
}

export function buildStudentTCurve(
  fit: StudentTFitSummary,
  minimum: number,
  maximum: number,
  gridPoints = 256,
): Curve {
  const x: number[] = [];
  const y: number[] = [];

  if (
    !Number.isFinite(minimum) ||
    !Number.isFinite(maximum) ||
    maximum <= minimum ||
    fit.sigma <= 0 ||
    fit.df <= 0
  ) {
    return { x, y };
  }

  const step = (maximum - minimum) / (gridPoints - 1);

  for (let i = 0; i < gridPoints; i += 1) {
    const point = minimum + step * i;
    x.push(point);
    y.push(studentTPdf(point, fit.mu, fit.sigma, fit.df));
  }

  return { x, y };
}
