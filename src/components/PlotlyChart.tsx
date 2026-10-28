'use client';

import { useEffect, useRef } from 'react';

interface PlotlyApi {
  react(
    element: HTMLElement,
    data: unknown[],
    layout?: unknown,
    config?: unknown,
  ): Promise<unknown>;
  purge(element: HTMLElement): void;
}

interface PlotlyChartProps {
  data: Array<Record<string, unknown>>;
  layout: Record<string, unknown>;
  config?: Record<string, unknown>;
  ariaLabel: string;
  chartId?: string;
}

export default function PlotlyChart({
  data,
  layout,
  config,
  ariaLabel,
  chartId,
}: PlotlyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotlyRef = useRef<PlotlyApi | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    return () => {
      if (plotlyRef.current) {
        plotlyRef.current.purge(container);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;

    if (!container) return;
    const target = container as HTMLElement;

    async function render() {
      const Plotly =
        plotlyRef.current ??
        (await import('plotly.js-basic-dist-min')).default;

      if (cancelled) return;

      plotlyRef.current = Plotly;

      await Plotly.react(target, data, layout, {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: [
          'lasso2d',
          'select2d',
          'autoScale2d',
          'resetScale2d',
          'toggleSpikelines',
          'hoverClosestCartesian',
          'hoverCompareCartesian',
        ],
        toImageButtonOptions: {
          format: 'png',
          filename: 'sa-normality',
          scale: 2,
        },
        ...config,
      });
    }

    render().catch((error) => {
      console.error('Plotly render failed', error);
    });

    return () => {
      cancelled = true;
    };
  }, [data, layout, config]);

  return (
    <div
      ref={containerRef}
      id={chartId}
      className="plot-canvas"
      role="img"
      aria-label={ariaLabel}
    />
  );
}
