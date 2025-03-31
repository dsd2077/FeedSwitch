/// <reference types="chrome"/>
/// <reference lib="DOM"/>

document.addEventListener('DOMContentLoaded', () => {
  const websiteList = document.getElementById('website-list');
  const trackingSwitch = document.getElementById('tracking-switch');
  chrome.storage.local.get(['trackingEnabled'], (result) => {
    const isEnabled = !!result.trackingEnabled;
    if (trackingSwitch instanceof HTMLInputElement) {
      trackingSwitch.checked = isEnabled;
    }
  });
  function updateWebsiteList() {
    chrome.storage.local.get(['websiteTimesDaily'], (result) => {
      const websiteTimesDaily = result.websiteTimesDaily || {};
      websiteList.innerHTML = '';
      // 将对象转换为数组并排序
      const sortedEntries = Object.entries(websiteTimesDaily).sort((a, b) => b[1] - a[1]);
      for (const [url, time] of sortedEntries) {
        const listItem = document.createElement('li');
        // 格式化时间和限制时间
        const formattedTime = formatTime(time);
        listItem.textContent = `${url}: ${formattedTime}`;
        // listItem.textContent = `${url}: ${time} seconds (Limit: ${timeLimits[url] || 'None'} seconds)`;
        websiteList.appendChild(listItem);
      }
    });
  }

  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
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
    const isEnabled = event.target instanceof HTMLInputElement ? event.target.checked : false;

    chrome.storage.local.set({ trackingEnabled: isEnabled }, () => {

      // 立即更新当前页面的徽章
      chrome.runtime.sendMessage({
        type: 'toggleTracking',
        enabled: isEnabled
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

