import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz';

export class HyperliquidAdapter extends BaseExchangeAdapter {
  constructor() {
    super('hyperliquid', {
      baseUrl: HYPERLIQUID_API_URL,
      makerFee: 0.02,
      takerFee: 0.05
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.post(`${HYPERLIQUID_API_URL}/info`, {
        type: 'metaAndAssetCtxs'
      }, {
        timeout: this.timeout
      });

      const meta = response.data[0];
      this.pairs = meta.universe.map(s => ({
        symbol: s.name,
        baseAsset: s.name.split('-')[0],
        quoteAsset: 'USD',
        pair: `${s.name.split('-')[0]}/USDT`
      }));

      this.pairs.forEach(p => this.pairsMap.set(p.symbol, p.symbol));
      this.setStatus('LIVE');
      logger.info(`Hyperliquid: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`Hyperliquid getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.split('/')[0] + '-USD');
      if (!symbol) return null;

      const response = await axios.post(`${HYPERLIQUID_API_URL}/info`, {
        type: 'l2Book',
        coin: symbol
      }, {
        timeout: this.timeout
      });

      this.setStatus('LIVE');
      return this.normalizeOrderBook({
        bids: response.data.bids.map(b => [parseFloat(b.px), parseFloat(b.sz)]),
        asks: response.data.asks.map(a => [parseFloat(a.px), parseFloat(a.sz)]),
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error(`Hyperliquid getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.split('/')[0] + '-USD');
      if (!symbol) return null;

      const response = await axios.post(`${HYPERLIQUID_API_URL}/info`, {
        type: 'allMids'
      }, {
        timeout: this.timeout
      });

      const mid = response.data[symbol];
      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(mid) * 0.9995,
        ask: parseFloat(mid) * 1.0005,
        lastPrice: parseFloat(mid),
        volume24h: 0,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Hyperliquid getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
