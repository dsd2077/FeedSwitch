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
      const totalTime = Object.values(subDomains).reduce(
        (sum, pages) => sum + Object.values(pages).reduce((pageSum, pageInfo) => pageSum + pageInfo.time, 0),
        0,
      )
      const funDomains = websiteTimesDailyFun[mainDomain] || {}
      const funTime = Object.values(funDomains).reduce(
        (sum, pages) => sum + Object.values(pages).reduce((pageSum, pageInfo) => pageSum + pageInfo.time, 0),
        0,
      )
      return { mainDomain, totalTime, funTime }
    })

    // 2. 按总时长排序
    const sortedDomains = domainTotals.sort((a, b) => b.totalTime - a.totalTime)
    const maxTotalTime = Math.max(...sortedDomains.map((d) => d.totalTime), 0)

    // 3. 生成列表项
    for (const { mainDomain, totalTime, funTime } of sortedDomains) {
      const domainList = document.createElement("li")
      domainList.classList.add("domain-list")
      const focusTime = totalTime - funTime
      const focusPercentage = totalTime > 0 ? ((focusTime / totalTime) * 100).toFixed(1) : 0
      const funPercentage = totalTime > 0 ? ((funTime / totalTime) * 100).toFixed(1) : 0
      const timeDisplay = funTime > 0 ? `${formatTime(totalTime)} (娱乐: ${formatTime(funTime)})` : formatTime(totalTime)
      const widthPercentage = maxTotalTime > 0 ? ((totalTime / maxTotalTime) * 100).toFixed(1) : 0

      domainList.innerHTML = `
        <div class="domain-item">
          <div class="domain-icon">
            <img class="domain-icon" 
                src="${encodeURI(faviconCache[mainDomain] || getDefaultIconUrl())}"
                alt=""
                onerror="this.onerror=null;this.src='${chrome.runtime.getURL("icons/broken_pic.png")}'"
            >
          </div>
          <div class="domain-info">
            <span class="domain-name">${mainDomain}</span>
            <span class="domain-time">${timeDisplay}</span>
            <div class="progress-bar" style="width: ${widthPercentage}%">
              <div class="focus-progress" style="width: ${focusPercentage}%"></div>
              <div class="fun-progress" style="width: ${funPercentage}%"></div>
            </div>
          </div>
        </div>
        `

      // 主域名点击展开二级域名
      domainList.addEventListener("click", () => {
        console.log("Clicked on main domain:", mainDomain)
        domainList.classList.toggle("active") // 添加这行
        // const existingList = domainList.querySelector(".subdomain-list")
        // if (existingList) {
        //   existingList.classList.toggle("expanded")
        //   return
        // }

        const allSubLists = domainList.querySelectorAll(".subdomain-list")

        if (allSubLists.length > 0) {
          // 统一切换所有子列表状态
          allSubLists.forEach((list) => list.classList.toggle("expanded"))
          return
        }
        const subDomains = websiteTimesDaily[mainDomain]
        // 计算二级域名总时长并排序
        const sortedSubDomains = Object.entries(subDomains)
          .map(([subDomain, pages]) => {
            const subDomainTotalTime = Object.values(pages).reduce((sum, pageInfo) => sum + pageInfo.time, 0)
            return { subDomain, subDomainTotalTime }
          })
          .sort((a, b) => b.subDomainTotalTime - a.subDomainTotalTime)
        console.log("Sorted subdomains:", sortedSubDomains)

        for (const { subDomain, subDomainTotalTime } of sortedSubDomains) {
          const subDomainList = document.createElement("ul")
          subDomainList.classList.add("subdomain-list")

          // const subDomainTotalTime = Object.values(pages).reduce((sum, pageInfo) => sum + pageInfo.time, 0)

          subDomainList.innerHTML = `
              <div class="subdomain-item">
                 <div class="subdomain-info">
                  <span class="subdomain-name">${subDomain}</span>
                  <span class="subdomain-time">${formatTime(subDomainTotalTime)}</span>
                </div>
              </div>
            `

          // 二级域名点击展开网页标题
          subDomainList.addEventListener("click", (event) => {
            event.stopPropagation()
            subDomainList.classList.toggle("active")
            console.log("Clicked on sub domain:", subDomain)

            const existingList = subDomainList.querySelector(".page-list")
            if (existingList) {
              existingList.classList.toggle("expanded")
              return
            }

            const pageList = document.createElement("ul")
            pageList.classList.add("page-list")
            const sortedPages = Object.entries(subDomains[subDomain])
              .map(([pageUrl, pageInfo]) => ({ pageUrl, pageInfo }))
              .sort((a, b) => b.pageInfo.time - a.pageInfo.time)
            for (const { pageUrl, pageInfo } of sortedPages) {
              const pageItem = document.createElement("li")
              pageItem.classList.add("page-item")
              pageItem.innerHTML = `
                  <div class="page-info">
                    <a class="page-title" 
                       href="${pageUrl}"
                       target="_blank"
                       title="${pageUrl}">
                       ${pageInfo.title || pageUrl}
                       </a>
                    <span class="page-time">${formatTime(pageInfo.time)}</span>
                  </div>
                `
              pageList.appendChild(pageItem)
            }

            subDomainList.appendChild(pageList)
            pageList.classList.add("expanded")
          })
          subDomainList.classList.add("expanded")
          domainList.appendChild(subDomainList)
        }
      })
      websiteList.appendChild(domainList)
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

// function getFaviconUrl(domain) {
//   return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
// }

function getDefaultIconUrl() {
  return chrome.runtime.getURL(`icons/broken_pic.png`)
}
