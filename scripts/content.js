import psl from "../node_modules/psl/dist/psl.mjs"
let cachedMap = new Map()
import { SITE_CONFIG } from "./config.js"
// 通用移除函数
function removeWebsiteFeed(hostname) {
  const config = SITE_CONFIG[parseDomain(hostname)]
  if (!config) return
  const checkAndRemove = (root = document) => {
    // 路由级条件：若站点定义了 shouldApply，则仅在返回 true 时执行
    if (typeof config.shouldApply === "function") {
      try {
        if (!config.shouldApply(window.location)) {
          return
        }
      } catch (e) {
        console.warn("shouldApply check failed:", e)
      }
    }
    config.targets.forEach((target) => {
      // const elements = root.querySelector(target)
      // elements?.parentElement?.removeChild(elements)
      const elements = root.querySelectorAll(target)
      elements.forEach((element) => {
        if (element && element.style) {
          element.style.display = "none"
        }
      })
      // const elements = root.querySelectorAll(target)
      // elements.forEach((element) => {
      //   element?.parentElement?.removeChild(element)
      // })
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
  const websitesTimeKey = generateWebsitesTimeKey()
  chrome.storage.local.get(["focus", websitesTimeKey], (localResult) => {
    chrome.storage.sync.get(["limits"], (syncResult) => {
      const shouldRemove = localResult.focus === true || checkTimeLimit(location.hostname, localResult[websitesTimeKey], syncResult.limits)
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
      // const domainTotal = Object.values(subDomains).reduce(
      //   (sum, pages) => sum + Object.values(pages).reduce((pageSum, pageInfo) => pageSum + pageInfo.time, 0),
      //   0,
      // )
      const domainTotal = Object.values(subDomains).reduce(
        (sum, pages) => sum + Object.values(pages).reduce((pageSum, pageInfo) => pageSum + (pageInfo.funTime || 0), 0),
        0,
      )
      return sum + domainTotal
    }, 0)

    // 转换为分钟
    const usageMinutes = Math.floor(groupUsage / 60)
    console.log(`domain:[${domain}] groupUsage:${groupUsage}秒 (${usageMinutes}分钟)`)

    // 根据时间类型获取今日限制
    let todayLimit = 0

    if (limit.timeType === "daily") {
      // 每日限制类型
      todayLimit = limit.dailyLimit || 0
    } else if (limit.timeType === "custom" && limit.customLimits) {
      // 自定义限制类型 - 根据今天是星期几获取对应限制
      const today = new Date()
      const dayOfWeek = today.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
      const todayName = dayNames[dayOfWeek]
      todayLimit = limit.customLimits[todayName] || 0
    } else {
      // 兼容旧数据格式
      todayLimit = limit.dailyLimit || 0
    }

    console.log(`domain:[${domain}] 今日限制:${todayLimit}分钟, 已使用:${usageMinutes}分钟, 限制类型:${limit.timeType || "legacy"}`)

    return usageMinutes >= todayLimit
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
  if (areaName === "local" && (changes.focus || changes[generateWebsitesTimeKey()])) {
    checkAndRemove()
  }
  if (areaName === "sync" && changes.limits) {
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

    // 特殊处理v.qq.com等子域名
    if (domain === "v.qq.com") {
      return "v.qq.com"
    }

    const parsed = psl.parse(domain)
    return parsed.domain || domain
  } catch (e) {
    console.error("Domain parse error:", domain, e)
    return domain
  }
}

function generateWebsitesTimeKey() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0") // 月份从0开始，需要+1并补零
  const day = String(today.getDate()).padStart(2, "0") // 日期补零

  return `websitesTime-${year}-${month}-${day}`
}
