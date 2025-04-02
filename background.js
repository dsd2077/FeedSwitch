// background.js
let activeTabId = null;
const activeTabs = {}; // 存储各标签页的最新活动时间
let updateInterval;
let isSystemActive = true; // 新增系统活动状态标识
let isBrowserFocused = true; // 新增窗口焦点状态标识
// 在文件顶部添加颜色常量
const BADGE_COLORS = {
  focus: '#2ecc71', // 绿色
  fun: '#e74c3c' // 红色
};

// 创建定时更新函数
function startIntervalUpdate() {
  // 先清除已有定时器
  if (updateInterval) clearInterval(updateInterval); 
  updateInterval = setInterval(() => {
    if (activeTabs?.[activeTabId]?.url) {
      const now = Date.now();
      const duration = Math.round((now - activeTabs[activeTabId].startTime) / 1000);
      
      // 更新存储并刷新开始时间
      updateDomainTime(activeTabs[activeTabId].url, duration);
      activeTabs[activeTabId].startTime = now - ((now - activeTabs[activeTabId].startTime) % 1000);

    }
    console.log(`Interval update. Active Tab ID: ${activeTabId}, URL: ${activeTabs?.[activeTabId]?.url || 'N/A'}`);

  }, 5000); // 5秒间隔
}

// 监听浏览器窗口焦点变化
chrome.windows.onFocusChanged.addListener((windowId) => {
  const wasFocused = isBrowserFocused;
  isBrowserFocused = windowId !== chrome.windows.WINDOW_ID_NONE;

  if (wasFocused && !isBrowserFocused) {
    // 失去焦点时先更新一次时间
    if (activeTabId && activeTabs?.[activeTabId]?.url) {
      const now = Date.now();
      const duration = Math.round((now - activeTabs[activeTabId].startTime) / 1000);
      updateDomainTime(activeTabs[activeTabId].url, duration);
      // activeTabs[activeTabId].startTime = now - ((now - activeTabs[activeTabId].startTime) % 1000);
    }
    clearInterval(updateInterval);
    console.log('Browser lost focus, final update');
    // activeTabId = null
  } else if (isBrowserFocused){
    // 恢复时重置开始时间避免计入非活动时间
    if (activeTabId && activeTabs[activeTabId]) {
      activeTabs[activeTabId].startTime = Date.now();
    }
    startIntervalUpdate();
    console.log(`Browser focused, resume timing. Active Tab ID: ${activeTabId}, URL: ${activeTabs?.[activeTabId]?.url || 'N/A'}, Window ID: ${windowId}`);
  }
});

// 监听系统唤醒/睡眠事件（需要声明权限）
chrome.idle.onStateChanged.addListener((newState) => {
  const wasActive = isSystemActive;
  isSystemActive = (newState !== 'locked');

  if (wasActive && !isSystemActive) {
    // 进入非活动状态前更新最后一次时间
    if (activeTabId && activeTabs?.[activeTabId]?.url) {
      const now = Date.now();
      const duration = Math.round((now - activeTabs[activeTabId].startTime) / 1000);
      updateDomainTime(activeTabs[activeTabId].url, duration);
      // activeTabs[activeTabId].startTime = now - ((now - activeTabs[activeTabId].startTime) % 1000);
    }
    clearInterval(updateInterval);
    console.log('System inactive, final update');
  } else {
    // 恢复时重置开始时间避免计入息屏时间
    if (activeTabId && activeTabs[activeTabId]) {
      activeTabs[activeTabId].startTime = Date.now();
    }
    startIntervalUpdate();
    console.log('System active, resume timing');
  }
});

// 激活一个新的标签页
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('Browser tab activated');

  const now = Date.now();
  
  // 记录前一个标签页的停留时间
  if (activeTabId  && activeTabs?.[activeTabId]?.url) {
    const duration = Math.round((now - activeTabs[activeTabId].startTime) / 1000);
    updateDomainTime(activeTabs[activeTabId].url, duration);
  }
  activeTabId = activeInfo.tabId;

  // 获取新标签页的URL
  chrome.tabs.get(activeTabId, (tab) => {
    if (tab?.url) {
      activeTabs[activeTabId] = {
        url: new URL(tab.url).hostname,
        startTime: now
      };
    }
  });
});

