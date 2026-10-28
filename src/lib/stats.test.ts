import { describe, expect, it } from 'vitest';
import {
  computeKde,
  computeNormalCurve,
  computeQq,
  computeReturns,
  describeMoments,
  histogramDensity,
  jarqueBera,
  normalCdf,
  normalInv,
  quantileSorted,
  sampleStd,
} from './stats';

describe('computeReturns', () => {
  it('computes simple returns', () => {
    const returns = computeReturns([100, 110, 99], 'simple');
    expect(returns).toHaveLength(2);
    expect(returns[0]).toBeCloseTo(0.1, 12);
    expect(returns[1]).toBeCloseTo(-0.1, 12);
  });

  it('computes log returns', () => {
    const returns = computeReturns([100, Math.E * 100], 'log');
    expect(returns[0]).toBeCloseTo(1, 12);
  });

  it('drops invalid prices', () => {
    const returns = computeReturns([0, 100, 110], 'simple');
    expect(returns).toHaveLength(1);
    expect(returns[0]).toBeCloseTo(0.1, 12);
    expect(computeReturns([100, Number.NaN, 110], 'simple')).toEqual([]);
  });
});

describe('moments', () => {
  it('matches known values for a small sample', () => {
    const moments = describeMoments([1, 2, 3, 4, 5]);
    expect(moments.n).toBe(5);
    expect(moments.mean).toBe(3);
    expect(moments.populationStd).toBeCloseTo(Math.SQRT2, 12);
    expect(moments.sampleStd).toBeCloseTo(Math.sqrt(2.5), 12);
    expect(moments.skewness).toBeCloseTo(0, 12);
    expect(moments.excessKurtosis).toBeCloseTo(-1.3, 12);
  });

  it('returns zeros for an empty sample', () => {
    expect(describeMoments([])).toEqual({
      n: 0,
      mean: 0,
      populationStd: 0,
      sampleStd: 0,
      skewness: 0,
      excessKurtosis: 0,
    });
  });
});

describe('normal distribution helpers', () => {
  it('round-trips the 97.5th percentile', () => {
    expect(normalInv(0.5)).toBeCloseTo(0, 12);
    expect(normalInv(0.975)).toBeCloseTo(1.959963984540054, 8);
    expect(normalCdf(normalInv(0.975))).toBeCloseTo(0.975, 6);
  });

  it('handles the tails', () => {
    expect(normalInv(0.001)).toBeLessThan(-3);
    expect(normalInv(0.999)).toBeGreaterThan(3);
    expect(normalInv(0)).toBe(Number.NEGATIVE_INFINITY);
    expect(normalInv(1)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('jarqueBera', () => {
  it('matches the chi-squared survival function for two degrees of freedom', () => {
    const result = jarqueBera(0, -1.3, 5);
    expect(result.statistic).toBeCloseTo((5 / 6) * (1.69 / 4), 12);
    expect(result.pValue).toBeCloseTo(Math.exp(-result.statistic / 2), 12);
  });
});

describe('histogramDensity', () => {
  it('integrates to one', () => {
    const values = Array.from({ length: 500 }, (_, i) =>
      Math.sin(i) + (i % 7) * 0.03,
    );
    const histogram = histogramDensity(values);
    const area = histogram.y.reduce((sum, y) => sum + y * histogram.width, 0);
    expect(area).toBeCloseTo(1, 10);
  });

  it('handles a constant sample', () => {
    const histogram = histogramDensity([0.01, 0.01, 0.01]);
    expect(histogram.x).toHaveLength(1);
    expect(histogram.y[0] * histogram.width).toBeCloseTo(1, 12);
  });
});

describe('computeKde', () => {
  it('integrates to approximately one', () => {
    const values = Array.from({ length: 400 }, (_, i) =>
      Math.sin(i * 0.7) * 0.02,
    );
    const kde = computeKde(values);
    let area = 0;

    for (let i = 1; i < kde.x.length; i += 1) {
      area +=
        ((kde.y[i] + kde.y[i - 1]) / 2) * (kde.x[i] - kde.x[i - 1]);
    }

    expect(area).toBeCloseTo(1, 1);
    expect(kde.bandwidth).toBeGreaterThan(0);
  });

  it('has a positive bandwidth for a constant sample', () => {
    const kde = computeKde([1, 1, 1]);
    expect(kde.bandwidth).toBeGreaterThan(0);
    expect(Number.isFinite(kde.bandwidth)).toBe(true);
  });
});

describe('computeNormalCurve', () => {
  it('integrates to approximately one', () => {
    const curve = computeNormalCurve(0, 1, -6, 6, 500);
    let area = 0;

    for (let i = 1; i < curve.x.length; i += 1) {
      area +=
        ((curve.y[i] + curve.y[i - 1]) / 2) * (curve.x[i] - curve.x[i - 1]);
    }

    expect(area).toBeCloseTo(1, 6);
  });
});

describe('computeQq', () => {
  it('produces aligned theoretical, sample and raw series', () => {
    const qq = computeQq([-2, -1, 0, 1, 2]);
    expect(qq.theoretical).toHaveLength(5);
    expect(qq.sample).toHaveLength(5);
    expect(qq.rawReturns).toHaveLength(5);
    expect(qq.theoretical[0]).toBeLessThan(qq.theoretical[4]);
    expect(qq.sample[0]).toBeLessThan(qq.sample[4]);
    expect(qq.line.x).toHaveLength(2);
    expect(qq.line.y).toHaveLength(2);
  });
});

describe('quantile helpers', () => {
  it('interpolates percentiles', () => {
    expect(quantileSorted([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(quantileSorted([1, 2, 3, 4, 5], 0.25)).toBe(2);
  });

  it('computes the sample standard deviation', () => {
    expect(sampleStd([1, 2, 3, 4, 5])).toBeCloseTo(Math.sqrt(2.5), 12);
  });
});
