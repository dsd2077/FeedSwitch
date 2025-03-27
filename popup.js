/// <reference types="chrome"/>
/// <reference lib="DOM"/>

document.addEventListener('DOMContentLoaded', () => {
  const websiteList = document.getElementById('website-list');

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
});
