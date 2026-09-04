import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const KUCOIN_API_URL = 'https://api.kucoin.com/api/v1';
const KUCOIN_WS_URL = 'wss://ws-api.kucoin.com/socket.io';

export class KuCoinAdapter extends BaseExchangeAdapter {
  constructor() {
    super('kucoin', {
      baseUrl: KUCOIN_API_URL,
      wsUrl: KUCOIN_WS_URL,
      makerFee: 0.1,
      takerFee: 0.1
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${KUCOIN_API_URL}/symbols`, {
        timeout: this.timeout
      });

      this.pairs = response.data.data
        .filter(s => s.enableTrading)
        .map(s => ({
          symbol: s.name,
          baseAsset: s.baseCurrency,
          quoteAsset: s.quoteCurrency,
          pair: `${s.baseCurrency}/${s.quoteCurrency}`
        }));

      this.pairs.forEach(p => this.pairsMap.set(p.pair.toUpperCase(), p.symbol));
      this.setStatus('LIVE');
      logger.info(`KuCoin: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`KuCoin getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${KUCOIN_API_URL}/market/orderbook/level2_100`, {
        params: { symbol },
        timeout: this.timeout
      });

      this.setStatus('LIVE');
      return this.normalizeOrderBook({
        bids: response.data.data.bids.map(b => [parseFloat(b[0]), parseFloat(b[1])]),
        asks: response.data.data.asks.map(a => [parseFloat(a[0]), parseFloat(a[1])]),
        timestamp: response.data.data.time
      });
    } catch (error) {
      logger.error(`KuCoin getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${KUCOIN_API_URL}/market/stats`, {
        params: { symbol },
        timeout: this.timeout
      });

      const ticker = response.data.data;
      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(ticker.buy),
        ask: parseFloat(ticker.sell),
        lastPrice: parseFloat(ticker.last),
        volume24h: parseFloat(ticker.volValue),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`KuCoin getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
