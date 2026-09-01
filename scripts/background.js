import psl from "../libs/psl.mjs"
import { SITE_CONFIG } from "./config.js"

// background.js
let activeTabId = null
const activeTabs = {} // 存储各标签页的最新活动时间
let updateInterval
let isSystemActive = true // 新增系统活动状态标识
let isBrowserFocused = true // 新增窗口焦点状态标识
// 在文件顶部添加颜色常量
const BADGE_COLORS = {
  // focus: "#2ecc71", // 绿色
  focus: "#00C853", // 明亮的绿色
  // fun: "#FFA500", // 橙色
  fun: "#FF6B00", // 活力橙
  // fun: "#FFB74D", // 浅橙色
}

// migrateLegacyData(); // 迁移旧数据
// 创建定时更新函数
function startIntervalUpdate() {
  // 先清除已有定时器
  if (updateInterval) clearInterval(updateInterval)
  updateInterval = setInterval(() => {
    if (activeTabs?.[activeTabId]?.url) {
      const now = Date.now()
      const duration = Math.round((now - activeTabs[activeTabId].startTime) / 1000)

      // 更新存储并刷新开始时间
      updateDomainTime(activeTabs?.[activeTabId]?.url, duration, activeTabs?.[activeTabId]?.title, "interval")
      activeTabs[activeTabId].startTime = now - ((now - activeTabs[activeTabId].startTime) % 1000)
    }
    console.log(`Interval update. Active Tab ID: ${activeTabId}, URL: ${activeTabs?.[activeTabId]?.url || "N/A"}`)
  }, 5000) // 5秒间隔
}

// 监听浏览器窗口焦点变化
chrome.windows.onFocusChanged.addListener((windowId) => {
  const wasFocused = isBrowserFocused
  isBrowserFocused = windowId !== chrome.windows.WINDOW_ID_NONE

  if (wasFocused && !isBrowserFocused) {
    // 失去焦点时先更新一次时间
    if (activeTabId && activeTabs?.[activeTabId]?.url) {
      const now = Date.now()
      const duration = Math.round((now - activeTabs[activeTabId].startTime) / 1000)
      updateDomainTime(activeTabs[activeTabId].url, duration, activeTabs[activeTabId].title, "windowFocusChange")
      activeTabs[activeTabId].startTime = now - ((now - activeTabs[activeTabId].startTime) % 1000)
    }
    clearInterval(updateInterval)
    console.log("Browser lost focus, final update")
    // activeTabId = null
  } else if (isBrowserFocused) {
    // 恢复时重置开始时间避免计入非活动时间
    if (activeTabId && activeTabs[activeTabId]) {
      activeTabs[activeTabId].startTime = Date.now()
    }
    startIntervalUpdate()
    console.log(
      `Browser focused, resume timing. Active Tab ID: ${activeTabId}, URL: ${activeTabs?.[activeTabId]?.url || "N/A"}, Window ID: ${windowId}`,
    )
  }
})

// 监听系统唤醒/睡眠事件（需要声明权限）
chrome.idle.onStateChanged.addListener((newState) => {
  const wasActive = isSystemActive
  isSystemActive = newState !== "locked"

  if (wasActive && !isSystemActive) {
    // 进入非活动状态前更新最后一次时间
    if (activeTabId && activeTabs?.[activeTabId]?.url) {
      const now = Date.now()
      const duration = Math.round((now - activeTabs[activeTabId].startTime) / 1000)
      updateDomainTime(activeTabs[activeTabId].url, duration, activeTabs[activeTabId].title, "stateChange")
      activeTabs[activeTabId].startTime = now - ((now - activeTabs[activeTabId].startTime) % 1000)
    }
    clearInterval(updateInterval)
    console.log("System inactive, final update")
  } else {
    // 恢复时重置开始时间避免计入息屏时间
    if (activeTabId && activeTabs[activeTabId]) {
      activeTabs[activeTabId].startTime = Date.now()
    }
    startIntervalUpdate()
    console.log("System active, resume timing")
  }
})

