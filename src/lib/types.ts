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
  distribution: {
    histogram: HistogramDensity;
    kde: Curve;
    normal: Curve;
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
