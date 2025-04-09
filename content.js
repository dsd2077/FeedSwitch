let cachedMap = new Map();
const SITE_CONFIG = window.SITE_CONFIG || {};
// 通用移除函数
function removeWebsiteFeed(hostname) {
  const config = SITE_CONFIG[hostname];
  if (!config) return;

  const checkAndRemove = (root = document) => {
    config.targets.forEach((target) => {
      const elements = root.querySelector(target);
      elements?.parentElement?.removeChild(elements);
    });
    config.extraCheck?.(root);
  };

  const observer = new MutationObserver((mutations) => {
    checkAndRemove();
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          checkAndRemove(node);
        }
      });
    });
  });

  observer.observe(document, { childList: true, subtree: true });
  checkAndRemove();
}

// 通用检查逻辑
function checkAndRemove() {
  chrome.storage.local.get(["focus", "websiteTimesDailyFun"], (localResult) => {
    chrome.storage.sync.get(["limits"], (syncResult) => {
      const shouldRemove =
        localResult.focus === true ||
        checkTimeLimit(
          location.hostname,
          localResult.websiteTimesDailyFun,
          syncResult.limits
        );
      if (shouldRemove) {
        removeWebsiteFeed(location.hostname);
      }
    });
  });
}

// 其他通用函数保持不变...
function checkTimeLimit(domain, timeData = {}, limits = []) {
  const groupIds = cachedMap.get(domain) || [];
  if (groupIds.length === 0) return false;

  return limits
    .filter((l) => groupIds.includes(l.id))
    .some((limit) => {
      const groupUsage = limit.websites.reduce(
        (sum, w) => sum + (timeData[w] || 0),
        0
      );
      return Math.floor(groupUsage / 60) >= limit.dailyLimit;
    });
}

function initSPARouteCheck(hostname) {
  let lastPath = location.pathname;

  const checkSPA = () => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      checkAndRemove();
      console.log(`[${hostname}] 检测到路由变化`);
    }
  };

  // 初始执行 + 路由监听
  checkAndRemove();
  setInterval(checkSPA, 1000);
}

if (SITE_CONFIG?.[location.hostname]) {
  initSPARouteCheck(location.hostname);
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && (changes.focus || changes.websiteTimesDailyFun)) {
    checkAndRemove();
  }
});

// 监听limits变化
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.limits) {
    updateCachedMap(changes.limits.newValue || []);
  }
});

// 初始化时加载
chrome.storage.sync.get(["limits"], (result) => {
  updateCachedMap(result.limits || []);
});

function updateCachedMap(limits) {
  const newMap = new Map();
  limits.forEach((limit) => {
    limit.websites.forEach((website) => {
      if (!newMap.has(website)) newMap.set(website, []);
      newMap.get(website).push(limit.id);
    });
  });
  cachedMap = newMap;
}
