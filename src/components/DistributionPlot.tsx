'use client';

import { useMemo } from 'react';
import PlotlyChart from '@/components/PlotlyChart';
import type { AnalyzeResponse } from '@/lib/types';

interface DistributionPlotProps {
  analysis: AnalyzeResponse;
}

export default function DistributionPlot({ analysis }: DistributionPlotProps) {
  const { distribution, meta, diagnostics } = analysis;

  const data = useMemo(
    () => [
      {
        type: 'bar',
        x: distribution.histogram.x,
        y: distribution.histogram.y,
        width: distribution.histogram.width,
        name: 'Histogram',
        marker: {
          color: 'rgba(44, 130, 134, 0.26)',
          line: { color: 'rgba(44, 130, 134, 0.55)', width: 1 },
        },
        hovertemplate:
          'Return %{x:.2%}<br>Density %{y:.3f}<extra></extra>',
      },
      {
        type: 'scatter',
        mode: 'lines',
        x: distribution.kde.x,
        y: distribution.kde.y,
        name: 'Kernel density',
        line: { color: '#d07756', width: 2.4 },
        hovertemplate:
          'Return %{x:.2%}<br>Density %{y:.3f}<extra></extra>',
      },
      {
        type: 'scatter',
        mode: 'lines',
        x: distribution.normal.x,
        y: distribution.normal.y,
        name: 'Normal fit',
        line: { color: '#092a36', width: 2, dash: 'dash' },
        hovertemplate:
          'Return %{x:.2%}<br>Density %{y:.3f}<extra></extra>',
      },
    ],
    [distribution],
  );

  const layout = useMemo(
    () => ({
      height: 400,
      margin: { l: 60, r: 18, t: 38, b: 48 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: '#ffffff',
      font: {
        family: 'Roboto, Arial, sans-serif',
        size: 11,
        color: '#5f7278',
      },
      bargap: 0.04,
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#ffffff',
        bordercolor: '#dfe5e3',
        font: { color: '#132f38', size: 12 },
      },
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.14,
        font: { size: 10 },
        bgcolor: 'rgba(0,0,0,0)',
      },
      xaxis: {
        title: {
          text:
            meta.returnType === 'simple'
              ? 'Daily simple return'
              : 'Daily log return',
          font: { size: 10.5, color: '#5f7278' },
        },
        tickformat: '.1%',
        zeroline: true,
        zerolinecolor: '#c9d3d0',
        zerolinewidth: 1,
        gridcolor: '#eef1f0',
        linecolor: '#dfe5e3',
        tickfont: { size: 10 },
        automargin: true,
      },
      yaxis: {
        title: {
          text: 'Density',
          font: { size: 10.5, color: '#5f7278' },
        },
        gridcolor: '#eef1f0',
        zeroline: false,
        tickfont: { size: 10 },
        automargin: true,
      },
      shapes: [
        {
          type: 'line',
          xref: 'x',
          yref: 'paper',
          x0: 0,
          x1: 0,
          y0: 0,
          y1: 1,
          line: { color: '#c9d3d0', width: 1, dash: 'dot' },
        },
      ],
    }),
    [meta.returnType],
  );

  return (
    <section className="plot-section" aria-labelledby="distribution-heading">
      <div className="plot-heading">
        <div>
          <h3 id="distribution-heading">Distribution of returns</h3>
          <p>
            Histogram, kernel density estimate and fitted normal distribution
            {` · n = ${diagnostics.n.toLocaleString('en-ZA')}`}
          </p>
        </div>
        <span className="plot-tag">
          Skew {diagnostics.skewness.toFixed(2)} · Kurt{' '}
          {diagnostics.excessKurtosis.toFixed(2)}
        </span>
      </div>
      <PlotlyChart
        data={data}
        layout={layout}
        ariaLabel={`Distribution of ${meta.name} returns compared with a normal distribution`}
      />
    </section>
  );
}
