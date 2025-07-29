import psl from "../node_modules/psl/dist/psl.mjs"

/// <reference types="chrome"/>
/// <reference lib="DOM"/>
let websitesTimeCache = null
let faviconCache = null
let faviconUrls = null
let pinnedWebsites = null // 添加pin状态缓存，格式：{domain: timestamp}
let currentDate = new Date() // 当前选择的日期

document.addEventListener("DOMContentLoaded", () => {
  const trackingSwitch = document.getElementById("tracking-switch")
  chrome.storage.local.get(["focus"], (result) => {
    const isEnabled = !!result.focus
    if (trackingSwitch instanceof HTMLInputElement) {
      trackingSwitch.checked = isEnabled
    }
  })

  // 初始化日期显示
  updateDateDisplay()

  const websiteList = document.getElementById("website-list")
  updateWebsiteList(websiteList)

  // 添加日期导航按钮的事件监听器
  document.getElementById("prevDay").addEventListener("click", () => {
    changeDate(-1)
  })

  document.getElementById("currentDate").addEventListener("click", () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    } else {
      window.open(chrome.runtime.getURL("options.html"))
    }
  })

  document.getElementById("nextDay").addEventListener("click", () => {
    changeDate(1)
  })

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
  window.open(chrome.runtime.getURL("options/option.html#webpage-limits"))
})

function updateWebsiteList(websiteList) {
  const websitesTimeKey = generateWebsitesTimeKey()
  chrome.storage.local.get([websitesTimeKey, "faviconCache", "faviconUrls", "pinnedWebsites"], (result) => {
    websitesTimeCache = result[websitesTimeKey] || {} // 缓存数据
    faviconCache = result.faviconCache || {}
    faviconUrls = result.faviconUrls || {}

    // 处理数据兼容性：如果是旧的数组格式，转换为新的对象格式
    let pinnedData = result.pinnedWebsites || {}
    if (Array.isArray(pinnedData)) {
      // 转换数组格式为对象格式
      const newPinnedData = {}
      pinnedData.forEach((domain) => {
        newPinnedData[domain] = Date.now()
      })
      pinnedWebsites = newPinnedData
      // 立即保存新格式到存储
      chrome.storage.local.set({ pinnedWebsites: pinnedWebsites })
    } else {
      pinnedWebsites = pinnedData
    }

    const processedData = processStorageData()
    // 自动重新缓存没有缓存但有URL的图标
    processedData.forEach((domain) => {
      const cachedIcon = faviconCache[domain.mainDomain]
      const iconUrl = faviconUrls[domain.mainDomain]

      if (iconUrl && !cachedIcon) {
        // 触发重新缓存
        chrome.runtime.sendMessage({
          type: "recacheIcon",
          domain: domain.mainDomain,
          url: iconUrl,
        })
      }
    })

    renderWebsiteList(websiteList, processedData)
  })
}

// 处理存储数据
function processStorageData() {
  const domainData = Object.entries(websitesTimeCache)
    .map(([mainDomain, subDomains]) => ({
      mainDomain,
      totalTime: calculateTotalTime(subDomains),
      funTime: calculateFunTime(subDomains),
      isPinned: mainDomain in pinnedWebsites,
      pinTimestamp: pinnedWebsites[mainDomain] || 0,
    }))
    .sort((a, b) => {
      // 首先按pin状态排序，被pin的网站排在前面
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      // 如果都被pin，按pin时间降序排列（最近pin的在前）
      if (a.isPinned && b.isPinned) {
        return b.pinTimestamp - a.pinTimestamp
      }

      // 如果都未被pin，按总时长排序
      return b.totalTime - a.totalTime
    })

  return domainData
}

// 计算总时长
function calculateTotalTime(subDomains) {
  return Object.values(subDomains).reduce((sum, pages) => sum + Object.values(pages).reduce((pageSum, pageInfo) => pageSum + pageInfo.time, 0), 0)
}

// 计算娱乐时长
function calculateFunTime(subDomains) {
  return Object.values(subDomains).reduce(
    (sum, pages) => sum + Object.values(pages).reduce((pageSum, pageInfo) => pageSum + (pageInfo.funTime || 0), 0),
    0,
  )
}

