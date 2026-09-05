class UI {
  constructor() {
    this.selectedExchanges = [];
    this.signals = [];
  }

  // Render exchanges list
  async renderExchangesList() {
    try {
      const result = await apiClient.getExchanges();
      const container = document.getElementById('exchanges-list');
      container.innerHTML = '';

      // Default selections
      const defaultSelected = ['binance', 'bybit', 'okx', 'bitget'];

      result.exchanges.forEach(ex => {
        const isChecked = defaultSelected.includes(ex.name);
        if (isChecked) {
          this.selectedExchanges.push(ex.name);
        }

        const div = document.createElement('div');
        div.className = 'exchange-checkbox';
        div.innerHTML = `
          <input type="checkbox" id="ex-${ex.name}" value="${ex.name}" ${isChecked ? 'checked' : ''}>
          <label for="ex-${ex.name}" title="${ex.name} - ${ex.status}">
            ${ex.name.toUpperCase()}
          </label>
        `;

        div.querySelector('input').addEventListener('change', (e) => {
          if (e.target.checked) {
            this.selectedExchanges.push(ex.name);
          } else {
            this.selectedExchanges = this.selectedExchanges.filter(n => n !== ex.name);
          }
        });

        container.appendChild(div);
      });

      this.updateStatus(result.exchanges);
    } catch (error) {
      console.error('Error rendering exchanges:', error);
    }
  }

  // Update status header
  updateStatus(exchanges) {
    const liveCount = exchanges.filter(e => e.status === 'LIVE').length;
    const offlineCount = exchanges.filter(e => e.status === 'OFFLINE').length;

    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = `
      <span class="status-item">${exchanges.length} бирж</span>
      <span class="status-item"><span class="status-dot live"></span>${liveCount} LIVE</span>
      <span class="status-item"><span class="status-dot offline"></span>${offlineCount} OFFLINE</span>
    `;
  }

  // Render signals table
  renderSignals(signals) {
    const tbody = document.getElementById('signals-body');
    tbody.innerHTML = '';

    if (signals.length === 0) {
      document.getElementById('results').style.display = 'none';
      document.getElementById('no-signals').style.display = 'block';
      return;
    }

    document.getElementById('results').style.display = 'block';
    document.getElementById('no-signals').style.display = 'none';
    document.getElementById('signal-count').textContent = signals.length;

    signals.forEach((signal, index) => {
      const row = document.createElement('tr');
      const statusClass = signal.status === 'LIVE' ? 'status-live' : 'status-delayed';
      const profitClass = (signal.estimatedProfit?.netProfit || 0) > 0 ? 'profit-positive' : 'profit-negative';

      const buyPrice = signal.buyPrice.toFixed(2);
      const sellPrice = signal.sellPrice.toFixed(2);
      const profit = (signal.estimatedProfit?.netProfit || 0).toFixed(2);
      const spread = signal.netSpread.toFixed(3);

      row.innerHTML = `
        <td><span class="signal-pair">${signal.pair}</span></td>
        <td><span class="signal-exchange">${signal.buyExchange}</span></td>
        <td>${buyPrice}</td>
        <td><span class="signal-exchange">${signal.sellExchange}</span></td>
        <td>${sellPrice}</td>
        <td>${signal.grossSpread.toFixed(3)}%</td>
        <td>${spread}%</td>
        <td class="${profitClass}">${profit} USDT</td>
        <td><span class="status-badge ${statusClass}">${signal.status}</span></td>
        <td><button class="btn btn-secondary" onclick="ui.showSignalDetails(${index})">📋</button></td>
      `;

      row.style.cursor = 'pointer';
      row.addEventListener('click', () => this.showSignalDetails(index));
      tbody.appendChild(row);
    });

    this.signals = signals;
  }

  // Show signal details modal
  showSignalDetails(index) {
    const signal = this.signals[index];
    if (!signal) return;

    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');

    const buyUrl = this.getTradeUrl(signal.buyExchange, signal.pair);
    const sellUrl = this.getTradeUrl(signal.sellExchange, signal.pair);

    modalBody.innerHTML = `
      <div class="modal-section">
        <h2>${signal.pair}</h2>
      </div>

      <div class="modal-section">
        <h3>🛒 Купить</h3>
        <div class="modal-row">
          <span class="modal-label">Биржа:</span>
          <span class="modal-value">${signal.buyExchange.toUpperCase()}</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">Цена:</span>
          <span class="modal-value">${signal.buyPrice.toFixed(2)} USDT</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">Статус:</span>
          <span class="modal-value status-badge status-${signal.buyStatus.toLowerCase()}">${signal.buyStatus}</span>
        </div>
        <a href="${buyUrl}" target="_blank" class="exchange-link">📱 Открыть ${signal.buyExchange}</a>
      </div>

      <div class="modal-section">
        <h3>💰 Продать</h3>
        <div class="modal-row">
          <span class="modal-label">Биржа:</span>
          <span class="modal-value">${signal.sellExchange.toUpperCase()}</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">Цена:</span>
          <span class="modal-value">${signal.sellPrice.toFixed(2)} USDT</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">Статус:</span>
          <span class="modal-value status-badge status-${signal.sellStatus.toLowerCase()}">${signal.sellStatus}</span>
        </div>
        <a href="${sellUrl}" target="_blank" class="exchange-link">📱 Открыть ${signal.sellExchange}</a>
      </div>

      <div class="modal-section">
        <h3>📊 Метрики</h3>
        <div class="modal-row">
          <span class="modal-label">Сумма сделки:</span>
          <span class="modal-value">${signal.amount} USDT</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">Gross Spread:</span>
          <span class="modal-value">${signal.grossSpread.toFixed(4)}%</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">Net Spread:</span>
          <span class="modal-value">${signal.netSpread.toFixed(4)}%</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">Комиссии:</span>
          <span class="modal-value">${signal.fees?.totalFee?.toFixed(2) || 'N/A'} USDT</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">Слипpage:</span>
          <span class="modal-value">${signal.slippage?.toFixed(3) || 'N/A'}%</span>
        </div>
      </div>

      <div class="modal-section">
        <h3>💵 Прибыль</h3>
        <div class="modal-row">
          <span class="modal-label">Брутто прибыль:</span>
          <span class="modal-value">${signal.estimatedProfit?.grossProfit?.toFixed(2) || 0} USDT</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">Нетто прибыль:</span>
          <span class="modal-value profit-positive">${signal.estimatedProfit?.netProfit?.toFixed(2) || 0} USDT</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">ROI:</span>
          <span class="modal-value">${signal.estimatedProfit?.roi?.toFixed(3) || 0}%</span>
        </div>
      </div>

      <div class="modal-section">
        <h3>💧 Ликвидность</h3>
        <div class="modal-row">
          <span class="modal-label">Buy側:</span>
          <span class="modal-value">${signal.buyLiquidity?.toFixed(2) || 'N/A'} USDT</span>
        </div>
        <div class="modal-row">
          <span class="modal-label">Sell側:</span>
          <span class="modal-value">${signal.sellLiquidity?.toFixed(2) || 'N/A'} USDT</span>
        </div>
      </div>

      <div class="modal-section">
        <h3>⏱️ Время</h3>
        <div class="modal-row">
          <span class="modal-label">Обновлено:</span>
          <span class="modal-value">${new Date(signal.timestamp).toLocaleTimeString('ru-RU')}</span>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }

  // Get trading URL for exchange
  getTradeUrl(exchange, pair) {
    const pairFormatted = pair.replace('/', '');
    const urls = {
      binance: `https://www.binance.com/ru/trade/${pairFormatted}`,
      bybit: `https://www.bybit.com/trade/spot/${pairFormatted}`,
      okx: `https://www.okx.com/ru/trade-spot/${pairFormatted}`,
      bitget: `https://www.bitget.com/spot/${pairFormatted}`,
      kucoin: `https://trade.kucoin.com/${pairFormatted}`,
      gate: `https://www.gate.io/trade/${pairFormatted}`,
      bingx: `https://www.bingx.com/trade/${pairFormatted}`,
      mexc: `https://www.mexc.com/exchange/${pairFormatted}`,
      htx: `https://www.htx.com/trade/${pairFormatted}`,
      hyperliquid: `https://hyperliquid.xyz`,
      aster: `https://www.asterdex.com/trade/${pairFormatted}`,
      ourbit: `https://www.ourbit.com/trade/${pairFormatted}`,
      bitmart: `https://www.bitmart.com/trade/${pairFormatted}`,
      xt: `https://www.xt.com/trade/${pairFormatted}`,
      ju: `https://www.ju.com/trade/${pairFormatted}`,
      kcex: `https://www.kcex.com/trade/${pairFormatted}`,
      levex: `https://www.levex.com/trade/${pairFormatted}`,
      edgex: `https://www.edgex.exchange/trade/${pairFormatted}`
    };
    return urls[exchange] || '#';
  }

  // Toggle sorting
  sortSignals(by) {
    if (by === 'profit') {
      this.signals.sort((a, b) => (b.estimatedProfit?.netProfit || 0) - (a.estimatedProfit?.netProfit || 0));
    } else if (by === 'spread') {
      this.signals.sort((a, b) => b.netSpread - a.netSpread);
    } else if (by === 'liquidity') {
      this.signals.sort((a, b) => (b.buyLiquidity + b.sellLiquidity) - (a.buyLiquidity + a.sellLiquidity));
    }
    this.renderSignals(this.signals);
  }
}

const ui = new UI();