// 激活一个新的标签页
chrome.tabs.onActivated.addListener((activeInfo) => {
  const now = Date.now()

  // 记录前一个标签页的停留时间
  if (activeTabId && activeTabs?.[activeTabId]?.url) {
    const duration = Math.round((now - activeTabs[activeTabId].startTime) / 1000)
    updateDomainTime(activeTabs[activeTabId].url, duration, activeTabs[activeTabId].title, "tab_activate")
  }
  activeTabId = activeInfo.tabId
  // 获取新标签页的URL
  chrome.tabs.get(activeTabId, (tab) => {
    console.log("Browser tab activated", " title: ", tab.title, ", url: ", tab.url, "favIconUrl: ", tab.favIconUrl)
    if (tab?.url) {
      activeTabs[activeTabId] = {
        url: normalizeUrl(tab.url), // 修改：存储完整URL
        startTime: now,
        title: tab.title,
      }
      const favIconUrl = tab.favIconUrl
      cacheFavicon(parseDomain(new URL(tab.url).hostname), favIconUrl) // 缓存图标
    }
  })
})
// 在标签页更新时触发（包括刷新）,
// 单纯的刷新——tabId不变、url不变
// 更新当前页面——tabId不变，url改变
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 处理标题更新事件（优先处理，无论页面状态如何）
  if (changeInfo.title && activeTabs[tabId]) {
    console.log(`Title updated for tab ${tabId}: ${changeInfo.title}`)
    activeTabs[tabId].title = changeInfo.title
    return
  }

  // 前置条件检查 - 只处理页面加载完成的情况
  console.log(`Tab updated: ${tabId} changeInfo: `, changeInfo)
  if (changeInfo.status !== "complete" || !tab.url) return

  const newRawUrl = tab.url
  const newUrl = normalizeUrl(newRawUrl) // 标准化后的URL
  const oldRecord = activeTabs[tabId]

  console.log(`Tab updated: 
    TabID: ${tabId}
    Title: ${tab.title}
    RawURL: ${newRawUrl}
    NormalizedURL: ${newUrl}
    PreviousURL: ${oldRecord?.url || "N/A"}`)

  // 单纯的刷新url不变
  if (oldRecord?.url && normalizeUrl(oldRecord.url) === newUrl) {
    console.log("Same normalized URL, update title only")
    activeTabs[tabId].title = tab.title
    return
  }
  if (oldRecord?.url) {
    // 计算前一个页面的停留时间
    const duration = Math.round((Date.now() - oldRecord.startTime) / 1000)
    updateDomainTime(oldRecord.url, duration, oldRecord.title, "tab_update")
  }

  // 记录新的域名信息
  activeTabs[tabId] = {
    url: newUrl,
    startTime: Date.now(),
    title: tab.title,
  }
  cacheFavicon(parseDomain(new URL(tab.url).hostname), tab.favIconUrl) // 缓存图标
})

// 添加标签页关闭时的清理
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTabs[tabId]) {
    delete activeTabs[tabId]
  }
})

