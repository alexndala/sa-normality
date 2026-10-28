export type ReturnType = 'simple' | 'log';

export interface AssetOption {
  symbol: string;
  name: string;
  currency?: string;
}

export interface AssetGroup {
  label: string;
  assets: AssetOption[];
}

export interface PriceSeries {
  dates: string[];
  values: number[];
}

export interface Curve {
  x: number[];
  y: number[];
}

export interface HistogramDensity {
  x: number[];
  y: number[];
  width: number;
}

export interface Diagnostics {
  n: number;
  meanDaily: number;
  meanAnnual: number;
  volatilityAnnual: number;
  skewness: number;
  excessKurtosis: number;
  jbStat: number;
  jbPValue: number;
  minReturn: number;
  maxReturn: number;
  totalReturn: number;
  normalityRejected: boolean;
}

export interface RiskMetrics {
  var95: number;
  var99: number;
  cvar95: number;
  cvar99: number;
  normalVar95: number;
  normalVar99: number;
  normalCvar95: number;
  normalCvar99: number;
  var99Ratio: number;
  cvar99Ratio: number;
  worstDay: number;
  maxDrawdown: number;
  exceed2Sigma: number;
  expected2Sigma: number;
  exceed3Sigma: number;
  expected3Sigma: number;
}

export interface StudentTFitSummary {
  mu: number;
  sigma: number;
  df: number;
  logLik: number;
  aic: number;
  bic: number;
  method: 'mle' | 'moment';
}

export interface FitSummary {
  normal: {
    logLik: number;
    aic: number;
    bic: number;
  };
  studentT: StudentTFitSummary | null;
  deltaAIC: number | null;
  tPreferred: boolean;
}

export interface AnalyzeMeta {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  returnType: ReturnType;
  requestedStart: string;
  requestedEnd: string;
  firstDate: string;
  lastDate: string;
  observations: number;
  priceScale: number;
}

export interface AnalyzeResponse {
  success: true;
  meta: AnalyzeMeta;
  price: PriceSeries;
  diagnostics: Diagnostics;
  risk: RiskMetrics;
  fit: FitSummary;
  narrative: string;
  distribution: {
    histogram: HistogramDensity;
    kde: Curve;
    normal: Curve;
    studentT: Curve | null;
    bandwidth: number;
  };
  qq: {
    theoretical: number[];
    sample: number[];
    rawReturns: number[];
    line: { x: number[]; y: number[] };
  };
}

export interface AnalyzeError {
  success: false;
  error: string;
  code: string;
}

export type AnalyzeResult = AnalyzeResponse | AnalyzeError;
