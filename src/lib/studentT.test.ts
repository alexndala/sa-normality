import { describe, expect, it } from 'vitest';
import {
  buildStudentTCurve,
  fitDistributions,
  logGamma,
  studentTPdf,
} from './studentT';

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalSample(rng: () => number): number {
  const u = Math.max(rng(), Number.EPSILON);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function studentTSample(rng: () => number, df: number): number {
  const numerator = normalSample(rng);
  let chiSquare = 0;
  for (let i = 0; i < df; i += 1) {
    chiSquare += normalSample(rng) ** 2;
  }
  return numerator / Math.sqrt(chiSquare / df);
}

describe('logGamma', () => {
  it('matches known values', () => {
    expect(logGamma(0.5)).toBeCloseTo(Math.log(Math.sqrt(Math.PI)), 10);
    expect(logGamma(1)).toBeCloseTo(0, 10);
    expect(logGamma(5)).toBeCloseTo(Math.log(24), 10);
  });
});

describe('studentTPdf', () => {
  it('matches the t(5) density at zero', () => {
    expect(studentTPdf(0, 0, 1, 5)).toBeCloseTo(0.379606, 5);
  });

  it('is symmetric', () => {
    expect(studentTPdf(0.7, 0, 1, 6)).toBeCloseTo(
      studentTPdf(-0.7, 0, 1, 6),
      12,
    );
  });
});

describe('fitDistributions', () => {
  it('recovers a heavy-tailed t fit from simulated data', () => {
    const rng = mulberry32(42);
    const returns = Array.from({ length: 2000 }, () =>
      studentTSample(rng, 5) * 0.01,
    );

    const fit = fitDistributions(returns);

    expect(fit.studentT).not.toBeNull();
    expect(fit.studentT?.df).toBeGreaterThan(3);
    expect(fit.studentT?.df).toBeLessThan(9);
    expect(fit.tPreferred).toBe(true);
    expect(fit.deltaAIC).toBeGreaterThan(0);
  });

  it('returns a finite normal fit for a small sample', () => {
    const fit = fitDistributions([0.01, -0.02, 0.005, -0.01, 0.015]);
    expect(Number.isFinite(fit.normal.aic)).toBe(true);
    expect(fit.studentT).toBeNull();
    expect(fit.deltaAIC).toBeNull();
  });

  it('returns no t fit for a constant sample', () => {
    const fit = fitDistributions([0.01, 0.01, 0.01, 0.01]);
    expect(fit.studentT).toBeNull();
    expect(fit.tPreferred).toBe(false);
  });

  it('builds a t curve over the requested range', () => {
    const fit = fitDistributions(
      Array.from({ length: 500 }, (_, index) =>
        Math.sin(index * 0.4) * 0.02,
      ),
    );

    if (!fit.studentT) throw new Error('expected a t fit');

    const curve = buildStudentTCurve(fit.studentT, -0.1, 0.1, 128);
    expect(curve.x).toHaveLength(128);
    expect(curve.y).toHaveLength(128);
    expect(curve.y.every((value) => Number.isFinite(value))).toBe(true);
  });
});