/* ****************************************
数据结构变化过程：
{
// 1
  "websiteTimesDaily": {
    "bilibili.com": {
      "www.bilibili.com": 3600,
      "search.bilibili.com": 1200,
      "account.bilibili.com": 1800
    },
  }
// 2
  "websiteTimesDaily": {
    "bilibili.com": {
      "www.bilibili.com": {
        "https://www.bilibili.com/video/BV1E55BztEzX/?spm_id_from=333.1007.tianma.1-2-2.click&vd_source=836e2cbc96ae0060340beef17d34df94": {
          "time": 1200,
          "title": "B站视频标题",
        },
      },
      "search.bilibili.com": {
        "https://search.bilibili.com/all?keyword=chrome%E6%8F%92%E4%BB%B6%E5%BC%80%E5%8F%91%E5%B7%A5%E7%A8%8B%E5%8C%96%E9%97%AE%E9%A2%98&from_source=webtop_search&spm_id_from=333.1007&search_source=3" : {  
          "time": 1200,
          "title": "chrome插件开发工程化问题-哔哩哔哩_bilibili",
        },
        "https://www.bilibili.com/video/BV1E55BztEzX/?spm_id_from=333.1007.tianma.1-2-2.click&vd_source=836e2cbc96ae0060340beef17d34df94": {
          "time": 1200,
          "title": "B站视频标题",
        }
      },
    },
  }

// 3
 "websitesTime-2025-05-07": {
    "bilibili.com": {
      "www.bilibili.com": {
        "https://www.bilibili.com/video/BV1E55BztEzX/?spm_id_from=333.1007.tianma.1-2-2.click&vd_source=836e2cbc96ae0060340beef17d34df94": {
          "time": 1200,
          "title": "B站视频标题",
          "funTime": 600
        },
      },
      "search.bilibili.com": {
        "https://search.bilibili.com/all?keyword=chrome%E6%8F%92%E4%BB%B6%E5%BC%80%E5%8F%91%E5%B7%A5%E7%A8%8B%E5%8C%96%E9%97%AE%E9%A2%98&from_source=webtop_search&spm_id_from=333.1007&search_source=3" : {  
          "time": 1200,
          "title": "chrome插件开发工程化问题-哔哩哔哩_bilibili",
          "funTime": 20
        },
        "https://www.bilibili.com/video/BV1E55BztEzX/?spm_id_from=333.1007.tianma.1-2-2.click&vd_source=836e2cbc96ae0060340beef17d34df94": {
          "time": 1200,
          "title": "B站视频标题",
          "funTime": 20
        }
      },
    },
  }
}
**************************************** */
// const websitesTimeKey = generateWebsitesTimeKey()
// const hourlyUsageKey = generateHourlyUsageKey()
// chrome.storage.local.get(["focus", websitesTimeKey, hourlyUsageKey], (result) => {
//   const websitesTimeDaily = result[websitesTimeKey] || {}
//   const hourlyUsage = result[hourlyUsageKey] || Array(24).fill(0)
//   console.log("Initialized storage:", websitesTimeDaily, hourlyUsage)
// })

function updateDomainTime(pageUrl, seconds, title, type) {
  if (!pageUrl) return
  const normalizedUrl = normalizeUrl(pageUrl)
  const domain = new URL(normalizedUrl).hostname // 提取域名
  if (!isSystemActive || !isBrowserFocused || !normalizedUrl || seconds <= 0 || !isValidDomain(domain)) return

  const mainDomain = parseDomain(domain)
  // v.qq.com 等配置项可能是特殊子域名，因此同时检查规范化主域名和当前主机名。
  const isFunTimeTracked =
    Object.prototype.hasOwnProperty.call(SITE_CONFIG, mainDomain) || Object.prototype.hasOwnProperty.call(SITE_CONFIG, domain)
  const websitesTimeKey = generateWebsitesTimeKey()
  const hourlyUsageKey = generateHourlyUsageKey()
  chrome.storage.local.get(["focus", websitesTimeKey, hourlyUsageKey], (result) => {
    const websitesTimeDaily = result[websitesTimeKey] || {}
    const hourlyUsage = result[hourlyUsageKey] || {
      total: Array(24).fill(0), // 总时间数组
      fun: Array(24).fill(0), // 娱乐时间数组
    }
    if (websitesTimeDaily[mainDomain]) {
      console.log(`updateDomainTime
        "type : ", ${type}
        "normalizedUrl : ", ${normalizedUrl}
        "title : ", ${title}
        "previous time : ", ${websitesTimeDaily?.[mainDomain]?.[domain]?.[normalizedUrl]?.time || 0}
        `)
    }
    // 初始化嵌套结构
    websitesTimeDaily[mainDomain] = websitesTimeDaily[mainDomain] || {}
    websitesTimeDaily[mainDomain][domain] = websitesTimeDaily[mainDomain][domain] || {}
    // 更新时间并记录标题
    const existingEntry = websitesTimeDaily[mainDomain][domain][normalizedUrl] || {}
    const entry = {
      time: (existingEntry.time || 0) + seconds,
      title: title || existingEntry.title || "",
      funTime: isFunTimeTracked ? existingEntry.funTime || 0 : 0,
    }

    // 娱乐时间只统计支持屏蔽信息流的网站；其他网站的时间全部作为专注时间。
    const currentHour = new Date().getHours()

    if (!result.focus && isFunTimeTracked) {
      entry.funTime += seconds
      hourlyUsage.fun[currentHour] = (hourlyUsage.fun[currentHour] || 0) + seconds
    }

    // 将更新后的 entry 写回
    websitesTimeDaily[mainDomain][domain][normalizedUrl] = entry
    // 更新小时使用情况
    hourlyUsage.total[currentHour] = (hourlyUsage.total[currentHour] || 0) + seconds

    chrome.storage.local.set({
      [websitesTimeKey]: websitesTimeDaily,
      [hourlyUsageKey]: hourlyUsage,
    })
  })
}

