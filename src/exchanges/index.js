// Exchange initialization and management
import { BinanceAdapter } from './binance.js';
import { BybitAdapter } from './bybit.js';
import { OKXAdapter } from './okx.js';
import { BitgetAdapter } from './bitget.js';
import { KuCoinAdapter } from './kucoin.js';
import { GateAdapter } from './gate.js';
import { BingXAdapter } from './bingx.js';
import { MEXCAdapter } from './mexc.js';
import { HTXAdapter } from './htx.js';
import { HyperliquidAdapter } from './hyperliquid.js';
import { AsterAdapter } from './aster.js';
import { OurbitAdapter } from './ourbit.js';
import { BitMartAdapter } from './bitmart.js';
import { XTAdapter } from './xt.js';
import { JuAdapter } from './ju.js';
import { KCEXAdapter } from './kcex.js';
import { LeveXAdapter } from './levex.js';
import { EdgeXAdapter } from './edgex.js';
import { logger } from '../utils/logger.js';

const ENABLED_EXCHANGES = {
  binance: process.env.ENABLE_BINANCE === '1',
  bybit: process.env.ENABLE_BYBIT === '1',
  okx: process.env.ENABLE_OKX === '1',
  bitget: process.env.ENABLE_BITGET === '1',
  kucoin: process.env.ENABLE_KUCOIN === '1',
  gate: process.env.ENABLE_GATE === '1',
  bingx: process.env.ENABLE_BINGX === '1',
  mexc: process.env.ENABLE_MEXC === '1',
  htx: process.env.ENABLE_HTX === '1',
  hyperliquid: process.env.ENABLE_HYPERLIQUID === '1',
  aster: process.env.ENABLE_ASTER === '1',
  ourbit: process.env.ENABLE_OURBIT === '1',
  bitmart: process.env.ENABLE_BITMART === '1',
  xt: process.env.ENABLE_XT === '1',
  ju: process.env.ENABLE_JU === '1',
  kcex: process.env.ENABLE_KCEX === '1',
  levex: process.env.ENABLE_LEVEX === '1',
  edgex: process.env.ENABLE_EDGEX === '1'
};

const EXCHANGE_CONSTRUCTORS = {
  binance: () => new BinanceAdapter(),
  bybit: () => new BybitAdapter(),
  okx: () => new OKXAdapter(),
  bitget: () => new BitgetAdapter(),
  kucoin: () => new KuCoinAdapter(),
  gate: () => new GateAdapter(),
  bingx: () => new BingXAdapter(),
  mexc: () => new MEXCAdapter(),
  htx: () => new HTXAdapter(),
  hyperliquid: () => new HyperliquidAdapter(),
  aster: () => new AsterAdapter(),
  ourbit: () => new OurbitAdapter(),
  bitmart: () => new BitMartAdapter(),
  xt: () => new XTAdapter(),
  ju: () => new JuAdapter(),
  kcex: () => new KCEXAdapter(),
  levex: () => new LeveXAdapter(),
  edgex: () => new EdgeXAdapter()
};

export async function initializeExchanges() {
  const exchanges = [];

  for (const [name, enabled] of Object.entries(ENABLED_EXCHANGES)) {
    if (!enabled) {
      logger.info(`Exchange ${name} is disabled`);
      continue;
    }

    try {
      const constructor = EXCHANGE_CONSTRUCTORS[name];
      if (!constructor) {
        logger.warn(`No constructor found for exchange: ${name}`);
        continue;
      }

      const exchange = constructor();
      exchanges.push(exchange);
      logger.info(`Initialized exchange: ${name}`);
    } catch (error) {
      logger.error(`Failed to initialize exchange ${name}: ${error.message}`);
    }
  }

  return exchanges;
}

export function getExchangeByName(exchanges, name) {
  return exchanges.find(e => e.name.toLowerCase() === name.toLowerCase());
}

export function getAllExchangeNames() {
  return Object.keys(EXCHANGE_CONSTRUCTORS);
}