// 渲染网站列表
function renderWebsiteList(websiteList, domains) {
  websiteList.innerHTML = ""
  const maxTotalTime = Math.max(...domains.map((d) => d.totalTime), 0)

  domains.forEach((domain) => {
    const domainElement = createDomainElement(domain, maxTotalTime)
    websiteList.appendChild(domainElement)
  })

  // 触发进度条动画
  setTimeout(() => {
    animateProgressBars(websiteList)
  }, 100) // 延迟100ms确保DOM已完全渲染
}

// 触发进度条动画
function animateProgressBars(container) {
  const progressBars = container.querySelectorAll(".progress-bar")
  progressBars.forEach((bar, index) => {
    const focusProgress = bar.querySelector(".focus-progress")
    const funProgress = bar.querySelector(".fun-progress")

    // 延迟每个进度条的动画，创建波浪效果
    setTimeout(() => {
      // 设置进度条容器宽度
      const barWidth = bar.getAttribute("data-width")
      bar.style.width = barWidth + "%"
      bar.classList.add("animate")

      // 设置专注时长进度条宽度
      const focusWidth = focusProgress.getAttribute("data-width")
      focusProgress.style.width = focusWidth + "%"
      focusProgress.classList.add("animate")

      // 设置娱乐时长进度条宽度
      const funWidth = funProgress.getAttribute("data-width")
      funProgress.style.width = funWidth + "%"
      funProgress.classList.add("animate")
    }, index * 100) // 每个进度条延迟100ms
  })
}

// 创建域名元素
function createDomainElement(domain, maxTotalTime) {
  const domainList = document.createElement("li")
  domainList.className = "domain-list"

  const focusTime = domain.totalTime - domain.funTime
  const focusPercentage = calculatePercentage(focusTime, domain.totalTime)
  const funPercentage = calculatePercentage(domain.funTime, domain.totalTime)
  const widthPercentage = calculatePercentage(domain.totalTime, maxTotalTime)

  domainList.innerHTML = buildDomainHTML(domain, focusPercentage, funPercentage, widthPercentage)

  // 添加图片错误处理
  const imgElement = domainList.querySelector(".domain-icon img")
  if (imgElement) {
    imgElement.addEventListener("error", function () {
      this.src = chrome.runtime.getURL("icons/broken_pic.png")
    })
  }

  setupDomainClickListener(domainList, domain)
  return domainList
}

// 获取图标源地址
function getIconSrc(domain) {
  const cachedIcon = faviconCache[domain]
  const iconUrl = faviconUrls[domain]

  // 优先使用缓存的图标
  if (cachedIcon) {
    return cachedIcon.data
  }

  // 如果缓存不存在但有URL，使用URL并触发重新缓存
  if (iconUrl && !cachedIcon) {
    // 触发重新缓存（通过消息传递给background script）
    chrome.runtime.sendMessage({
      type: "recacheIcon",
      domain: domain,
      url: iconUrl,
    })
    return encodeURI(iconUrl)
  }

  // 否则使用默认图标
  return getDefaultIconUrl()
}

// 构建域名HTML模板
function buildDomainHTML(domain, focusPercentage, funPercentage, widthPercentage) {
  const timeDisplay =
    domain.funTime > 0
      ? `${formatTime(domain.totalTime)} (${chrome.i18n.getMessage("timeDisplayFun")}: ${formatTime(domain.funTime)})`
      : formatTime(domain.totalTime)
  const pinClass = domain.isPinned ? "pinned" : ""
  const pinIcon = domain.isPinned ? "📌" : "📍"
  const pinTitle = domain.isPinned ? chrome.i18n.getMessage("pinTitleUnpin") : chrome.i18n.getMessage("pinTitlePin")

  return `
    <div class="domain-header">
      <div class="domain-item">
        <div class="domain-icon">
          <img class="domain-icon" 
               src="${getIconSrc(domain.mainDomain)}" 
               alt=""
               data-domain="${domain.mainDomain}">
        </div>
        <div class="domain-info">
          <span class="domain-name">${domain.mainDomain}</span>
          <span class="domain-time">${timeDisplay}</span>
          <div class="progress-bar" data-width="${widthPercentage}">
            <div class="focus-progress" data-width="${focusPercentage}"></div>
            <div class="fun-progress" data-width="${funPercentage}"></div>
          </div>
        </div>
      </div>
      <button class="pin-button ${pinClass}" 
              data-domain="${domain.mainDomain}"
              title="${pinTitle}">
        ${pinIcon}
      </button>
    </div>
  `
}