function setDailyAlarm() {
  // 先检查闹钟是否已存在
  chrome.alarms.get("resetDaily", (alarm) => {
    if (!alarm) {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const delayInMinutes = (tomorrow.getTime() - now.getTime()) / (1000 * 60)
      chrome.alarms.create("resetDaily", {
        delayInMinutes: delayInMinutes,
        periodInMinutes: 1440,
      })
      console.log("Daily alarm set for", new Date(now.getTime() + delayInMinutes * 60 * 1000))
    } else {
      console.log("Daily alarm already exists, scheduled for", new Date(alarm.scheduledTime))
    }
  })
}

// function setDailyAlarm() {
//   // 先清除可能存在的旧闹钟
//   chrome.alarms.clear("resetDaily", (wasCleared) => {
//     console.log("Previous alarm cleared:", wasCleared)

//     const now = new Date()
//     const tomorrow = new Date(now)
//     // tomorrow.setDate(tomorrow.getDate() + 1) // 先设置为明天
//     tomorrow.setHours(11, 1, 0, 0) // 设置为凌晨00:00:00

//     const delayInMinutes = (tomorrow.getTime() - now.getTime()) / (1000 * 60)
//     console.log(
//       `Setting alarm for next midnight. Current time: ${now.toLocaleString()}, Next trigger: ${tomorrow.toLocaleString()}, Delay: ${delayInMinutes} minutes`,
//     )

//     chrome.alarms.create("resetDaily", {
//       delayInMinutes: delayInMinutes,
//       periodInMinutes: 1440, // 24小时 = 1440分钟
//     })

//     // 验证闹钟是否创建成功
//     chrome.alarms.get("resetDaily", (alarm) => {
//       if (alarm) {
//         console.log("Daily alarm created successfully:", alarm)
//       } else {
//         console.error("Failed to create daily alarm")
//       }
//     })
//   })
// }

// 新增事件监听器：处理闹钟触发事件
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "resetDaily") {
    processPendingChanges() // 处理待生效的更改
  }
})

setDailyAlarm() // 设置每日凌晨的闹钟

startIntervalUpdate() // 新增此行

// 统一更新徽章的方法
function updateBadgeStatus(isFocus) {
  const text = isFocus ? chrome.i18n.getMessage("focusLabel") : chrome.i18n.getMessage("funLabel")
  const color = isFocus ? BADGE_COLORS.focus : BADGE_COLORS.fun

  // 同步设置初始状态
  chrome.action.setBadgeText({ text })
  chrome.action.setBadgeBackgroundColor({ color })

  // 添加动画
  chrome.action.setBadgeText({ text: "" }, () => {
    setTimeout(() => {
      chrome.action.setBadgeText({ text })
      chrome.action.setBadgeBackgroundColor({ color })
    }, 50)
  })
}

// 修改消息监听器
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === "toggleTracking") {
    updateBadgeStatus(request.isFocus)
  } else if (request.type === "recacheIcon") {
    // 重新缓存图标
    cacheFavicon(request.domain, request.url)
  }
})

