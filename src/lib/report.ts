import {
  formatIsoDate,
  formatNumber,
  formatPercent,
  formatPValue,
  formatSignedPercent,
} from './format';
import type { AnalyzeResponse } from './types';

interface ReportCharts {
  price: string;
  distribution: string;
  qq: string;
}

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  tealDeep: [9, 42, 54] as const,
  teal: [27, 109, 113] as const,
  tealSoft: [223, 234, 231] as const,
  copper: [208, 119, 86] as const,
  text: [19, 47, 56] as const,
  light: [95, 114, 120] as const,
  border: [223, 229, 227] as const,
  white: [248, 250, 250] as const,
};

function safeFileName(symbol: string): string {
  return symbol.replace(/[^A-Za-z0-9.-]/g, '-');
}

async function captureCharts(): Promise<ReportCharts> {
  const Plotly = (await import('plotly.js-basic-dist-min')).default;
  const ids = {
    price: 'price-chart',
    distribution: 'distribution-chart',
    qq: 'qq-chart',
  };

  const entries = await Promise.all(
    Object.entries(ids).map(async ([key, id]) => {
      const node = document.getElementById(id);
      if (!node) {
        throw new Error('Charts are still loading. Try again in a moment.');
      }

      const image = await Plotly.toImage(node, {
        format: 'png',
        width: 1100,
        height: 500,
        scale: 1,
      });

      return [key, image] as const;
    }),
  );

  return Object.fromEntries(entries) as unknown as ReportCharts;
}

export function reportFileName(analysis: AnalyzeResponse): string {
  const { symbol, firstDate, lastDate } = analysis.meta;
  return `sa-normality-${safeFileName(symbol)}-${firstDate}-${lastDate}.pdf`;
}

