/// <reference types="chrome"/>
/// <reference lib="DOM"/>

document.addEventListener('DOMContentLoaded', () => {
  const websiteList = document.getElementById('website-list');
  const trackingSwitch = document.getElementById('tracking-switch');
  chrome.storage.local.get(['focus'], (result) => {
    const isEnabled = !!result.focus;
    if (trackingSwitch instanceof HTMLInputElement) {
      trackingSwitch.checked = isEnabled;
    }
  });
  function updateWebsiteList() {
    chrome.storage.local.get(['websiteTimesDaily', 'websiteTimesDailyFun'], (result) => {
      const websiteTimesDaily = result.websiteTimesDaily || {};
      const websiteTimesDailyFun = result.websiteTimesDailyFun || {};
      websiteList.innerHTML = '';
      // 将对象转换为数组并排序
      const sortedEntries = Object.entries(websiteTimesDaily).sort((a, b) => b[1] - a[1]);
      for (const [url, time] of sortedEntries) {
        const listItem = document.createElement('li');
        // 格式化时间和限制时间
        const formattedTime = formatTime(time);
        if (websiteTimesDailyFun[url]) {
          const formattedTimeFun = formatTime(websiteTimesDailyFun[url]);
          listItem.textContent = `${url}: ${formattedTime} (Fun: ${formattedTimeFun})`;
        } else {
          listItem.textContent = `${url}: ${formattedTime}`;
        }
        websiteList.appendChild(listItem);
      }
    });
  }

  function formatTime(seconds) {
    const hours = Math.round(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    const secs = seconds % 60;

    let parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  updateWebsiteList();

  // 修改开关变化事件监听
  trackingSwitch.addEventListener('change', (event) => {
    const isFocus = event.target instanceof HTMLInputElement ? event.target.checked : false;
    chrome.storage.local.set({ focus: isFocus }, () => {

      // 立即更新当前页面的徽章
      chrome.runtime.sendMessage({
        type: 'toggleTracking',
        isFocus: isFocus
      });
    });
  });
});

document.querySelector('#go-to-options').addEventListener('click', function() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});

