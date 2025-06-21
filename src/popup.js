const toggleSwitch = document.getElementById('toggle');
const timerElement = document.getElementById('timer');
const intervalInput = document.getElementById('interval');
const todayCountElement = document.getElementById('todayCount');
const categories = document.getElementById('categories')

const links = [
  { selector: '.btn-discord', url: 'https://discord.gg/f9aKHX8qHB' },
  { selector: '.btn-telegram', url: 'https://t.me/realmnodes' },
  { selector: '.github', url: 'https://github.com/ccoin27/FunPay-Auto-Raise' },
];

links.forEach(({ selector, url }) => {
  const el = document.querySelector(selector);
  if (el) {
    el.addEventListener('click', () => window.open(url, '_blank'));
  }
});

const CACHE_DURATION = 10 * 60 * 1000;
const CATEGORIES_CACHE_DURATION = 10 * 60 * 1000;

let state = {
  isActive: true,
  nextBumpTime: 0,
  bumpCountToday: 0,
  interval: 45,
  categories: 0
};

const port = chrome.runtime.connect({ name: "popup" });

port.onMessage.addListener((message) => {
  if (message.type === "stateUpdate") {
    state = message.state;
    updateUI();
  }
});

function send(message) {
  port.postMessage(message);
}

async function getUserAvatarUrl() {
  try {
    const parser = new DOMParser();

    const balanceResponse = await fetch('https://funpay.com/account/balance', {
      credentials: 'include',
      headers: {
        'User-Agent': navigator.userAgent,
        'Accept': 'text/html'
      }
    });
    if (!balanceResponse.ok) throw new Error(`HTTP error ${balanceResponse.status}`);
    const balanceHtml = await balanceResponse.text();
    const balanceDoc = parser.parseFromString(balanceHtml, 'text/html');

    const balanceSpan = balanceDoc.querySelector('span.badge.badge-balance');
    if (!balanceSpan) throw new Error('Баланс не найден');
    const balanceText = balanceSpan.textContent.trim().replace(/\s/g, '').replace('₽', '');
    const balance = parseInt(balanceText, 10);
    if (isNaN(balance)) throw new Error('Не удалось распарсить баланс');

    let formattedBalance;
    if (balance >= 1000) {
      formattedBalance = `${Math.floor(balance / 1000)}к₽`;
    } else {
      formattedBalance = `${balance}₽`;
    }

    const userNameDiv = balanceDoc.querySelector('div.user-link-name');
    const username = userNameDiv ? userNameDiv.textContent.trim() : null;

    const userLink = balanceDoc.querySelector('a.user-link-dropdown');
    if (!userLink) throw new Error('Ссылка профиля не найдена');
    const profileUrl = userLink.href;

    const profileResponse = await fetch(profileUrl, {
      credentials: 'include',
      headers: {
        'User-Agent': navigator.userAgent,
        'Accept': 'text/html'
      }
    });
    if (!profileResponse.ok) throw new Error(`HTTP error ${profileResponse.status}`);
    const profileHtml = await profileResponse.text();
    const profileDoc = parser.parseFromString(profileHtml, 'text/html');

    const avatarDiv = profileDoc.querySelector('div.avatar-photo');
    if (!avatarDiv) throw new Error('avatar-photo не найден');
    const style = avatarDiv.getAttribute('style') || '';
    const match = style.match(/url\((.*?)\)/);
    if (!match) throw new Error('Ссылка на аватар не найдена');
    const avatarUrl = match[1].replace(/['"]/g, '');

    return { username, balance: formattedBalance, avatarUrl };
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function setCachedAvatar() {
  const cacheKeyUrl = 'funpayAvatarUrl';
  const cacheKeyName = 'funpayUserName';
  const cacheKeyBalance = 'funpayUserBalance';
  const cacheKeyTime = 'funpayUserTime';

  const lastFetch = Number(localStorage.getItem(cacheKeyTime));
  const now = Date.now();

  if (lastFetch && now - lastFetch < CACHE_DURATION) {
    const cachedUrl = localStorage.getItem(cacheKeyUrl);
    const cachedName = localStorage.getItem(cacheKeyName);
    const cachedBalance = localStorage.getItem(cacheKeyBalance);

    if (cachedUrl) {
      const logoDiv = document.querySelector('.logo');
      if (logoDiv) {
        logoDiv.innerHTML = `<img src="${cachedUrl}" alt="FP">`;
      }
    }
    if (cachedName) {
      const usernameDiv = document.querySelector('h1.username');
      if (usernameDiv) usernameDiv.textContent = cachedName;
    }
    if (cachedBalance) {
      const balanceDiv = document.querySelector('div.stat-value.balance');
      if (balanceDiv) balanceDiv.textContent = cachedBalance;
    }
    return;
  }

  const data = await getUserAvatarUrl();
  if (data) {
    localStorage.setItem(cacheKeyUrl, data.avatarUrl);
    localStorage.setItem(cacheKeyName, data.username);
    localStorage.setItem(cacheKeyBalance, data.balance);
    localStorage.setItem(cacheKeyTime, now.toString());

    const logoDiv = document.querySelector('.logo');
    if (logoDiv) {
      logoDiv.innerHTML = `<img src="${data.avatarUrl}" alt="FP">`;
    }
    const usernameDiv = document.querySelector('h1.username');
    if (usernameDiv) usernameDiv.textContent = data.username;

    const balanceDiv = document.querySelector('div.stat-value.balance');
    if (balanceDiv) balanceDiv.textContent = data.balance;
  }
}

async function init() {
  send({ type: "getState" });
  await setCachedAvatar();
  setInterval(updateTimer, 1000);
}
function updateTimer() {
  if (!state.isActive) {
    timerElement.textContent = "--:--";
    return;
  }
  const diff = state.nextBumpTime - Date.now();
  if (diff <= 0) {
    timerElement.textContent = "00:00";
    return;
  }
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    timerElement.textContent = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
  } else {
    timerElement.textContent = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
  }
}

function updateUI() {
  toggleSwitch.checked = state.isActive;
  todayCountElement.textContent = state.bumpCountToday;
  categories.textContent = state.categories
}

toggleSwitch.addEventListener('change', function () {
  send({ type: "setActive", value: this.checked });
});

init();


