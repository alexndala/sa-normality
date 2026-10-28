'use client';

import { formatNumber, formatPValue, formatPercent } from '@/lib/format';
import type { Diagnostics } from '@/lib/types';

interface DiagnosticsStripProps {
  diagnostics: Diagnostics;
}

function Stat({
  label,
  value,
  hint,
  title,
}: {
  label: string;
  value: string;
  hint?: string;
  title?: string;
}) {
  return (
    <div className="stat" title={title}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

export default function DiagnosticsStrip({ diagnostics }: DiagnosticsStripProps) {
  const rejected = diagnostics.normalityRejected;

  return (
    <div className="diagnostics" aria-label="Return diagnostics">
      <Stat label="Observations" value={formatNumber(diagnostics.n, 0)} />
      <Stat
        label="Mean (daily)"
        value={formatPercent(diagnostics.meanDaily, 3)}
        title="Arithmetic mean of daily returns"
      />
      <Stat
        label="Annualised vol"
        value={formatPercent(diagnostics.volatilityAnnual, 1)}
        title="Sample standard deviation of returns multiplied by the square root of 252"
      />
      <Stat
        label="Total return"
        value={formatPercent(diagnostics.totalReturn, 1)}
        title="Last adjusted close divided by first adjusted close, minus one"
      />
      <Stat
        label="Skewness"
        value={formatNumber(diagnostics.skewness, 2)}
        title="Third standardised moment; zero for a normal distribution"
      />
      <Stat
        label="Excess kurtosis"
        value={formatNumber(diagnostics.excessKurtosis, 2)}
        title="Fourth standardised moment minus three; zero for a normal distribution"
      />
      <Stat
        label="Jarque–Bera"
        value={formatNumber(diagnostics.jbStat, 1)}
        hint={`p = ${formatPValue(diagnostics.jbPValue)}`}
        title="Test statistic for skewness and excess kurtosis jointly. The p-value uses a chi-squared distribution with two degrees of freedom."
      />
      <div className={`verdict ${rejected ? 'rejected' : 'normal'}`}>
        <span className="verdict-label">Jarque–Bera test at 5%</span>
        <strong>
          {rejected
            ? 'Normality rejected — returns are not normal'
            : 'Normality not rejected at the 5% level'}
        </strong>
      </div>
    </div>
  );
}
