# 🔍 Криптовалютный сканер неэффективностей

Веб-сканер для поиска рыночных неэффективностей (арбитража) между 18 крупнейшими криптобиржами в реальном времени.

## 🎯 Особенности

- ✅ **18 криптобирж** (Binance, Bybit, OKX, Bitget, KuCoin, Gate.io и др.)
- ✅ **Реальные данные** через публичные REST API и WebSocket
- ✅ **Анализ Order Book** с расчётом реальной исполнимости
- ✅ **Расчёт комиссий** для каждой биржи
- ✅ **Оценка проскальзывания** (slippage)
- ✅ **Веб-интерфейс** на русском языке
- ✅ **REST API** для интеграции
- ✅ **Фильтрация** по сумме, ликвидности, спреду
- ✅ **Статистика** в реальном времени
- ✅ **Отзывчивый дизайн** (мобильный + ПК)

## 🚀 Быстрый старт

### Требования
- Node.js >= 16
- npm >= 8

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/RKJAX/SCANNER.git
cd SCANNER

# Установить зависимости
npm install

# Копировать конфигурацию
cp .env.example .env

# Запустить в режиме разработки
npm run dev

# Открыть в браузере
# http://localhost:3000
```

## 📊 Использование

### Через веб-интерфейс

1. Выберите биржи (мин. 2)
2. Укажите торговую пару (напр., BTC/USDT)
3. Установите параметры:
   - Сумма сделки (USDT)
   - Минимальная ликвидность
   - Минимальный спред (%)
4. Нажмите "Сканировать"
5. Смотрите результаты в таблице

### Через REST API

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "exchanges": ["binance", "bybit", "okx"],
    "pair": "BTC/USDT",
    "minAmount": 1000,
    "minLiquidity": 5000,
    "minSpread": 0.1
  }'
```

## 🏗️ Архитектура

```
server.js (Express)
├── api/
│   ├── exchanges.js      → GET /api/exchanges
│   ├── pairs.js         → GET /api/pairs
│   ├── scan.js          → POST /api/scan
│   └── signals.js       → GET /api/signals
├── exchanges/ (18 адаптеров)
│   ├── binance.js
│   ├── bybit.js
│   ├── okx.js
│   └── ... (15 more)
├── core/
│   ├── scanner.js       → Основной двигатель
│   ├── arbitrage.js     → Расчёты
│   └── orderbook.js     → Анализ стакана
└── public/
    ├── index.html       → Веб-интерфейс
    ├── css/styles.css
    └── js/
        ├── app.js
        ├── ui.js
        └── api-client.js
```

## 💾 Поддерживаемые биржи

| # | Биржа | Статус | REST | WebSocket | Комиссия |
|---|-------|--------|------|-----------|----------|
| 1 | Binance | ✅ | ✅ | ✅ | 0.1% |
| 2 | Bybit | ✅ | ✅ | ✅ | 0.1% |
| 3 | OKX | ✅ | ✅ | ✅ | 0.15% |
| 4 | Bitget | ✅ | ✅ | ✅ | 0.1% |
| 5 | KuCoin | ✅ | ✅ | ✅ | 0.1% |
| 6 | Gate.io | ✅ | ✅ | ✅ | 0.2% |
| 7 | BingX | ✅ | ✅ | ✅ | 0.1% |
| 8 | MEXC | ✅ | ✅ | ✅ | 0.2% |
| 9 | HTX | ✅ | ✅ | ⚠️ | 0.2% |
| 10 | Hyperliquid | ✅ | ✅ | - | 0.05% |
| 11 | ASTER | ✅ | ✅ | - | 0.2% |
| 12 | Ourbit | ✅ | ✅ | - | 0.15% |
| 13 | BitMart | ✅ | ✅ | ✅ | 0.25% |
| 14 | XT.com | ✅ | ✅ | ✅ | 0.2% |
| 15 | Ju.com | ✅ | ✅ | - | 0.2% |
| 16 | KCEX | ✅ | ✅ | - | 0.1% |
| 17 | LeveX | ✅ | ✅ | - | 0.1% |
| 18 | edgeX | ✅ | ✅ | ✅ | 0.1% |

## 📡 REST API

### GET /api/exchanges
Получить статус всех бирж

```json
{
  "success": true,
  "total": 18,
  "exchanges": [
    {
      "name": "binance",
      "status": "LIVE",
      "lastUpdate": 1234567890,
      "pairsLoaded": 2000,
      "makerFee": 0.1,
      "takerFee": 0.1
    }
  ]
}
```

### GET /api/pairs?exchanges=binance,bybit
Получить доступные пары

```json
{
  "success": true,
  "total": 500,
  "pairs": ["BTC/USDT", "ETH/USDT", ...]
}
```

### POST /api/scan
Сканировать арбитраж

**Запрос:**
```json
{
  "exchanges": ["binance", "bybit"],
  "pair": "BTC/USDT",
  "minAmount": 1000,
  "minLiquidity": 5000,
  "minSpread": 0.1
}
```

**Ответ:**
```json
{
  "success": true,
  "count": 3,
  "signals": [
    {
      "pair": "BTC/USDT",
      "buyExchange": "binance",
      "buyPrice": 42500,
      "sellExchange": "bybit",
      "sellPrice": 42550,
      "grossSpread": 0.117,
      "netSpread": -0.183,
      "fees": {
        "buyFee": 42.50,
        "sellFee": 42.55,
        "totalFee": 85.05
      },
      "estimatedProfit": {
        "netProfit": 8.50,
        "roi": 0.85
      },
      "status": "LIVE"
    }
  ]
}
```

### GET /api/signals?limit=50
Получить последние сигналы

## ⚙️ Конфигурация

Отредактируйте `.env` файл:

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Включить/отключить биржи (1=включить, 0=отключить)
ENABLE_BINANCE=1
ENABLE_BYBIT=1
ENABLE_OKX=1
# ... и так далее
```

## 📊 Расчёты

### Gross Spread
```
((Sell Price - Buy Price) / Buy Price) × 100%
```

### Net Spread
```
Gross Spread - (Total Fees / (Amount × Buy Price) × 100)
```

### Estimated Profit
```
(Amount × Sell Price × (1 - Sell Fee %)) - (Amount × Buy Price × (1 + Buy Fee %))
```

## 🔐 Безопасность

- ✅ Используются только публичные market-data endpoints
- ✅ Без API keys
- ✅ Без автоматической торговли
- ✅ Без хранения чувствительных данных
- ✅ XSS защита
- ✅ CORS конфигурация

## 🐛 Известные ограничения

- Hyperliquid: только perpetuals (нет спота)
- HTX: WebSocket может быть ограничен
- Меньшие биржи: может быть нижняя ликвидность
- Rate limits: разные для каждой биржи

## 📖 Документация

- `DEPLOYMENT.md` - Развертывание на Heroku, Docker, Vercel
- `ARCHITECTURE.md` - Полная архитектура системы
- `EXCHANGE_APIS.md` - Детали по API каждой биржи

## 🤝 Контрибьютинг

Приветствуются pull requests! 

1. Fork репозиторий
2. Создайте feature branch
3. Коммитьте изменения
4. Пушьте в branch
5. Откройте Pull Request

## 📄 Лицензия

MIT License

## 💬 Поддержка

Откройте Issue на GitHub если возникли проблемы.

---

**⭐ Если проект вам нравится, дайте ему star!**
