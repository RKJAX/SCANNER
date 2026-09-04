# Сканер рыночных неэффективностей криптобирж

Веб-приложение для сканирования арбитражных возможностей между криптобиржами в реальном времени.

## 🎯 Особенности

- ✅ **Реальные данные**: Подключение к публичным API всех 18 криптобирж
- ✅ **Real-time**: WebSocket для потока данных от бирж
- ✅ **Анализ стакана**: Расчёт реальной исполнимости на основе order book
- ✅ **Расчёт комиссий**: Учёт торговых комиссий каждой биржи
- ✅ **Фильтрация**: По сумме, ликвидности, спреду
- ✅ **Адаптивность**: Работает на компьютере, планшете и смартфоне
- ✅ **Обработка ошибок**: Graceful degradation при недоступности API

## 📋 Поддерживаемые биржи

1. Binance
2. Bybit
3. OKX
4. Bitget
5. KuCoin
6. Gate.io
7. BingX
8. MEXC
9. HTX (Huobi)
10. Hyperliquid
11. ASTER
12. Ourbit
13. BitMart
14. XT.com
15. Ju.com
16. KCEX
17. LeveX
18. edgeX

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Создание .env файла
cp .env.example .env

# Запуск в режиме разработки
npm run dev

# Запуск production сборки
npm run build
npm start
```

## 📁 Структура проекта

```
src/
├── server.js              # Entry point
├── config/                # Configuration
│   └── exchanges.js       # Exchange configurations
├── exchanges/             # Exchange adapters
│   ├── base.js            # Base adapter class
│   ├── binance/
│   ├── bybit/
│   ├── okx/
│   ├── bitget/
│   ├── kucoin/
│   ├── gate/
│   ├── bingx/
│   ├── mexc/
│   ├── htx/
│   ├── hyperliquid/
│   ├── aster/
│   ├── ourbit/
│   ├── bitmart/
│   ├── xt/
│   ├── ju/
│   ├── kcex/
│   ├── levex/
│   └── edgex/
├── core/                  # Core logic
│   ├── scanner.js         # Main scanning engine
│   ├── arbitrage.js       # Arbitrage calculations
│   ├── orderbook.js       # Order book analysis
│   └── metrics.js         # Metrics calculations
├── api/                   # REST API routes
│   ├── exchanges.js       # /api/exchanges
│   ├── pairs.js           # /api/pairs
│   ├── scan.js            # /api/scan
│   └── signals.js         # /api/signals
├── middleware/            # Express middleware
│   ├── errorHandler.js
│   └── rateLimit.js
├── utils/                 # Utilities
│   ├── logger.js
│   ├── cache.js
│   └── validators.js
public/                   # Frontend assets
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js
    ├── ui.js
    └── api-client.js
```

## 🔌 API Endpoints

### GET /api/exchanges
Получить статус всех бирж

### GET /api/pairs?exchanges=binance,bybit
Получить доступные пары для выбранных бирж

### POST /api/scan
```json
{
  "exchanges": ["binance", "bybit"],
  "pair": "BTC/USDT",
  "minAmount": 1000,
  "minLiquidity": 5000,
  "minSpread": 0.1
}
```

### GET /api/signals
Получить список найденных сигналов

## 🔐 Безопасность

- Используются только публичные market-data endpoints
- Нет API keys
- Нет автоматической торговли
- CORS ограничения

## ⚙️ Environment Variables

См. `.env.example`

## 📊 Метрики и расчёты

### Gross Spread
```
((Sell Price - Buy Price) / Buy Price) × 100%
```

### Net Spread
```
Gross Spread - (Buy Commission + Sell Commission)
```

### Estimated Profit
```
(Amount × Buy Price × (1 + Buy Commission %) - Amount × Sell Price × (1 - Sell Commission %)) / (Amount × Buy Price × (1 + Buy Commission %))
```

## 🐛 Известные ограничения

См. документацию по каждой бирже в `/docs/exchanges/`

## 📖 Документация

- [Архитектура](./docs/ARCHITECTURE.md)
- [API биржи](./docs/EXCHANGE_APIS.md)
- [Разработка adapters](./docs/ADAPTER_DEVELOPMENT.md)

## 📄 Лицензия

MIT
