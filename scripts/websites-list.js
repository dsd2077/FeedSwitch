import psl from "../node_modules/psl/dist/psl.mjs"

let websitesTimeCache = null
let faviconCache = null

function updateWebsiteList(websiteList, date) {
  const websitesTimeKey = generateWebsitesTimeKey(date)
  chrome.storage.local.get([websitesTimeKey, "faviconCache"], (result) => {
    websitesTimeCache = result[websitesTimeKey] || {} // 缓存数据
    faviconCache = result.faviconCache || {}
    const processedData = processStorageData()
    renderWebsiteList(websiteList, processedData)
  })
}

// 处理存储数据
function processStorageData() {
  return Object.entries(websitesTimeCache)
    .map(([mainDomain, subDomains]) => ({
      mainDomain,
      totalTime: calculateTotalTime(subDomains),
      funTime: calculateFunTime(subDomains),
    }))
    .sort((a, b) => b.totalTime - a.totalTime)
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
  const imgElement = domainList.querySelector('.domain-icon img')
  if (imgElement) {
    imgElement.addEventListener('error', function() {
      this.src = chrome.runtime.getURL("icons/broken_pic.png")
    })
  }

  setupDomainClickListener(domainList, domain)
  return domainList
}

// 构建域名HTML模板
function buildDomainHTML(domain, focusPercentage, funPercentage, widthPercentage) {
  const timeDisplay = domain.funTime > 0 ? `${formatTime(domain.totalTime)} (娱乐: ${formatTime(domain.funTime)})` : formatTime(domain.totalTime)

  return `
    <div class="domain-item">
      <div class="domain-icon">
        <img class="domain-icon" 
             src="${encodeURI(faviconCache[domain.mainDomain] || getDefaultIconUrl())}" 
             alt=""
             data-domain="${domain.mainDomain}">
      </div>
      <div class="domain-info">
        <span class="domain-name">${domain.mainDomain}</span>
        <span class="domain-time">${timeDisplay}</span>
        <div class="progress-bar" style="width:${widthPercentage}%">
          <div class="focus-progress" style="width:${focusPercentage}%"></div>
          <div class="fun-progress" style="width:${funPercentage}%"></div>
        </div>
      </div>
    </div>
  `
}

// 设置域名点击事件
function setupDomainClickListener(domainElement, domain) {
  domainElement.addEventListener("click", () => {
    domainElement.classList.toggle("active")

    if (hasExistingSubdomain(domainElement)) {
      toggleSubdomainExpansion(domainElement)
      return
    }

    fetchSubDomainData(domain.mainDomain).then((subDomains) => {
      const sortedSubDomains = sortSubDomains(subDomains)
      renderSubDomains(domainElement, sortedSubDomains)
    })
  })
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

function generateWebsitesTimeKey(date) {
  return "websitesTime-" + getTodayDate(date)
}

function getTodayDate(date) {
  const today = new Date(date)
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0") // 月份从0开始，需要+1并补零
  const day = String(today.getDate()).padStart(2, "0") // 日期补零

  return `${year}-${month}-${day}`
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

function getDefaultIconUrl() {
  return chrome.runtime.getURL(`icons/broken_pic.png`)
}
