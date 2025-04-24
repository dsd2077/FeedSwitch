// import psl from "psl"
import psl from "../node_modules/psl/dist/psl.mjs"
// import psl from "./libs/psl.mjs"
let cachedMap = new Map()
import { SITE_CONFIG } from "./config.js"
// 通用移除函数
function removeWebsiteFeed(hostname) {
  const config = SITE_CONFIG[parseDomain(hostname)]
  if (!config) return

  const checkAndRemove = (root = document) => {
    config.targets.forEach((target) => {
      const elements = root.querySelector(target)
      elements?.parentElement?.removeChild(elements)
    })
    config.extraCheck?.(root)
  }

  const observer = new MutationObserver((mutations) => {
    checkAndRemove()
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          checkAndRemove(node)
        }
      })
    })
  })

  observer.observe(document, { childList: true, subtree: true })
  checkAndRemove()
}

// 通用检查逻辑
function checkAndRemove() {
  chrome.storage.local.get(["focus", "websiteTimesDailyFun"], (localResult) => {
    chrome.storage.sync.get(["limits"], (syncResult) => {
      const shouldRemove = localResult.focus === true || checkTimeLimit(location.hostname, localResult.websiteTimesDailyFun, syncResult.limits)
      if (shouldRemove) {
        removeWebsiteFeed(location.hostname)
      }
    })
  })
}

// 其他通用函数保持不变...
function checkTimeLimit(domain, timeData = {}, limits = {}) {
  const mainDomain = parseDomain(domain)
  const groupIds = cachedMap.get(mainDomain) || []

  // console.log(`checkTimeLimit:${domain} limits:${JSON.stringify(limits)} groupIds:${JSON.stringify(groupIds)} cachedMap:${JSON.stringify(cachedMap)}`)

  if (groupIds.length === 0) return false

  return Object.values(limits).some((limit) => {
    if (!groupIds.includes(limit.id)) return false

    const groupUsage = limit.websites.reduce((sum, mainDomain) => {
      // 获取该主域名下的所有子域名时间对象
      const subDomains = timeData[mainDomain] || {}
      // 累加所有子域名的时间（单位：秒）
      const domainTotal = Object.values(subDomains).reduce((sum, pages) => sum + Object.values(pages).reduce((pageSum, pageInfo) => pageSum + pageInfo.time, 0), 0)
      return sum + domainTotal
    }, 0)
    console.log(`domain:[${domain}] groupUsage:${groupUsage}`)
    // 转换为分钟比较
    return Math.floor(groupUsage / 60) >= limit.dailyLimit
  })
}

function initSPARouteCheck(hostname) {
  let lastPath = location.pathname

  const checkSPA = () => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname
      checkAndRemove()
      console.log(`[${hostname}] 检测到路由变化`)
    }
  }

  // 初始执行 + 路由监听
  checkAndRemove()
  setInterval(checkSPA, 1000)
}

if (SITE_CONFIG?.[parseDomain(location.hostname)]) {
  initSPARouteCheck(location.hostname)
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && (changes.focus || changes.websiteTimesDailyFun)) {
    checkAndRemove()
  }
})

// 监听limits变化
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.limits) {
    updateCachedMap(changes.limits.newValue || {})
  }
})

// 初始化时加载
chrome.storage.sync.get(["limits"], (result) => {
  updateCachedMap(result.limits || {})
})

function updateCachedMap(limits) {
  const newMap = new Map()
  Object.values(limits).forEach((limit) => {
    limit.websites.forEach((mainDomain) => {
      if (!newMap.has(mainDomain)) newMap.set(mainDomain, [])
      newMap.get(mainDomain).push(limit.id)
    })
  })
  cachedMap = newMap
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
