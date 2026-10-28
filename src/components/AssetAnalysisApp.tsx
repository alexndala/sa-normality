'use client';

import { useEffect, useState } from 'react';
import AssetActions from '@/components/AssetActions';
import DiagnosticsStrip from '@/components/DiagnosticsStrip';
import DistributionPlot from '@/components/DistributionPlot';
import NarrativeCard from '@/components/NarrativeCard';
import PricePlot from '@/components/PricePlot';
import QQPlot from '@/components/QQPlot';
import RiskPanel from '@/components/RiskPanel';
import SelectionCard from '@/components/SelectionCard';
import { DEFAULT_ASSET } from '@/lib/assets';
import {
  formatIsoDate,
  todayIso,
  yearsAgoIso,
} from '@/lib/format';
import { buildShareUrl, readShareState } from '@/lib/share';
import type {
  AnalyzeResponse,
  ReturnType,
} from '@/lib/types';

const DEFAULT_START = '2018-01-01';
const DEBOUNCE_MS = 300;

export default function AssetAnalysisApp() {
  const [symbol, setSymbol] = useState(DEFAULT_ASSET);
  const [start, setStart] = useState(DEFAULT_START);
  const [end, setEnd] = useState(todayIso);
  const [returnType, setReturnType] = useState<ReturnType>('simple');
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialised, setInitialised] = useState(false);

  const dateError =
    start && end && start >= end
      ? 'The start date must be before the end date.'
      : null;

  useEffect(() => {
    const state = readShareState(window.location.search, {
      symbol: DEFAULT_ASSET,
      start: DEFAULT_START,
      end: todayIso(),
      returnType: 'simple',
    });

    setSymbol(state.symbol);
    setStart(state.start);
    setEnd(state.end);
    setReturnType(state.returnType);
    setInitialised(true);
  }, []);

  useEffect(() => {
    if (!initialised) return;

    const url = buildShareUrl(window.location.href, {
      symbol,
      start,
      end,
      returnType,
    });

    if (url !== window.location.href) {
      window.history.replaceState(null, '', url);
    }
  }, [initialised, symbol, start, end, returnType]);

  useEffect(() => {
    if (!initialised || !symbol || !start || !end) return;

    if (start >= end) {
      setError('The start date must be before the end date.');
      setAnalysis(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          symbol,
          start,
          end,
          returnType,
        });
        const response = await fetch(`/api/analyze?${params.toString()}`, {
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload || payload.success !== true) {
          throw new Error(
            payload?.error ??
              'Could not load data for this asset. Please try another ticker or date range.',
          );
        }

        setAnalysis(payload as AnalyzeResponse);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setAnalysis(null);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Could not load data for this asset.',
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [initialised, symbol, start, end, returnType]);

  function handleQuickRange(years: number | 'max') {
    setStart(years === 'max' ? '1990-01-01' : yearsAgoIso(years));
    setEnd(todayIso());
  }

  return (
    <div className="page-shell">
      <header className="masthead">
        <p className="eyebrow">South African market diagnostics</p>
        <h1>
          Normality of <span>Returns</span>
        </h1>
        <p>
          Examine whether daily returns for South African equities, indices,
          ETFs, currencies and commodities behave like a normal distribution.
          Select an asset and a date range to compare its realised return
          distribution with a fitted normal curve and a normal Q-Q plot.
        </p>
      </header>

      <main className="app-grid">
        <SelectionCard
          symbol={symbol}
          start={start}
          end={end}
          returnType={returnType}
          dateError={dateError}
          onSymbolChange={setSymbol}
          onStartChange={setStart}
          onEndChange={setEnd}
          onReturnTypeChange={setReturnType}
          onQuickRange={handleQuickRange}
        />

        <section className="analysis-panel" aria-busy={loading} aria-live="polite">
          {error && (
            <div className="error-banner" role="alert">
              <div>
                <strong>Unable to load analysis.</strong>
                <div>{error}</div>
              </div>
            </div>
          )}

          {!analysis && !loading && !error && (
            <div className="card">
              <div className="card-header">
                <span>Asset Analysis Plots</span>
              </div>
              <div className="placeholder">
                <div className="placeholder-icon">σ</div>
                <h2>Select an asset</h2>
                <p>
                  Choose an asset from the South African universe or enter any
                  Yahoo Finance ticker, then pick a date range.
                </p>
              </div>
            </div>
          )}

          {!analysis && !loading && error && (
            <div className="card">
              <div className="card-header">
                <span>Asset Analysis Plots</span>
                <span className="card-header-meta">{symbol}</span>
              </div>
              <div className="placeholder">
                <div className="placeholder-icon">!</div>
                <h2>No analysis to display</h2>
                <p>
                  Try another ticker or a longer date range. JSE symbols use the
                  .JO suffix, for example NPN.JO.
                </p>
              </div>
            </div>
          )}

          {!analysis && loading && (
            <div className="card">
              <div className="card-header">
                <span>Asset Analysis Plots</span>
                <span className="card-header-meta">{symbol}</span>
              </div>
              <div className="placeholder">
                <div className="spinner" />
                <p>Loading market data…</p>
              </div>
            </div>
          )}

          {analysis && (
            <article className="card">
              <div className="card-header">
                <span>Asset Analysis Plots</span>
                <span className="card-header-meta">
                  {analysis.meta.symbol} · {analysis.meta.currency}
                </span>
              </div>

              <div className="analysis-body">
                <div className="asset-summary">
                  <div>
                    <h2>{analysis.meta.name}</h2>
                    <div className="summary-meta">
                      <span className="symbol-pill">{analysis.meta.symbol}</span>
                      {analysis.meta.exchange && (
                        <span>{analysis.meta.exchange}</span>
                      )}
                      <span>·</span>
                      <span>
                        {analysis.meta.returnType === 'simple'
                          ? 'Simple'
                          : 'Log'}{' '}
                        returns
                      </span>
                      <span>·</span>
                      <span>
                        {analysis.diagnostics.n.toLocaleString('en-ZA')}{' '}
                        observations
                      </span>
                    </div>
                  </div>
                  <div className="summary-right">
                    <div className="summary-dates">
                      <span>Actual data range</span>
                      <strong>
                        {formatIsoDate(analysis.meta.firstDate)} —{' '}
                        {formatIsoDate(analysis.meta.lastDate)}
                      </strong>
                    </div>
                    <AssetActions analysis={analysis} />
                  </div>
                </div>

                <DiagnosticsStrip diagnostics={analysis.diagnostics} />
                <NarrativeCard narrative={analysis.narrative} />
                <RiskPanel risk={analysis.risk} fit={analysis.fit} />

                <div className="plot-stack">
                  <PricePlot analysis={analysis} />
                  <DistributionPlot analysis={analysis} />
                  <QQPlot analysis={analysis} />
                </div>

                <details className="methodology">
                  <summary>How these numbers are calculated</summary>
                  <div className="methodology-body">
                    <p>
                      VaR and CVaR are 1-day historical estimates from the
                      selected sample. Normal estimates use the sample mean and
                      standard deviation. Ratios compare the historical loss
                      estimate with the normal one.
                    </p>
                    <p>
                      The Student-t fit is estimated by maximum likelihood,
                      with a moment approximation if optimisation fails. AIC
                      compares the normal and Student-t fits; lower is better.
                    </p>
                    <p>
                      Returns use adjusted close. JSE prices quoted in cents
                      are converted to rand. Data comes from Yahoo Finance and
                      is delayed. This is historical analysis, not a forecast or
                      investment advice.
                    </p>
                  </div>
                </details>
              </div>
            </article>
          )}

          {analysis && loading && (
            <div className="loading-overlay">
              <div className="spinner" />
              <span>Updating {symbol}</span>
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <span>
          Data from Yahoo Finance (delayed). Returns use adjusted close and are
          not investment advice.
        </span>
        <span>
          Built for South African assets ·{' '}
          <a href="https://github.com/alexndala" rel="noreferrer">
            Mahlatse Ndala
          </a>
        </span>
      </footer>
    </div>
  );
}