// 设置域名点击事件
function setupDomainClickListener(domainElement, domain) {
  // 添加pin按钮事件监听
  const pinButton = domainElement.querySelector(".pin-button")
  if (pinButton) {
    pinButton.addEventListener("click", (event) => {
      event.stopPropagation() // 防止触发域名展开
      togglePinStatus(domain.mainDomain)
    })
  }

  // 获取domain-header来处理点击事件
  const domainHeader = domainElement.querySelector(".domain-header")
  if (domainHeader) {
    domainHeader.addEventListener("click", (event) => {
      // 如果点击的是pin按钮，不处理展开逻辑
      if (event.target.classList.contains("pin-button")) {
        return
      }

      domainElement.classList.toggle("active")

      if (hasExistingSubdomain(domainElement)) {
        toggleSubdomainExpansion(domainElement)
        return
      }

      fetchSubDomainData(domain.mainDomain).then((subDomains) => {
        const sortedSubDomains = sortSubDomains(subDomains)
        renderSubDomains(domainElement, sortedSubDomains)

        // 如果只有一个子域名，自动展开它
        if (sortedSubDomains.length === 1) {
          const subDomainElement = domainElement.querySelector(".subdomain-list")
          if (subDomainElement) {
            subDomainElement.click()
          }
        }
      })
    })
  } else {
    console.error("未找到domain-header:", domainElement)
  }
}

// 检查是否存在子域名
function hasExistingSubdomain(element) {
  return element.querySelectorAll(".subdomain-list").length > 0
}

// 切换子域名展开状态
function toggleSubdomainExpansion(element) {
  element.querySelectorAll(".subdomain-list").forEach((list) => list.classList.toggle("expanded"))
}

// 获取子域名数据
function fetchSubDomainData(mainDomain) {
  return new Promise((resolve) => {
    if (websitesTimeCache && websitesTimeCache[mainDomain]) {
      resolve(websitesTimeCache[mainDomain])
    } else {
      const websitesTimeKey = generateWebsitesTimeKey()
      chrome.storage.local.get([websitesTimeKey], (result) => {
        websitesTimeCache = result[websitesTimeKey] || {}
        resolve(websitesTimeCache[mainDomain] || {})
      })
    }
  })
}

// 排序子域名
function sortSubDomains(subDomains) {
  return Object.entries(subDomains)
    .map(([subDomain, pages]) => ({
      subDomain,
      time: calculateSubDomainTime(pages),
    }))
    .sort((a, b) => b.time - a.time)
}

// 计算子域名时间
function calculateSubDomainTime(pages) {
  return Object.values(pages).reduce((sum, pageInfo) => sum + pageInfo.time, 0)
}

// 渲染子域名
function renderSubDomains(domainElement, subDomains) {
  subDomains.forEach(({ subDomain, time }) => {
    const subDomainElement = createSubDomainElement(subDomain, time)
    setupSubDomainListener(subDomainElement, subDomain)
    domainElement.appendChild(subDomainElement)
  })
}

// 创建子域名元素
function createSubDomainElement(subDomain, time) {
  const subDomainElement = document.createElement("ul")
  subDomainElement.className = "subdomain-list expanded"

  subDomainElement.innerHTML = `
    <div class="subdomain-item">
      <div class="subdomain-info">
        <span class="subdomain-name">${subDomain}</span>
        <span class="subdomain-time">${formatTime(time)}</span>
      </div>
    </div>
  `

  return subDomainElement
}

// 设置子域名点击事件
function setupSubDomainListener(subDomainElement, subDomain) {
  subDomainElement.addEventListener("click", (event) => {
    event.stopPropagation()
    subDomainElement.classList.toggle("active")

    if (subDomainElement.querySelector(".page-list")) {
      subDomainElement.querySelector(".page-list").classList.toggle("expanded")
      return
    }

    fetchPageData(subDomain).then((pages) => {
      const sortedPages = sortPages(pages)
      renderPages(subDomainElement, sortedPages)
    })
  })
}

