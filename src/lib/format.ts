export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';

  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatSignedPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  const formatted = formatPercent(value, digits);
  return value > 0 ? `+${formatted}` : formatted;
}

export function formatPValue(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value < 0.0001) return '< 0.0001';
  return value.toFixed(4);
}

export function currencyPrefix(currency: string): string {
  const code = currency.toUpperCase();

  if (code === 'ZAR') return 'R';
  if (code === 'USD') return '$';
  if (code === 'GBP') return '£';
  if (code === 'EUR') return '€';

  return code ? `${code} ` : '';
}

export function formatPrice(value: number, currency: string, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  return `${currencyPrefix(currency)}${formatNumber(value, digits)}`;
}


export function formatIsoDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yearsAgoIso(years: number): string {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.toISOString().slice(0, 10);
}
