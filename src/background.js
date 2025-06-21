const htmlparser2 = require("htmlparser2");
import { selectOne } from 'css-select';
import { parseDocument } from 'htmlparser2';

const CATEGORIES_CACHE_DURATION = 10 * 60 * 1000;

let extensionState = {
  isActive: true,
  interval: 45,
  nextBumpTime: Date.now() + 45 * 60000,
  bumpCountToday: 0,
  categories: 0,
  lastBumpDate: new Date().toDateString()
};

const utils = {
  sleep: (ms) => new Promise(r => setTimeout(r, ms)),
  log: (msg) => console.log(`[${new Date().toLocaleTimeString()}] ✅ ${msg}`),
  error: (msg) => console.error(`[${new Date().toLocaleTimeString()}] ❌ ${msg}`),
  saveState: () => chrome.storage.local.set({ extensionState }),
  updateCounters: () => {
    const today = new Date().toDateString();
    if (today !== extensionState.lastBumpDate) {
      extensionState.bumpCountToday = 0;
      extensionState.lastBumpDate = today;
    }
  }
};

async function getFromStorage(key) {
  return new Promise(resolve => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

async function setToStorage(key, value) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
  });
}

async function fetchCategories() {
  const categoriesCacheKey = 'funpayCategories';
  const categoriesCacheTimeKey = 'funpayCategoriesTime';
  const now = Date.now();
  const lastFetch = Number(await getFromStorage(categoriesCacheTimeKey));

  if (lastFetch && now - lastFetch < CATEGORIES_CACHE_DURATION) {
    return JSON.parse(await getFromStorage(categoriesCacheKey) || '[]');
  }

  try {
    const balanceResponse = await fetch('https://funpay.com/account/balance', {
      credentials: 'include',
      headers: {
        'User-Agent': navigator.userAgent,
        'Accept': 'text/html'
      }
    });
    if (!balanceResponse.ok) throw new Error(`HTTP error ${balanceResponse.status}`);

    const balanceHtml = await balanceResponse.text();
    const balanceDoc = parseDocument(balanceHtml);

    const userLinkElement = selectOne('a.user-link-dropdown', balanceDoc);
    if (!userLinkElement || !userLinkElement.attribs?.href) {
      throw new Error('Ссылка профиля не найдена');
    }
    const userUrl = userLinkElement.attribs.href;
    const userResponse = await fetch(userUrl, {
      credentials: 'include',
      headers: {
        'User-Agent': navigator.userAgent,
        'Accept': 'text/html'
      }
    });
    if (!userResponse.ok) throw new Error(`HTTP error ${userResponse.status}`);

    const userHtml = await userResponse.text();
    const links = [];
    const userParser = new htmlparser2.Parser({
      onopentag(name, attribs) {
        if (name === "a" && attribs.class && attribs.class.includes("btn btn-default btn-plus")) {
          links.push(attribs.href);
        }
      }
    });
    userParser.write(userHtml);
    userParser.end();

    const categories = [];

    for (const href of links) {
      if (!href) continue;

      const lotResponse = await fetch(href, {
        credentials: 'include',
        headers: {
          'User-Agent': navigator.userAgent,
          'Accept': 'text/html'
        }
      });
      if (!lotResponse.ok) continue;

      const lotHtml = await lotResponse.text();
      let gameId, nodeId, lotTitle;
      const lotParser = new htmlparser2.Parser({
        onopentag(name, attribs) {
          if (name === "button" && attribs.class && attribs.class.includes("js-lot-raise")) {
            gameId = attribs["data-game"];
            nodeId = attribs["data-node"];
          }
        },
        ontext(text) {
          if (this._inLotTitle) {
            lotTitle = text.trim();
          }
        },
        onclosetag(name) {
          if (name === "h1") this._inLotTitle = false;
        }
      });
      lotParser.write(lotHtml);
      lotParser.end();

      if (!gameId || !nodeId) continue;

      categories.push({
        nodeId,
        name: lotTitle || 'Без названия',
        gameId: Number(gameId)
      });
    }

    await setToStorage(categoriesCacheKey, JSON.stringify(categories));
    await setToStorage(categoriesCacheTimeKey, now.toString());

    return categories;
  } catch (error) {
    utils.error(error.message);
    return [];
  }
}
chrome.storage.local.get('extensionState', (data) => {
  if (data.extensionState) {
    extensionState = data.extensionState;
    utils.updateCounters();
  }
});