// 获取页面数据
function fetchPageData(subDomain) {
  return new Promise((resolve) => {
    const mainDomain = parseDomain(subDomain)
    if (websitesTimeCache && websitesTimeCache[mainDomain]?.[subDomain]) {
      resolve(websitesTimeCache[mainDomain][subDomain])
    } else {
      const websitesTimeKey = generateWebsitesTimeKey()
      chrome.storage.local.get([websitesTimeKey], (result) => {
        websitesTimeCache = result[websitesTimeKey] || {}
        resolve(websitesTimeCache[mainDomain]?.[subDomain] || {})
      })
    }
  })
}

// 排序页面
function sortPages(pages) {
  return Object.entries(pages)
    .map(([pageUrl, pageInfo]) => ({ pageUrl, pageInfo }))
    .sort((a, b) => b.pageInfo.time - a.pageInfo.time)
}

// 渲染页面
function renderPages(subDomainElement, pages) {
  const pageList = document.createElement("ul")
  pageList.className = "page-list expanded"

  pages.forEach(({ pageUrl, pageInfo }) => {
    const pageItem = createPageItem(pageUrl, pageInfo)
    pageList.appendChild(pageItem)
  })

  subDomainElement.appendChild(pageList)
}

// 创建页面元素
function createPageItem(pageUrl, pageInfo) {
  const pageItem = document.createElement("li")
  pageItem.className = "page-item"

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

  return pageItem
}

// 计算百分比
function calculatePercentage(value, total) {
  return total > 0 ? ((value / total) * 100).toFixed(1) : 0
}

// 切换pin状态
function togglePinStatus(domain) {
  const isPinned = domain in pinnedWebsites

  if (isPinned) {
    // 取消pin
    delete pinnedWebsites[domain]
  } else {
    // 添加pin，记录当前时间戳，新pin的项目会排在最前面
    pinnedWebsites[domain] = Date.now()
  }

  // 保存到存储
  chrome.storage.local.set({ pinnedWebsites: pinnedWebsites }, () => {
    // 重新加载列表
    const websiteList = document.getElementById("website-list")
    updateWebsiteList(websiteList)
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

function getTodayDate() {
  const year = currentDate.getFullYear()
  const month = String(currentDate.getMonth() + 1).padStart(2, "0") // 月份从0开始，需要+1并补零
  const day = String(currentDate.getDate()).padStart(2, "0") // 日期补零

  return `${year}-${month}-${day}`
}

function generateWebsitesTimeKey() {
  return "websitesTime-" + getTodayDate()
}

function parseDomain(domain) {
  try {
    // 处理特殊cases：IP地址或localhost
    if (/^(\d+\.){3}\d+$/.test(domain) || domain === "localhost") {
      return domain
    }
    const parsed = psl.parse(domain)
    return parsed.domain || domain
  } catch (e) {
    console.error("Domain parse error:", domain, e)
    return domain
  }
}

// 更新日期显示
function updateDateDisplay() {
  const dateElement = document.getElementById("currentDate")
  if (dateElement) {
    const today = new Date()
    const isToday = currentDate.toDateString() === today.toDateString()
    const month = currentDate.getMonth() + 1
    const day = currentDate.getDate()
    const weekdays = [
      chrome.i18n.getMessage("dateWeekdaySun"),
      chrome.i18n.getMessage("dateWeekdayMon"),
      chrome.i18n.getMessage("dateWeekdayTue"),
      chrome.i18n.getMessage("dateWeekdayWed"),
      chrome.i18n.getMessage("dateWeekdayThu"),
      chrome.i18n.getMessage("dateWeekdayFri"),
      chrome.i18n.getMessage("dateWeekdaySat"),
    ]
    const weekday = weekdays[currentDate.getDay()]

    if (isToday) {
      dateElement.textContent = `${chrome.i18n.getMessage("dateToday")} ${weekday}`
    } else {
      dateElement.textContent = `${month}${chrome.i18n.getMessage("dateMonthUnit")}${day}${chrome.i18n.getMessage("dateDayUnit")} ${weekday}`
    }
  }
}

// 改变日期
function changeDate(days) {
  const newDate = new Date(currentDate)
  newDate.setDate(currentDate.getDate() + days)

  // 不能选择未来的日期
  const today = new Date()
  if (newDate > today) {
    return
  }

  currentDate = newDate
  updateDateDisplay()

  // 重新加载数据
  const websiteList = document.getElementById("website-list")
  updateWebsiteList(websiteList)
}
