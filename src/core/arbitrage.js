import Decimal from 'decimal.js';
import { logger } from '../utils/logger.js';

/**
 * Calculate trading metrics for arbitrage opportunity
 */
export class ArbitrageCalculator {
  constructor(buyExchange, sellExchange) {
    this.buyExchange = buyExchange;
    this.sellExchange = sellExchange;
  }

  /**
   * Calculate gross spread percentage
   */
  calculateGrossSpread(buyPrice, sellPrice) {
    return new Decimal(sellPrice)
      .minus(buyPrice)
      .dividedBy(buyPrice)
      .times(100)
      .toNumber();
  }

  /**
   * Calculate trading fees
   */
  calculateTradingFees(amount, buyPrice, sellPrice) {
    const buyFee = this.buyExchange.takerFee || this.buyExchange.tradingFee || 0;
    const sellFee = this.sellExchange.takerFee || this.sellExchange.tradingFee || 0;
    
    const buyAmount = new Decimal(amount).times(buyPrice);
    const buyFeeAmount = buyAmount.times(buyFee / 100);
    const sellFeeAmount = buyAmount.times(sellFee / 100);

    return {
      buyFee: buyFeeAmount.toNumber(),
      sellFee: sellFeeAmount.toNumber(),
      totalFee: buyFeeAmount.plus(sellFeeAmount).toNumber(),
      buyFeePercent: buyFee,
      sellFeePercent: sellFee
    };
  }

  /**
   * Estimate slippage based on order book depth
   */
  estimateSlippage(orderBook, amount, price, side = 'ask') {
    if (!orderBook) return 0;

    const orders = side === 'ask' ? orderBook.asks : orderBook.bids;
    if (!orders || orders.length === 0) return 0;

    const bestPrice = parseFloat(orders[0][0]);
    let remainingAmount = amount;
    let totalCost = 0;
    let priceImpact = 0;

    for (const [levelPrice, levelVolume] of orders) {
      const levelPrice_ = parseFloat(levelPrice);
      const levelVolume_ = parseFloat(levelVolume);
      const levelValue = levelPrice_ * levelVolume_;

      if (remainingAmount <= 0) break;

      const executeValue = Math.min(remainingAmount, levelValue);
      totalCost += executeValue;
      remainingAmount -= executeValue;
      priceImpact = Math.abs(levelPrice_ - bestPrice) / bestPrice * 100;
    }

    return remainingAmount > 0 ? 100 : priceImpact; // Full slippage if can't execute
  }

  /**
   * Calculate net spread (gross spread - fees - slippage)
   */
  calculateNetSpread(grossSpread, feePercent) {
    return grossSpread - feePercent;
  }

  /**
   * Calculate estimated profit
   */
  calculateEstimatedProfit(amount, buyPrice, sellPrice, fees, slippage) {
    const buyTotal = new Decimal(amount).times(buyPrice);
    const buyWithFees = buyTotal.plus(fees.buyFee);
    
    const sellTotal = new Decimal(amount).times(sellPrice);
    const sellWithFees = sellTotal.minus(fees.sellFee);
    
    const profit = sellWithFees.minus(buyWithFees);
    const profitPercent = profit.dividedBy(buyWithFees).times(100);

    return {
      grossProfit: sellTotal.minus(buyTotal).toNumber(),
      netProfit: profit.toNumber(),
      profitPercent: profitPercent.toNumber(),
      roi: profitPercent.toNumber()
    };
  }
}

/**
 * Check if arbitrage is viable
 */
export function isViableArbitrage(signal, minSpread) {
  const netSpread = signal.netSpread || 0;
  const profit = signal.estimatedProfit?.netProfit || 0;
  
  return netSpread >= minSpread && profit > 0;
}