const api = {
  BASE_URL: 'https://funpay.com',
  async fetch(url, options = {}) {
    try {
      const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...options.headers,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': '*/*',
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      utils.error(`Fetch failed: ${e.message}`);
      throw e;
    }
  },
  async getCsrfToken() {
    return new Promise((resolve, reject) => {
      chrome.cookies.get({ url: this.BASE_URL, name: 'golden_key' }, (cookie) => {
        if (cookie?.value) resolve(cookie.value);
        else reject(new Error('golden_key не найден'));
      });
    });
  },
  parseWaitMinutes(errorMsg) {
    if (typeof errorMsg !== 'string') return 0;
    const msg = errorMsg.toLowerCase().replace(/[.,!?]/g, '').trim();
    let totalMinutes = 0;
    const hourMatch = msg.match(/(\d+)\s*час/);
    if (hourMatch) totalMinutes += parseInt(hourMatch[1], 10) * 60;
    else if (msg.includes('час')) totalMinutes += 60;
    const minuteMatch = msg.match(/(\d+)\s*мин/);
    if (minuteMatch) totalMinutes += parseInt(minuteMatch[1], 10);
    else if (msg.includes('минут')) totalMinutes += 1;
    return totalMinutes;
  },
  async raiseCategory(nodeId, gameId) {
    try {
      const token = await this.getCsrfToken();
      const body = new URLSearchParams({ game_id: gameId, node_id: nodeId, token });
      const res = await this.fetch(`${this.BASE_URL}/lots/raise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': `golden_key=${token}`
        },
        body
      });
      const text = await res.text();
      if (text === '1') return true;
      const json = JSON.parse(text);
      if (json.error) {
        const waitMinutes = this.parseWaitMinutes(json.msg || '');
        if (waitMinutes > 0) {
          extensionState.nextBumpTime = Date.now() + waitMinutes * 60000;
          utils.saveState();
          safeSendMessage({ type: "stateUpdate", state: extensionState });
        }
        utils.log(`Node ${nodeId}: ⚠️ Подождите ${waitMinutes} минут`);
        return waitMinutes;
      } else {
        extensionState.bumpCountToday += categories.length;
        utils.log(`Node ${nodeId}: Успешно поднято`);
      }
      return true;
    } catch (e) {
      utils.error(`Ошибка raiseCategory: ${e.message}`);
      return false;
    }
  },
  async raiseAll() {
    const categories = await fetchCategories();
    let minWait = null;
    for (const cat of categories) {
      const result = await this.raiseCategory(cat.nodeId, cat.gameId);
      if (typeof result === 'number') {
        if (minWait === null || result < minWait) minWait = result;
      }
      await utils.sleep(1000);
    }
    if (minWait !== null) {
      extensionState.nextBumpTime = Date.now() + minWait * 60000;
      utils.log(`Ожидаем ${minWait} минут до следующего бампа`);
    } else {
      extensionState.nextBumpTime = Date.now() + extensionState.interval * 60000;
    }
    utils.saveState();
    safeSendMessage({ type: "stateUpdate", state: extensionState });
    return true;
  }
};

function broadcastState() {
  ports.forEach(p => {
    try {
      p.postMessage({ type: 'stateUpdate', state: extensionState });
    } catch {}
  });
}

let retryTimeoutId = null;

function safeSendMessage(msg) {
  try {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        const errMsg = chrome.runtime.lastError.message;
        if (!errMsg.includes('Could not establish connection')) {
          utils.error(`Ошибка отправки сообщения: ${errMsg}`);
        }
        scheduleRetry(msg);
      } else {
        if (retryTimeoutId) {
          clearTimeout(retryTimeoutId);
          retryTimeoutId = null;
        }
      }
    });
  } catch (e) {
    if (!e.message.includes('Could not establish connection')) {
      utils.error(`Ошибка отправки сообщения: ${e.message}`);
    }
    scheduleRetry(msg);
  }
}

function scheduleRetry(msg) {
  if (retryTimeoutId) return; 

  retryTimeoutId = setTimeout(() => {
    retryTimeoutId = null;
    safeSendMessage(msg);
  }, 10000);
}

let ports = [];

chrome.runtime.onConnect.addListener(port => {
  ports.push(port);
  try {
    port.postMessage({ type: 'stateUpdate', state: extensionState });
  } catch {}
  port.onDisconnect.addListener(() => {
    ports = ports.filter(p => p !== port);
  });
  port.onMessage.addListener(msg => {
    switch (msg.type) {
      case 'getState':
        try { port.postMessage({ type: 'stateUpdate', state: extensionState }); } catch {}
        break;
      case 'setActive':
        extensionState.isActive = msg.value;
        utils.saveState();
        broadcastState();
        if (extensionState.isActive) main();
        break;
      case 'setInterval':
        extensionState.interval = msg.value;
        extensionState.nextBumpTime = Date.now() + extensionState.interval * 60000;
        utils.saveState();
        broadcastState();
        break;
    }
  });
});

async function main() {
  const cats = await fetchCategories();
  extensionState.categories = cats.length
  utils.saveState();
  broadcastState();
  if (!extensionState.isActive) return;
  await api.raiseAll();
}

chrome.alarms.create('raise', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'raise' && extensionState.isActive) main();
});

main();