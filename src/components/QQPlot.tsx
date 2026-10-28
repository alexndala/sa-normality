'use client';

import { useMemo } from 'react';
import PlotlyChart from '@/components/PlotlyChart';
import type { AnalyzeResponse } from '@/lib/types';

interface QQPlotProps {
  analysis: AnalyzeResponse;
}

export default function QQPlot({ analysis }: QQPlotProps) {
  const { qq, meta } = analysis;

  const data = useMemo(() => {
    const first = qq.theoretical[0] ?? -3;
    const last = qq.theoretical[qq.theoretical.length - 1] ?? 3;

    return [
      {
        type: 'scatter',
        mode: 'markers',
        x: qq.theoretical,
        y: qq.sample,
        customdata: qq.rawReturns,
        name: 'Returns',
        marker: {
          color: 'rgba(27, 109, 113, 0.65)',
          size: 4,
          line: { width: 0 },
        },
        hovertemplate:
          'Theoretical %{x:.2f}<br>Standardised %{y:.2f}<br>' +
          `Raw return %{customdata:.2%}<extra></extra>`,
      },
      {
        type: 'scatter',
        mode: 'lines',
        x: qq.line.x,
        y: qq.line.y,
        name: 'Quartile line',
        line: { color: '#d07756', width: 2 },
        hoverinfo: 'skip',
      },
      {
        type: 'scatter',
        mode: 'lines',
        x: [first, last],
        y: [first, last],
        name: '45° reference',
        line: { color: '#b8c4c1', width: 1.2, dash: 'dot' },
        hoverinfo: 'skip',
      },
    ];
  }, [qq]);

  const layout = useMemo(
    () => ({
      height: 400,
      margin: { l: 62, r: 18, t: 38, b: 50 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: '#ffffff',
      font: {
        family: 'Roboto, Arial, sans-serif',
        size: 11,
        color: '#5f7278',
      },
      hovermode: 'closest',
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
          text: 'Theoretical normal quantile',
          font: { size: 10.5, color: '#5f7278' },
        },
        gridcolor: '#eef1f0',
        zeroline: true,
        zerolinecolor: '#c9d3d0',
        zerolinewidth: 1,
        linecolor: '#dfe5e3',
        tickfont: { size: 10 },
        automargin: true,
      },
      yaxis: {
        title: {
          text: 'Sample quantile (standardised)',
          font: { size: 10.5, color: '#5f7278' },
        },
        gridcolor: '#eef1f0',
        zeroline: true,
        zerolinecolor: '#c9d3d0',
        zerolinewidth: 1,
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
          line: { color: '#e5eae8', width: 1 },
        },
        {
          type: 'line',
          xref: 'paper',
          yref: 'y',
          x0: 0,
          x1: 1,
          y0: 0,
          y1: 0,
          line: { color: '#e5eae8', width: 1 },
        },
      ],
    }),
    [],
  );

  return (
    <section className="plot-section" aria-labelledby="qq-heading">
      <div className="plot-heading">
        <div>
          <h3 id="qq-heading">Normal Q-Q plot</h3>
          <p>
            Standardised returns against theoretical normal quantiles ·{' '}
            {meta.returnType === 'simple' ? 'simple' : 'log'} returns
          </p>
        </div>
        <span className="plot-tag">Deviations = fat tails / skew</span>
      </div>
      <PlotlyChart
        data={data}
        layout={layout}
        ariaLabel={`Normal quantile-quantile plot of ${meta.name} returns`}
      />
    </section>
  );
}