function initializeFocusState() {
  chrome.storage.local.get("focus", (result) => {
    if (typeof result.focus === "undefined") {
      chrome.storage.local.set({ focus: true }, () => {
        updateBadgeStatus(true)
        console.log("Initialized focus to true")
      })
      return
    }

    updateBadgeStatus(!!result.focus)
    console.log(`Loaded focus state: ${!!result.focus}`)
  })
}

initializeFocusState()

chrome.runtime.onStartup.addListener(() => {
  // onStartup 只会在浏览器配置文件启动时触发；Service Worker 被唤醒、页面刷新
  // 或标签页变化不会触发此事件，因此只有这里重置用户模式。
  chrome.storage.local.set({ focus: true }, () => {
    if (chrome.runtime.lastError) {
      console.error("Failed to reset focus on browser startup:", chrome.runtime.lastError)
      return
    }

    updateBadgeStatus(true)
    console.log("Reset focus to true on browser startup")
  })
  processPendingChanges()
})

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

function isValidDomain(domain) {
  if (!domain) return false

  // 新增PSL深度验证
  try {
    // 处理国际化域名（IDN）
    const normalizedDomain = domain.startsWith("xn--") ? psl.punycode.toUnicode(domain) : domain

    // PSL双重验证
    const parsed = psl.parse(normalizedDomain)
    const isValid = psl.isValid(normalizedDomain)

    // 公共后缀检查（如.github.io等）
    if (parsed.listed && parsed.domain === null) {
      return false // 拒绝纯公共后缀（如"com"）
    }

    return isValid
  } catch (e) {
    console.warn(`PSL validation failed for ${domain}`, e)
    return false
  }
}

chrome.commands.onCommand.addListener((command) => {
  console.log(`Command received: ${command}`)
  if (command === "toggle-tracking") {
    chrome.storage.local.get("focus", (result) => {
      const newState = !result.focus
      updateBadgeStatus(newState)
      chrome.storage.local.set({ focus: newState })
    })
  }
})

// 缓存管理配置
const CACHE_CONFIG = {
  CACHE_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7天过期时间
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24小时清理间隔
}

// 清理过期缓存
function cleanupExpiredCache() {
  chrome.storage.local.get(["faviconCache"], (result) => {
    const cache = result.faviconCache || {}
    const now = Date.now()
    let cleaned = false

    Object.keys(cache).forEach((domain) => {
      const entry = cache[domain]
      if (entry.timestamp && now - entry.timestamp > CACHE_CONFIG.CACHE_EXPIRY) {
        delete cache[domain]
        cleaned = true
      }
    })

    if (cleaned) {
      chrome.storage.local.set({
        faviconCache: cache,
      })
    }
  })
}

function cacheFavicon(mainDomain, iconUrl) {
  chrome.storage.local.get(["faviconCache", "faviconUrls"], (result) => {
    const cache = result.faviconCache || {}
    const urls = result.faviconUrls || {}

    if (!iconUrl) {
      return
    }

    if (!urls[mainDomain]) {
      urls[mainDomain] = iconUrl
      chrome.storage.local.set({ faviconUrls: urls })
    }

    if (!cache[mainDomain]) {
      if (iconUrl.startsWith("data:")) {
        const cacheEntry = {
          data: iconUrl,
          timestamp: Date.now(),
          size: iconUrl.length,
        }

        cache[mainDomain] = cacheEntry
        chrome.storage.local.set({ faviconCache: cache })

        return
      }

      // 获取图标数据并转换为base64
      fetch(iconUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return response.blob()
        })
        .then((blob) => {
          // 转换为base64
          const reader = new FileReader()
          reader.onload = function () {
            const cacheEntry = {
              data: reader.result,
              timestamp: Date.now(),
              size: reader.result.length,
            }

            cache[mainDomain] = cacheEntry
            chrome.storage.local.set({ faviconCache: cache })
            console.log(`Cached icon for ${mainDomain} (${cacheEntry.size} bytes)`)
          }
          reader.onerror = function () {
            console.error(`Failed to read icon for ${mainDomain}`)
          }
          reader.readAsDataURL(blob)
        })
        .catch(() => {})
    }
  })
}

