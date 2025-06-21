# 🚀 FunPay Auto Raise (AutoBump)

Браузерное расширение для автоматического поднятия лотов на [FunPay.com](https://funpay.com).

> Простое, удобное, автоматизированное расширение с UI, статистикой и поддержкой категорий.

---

## 🧩 Функционал

- ✅ Автоматическое поднятие лотов на FunPay
- ⏱ Настройка интервала между поднятиями
- 📊 Счётчики поднятий за сегодня и всего
- 💾 Сохраняет состояние между перезапусками
- 🧭 Поддержка категорий (если включено)
- 🎛 Удобный UI на popup странице
- 📎 Ссылки на Telegram, Discord, GitHub

---

## 🛠️ Установка (для разработчиков)

### 1. Клонирование

```bash
git clone https://github.com/yourusername/funpay-autobump.git
cd funpay-autobump
```

### 2. Установка зависимостей
```bash
npm install
```
Если используете yarn:
```bash
yarn install
```

### 3. Установка необходимых библиотек
```bash
npm install htmlparser2 css-select
```

### 🧪 Разработка
Проект использует Manifest V3, а также следующие технологии:

HTML/CSS/JS (ES6+)

chrome.runtime, chrome.storage, chrome.alarms

[htmlparser2](https://www.npmjs.com/package/htmlparser2) и css-[select](https://www.npmjs.com/package/css-select) для парсинга HTML с FunPay

### 📁 Структура проекта
```
funpay-autobump/
├── src/
│   ├── popup.html
│   ├── popup.js
│   ├── background.js
│   ├── style.css
│   └── utils/
│       └── parser.js
├── manifest.json
├── README.md
├── package.json
└── webpack.config.js
```

### ⚙️ Сборка проекта
> Если используешь Webpack
## Установка Webpack
```bash
npm install --save-dev webpack webpack-cli webpack-dev-server html-webpack-plugin css-loader style-loader
```
## Пример webpack.config.js
```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    popup: './src/popup.js',
    background: './src/background.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup.html',
      filename: 'index.html',
      chunks: ['popup']
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      }
    ]
  }
};
```
## Сборка
```bash
npm run build
```
### 📦 Установка расширения в Chrome
1. Перейди в chrome://extensions/

2. Включи Режим разработчика

3. Нажми Загрузить распакованное расширение

4. Выбери папку dist/
### 🔗 Ссылки
📢 Telegram: [@realmnodes](https://t.me/realmnodes)

💬 Discord: [RealmNodes](https://discord.gg/f9aKHX8qHB)

🛠 GitHub: [FunPay AutoBump](https://github.com/ccoin27/FunPay-Auto-Raise-AutoBump-/edit/main/README.md)
### 📃 Лицензия
MIT © 2025 — [Coin27]
