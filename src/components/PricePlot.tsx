'use client';

import { useMemo } from 'react';
import PlotlyChart from '@/components/PlotlyChart';
import { currencyPrefix, formatIsoDate } from '@/lib/format';
import type { AnalyzeResponse } from '@/lib/types';

interface PricePlotProps {
  analysis: AnalyzeResponse;
}

export default function PricePlot({ analysis }: PricePlotProps) {
  const { price, meta } = analysis;
  const prefix = currencyPrefix(meta.currency);

  const data = useMemo(
    () => [
      {
        type: 'scatter',
        mode: 'lines',
        x: price.dates,
        y: price.values,
        name: meta.name,
        line: { color: '#1b6d71', width: 2 },
        hovertemplate: `%{x|%d %b %Y}<br><b>${prefix}%{y:,.2f}</b><extra></extra>`,
      },
    ],
    [price.dates, price.values, meta.name, prefix],
  );

  const layout = useMemo(
    () => ({
      height: 400,
      margin: { l: 66, r: 18, t: 10, b: 42 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: '#ffffff',
      font: {
        family: 'Roboto, Arial, sans-serif',
        size: 11,
        color: '#5f7278',
      },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#ffffff',
        bordercolor: '#dfe5e3',
        font: { color: '#132f38', size: 12 },
      },
      showlegend: false,
      xaxis: {
        type: 'date',
        showgrid: false,
        zeroline: false,
        linecolor: '#dfe5e3',
        tickcolor: '#dfe5e3',
        ticks: 'outside',
        tickfont: { size: 10 },
        automargin: true,
      },
      yaxis: {
        gridcolor: '#eef1f0',
        zeroline: false,
        tickprefix: prefix,
        tickformat: ',.2f',
        tickfont: { size: 10 },
        automargin: true,
      },
    }),
    [prefix],
  );

  return (
    <section className="plot-section" aria-labelledby="price-heading">
      <div className="plot-heading">
        <div>
          <h3 id="price-heading">Price history</h3>
          <p>
            Adjusted close in {meta.currency}
            {meta.priceScale !== 1 ? ' (minor units converted)' : ''}
          </p>
        </div>
        <span className="plot-tag">
          {formatIsoDate(meta.firstDate)} — {formatIsoDate(meta.lastDate)}
        </span>
      </div>
      <PlotlyChart
        data={data}
        layout={layout}
        ariaLabel={`${meta.name} adjusted closing price history`}
      />
    </section>
  );
}
