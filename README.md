# Сканер рыночных неэффективностей криптобирж

Веб-приложение для сканирования арбитражных возможностей между криптобиржами в реальном времени.

## 🎯 Особенности

- ✅ **Реальные данные**: Подключение к публичным API всех 18 криптобирж
- ✅ **Real-time**: WebSocket для потока данных от бирж
- ✅ **Анализ стакана**: Расчёт реальной исполнимости на основе order book
- ✅ **Расчёт комиссий**: Учёт торговых комиссий каждой биржи
- ✅ **Фильтрация**: По сумме, ликвидности, спреду
- ✅ **Адаптивность**: Работает на компьютере, планшете и смартфоне

## 📋 Поддерживаемые биржи

1. Binance (REST + WebSocket)
2. Bybit (REST + WebSocket)
3. OKX (REST + WebSocket)
4. Bitget (REST + WebSocket)
5. KuCoin (REST + WebSocket)
6. Gate.io (REST + WebSocket)
7. BingX (REST + WebSocket)
8. MEXC (REST + WebSocket)
9. HTX (REST + WebSocket)
10. Hyperliquid (REST + WebSocket)
11. ASTER (REST)
12. Ourbit (REST)
13. BitMart (REST + WebSocket)
14. XT.com (REST + WebSocket)
15. Ju.com (REST)
16. KCEX (REST)
17. LeveX (REST)
18. edgeX (REST + WebSocket)

## 🚀 Быстрый старт

```bash
npm install
cp .env.example .env
npm run dev
```

Отворите http://localhost:3000

## 📁 Структура проекта

```
src/
├── server.js              # Entry point
├── config/
│   └── exchanges.js       # Exchange configurations
├── exchanges/             # Exchange adapters
│   ├── base.js
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
├── core/
│   ├── scanner.js         # Main scanning engine
│   ├── arbitrage.js       # Arbitrage calculations
│   ├── orderbook.js       # Order book analysis
│   └── metrics.js         # Metrics calculations
├── api/
│   ├── exchanges.js
│   ├── pairs.js
│   ├── scan.js
│   └── signals.js
├── middleware/
│   └── errorHandler.js
└── utils/
    ├── logger.js
    ├── cache.js
    └── validators.js
```

## 🔌 API Endpoints

- `GET /api/exchanges` - Статус всех бирж
- `GET /api/pairs?exchanges=binance,bybit` - Доступные пары
- `POST /api/scan` - Сканировать арбитраж
- `GET /api/signals` - Последние сигналы

## 📊 Метрики

- **Gross Spread**: ((Sell Price - Buy Price) / Buy Price) × 100%
- **Net Spread**: Gross Spread - Комиссии
- **Estimated Profit**: Ожидаемая прибыль после комиссий и проскальзывания

## ⚙️ Environment Variables

См. `.env.example`

## 🔒 Безопасност��

- Только публичные market-data endpoints
- Никаких API keys
- Никакой автоматической торговли

## 📄 Лицензия

MIT