// 在标签页更新时触发（包括刷新）,
// 单纯的刷新——tabId不变、url不变
// 更新当前页面——tabId不变，url改变
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('Browser tab updated');

  if (changeInfo.status === 'complete' && tab.url) {
    const now = Date.now();
    const newDomain = new URL(tab.url).hostname;
    const existingRecord = activeTabs[tabId];

    // 单纯的刷新url不变
    if (existingRecord && existingRecord.url == newDomain) {
      return
    }
    if (existingRecord && existingRecord.url !== newDomain) {
      // 计算前一个页面的停留时间
      const duration = Math.round((now - existingRecord.startTime) / 1000);
      updateDomainTime(existingRecord.url, duration);
    }

    // 记录新的域名信息
    activeTabs[tabId] = {
      url: newDomain,
      startTime: now
    };
  }
});

// 添加标签页关闭时的清理
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTabs[tabId]) {
    delete activeTabs[tabId];
  }
});

// 统一更新存储的方法
function updateDomainTime(domain, seconds) {
  if (!isSystemActive || !isBrowserFocused || !domain || seconds <= 0) return;

  chrome.storage.local.get(['focus','websiteTimesDaily', 'websiteTimesDailyFun'], (result) => {
    const websiteTimesDaily = result.websiteTimesDaily || {};
    const websiteTimesDailyFun = result.websiteTimesDailyFun || {};
    if (websiteTimesDaily[domain]) {
      console.log("previous time : ", websiteTimesDaily[domain])
    }
    websiteTimesDaily[domain] = (websiteTimesDaily[domain] || 0) + seconds;
    chrome.storage.local.set({ websiteTimesDaily });
    if (!result.focus) {
      websiteTimesDailyFun[domain] = (websiteTimesDailyFun[domain] || 0) + seconds;
      chrome.storage.local.set({ websiteTimesDailyFun });
    }
  });
}

// 新增函数：将每日使用时间累加到每周使用时间，并清空每日使用时间
function resetDailyAndAccumulateWeekly() {
  chrome.storage.local.get(['websiteTimesDaily', 'websiteTimesWeekly'], (result) => {
    const websiteTimesDaily = result.websiteTimesDaily || {};
    // const websiteTimesDailyFun = result.websiteTimesDailyFun || {};
    const websiteTimesWeekly = result.websiteTimesWeekly || {};

    for (const domain in websiteTimesDaily) {
      if (Object.prototype.hasOwnProperty.call(websiteTimesDaily, domain)) {
        websiteTimesWeekly[domain] = (websiteTimesWeekly[domain] || 0) + websiteTimesDaily[domain];
      }
    }

    chrome.storage.local.set({
      websiteTimesDaily: {},
      websiteTimesDailyFun: {},
      websiteTimesWeekly: websiteTimesWeekly
    });
  });
}

// 新增函数：设置每日凌晨的闹钟
function setDailyAlarm() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(0, 0, 0, 0);
  if (now >= tomorrow) {
    tomorrow.setDate(tomorrow.getDate() + 1);
  }

  const delayInMinutes = (tomorrow.getTime() - now.getTime()) / (1000 * 60);
  chrome.alarms.create('resetDaily', { delayInMinutes: delayInMinutes, periodInMinutes: 1440 }); // 每天凌晨触发
}

// 新增事件监听器：处理闹钟触发事件
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'resetDaily') {
    resetDailyAndAccumulateWeekly();
  }
});

setDailyAlarm(); // 设置每日凌晨的闹钟

startIntervalUpdate(); // 新增此行

// 统一更新徽章的方法
function updateBadgeStatus(isFocus) {
  const text = isFocus ? '专注' : '娱乐';
  const color = isFocus ? BADGE_COLORS.focus : BADGE_COLORS.fun;

  // 同步设置初始状态
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });

  // 添加动画
  chrome.action.setBadgeText({ text: '' }, () => {
    setTimeout(() => {
      chrome.action.setBadgeText({ text });
      chrome.action.setBadgeBackgroundColor({ color });
    }, 50);
  });
}

// 修改消息监听器
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'toggleTracking') {
    updateBadgeStatus(request.isFocus); 
  }
});

// 初始化时从存储加载状态
chrome.storage.local.set({ focus: true }, () => {
  updateBadgeStatus(true);
  console.log('Reset focus to true on browser startup');
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({ focus: true }, () => {
    updateBadgeStatus(true);
    console.log('Runtime startup: Focus reset to true');
  });
});