export async function downloadReport(analysis: AnalyzeResponse): Promise<void> {
  const [{ jsPDF }, charts] = await Promise.all([
    import('jspdf'),
    captureCharts(),
  ]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const setText = (
    size: number,
    style: 'normal' | 'bold' = 'normal',
    color: readonly [number, number, number] = COLORS.text,
  ) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const ensureSpace = (y: number, needed: number): number => {
    if (y + needed <= PAGE_HEIGHT - 18) return y;
    doc.addPage();
    return MARGIN + 4;
  };

  const addWrapped = (
    text: string,
    x: number,
    y: number,
    width: number,
    lineHeight = 4.5,
  ): number => {
    const lines = doc.splitTextToSize(text, width);
    doc.text(lines, x, y);
    return y + lines.length * lineHeight;
  };

  const sectionHeading = (text: string, y: number): number => {
    setText(10, 'bold', COLORS.teal);
    doc.text(text, MARGIN, y);
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.line(MARGIN, y + 2, PAGE_WIDTH - MARGIN, y + 2);
    return y + 6;
  };

  const drawStatGrid = (
    entries: Array<{ label: string; value: string }>,
    y: number,
  ): number => {
    const columns = 3;
    const gap = 4;
    const cellWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
    const cellHeight = 13;

    entries.forEach((entry, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const x = MARGIN + column * (cellWidth + gap);
      const cellY = y + row * (cellHeight + 2);

      doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, cellY, cellWidth, cellHeight, 1, 1, 'FD');

      setText(6.5, 'bold', COLORS.light);
      doc.text(entry.label.toUpperCase(), x + 3, cellY + 4.5);
      setText(9.5, 'bold', COLORS.text);
      doc.text(entry.value, x + 3, cellY + 10);
    });

    const rows = Math.ceil(entries.length / columns);
    return y + rows * (cellHeight + 2);
  };

  const drawRiskTable = (y: number): number => {
    const measurements = [
      ['95% VaR', analysis.risk.var95, analysis.risk.normalVar95],
      ['99% VaR', analysis.risk.var99, analysis.risk.normalVar99],
      ['95% CVaR', analysis.risk.cvar95, analysis.risk.normalCvar95],
      ['99% CVaR', analysis.risk.cvar99, analysis.risk.normalCvar99],
    ] as const;

    const columns = [
      { label: 'Measure', width: 50 },
      { label: 'Historical', width: 44 },
      { label: 'Normal', width: 44 },
      { label: 'Hist. / normal', width: 44 },
    ];

    doc.setFillColor(
      COLORS.tealSoft[0],
      COLORS.tealSoft[1],
      COLORS.tealSoft[2],
    );
    doc.rect(MARGIN, y, CONTENT_WIDTH, 7, 'F');

    let x = MARGIN;
    setText(7, 'bold', COLORS.text);
    columns.forEach((column) => {
      doc.text(column.label, x + 3, y + 4.8);
      x += column.width;
    });

    let rowY = y + 7;

    measurements.forEach(([label, historical, normal]) => {
      const ratio = normal > 1e-12 ? historical / normal : 0;

      doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
      doc.line(MARGIN, rowY, PAGE_WIDTH - MARGIN, rowY);

      setText(8, 'normal', COLORS.text);
      doc.text(label, MARGIN + 3, rowY + 4.8);
      doc.text(formatPercent(historical, 2), MARGIN + 53, rowY + 4.8);
      doc.text(formatPercent(normal, 2), MARGIN + 97, rowY + 4.8);
      doc.text(
        ratio > 0 ? `${ratio.toFixed(1)}x` : '—',
        MARGIN + 141,
        rowY + 4.8,
      );

      rowY += 7;
    });

    doc.line(MARGIN, rowY, PAGE_WIDTH - MARGIN, rowY);
    return rowY + 4;
  };

  const addChart = (
    image: string,
    title: string,
    subtitle: string,
    y: number,
  ): number => {
    const nextY = ensureSpace(y, 93);
    setText(10, 'bold', COLORS.teal);
    doc.text(title, MARGIN, nextY);
    setText(7.5, 'normal', COLORS.light);
    doc.text(subtitle, MARGIN, nextY + 4);
    doc.addImage(
      image,
      'PNG',
      MARGIN,
      nextY + 6,
      CONTENT_WIDTH,
      83,
      undefined,
      'FAST',
    );
    return nextY + 93;
  };

  // Header
  doc.setFillColor(COLORS.tealDeep[0], COLORS.tealDeep[1], COLORS.tealDeep[2]);
  doc.rect(0, 0, PAGE_WIDTH, 34, 'F');
  doc.setFillColor(COLORS.copper[0], COLORS.copper[1], COLORS.copper[2]);
  doc.rect(0, 34, PAGE_WIDTH, 1.5, 'F');

  setText(20, 'bold', COLORS.white);
  doc.text('SA Normality Report', MARGIN, 14);

  setText(11, 'normal', COLORS.white);
  doc.text(`${analysis.meta.name} (${analysis.meta.symbol})`, MARGIN, 21);

  setText(8, 'normal', [202, 220, 215]);
  doc.text(
    `${formatIsoDate(analysis.meta.firstDate)} to ${formatIsoDate(
      analysis.meta.lastDate,
    )} · ${analysis.meta.returnType} returns · ${analysis.diagnostics.n.toLocaleString(
      'en-ZA',
    )} observations · ${analysis.meta.currency}`,
    MARGIN,
    27,
  );

  let y = 42;

  y = sectionHeading('What this means', y);
  setText(9, 'normal', COLORS.text);
  y = addWrapped(analysis.narrative, MARGIN, y, CONTENT_WIDTH, 4.6);
  y += 4;

  y = sectionHeading('Diagnostics', y);
  y = drawStatGrid(
    [
      { label: 'Observations', value: analysis.diagnostics.n.toLocaleString('en-ZA') },
      { label: 'Skewness', value: formatNumber(analysis.diagnostics.skewness, 2) },
      {
        label: 'Excess kurtosis',
        value: formatNumber(analysis.diagnostics.excessKurtosis, 2),
      },
      {
        label: 'Annualised vol',
        value: formatPercent(analysis.diagnostics.volatilityAnnual, 1),
      },
      {
        label: 'Total return',
        value: formatPercent(analysis.diagnostics.totalReturn, 1),
      },
      {
        label: 'Jarque-Bera p',
        value: formatPValue(analysis.diagnostics.jbPValue),
      },
    ],
    y,
  );
  y += 3;

  y = sectionHeading('Tail risk: historical vs normal', y);
  y = drawRiskTable(y);

  setText(7.5, 'normal', COLORS.light);
  const expected3 = analysis.risk.expected3Sigma;
  const expectedText =
    expected3 < 1 ? 'less than 1' : `about ${Math.round(expected3)}`;
  y = addWrapped(
    `${analysis.risk.exceed3Sigma} days fell more than three standard ` +
      `deviations below the mean, versus ${expectedText} expected under ` +
      `normality. Worst day: ${formatSignedPercent(
        analysis.risk.worstDay,
        2,
      )}. Maximum drawdown: ${formatSignedPercent(
        analysis.risk.maxDrawdown,
        1,
      )}.`,
    MARGIN,
    y + 2,
    CONTENT_WIDTH,
    4.2,
  );

  if (analysis.fit.studentT) {
    const fit = analysis.fit.studentT;
    const delta =
      analysis.fit.deltaAIC !== null
        ? `, delta AIC ${Math.round(analysis.fit.deltaAIC)} vs normal`
        : '';
    y = addWrapped(
      `Student-t fit: nu = ${fit.df.toFixed(1)}, ${
        fit.method === 'mle' ? 'maximum likelihood' : 'moment approximation'
      }${delta}.`,
      MARGIN,
      y + 1,
      CONTENT_WIDTH,
      4.2,
    );
  }

  y += 4;
  y = addChart(
    charts.price,
    'Price history',
    `Adjusted close in ${analysis.meta.currency}`,
    y,
  );

  // Page 2
  doc.addPage();
  y = MARGIN + 4;

  y = addChart(
    charts.distribution,
    'Distribution of returns',
    'Histogram, kernel density, normal fit and Student-t fit',
    y,
  );
  y += 2;
  y = addChart(
    charts.qq,
    'Normal Q-Q plot',
    'Standardised returns against theoretical normal quantiles',
    y,
  );
  y += 2;

  y = sectionHeading('Methodology', y);
  setText(7.5, 'normal', COLORS.light);
  y = addWrapped(
    'VaR and CVaR are 1-day historical estimates from the selected sample. ' +
      'Normal estimates use the sample mean and standard deviation. The ' +
      'Student-t fit is estimated by maximum likelihood, with a moment ' +
      'approximation if optimisation fails. Returns use adjusted close; JSE ' +
      'prices are converted from cents to rand. Data from Yahoo Finance ' +
      '(delayed). This is a historical description, not a forecast or ' +
      'investment advice.',
    MARGIN,
    y,
    CONTENT_WIDTH,
    4.2,
  );

  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.line(MARGIN, PAGE_HEIGHT - 14, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 14);
    setText(6.5, 'normal', COLORS.light);
    doc.text(
      'SA Normality of Returns · Data: Yahoo Finance (delayed)',
      MARGIN,
      PAGE_HEIGHT - 9,
    );
    doc.text(
      `Page ${page} of ${pageCount}`,
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - 9,
      { align: 'right' },
    );
  }

  doc.save(reportFileName(analysis));
}