function normalizeUrl(url) {
  try {
    const u = new URL(url)

    // 对于特定网站，保留重要的查询参数
    const hostname = u.hostname.toLowerCase()
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      const videoId = u.searchParams.get("v")
      if (videoId) {
        return `${u.origin}${u.pathname}?v=${videoId}`
      }
      // 处理youtu.be短链接格式
      if (hostname.includes("youtu.be") && u.pathname !== "/") {
        return `${u.origin}${u.pathname}`
      }
    }

    // Bilibili - 保留视频BV号或av号
    if (hostname.includes("bilibili.com")) {
      if (u.pathname.includes("/video/")) {
        return `${u.origin}${u.pathname}`
      }
    }

    return url
  } catch {
    return url
  }
}

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0") // 月份从0开始，需要+1并补零
  const day = String(today.getDate()).padStart(2, "0") // 日期补零

  return `${year}-${month}-${day}`
}

function generateWebsitesTimeKey() {
  return "websitesTime-" + getTodayDate()
}

function generateHourlyUsageKey() {
  return "hourlyUsage-" + getTodayDate()
}

// 处理待生效的更改
function processPendingChanges() {
  console.log("Processing pending changes...")
  const todayDate = getTodayDate()

  chrome.storage.sync.get(["pendingChanges", "limits"], (result) => {
    const pendingChanges = result.pendingChanges || {}
    const limits = result.limits || {}

    // 获取所有应该生效的日期（今天及之前的日期）
    const datesToProcess = Object.keys(pendingChanges).filter((date) => date <= todayDate)

    if (datesToProcess.length === 0) {
      return
    }

    let totalChangesProcessed = 0

    // 处理所有应该生效的日期
    datesToProcess.forEach((date) => {
      const changes = pendingChanges[date] || []
      totalChangesProcessed += changes.length

      changes.forEach((change) => {
        if (change.action === "update" && change.newLimitData) {
          // 应用待生效的更改
          if (limits[change.limitId]) {
            console.log(`Applying pending changes for limit ID: ${change.limitId}`)
            console.log(`Old: ${change.websites.join(", ")}`)
            console.log(`New: ${change.newLimitData.websites.join(", ")}`)

            // 更新限制数据
            limits[change.limitId] = {
              ...limits[change.limitId],
              ...change.newLimitData,
              updatedAt: new Date().toISOString(),
            }
          }
        } else if (change.action === "delete") {
          // 删除限制
          if (limits[change.limitId]) {
            console.log(`Deleting limit for websites: ${change.websites.join(", ")}`)
            delete limits[change.limitId]
          }
        }
      })

      // 清除已处理的日期的待生效更改
      delete pendingChanges[date]
    })

    // 清理过期的待生效更改（超过7天的）
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const year = sevenDaysAgo.getFullYear()
    const month = String(sevenDaysAgo.getMonth() + 1).padStart(2, "0")
    const day = String(sevenDaysAgo.getDate()).padStart(2, "0")
    const sevenDaysAgoString = `${year}-${month}-${day}`

    Object.keys(pendingChanges).forEach((date) => {
      if (date < sevenDaysAgoString) {
        delete pendingChanges[date]
      }
    })

    // 保存更新后的数据
    chrome.storage.sync.set({ limits, pendingChanges }, () => {
      if (chrome.runtime.lastError) {
        console.error("Failed to process pending changes:", chrome.runtime.lastError)
      } else {
        console.log(`Successfully processed ${totalChangesProcessed} pending changes`)
      }
    })
  })
}

// 设置定期清理
setInterval(cleanupExpiredCache, CACHE_CONFIG.CLEANUP_INTERVAL)

// 启动时清理一次
cleanupExpiredCache()
