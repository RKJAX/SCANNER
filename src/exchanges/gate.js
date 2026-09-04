import axios from 'axios';
import { BaseExchangeAdapter } from './base.js';
import { logger } from '../utils/logger.js';

const GATE_API_URL = 'https://api.gateio.ws/api/v4';
const GATE_WS_URL = 'wss://api.gateio.ws/ws/v4';

export class GateAdapter extends BaseExchangeAdapter {
  constructor() {
    super('gate', {
      baseUrl: GATE_API_URL,
      wsUrl: GATE_WS_URL,
      makerFee: 0.2,
      takerFee: 0.2
    });
    this.pairs = [];
    this.pairsMap = new Map();
  }

  async getPairs() {
    try {
      const response = await axios.get(`${GATE_API_URL}/spot/currency_pairs`, {
        timeout: this.timeout
      });

      this.pairs = response.data.map(s => ({
        symbol: s.id,
        baseAsset: s.base,
        quoteAsset: s.quote,
        pair: `${s.base}/${s.quote}`
      }));

      this.pairs.forEach(p => this.pairsMap.set(p.pair.toUpperCase(), p.symbol));
      this.setStatus('LIVE');
      logger.info(`Gate.io: Loaded ${this.pairs.length} pairs`);
      return this.pairs;
    } catch (error) {
      logger.error(`Gate.io getPairs error: ${error.message}`);
      this.setStatus('OFFLINE');
      return [];
    }
  }

  async getOrderBook(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${GATE_API_URL}/spot/order_book`, {
        params: {
          currency_pair: symbol,
          limit: 100,
          with_id: false
        },
        timeout: this.timeout
      });

      this.setStatus('LIVE');
      return this.normalizeOrderBook({
        bids: response.data.bids.map(b => [parseFloat(b[0]), parseFloat(b[1])]),
        asks: response.data.asks.map(a => [parseFloat(a[0]), parseFloat(a[1])]),
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error(`Gate.io getOrderBook error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }

  async getTicker(pair) {
    try {
      const symbol = this.pairsMap.get(pair.toUpperCase());
      if (!symbol) return null;

      const response = await axios.get(`${GATE_API_URL}/spot/tickers`, {
        params: { currency_pair: symbol },
        timeout: this.timeout
      });

      const ticker = response.data[0];
      this.setStatus('LIVE');
      return {
        pair: pair,
        bid: parseFloat(ticker.bid),
        ask: parseFloat(ticker.ask),
        lastPrice: parseFloat(ticker.last),
        volume24h: parseFloat(ticker.volume),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Gate.io getTicker error for ${pair}: ${error.message}`);
      this.setStatus('OFFLINE');
      return null;
    }
  }
}
