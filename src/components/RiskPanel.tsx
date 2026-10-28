'use client';

import {
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from '@/lib/format';
import type { FitSummary, RiskMetrics } from '@/lib/types';

interface RiskPanelProps {
  risk: RiskMetrics;
  fit: FitSummary;
}

function understatement(actual: number, normal: number): string {
  if (!Number.isFinite(normal) || normal <= 1e-12) return '—';
  return `${(actual / normal).toFixed(1)}x`;
}

function RiskCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="risk-card">
      <span className="risk-card-label">{label}</span>
      <span className="risk-card-value">{value}</span>
      <span className="risk-card-hint">{hint}</span>
    </div>
  );
}

export default function RiskPanel({ risk, fit }: RiskPanelProps) {
  const rows = [
    {
      label: '95% VaR',
      historical: risk.var95,
      normal: risk.normalVar95,
      ratio: understatement(risk.var95, risk.normalVar95),
    },
    {
      label: '99% VaR',
      historical: risk.var99,
      normal: risk.normalVar99,
      ratio: understatement(risk.var99, risk.normalVar99),
    },
    {
      label: '95% CVaR',
      historical: risk.cvar95,
      normal: risk.normalCvar95,
      ratio: understatement(risk.cvar95, risk.normalCvar95),
    },
    {
      label: '99% CVaR',
      historical: risk.cvar99,
      normal: risk.normalCvar99,
      ratio: understatement(risk.cvar99, risk.normalCvar99),
    },
  ];

  const expected3 =
    risk.expected3Sigma < 1
      ? 'less than 1'
      : formatNumber(risk.expected3Sigma, 0);

  return (
    <section className="risk-panel" aria-labelledby="risk-heading">
      <div className="risk-panel-heading">
        <div>
          <h3 id="risk-heading">Tail risk: normal vs actual</h3>
          <p>
            One-day loss estimates from this sample. Ratios above 1 mean a
            normal model understates the tail.
          </p>
        </div>
        <span className="plot-tag">1-day horizon</span>
      </div>

      <div className="risk-cards">
        <RiskCard
          label="99% VaR"
          value={formatPercent(risk.var99, 2)}
          hint={`Normal ${formatPercent(risk.normalVar99, 2)}`}
        />
        <RiskCard
          label="99% CVaR"
          value={formatPercent(risk.cvar99, 2)}
          hint={`Normal ${formatPercent(risk.normalCvar99, 2)}`}
        />
        <RiskCard
          label="Worst day"
          value={formatSignedPercent(risk.worstDay, 2)}
          hint="Largest single-day loss"
        />
        <RiskCard
          label="Max drawdown"
          value={formatSignedPercent(risk.maxDrawdown, 1)}
          hint="Peak to trough"
        />
      </div>

      <div className="risk-table-wrap">
        <table className="risk-table">
          <thead>
            <tr>
              <th scope="col">Measure</th>
              <th scope="col">Historical</th>
              <th scope="col">Normal</th>
              <th scope="col">Historical / normal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{formatPercent(row.historical, 2)}</td>
                <td>{formatPercent(row.normal, 2)}</td>
                <td>{row.ratio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="risk-footnotes">
        <span>
          <strong>{risk.exceed3Sigma}</strong> days below -3σ vs{' '}
          <strong>{expected3}</strong> expected under normality
        </span>
        {fit.studentT ? (
          fit.tPreferred ? (
            <span className="fit-badge preferred">
              Student-t ν = {fit.studentT.df.toFixed(1)}
              {fit.deltaAIC !== null
                ? ` · ΔAIC ${Math.round(fit.deltaAIC)} vs normal`
                : ''}
              {fit.studentT.method === 'moment' ? ' · approx.' : ''}
            </span>
          ) : (
            <span className="fit-badge">
              Normal fit preferred
              {fit.deltaAIC !== null
                ? ` · ΔAIC ${Math.round(fit.deltaAIC)}`
                : ''}
            </span>
          )
        ) : (
          <span className="fit-badge">Student-t fit unavailable</span>
        )}
      </div>
    </section>
  );
}
