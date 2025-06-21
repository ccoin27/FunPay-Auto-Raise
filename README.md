# 🚀 FunPay Auto Raise (AutoBump)
![Изображение](https://cdn.discordapp.com/attachments/1371952734827315271/1386099366003212308/image.png?ex=68587921&is=685727a1&hm=931faaf9b515545eefd8880859af23f46a8d30c1bfb52c09515cce58d265431f&)

Браузерное расширение для автоматического поднятия лотов на [FunPay.com](https://funpay.com).

> Простое, удобное, автоматизированное расширение с UI, статистикой и поддержкой категорий.

---

## 🧩 Функционал

- ✅ Автоматическое поднятие лотов на FunPay
- ⏱ Автоматический таймер перед следующим поднятием
- 📊 Счётчики бампов, категорий и баланса
- 💾 Сохраняет состояние между перезапусками
- 🎛 Удобный UI на popup странице

---

## 🛠️ Установка (для разработчиков)

### 1. Клонирование

```bash
git clone https://github.com/ccoin27/FunPay-Auto-Raise/
cd FunPay-Auto-Raise
```

### 2. Установка зависимостей
```bash
npm install
```
Если используете yarn:
```bash
yarn install
```

### 🧪 Разработка
Проект использует Manifest V3, а также следующие технологии:

HTML/CSS/JS (ES6+)

chrome.runtime, chrome.storage, chrome.alarms

[htmlparser2](https://www.npmjs.com/package/htmlparser2) и [css-select](https://www.npmjs.com/package/css-select) для парсинга HTML с FunPay

### 📁 Структура проекта
```
funpay-autobump/
├── src/
│   ├── popup.html
│   ├── popup.js
│   ├── background.js
├── icons/
│   ├── icon.png
├── manifest.json
├── README.md
├── LICENCE
├── package.json
├── background.bundle.js
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

module.exports = {
  mode: 'production',
  entry: './src/background.js', 
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'background.bundle.js'
  },
  target: 'webworker', 
  resolve: {
    fallback: {
      "path": require.resolve("path"),
      "fs": false,
      "os": false
    }
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

3. Перемести файл с папки disk в главную дерикторию

3. Нажми Загрузить распакованное расширение

### 🔗 Ссылки
📢 Telegram: [@realmnodes](https://t.me/realmnodes)

💬 Discord: [RealmNodes](https://discord.gg/f9aKHX8qHB)

🛠 GitHub: [FunPay AutoBump](https://github.com/ccoin27/FunPay-Auto-Raise)
### 📃 Лицензия
MIT © 2025 — [Coin27]
