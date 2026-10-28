import {
  formatPercent,
  formatPValue,
  formatSignedPercent,
} from './format';
import type {
  Diagnostics,
  FitSummary,
  RiskMetrics,
} from './types';

interface NarrativeInput {
  diagnostics: Diagnostics;
  risk: RiskMetrics;
  fit: FitSummary;
  meta: {
    name: string;
    symbol: string;
  };
}

function pValuePhrase(value: number): string {
  if (value < 0.0001) return 'p < 0.0001';
  return `p = ${formatPValue(value)}`;
}

function expectedPhrase(value: number): string {
  if (value < 1) return 'less than 1';
  if (value < 10) return value.toFixed(1);
  return String(Math.round(value));
}

export function buildNarrative({
  diagnostics,
  risk,
  fit,
  meta,
}: NarrativeInput): string {
  const parts: string[] = [];

  const verdict = diagnostics.normalityRejected
    ? `Normality is rejected at the 5% level (Jarque-Bera ${pValuePhrase(diagnostics.jbPValue)}).`
    : `Normality is not rejected at the 5% level (Jarque-Bera ${pValuePhrase(diagnostics.jbPValue)}).`;

  parts.push(
    `This analysis covers ${meta.name} (${meta.symbol}) daily returns. ${verdict}`,
  );

  const shape: string[] = [];
  if (Math.abs(diagnostics.skewness) >= 0.25) {
    shape.push(
      diagnostics.skewness > 0 ? 'positively skewed' : 'negatively skewed',
    );
  }
  if (diagnostics.excessKurtosis > 0.5) {
    shape.push('fat-tailed');
  } else if (diagnostics.excessKurtosis < -0.5) {
    shape.push('thin-tailed');
  }

  if (shape.length > 0) {
    parts.push(
      `Returns are ${shape.join(' and ')} (skew ${diagnostics.skewness.toFixed(2)}, ` +
        `excess kurtosis ${diagnostics.excessKurtosis.toFixed(2)}), so ` +
        (diagnostics.excessKurtosis > 0.5
          ? 'large moves are more frequent than a normal model implies.'
          : 'the tails do not match a normal distribution.'),
    );
  } else {
    parts.push(
      `The distribution is close to symmetric and not unusually fat-tailed ` +
        `(skew ${diagnostics.skewness.toFixed(2)}, excess kurtosis ` +
        `${diagnostics.excessKurtosis.toFixed(2)}).`,
    );
  }

  const varSentence =
    `At the 99% level, historical VaR is ${formatPercent(risk.var99, 2)} ` +
    `versus ${formatPercent(risk.normalVar99, 2)} under a normal fit`;

  if (risk.var99Ratio >= 1.05) {
    parts.push(
      `${varSentence}, so the normal model understates the daily tail loss by ` +
        `${risk.var99Ratio.toFixed(1)}x.`,
    );
  } else if (risk.var99Ratio > 0 && risk.var99Ratio <= 0.95) {
    parts.push(
      `${varSentence}, so the normal model is conservative for this sample ` +
        `(${risk.var99Ratio.toFixed(1)}x).`,
    );
  } else {
    parts.push(`${varSentence}, broadly in line with the normal estimate.`);
  }

  const exceedance =
    risk.exceed3Sigma === 0
      ? `No days fell more than three standard deviations below the mean ` +
        `(about ${expectedPhrase(risk.expected3Sigma)} expected under normality).`
      : `${risk.exceed3Sigma} days fell more than three standard deviations below ` +
        `the mean, versus about ${expectedPhrase(risk.expected3Sigma)} expected under normality.`;

  parts.push(
    `${exceedance} The worst day was ${formatSignedPercent(risk.worstDay, 2)} ` +
      `and maximum drawdown was ${formatSignedPercent(risk.maxDrawdown, 1)}.`,
  );

  if (fit.studentT) {
    const { df, method } = fit.studentT;
    const approximation = method === 'moment' ? ' (moment approximation)' : '';

    if (fit.tPreferred && fit.deltaAIC !== null) {
      parts.push(
        `A Student-t fit with ${df.toFixed(1)} degrees of freedom beats the ` +
          `normal fit by AIC ${Math.round(fit.deltaAIC)}${approximation}.`,
      );
    } else if (df > 30) {
      parts.push(
        'A Student-t fit sits close to the normal model, so there is no ' +
          'material gain from the heavier-tailed alternative.',
      );
    } else {
      parts.push(
        `A Student-t fit with ${df.toFixed(1)} degrees of freedom does not ` +
          'improve on the normal model by AIC.',
      );
    }
  }

  if (diagnostics.n < 250) {
    parts.push(
      `With only ${diagnostics.n} observations, treat these estimates as indicative.`,
    );
  }

  parts.push(
    'This describes the selected historical sample, not a forecast.',
  );

  return parts.join(' ');
}
