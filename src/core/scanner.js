import { logger } from '../utils/logger.js';
import { calculateLiquidityAtPrice, getAverageExecutionPrice, hasSufficientLiquidity } from './orderbook.js';
import { ArbitrageCalculator, isViableArbitrage } from './arbitrage.js';

/**
 * Main scanning engine
 */
export class Scanner {
  constructor(exchanges) {
    this.exchanges = exchanges;
    this.signals = [];
    this.isScanning = false;
    this.lastScanTime = null;
  }

  /**
   * Start continuous scanning
   */
  async start() {
    logger.info('Scanner started');
    this.isScanning = true;
  }

  /**
   * Stop scanning
   */
  stop() {
    this.isScanning = false;
    logger.info('Scanner stopped');
  }

  /**
   * Main scan function
   */
  async scan(params) {
    const {
      exchanges: selectedExchanges,
      pair,
      minAmount,
      minLiquidity = 1000,
      minSpread = 0.1
    } = params;

    this.lastScanTime = Date.now();
    const signals = [];

    try {
      // Get active exchanges
      const activeExchanges = this.exchanges.filter(e =>
        selectedExchanges.includes(e.name.toLowerCase())
      );

      if (activeExchanges.length < 2) {
        return {
          success: false,
          error: 'Выберите минимум 2 биржи',
          signals: []
        };
      }

      // Load pairs for all exchanges
      const pairData = {};
      for (const exchange of activeExchanges) {
        try {
          if (!exchange.pairs || exchange.pairs.length === 0) {
            await exchange.getPairs();
          }
          pairData[exchange.name] = await exchange.getOrderBook(pair);
        } catch (error) {
          logger.warn(`Failed to get order book from ${exchange.name}: ${error.message}`);
          pairData[exchange.name] = null;
        }
      }

      // Find arbitrage opportunities
      for (let i = 0; i < activeExchanges.length; i++) {
        for (let j = i + 1; j < activeExchanges.length; j++) {
          const exchange1 = activeExchanges[i];
          const exchange2 = activeExchanges[j];
          const ob1 = pairData[exchange1.name];
          const ob2 = pairData[exchange2.name];

          if (!ob1 || !ob2) continue;

          // Check both directions
          const signal1 = this.findArbitrage(exchange1, exchange2, pair, ob1, ob2, minAmount, minLiquidity, minSpread);
          const signal2 = this.findArbitrage(exchange2, exchange1, pair, ob2, ob1, minAmount, minLiquidity, minSpread);

          if (signal1) signals.push(signal1);
          if (signal2) signals.push(signal2);
        }
      }

      // Sort by profitability
      signals.sort((a, b) => (b.estimatedProfit?.netProfit || 0) - (a.estimatedProfit?.netProfit || 0));

      this.signals = signals;

      return {
        success: true,
        count: signals.length,
        signals: signals,
        timestamp: this.lastScanTime
      };
    } catch (error) {
      logger.error('Scan error:', error);
      return {
        success: false,
        error: error.message,
        signals: []
      };
    }
  }

  /**
   * Find arbitrage between two exchanges
   */
  findArbitrage(buyExchange, sellExchange, pair, buyOrderBook, sellOrderBook, minAmount, minLiquidity, minSpread) {
    try {
      // Get best prices
      const bestBuyPrice = parseFloat(buyOrderBook.asks[0][0]);
      const bestSellPrice = parseFloat(sellOrderBook.bids[0][0]);

      if (bestSellPrice <= bestBuyPrice) {
        return null; // No opportunity
      }

      // Check liquidity
      if (!hasSufficientLiquidity(buyOrderBook, minAmount, 'ask')) {
        return null; // Insufficient buy liquidity
      }

      if (!hasSufficientLiquidity(sellOrderBook, minAmount, 'bid')) {
        return null; // Insufficient sell liquidity
      }

      // Calculate metrics
      const calculator = new ArbitrageCalculator(buyExchange, sellExchange);
      const grossSpread = calculator.calculateGrossSpread(bestBuyPrice, bestSellPrice);
      const fees = calculator.calculateTradingFees(minAmount, bestBuyPrice, bestSellPrice);
      const slippage = calculator.estimateSlippage(buyOrderBook, minAmount, bestBuyPrice, 'ask') +
                       calculator.estimateSlippage(sellOrderBook, minAmount, bestSellPrice, 'bid');
      const netSpread = grossSpread - (fees.totalFee / (minAmount * bestBuyPrice) * 100);
      const profit = calculator.calculateEstimatedProfit(minAmount, bestBuyPrice, bestSellPrice, fees, slippage);

      if (netSpread < minSpread) {
        return null; // Below minimum spread
      }

      // Get liquidity details
      const buyLiquidity = calculateLiquidityAtPrice(buyOrderBook, minAmount, 'ask');
      const sellLiquidity = calculateLiquidityAtPrice(sellOrderBook, minAmount, 'bid');

      if (buyLiquidity.availableLiquidity < minLiquidity || sellLiquidity.availableLiquidity < minLiquidity) {
        return null; // Below minimum liquidity
      }

      return {
        pair: pair,
        buyExchange: buyExchange.name,
        buyPrice: bestBuyPrice,
        sellExchange: sellExchange.name,
        sellPrice: bestSellPrice,
        amount: minAmount,
        grossSpread: grossSpread,
        netSpread: netSpread,
        fees: fees,
        slippage: slippage,
        estimatedProfit: profit,
        buyLiquidity: buyLiquidity.availableLiquidity,
        sellLiquidity: sellLiquidity.availableLiquidity,
        status: buyExchange.getStatus() === 'LIVE' && sellExchange.getStatus() === 'LIVE' ? 'LIVE' : 'DELAYED',
        timestamp: Date.now(),
        buyStatus: buyExchange.getStatus(),
        sellStatus: sellExchange.getStatus()
      };
    } catch (error) {
      logger.error(`Arbitrage calculation error: ${error.message}`);
      return null;
    }
  }

  /**
   * Get last signals
   */
  getSignals(limit = 50) {
    return this.signals.slice(0, limit);
  }

  /**
   * Get signal by id
   */
  getSignalDetails(index) {
    return this.signals[index] || null;
  }
}
