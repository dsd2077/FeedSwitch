/// <reference types="chrome"/>
/// <reference lib="DOM"/>

document.addEventListener("DOMContentLoaded", () => {
  const websiteList = document.getElementById("website-list")
  const trackingSwitch = document.getElementById("tracking-switch")
  chrome.storage.local.get(["focus"], (result) => {
    const isEnabled = !!result.focus
    if (trackingSwitch instanceof HTMLInputElement) {
      trackingSwitch.checked = isEnabled
    }
  })

  updateWebsiteList(websiteList)

  // 修改开关变化事件监听
  trackingSwitch.addEventListener("change", (event) => {
    const isFocus = event.target.checked
    chrome.storage.local.set({ focus: isFocus }, () => {
      // 立即更新当前页面的徽章
      chrome.runtime.sendMessage({
        type: "toggleTracking",
        isFocus: isFocus,
      })
    })
  })

  // 添加 storage 监听
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.focus) {
      trackingSwitch.checked = changes.focus.newValue
    }
  })
})

document.querySelector("#go-to-options").addEventListener("click", function () {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage()
  } else {
    window.open(chrome.runtime.getURL("options.html"))
  }
})

function updateWebsiteList(websiteList) {
  chrome.storage.local.get(["websiteTimesDaily", "websiteTimesDailyFun", "faviconCache"], (result) => {
    const websiteTimesDaily = result.websiteTimesDaily || {}
    const websiteTimesDailyFun = result.websiteTimesDailyFun || {}
    const faviconCache = result.faviconCache || {}

    websiteList.innerHTML = ""

    // 1. 计算主域名总时长
    const domainTotals = Object.entries(websiteTimesDaily).map(([mainDomain, subDomains]) => {
      // 计算总时长
      const totalTime = Object.values(subDomains).reduce((sum, time) => sum + time, 0)

      // 计算娱乐总时长
      const funDomains = websiteTimesDailyFun[mainDomain] || {}
      const funTime = Object.values(funDomains).reduce((sum, time) => sum + time, 0)

      return {
        mainDomain,
        totalTime,
        funTime,
      }
    })

    // 2. 按总时长排序
    const sortedDomains = domainTotals.sort((a, b) => b.totalTime - a.totalTime)
    const maxTotalTime = Math.max(...sortedDomains.map((d) => d.totalTime), 0)
    // 3. 生成列表项
    for (const { mainDomain, totalTime, funTime } of sortedDomains) {
      const listItem = document.createElement("li")
      listItem.classList.add("domain-item")
      // 计算总时长用于比例
      const focusTime = totalTime - funTime
      const focusPercentage = totalTime > 0 ? ((focusTime / totalTime) * 100).toFixed(1) : 0
      const funPercentage = totalTime > 0 ? ((funTime / totalTime) * 100).toFixed(1) : 0
      const timeDisplay = funTime > 0 ? `${formatTime(totalTime)} (娱乐: ${formatTime(funTime)})` : formatTime(totalTime)
      const widthPercentage = maxTotalTime > 0 ? ((totalTime / maxTotalTime) * 100).toFixed(1) : 0

      listItem.innerHTML = `
          <div class="domain-icon-container">
            <img class="domain-icon" src="${faviconCache[mainDomain] || getFaviconUrl(mainDomain)}" alt="${mainDomain} icon">
          </div>
          <div class="domain-info">
            <span class="domain-name">${mainDomain}</span>
            <span class="domain-time">${timeDisplay}</span>
            <div class="progress-bar" style="width: ${widthPercentage}%">
              <div class="focus-progress" style="width: ${focusPercentage * 100}%"></div>
              <div class="fun-progress" style="width: ${funPercentage * 100}%"></div>
            </div>
          </div>
        `
      websiteList.appendChild(listItem)
    }
  })
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  let parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0) parts.push(`${secs}s`)

  return parts.join(" ")
}

function getFaviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
}
