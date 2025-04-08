const SITE_CONFIG = window.SITE_CONFIG || {};
// 通用移除函数
function removeWebsiteFeed(hostname) {
  const config = SITE_CONFIG[hostname];
  if (!config) return;

  const checkAndRemove = (root = document) => {
    config.targets.forEach(target => {
      const elements = root.querySelector(target);
      elements?.parentElement?.removeChild(elements);
    });
    config.extraCheck?.(root);
  };

  const observer = new MutationObserver((mutations) => {
    checkAndRemove();
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
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
  chrome.storage.local.get(['focus', 'websiteTimesDailyFun'], localResult => {
    chrome.storage.sync.get(['limits'], syncResult => {
      const shouldRemove = localResult.focus === true || 
        checkTimeLimit(location.hostname, localResult.websiteTimesDailyFun, syncResult.limits);
      if (shouldRemove) {
        removeWebsiteFeed(location.hostname);
      }
    });
  });
}

// 其他通用函数保持不变...
function checkTimeLimit(domain, timeData = {}, limits = []) {
    const domainLimit = limits.find(l => l.website === domain)?.dailyLimit;
    if (!domainLimit) return false;

    // 转换时间单位（秒转分钟）
    const usedMinutes = Math.round((timeData[domain] || 0) / 60);
    return usedMinutes >= domainLimit;
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
  if (areaName === 'local' && (changes.focus || changes.websiteTimesDailyFun)) {
      checkAndRemove();
  }
});