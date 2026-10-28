'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { ASSET_BY_SYMBOL, ASSET_GROUPS } from '@/lib/assets';
import type { ReturnType } from '@/lib/types';

interface SelectionCardProps {
  symbol: string;
  start: string;
  end: string;
  returnType: ReturnType;
  dateError: string | null;
  onSymbolChange: (symbol: string) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onReturnTypeChange: (value: ReturnType) => void;
  onQuickRange: (years: number | 'max') => void;
}

const TICKER_PATTERN = /^[A-Z0-9.^=_-]{1,24}$/;

export default function SelectionCard({
  symbol,
  start,
  end,
  returnType,
  dateError,
  onSymbolChange,
  onStartChange,
  onEndChange,
  onReturnTypeChange,
  onQuickRange,
}: SelectionCardProps) {
  const [customTicker, setCustomTicker] = useState('');
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const selected = ASSET_BY_SYMBOL.get(symbol);

  function handleCustomSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalised = customTicker.trim().toUpperCase();

    if (!TICKER_PATTERN.test(normalised)) {
      setCustomMessage(
        'Use a valid Yahoo Finance ticker, for example SLM.JO or USDZAR=X.',
      );
      return;
    }

    onSymbolChange(normalised);
    setCustomTicker('');
    setCustomMessage(null);
  }

  return (
    <aside className="card selection-card" aria-label="Asset selection">
      <div className="card-header">
        <span>Asset Selection</span>
        <span className="card-header-meta">SA universe</span>
      </div>

      <div className="card-body">
        <div className="field">
          <label className="field-label" htmlFor="asset-select">
            Select an asset
          </label>
          <select
            id="asset-select"
            className="select"
            value={symbol}
            onChange={(event) => onSymbolChange(event.target.value)}
          >
            {!selected && (
              <optgroup label="Custom">
                <option value={symbol}>{symbol} (custom ticker)</option>
              </optgroup>
            )}
            {ASSET_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.assets.map((asset) => (
                  <option key={asset.symbol} value={asset.symbol}>
                    {asset.name} ({asset.symbol})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="selected-name">
            <span className="symbol-pill">{symbol}</span>
            <span>{selected?.name ?? 'Custom Yahoo Finance ticker'}</span>
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="custom-ticker">
            Or use any Yahoo ticker
          </label>
          <form className="custom-row" onSubmit={handleCustomSubmit}>
            <input
              id="custom-ticker"
              className="input"
              type="text"
              value={customTicker}
              placeholder="e.g. SLM.JO"
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                setCustomTicker(event.target.value);
                setCustomMessage(null);
              }}
            />
            <button className="primary-button" type="submit">
              Load
            </button>
          </form>
          <p className="field-hint">
            {customMessage ??
              'JSE symbols use the .JO suffix. Indices, ETFs and FX are supported.'}
          </p>
        </div>

        <div className="divider" />

        <div className="field">
          <span className="field-label">Select date range</span>
          <div className="date-range">
            <label className="sr-only" htmlFor="start-date">
              Start date
            </label>
            <input
              id="start-date"
              className="input"
              type="date"
              value={start}
              min="1990-01-01"
              max={end || undefined}
              onChange={(event) => onStartChange(event.target.value)}
            />
            <span>to</span>
            <label className="sr-only" htmlFor="end-date">
              End date
            </label>
            <input
              id="end-date"
              className="input"
              type="date"
              value={end}
              min={start || undefined}
              onChange={(event) => onEndChange(event.target.value)}
            />
          </div>
          <div className="quick-ranges">
            <button type="button" className="chip" onClick={() => onQuickRange(1)}>
              1Y
            </button>
            <button type="button" className="chip" onClick={() => onQuickRange(3)}>
              3Y
            </button>
            <button type="button" className="chip" onClick={() => onQuickRange(5)}>
              5Y
            </button>
            <button type="button" className="chip" onClick={() => onQuickRange(10)}>
              10Y
            </button>
            <button type="button" className="chip" onClick={() => onQuickRange('max')}>
              Max
            </button>
          </div>
          {dateError && (
            <p className="field-hint" role="alert" style={{ color: '#b86244' }}>
              {dateError}
            </p>
          )}
        </div>

        <div className="divider" />

        <div className="field">
          <span className="field-label">Return definition</span>
          <div className="segmented" role="group" aria-label="Return definition">
            <button
              type="button"
              aria-pressed={returnType === 'simple'}
              onClick={() => onReturnTypeChange('simple')}
            >
              Simple
            </button>
            <button
              type="button"
              aria-pressed={returnType === 'log'}
              onClick={() => onReturnTypeChange('log')}
            >
              Log
            </button>
          </div>
          <p className="field-hint">
            {returnType === 'simple'
              ? 'Pₜ / Pₜ₋₁ − 1, using adjusted close.'
              : 'ln(Pₜ / Pₜ₋₁), using adjusted close.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
