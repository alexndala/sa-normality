import type { AssetGroup, AssetOption } from './types';

export const ASSET_GROUPS: AssetGroup[] = [
  {
    label: 'JSE Indices',
    assets: [
      { symbol: '^J203.JO', name: 'FTSE JSE All Share Index', currency: 'ZAR' },
      { symbol: '^J200.JO', name: 'FTSE JSE Top 40 Index', currency: 'ZAR' },
      { symbol: '^JN0U.JO', name: 'JSE Top 40 USD Net TRI', currency: 'USD' },
    ],
  },
  {
    label: 'JSE Equities',
    assets: [
      { symbol: 'NPN.JO', name: 'Naspers', currency: 'ZAR' },
      { symbol: 'PRX.JO', name: 'Prosus', currency: 'ZAR' },
      { symbol: 'FSR.JO', name: 'FirstRand', currency: 'ZAR' },
      { symbol: 'ABG.JO', name: 'Absa Group', currency: 'ZAR' },
      { symbol: 'SBK.JO', name: 'Standard Bank Group', currency: 'ZAR' },
      { symbol: 'NED.JO', name: 'Nedbank Group', currency: 'ZAR' },
      { symbol: 'CPI.JO', name: 'Capitec', currency: 'ZAR' },
      { symbol: 'INL.JO', name: 'Investec Group', currency: 'ZAR' },
      { symbol: 'MTN.JO', name: 'MTN Group', currency: 'ZAR' },
      { symbol: 'VOD.JO', name: 'Vodacom Group', currency: 'ZAR' },
      { symbol: 'SOL.JO', name: 'Sasol', currency: 'ZAR' },
      { symbol: 'AGL.JO', name: 'Anglo American', currency: 'ZAR' },
      { symbol: 'BHG.JO', name: 'BHP Group', currency: 'ZAR' },
      { symbol: 'VAL.JO', name: 'Valterra Platinum', currency: 'ZAR' },
      { symbol: 'GFI.JO', name: 'Gold Fields', currency: 'ZAR' },
      { symbol: 'ANG.JO', name: 'AngloGold Ashanti', currency: 'ZAR' },
      { symbol: 'IMP.JO', name: 'Impala Platinum', currency: 'ZAR' },
      { symbol: 'KIO.JO', name: 'Kumba Iron Ore', currency: 'ZAR' },
      { symbol: 'EXX.JO', name: 'Exxaro Resources', currency: 'ZAR' },
      { symbol: 'SHP.JO', name: 'Shoprite Holdings', currency: 'ZAR' },
      { symbol: 'WHL.JO', name: 'Woolworths Holdings', currency: 'ZAR' },
      { symbol: 'CLS.JO', name: 'Clicks Group', currency: 'ZAR' },
      { symbol: 'BID.JO', name: 'Bid Corporation', currency: 'ZAR' },
      { symbol: 'BVT.JO', name: 'Bidvest Group', currency: 'ZAR' },
      { symbol: 'MRP.JO', name: 'Mr Price Group', currency: 'ZAR' },
      { symbol: 'TFG.JO', name: 'The Foschini Group', currency: 'ZAR' },
      { symbol: 'TRU.JO', name: 'Truworths International', currency: 'ZAR' },
      { symbol: 'DSY.JO', name: 'Discovery', currency: 'ZAR' },
      { symbol: 'SLM.JO', name: 'Sanlam', currency: 'ZAR' },
      { symbol: 'OMU.JO', name: 'Old Mutual', currency: 'ZAR' },
      { symbol: 'PPH.JO', name: 'Pepkor Holdings', currency: 'ZAR' },
      { symbol: 'PIK.JO', name: 'Pick n Pay Stores', currency: 'ZAR' },
      { symbol: 'SPP.JO', name: 'SPAR Group', currency: 'ZAR' },
      { symbol: 'APN.JO', name: 'Aspen Pharmacare', currency: 'ZAR' },
      { symbol: 'NTC.JO', name: 'Netcare', currency: 'ZAR' },
      { symbol: 'RNI.JO', name: 'Reinet Investments', currency: 'ZAR' },
      { symbol: 'MNP.JO', name: 'Mondi', currency: 'ZAR' },
      { symbol: 'BTI.JO', name: 'British American Tobacco', currency: 'ZAR' },
      { symbol: 'CML.JO', name: 'Coronation Fund Managers', currency: 'ZAR' },
      { symbol: 'RDF.JO', name: 'Redefine Properties', currency: 'ZAR' },
      { symbol: 'GRT.JO', name: 'Growthpoint Properties', currency: 'ZAR' },
      { symbol: 'VKE.JO', name: 'Vukile Property Fund', currency: 'ZAR' },
      { symbol: 'HYP.JO', name: 'Hyprop Investments', currency: 'ZAR' },
    ],
  },
  {
    label: 'SA ETFs',
    assets: [
      { symbol: 'STX40.JO', name: 'Satrix 40 ETF', currency: 'ZAR' },
      { symbol: 'STXFIN.JO', name: 'Satrix Financials ETF', currency: 'ZAR' },
      { symbol: 'STXRES.JO', name: 'Satrix Resources ETF', currency: 'ZAR' },
      { symbol: 'STXIND.JO', name: 'Satrix Industrials ETF', currency: 'ZAR' },
      { symbol: 'STXPRO.JO', name: 'Satrix Property ETF', currency: 'ZAR' },
      { symbol: 'STXDIV.JO', name: 'Satrix Dividend Plus ETF', currency: 'ZAR' },
      { symbol: 'STXWDM.JO', name: 'Satrix MSCI World Feeder ETF', currency: 'ZAR' },
      { symbol: 'STXTRA.JO', name: 'Satrix TRACI 3 Month ETF', currency: 'ZAR' },
      { symbol: 'GLD.JO', name: 'NewGold ETF', currency: 'ZAR' },
    ],
  },
  {
    label: 'ZAR FX',
    assets: [
      { symbol: 'USDZAR=X', name: 'US Dollar / South African Rand', currency: 'ZAR' },
      { symbol: 'GBPZAR=X', name: 'Pound Sterling / South African Rand', currency: 'ZAR' },
      { symbol: 'EURZAR=X', name: 'Euro / South African Rand', currency: 'ZAR' },
      { symbol: 'AUDZAR=X', name: 'Australian Dollar / South African Rand', currency: 'ZAR' },
      { symbol: 'JPYZAR=X', name: 'Japanese Yen / South African Rand', currency: 'ZAR' },
      { symbol: 'CHFZAR=X', name: 'Swiss Franc / South African Rand', currency: 'ZAR' },
    ],
  },
  {
    label: 'Commodities (USD)',
    assets: [
      { symbol: 'GC=F', name: 'Gold Futures', currency: 'USD' },
      { symbol: 'PL=F', name: 'Platinum Futures', currency: 'USD' },
      { symbol: 'SI=F', name: 'Silver Futures', currency: 'USD' },
      { symbol: 'CL=F', name: 'WTI Crude Oil Futures', currency: 'USD' },
      { symbol: 'BZ=F', name: 'Brent Crude Oil Futures', currency: 'USD' },
    ],
  },
  {
    label: 'Crypto',
    assets: [
      { symbol: 'BTC-USD', name: 'Bitcoin', currency: 'USD' },
      { symbol: 'ETH-USD', name: 'Ethereum', currency: 'USD' },
    ],
  },
];

export const DEFAULT_ASSET = 'NPN.JO';

export const ALL_ASSETS: AssetOption[] = ASSET_GROUPS.flatMap(
  (group) => group.assets,
);

export const ASSET_BY_SYMBOL = new Map(
  ALL_ASSETS.map((asset) => [asset.symbol, asset] as const),
);
