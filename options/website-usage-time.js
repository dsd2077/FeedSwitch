import psl from "../node_modules/psl/dist/psl.mjs"
;(function () {
  let websitesTimeCache = null
  let faviconCache = null
  let faviconUrls = null

  // 全局状态管理
  const state = {
    currentDate: new Date(),
    currentWeek: getWeekDatesArray(new Date()),
    weeklyData: {},
    dailyData: {},
    weeklyChart: null,
    dailyChart: null,
    // 分页状态
    weeklyPagination: {
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 1,
    },
    dailyPagination: {
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 1,
    },
  }

  const weeklyDateRange = document.getElementById("weeklyDateRange")
  const dailyDate = document.getElementById("dailyDate")

  // 初始化应用
  function init() {
    document.getElementById("nextDay").disabled = true
    document.getElementById("nextWeek").disabled = true
    initializeDateUI()
    setupEventListeners()
    setupPaginationEventListeners()
    loadDataAndRender()
  }

  // 初始化日期UI
  function initializeDateUI() {
    updateDateDisplay("dailyDate", state.currentDate)
    updateDateDisplay("weeklyDateRange", state.currentWeek)
  }

  function updateDateDisplay(type, date) {
    if (type === "dailyDate") {
      dailyDate.textContent = formatDate(date)
    } else {
      weeklyDateRange.textContent = `${formatDate(date[0])} - ${formatDate(date[date.length - 1])}`
    }
  }

  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  // 设置事件监听
  function setupEventListeners() {
    document.getElementById("prevWeek")?.addEventListener("click", () => {
      state.currentWeek = getPreviousWeek()
      const lastDayOfSelectedWeek = state.currentWeek[state.currentWeek.length - 1]
      const today = new Date()
      // 设置 currentDate 为周日 或 今天（如果周日大于今天）
      state.currentDate = lastDayOfSelectedWeek > today ? new Date(today) : new Date(lastDayOfSelectedWeek)
      updateDateDisplay("weeklyDateRange", state.currentWeek)
      updateDateDisplay("dailyDate", state.currentDate)
      document.getElementById("nextWeek").disabled = false
      // 重置分页到第一页
      state.weeklyPagination.currentPage = 1
      loadDataAndRender()
    })

    document.getElementById("nextWeek")?.addEventListener("click", () => {
      state.currentWeek = getNextWeek()
      const lastDayOfSelectedWeek = state.currentWeek[state.currentWeek.length - 1]
      const today = new Date()

      // 设置 currentDate 为周日 或 今天（如果周日大于今天）
      state.currentDate = lastDayOfSelectedWeek > today ? new Date(today) : new Date(lastDayOfSelectedWeek)

      updateDateDisplay("weeklyDateRange", state.currentWeek)
      updateDateDisplay("dailyDate", state.currentDate)

      // 重置分页到第一页
      state.weeklyPagination.currentPage = 1
      loadDataAndRender()

      if (isThisWeek()) {
        document.getElementById("nextWeek").disabled = true
      }
    })

    document.getElementById("prevDay")?.addEventListener("click", () => {
      const previousDate = getPreviousDay(state.currentDate)
      const previousWeek = [...state.currentWeek]
      let weekChanged = false

      // 判断是否需要切换周
      if (!isDateInWeek(previousDate, state.currentWeek)) {
        previousWeek.splice(0, previousWeek.length, ...getPreviousWeek())
        weekChanged = true
      }

      state.currentDate = previousDate
      updateDateDisplay("dailyDate", state.currentDate)

      if (weekChanged) {
        state.currentWeek = previousWeek
        updateDateDisplay("weeklyDateRange", state.currentWeek)
        // 如果周改变了，需要重新加载所有数据
        state.weeklyPagination.currentPage = 1
        loadDataAndRender()
      } else {
        // 如果只是日期改变，只更新图表中"今天"的位置
        updateWeeklyChartTodayPosition()
        // 只更新日数据
        updateDailyDataOnly()
      }

      // 重置日分页到第一页
      state.dailyPagination.currentPage = 1
      document.getElementById("nextDay").disabled = false
    })

    document.getElementById("nextDay")?.addEventListener("click", () => {
      const nextDate = getNextDay(state.currentDate)
      const nextWeek = [...state.currentWeek]
      let weekChanged = false

      // 判断是否需要切换周
      if (!isDateInWeek(nextDate, state.currentWeek)) {
        nextWeek.splice(0, nextWeek.length, ...getNextWeek())
        weekChanged = true
      }

      state.currentDate = nextDate
      updateDateDisplay("dailyDate", state.currentDate)

      if (weekChanged) {
        state.currentWeek = nextWeek
        updateDateDisplay("weeklyDateRange", state.currentWeek)
        // 如果周改变了，需要重新加载所有数据
        state.weeklyPagination.currentPage = 1
        loadDataAndRender()
      } else {
        // 如果只是日期改变，只更新图表中"今天"的位置
        updateWeeklyChartTodayPosition()
        // 只更新日数据
        updateDailyDataOnly()
      }

      // 重置日分页到第一页
      state.dailyPagination.currentPage = 1
      if (isSameDay(state.currentDate, new Date())) {
        document.getElementById("nextDay").disabled = true
      }
    })
  }

  function isThisWeek() {
    const today = new Date()
    const day1 = new Date(today.setDate(today.getDate() - today.getDay()))
    const day2 = state.currentWeek[0]
    return day1.getFullYear() === day2.getFullYear() && day1.getMonth() === day2.getMonth() && day1.getDate() === day2.getDate()
  }

  // 判断日期是否在当前周范围内
  function isDateInWeek(date, weekDates) {
    const targetTime = date.getTime()
    return targetTime >= weekDates[0].getTime() && targetTime <= weekDates[weekDates.length - 1].getTime()
  }

  function getPreviousDay(date) {
    const prevDate = new Date(date)
    prevDate.setDate(prevDate.getDate() - 1)
    return prevDate
  }

  function getNextDay(date) {
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    return nextDate
  }

  function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate()
  }

  // 加载数据并渲染
  function loadDataAndRender() {
    // 为每一天生成 dailyKey
    const dailyKeys = state.currentWeek.map((date) => `hourlyUsage-${getFormattedDate(date)}`)

    // 获取所有相关数据
    chrome.storage.local.get(dailyKeys, (result) => {
      // 聚合周数据（每个元素代表一天的总时长）
      const weeklyDataTotal = state.currentWeek.map((date) => {
        const hourlyUsage = result[`hourlyUsage-${getFormattedDate(date)}`] || {
          total: Array(24).fill(0),
          fun: Array(24).fill(0),
        }
        return hourlyUsage.total.reduce((acc, curr) => acc + curr, 0)
      })
      const weekDataFun = state.currentWeek.map((date) => {
        const hourlyUsage = result[`hourlyUsage-${getFormattedDate(date)}`] || {
          total: Array(24).fill(0),
          fun: Array(24).fill(0),
        }
        return hourlyUsage.fun.reduce((acc, curr) => acc + curr, 0)
      })
      state.weeklyData = {
        total: weeklyDataTotal,
        fun: weekDataFun,
      }

      // 获取当前日期的 daily 数据
      state.dailyData = result[`hourlyUsage-${getFormattedDate(state.currentDate)}`] || {
        total: Array(24).fill(0), // 总时间数组
        fun: Array(24).fill(0), // 娱乐时间数组
      }

      // 更新统计信息和图表
      updateStatistics()
      updateCharts()
    })

    // 更新每日网站列表
    const dailyWebsiteList = document.getElementById("daily-website-list")
    updateWebsiteList(dailyWebsiteList, state.currentDate, "daily")

    // 更新周网站列表
    const weeklyWebsiteList = document.getElementById("weekly-website-list")
    updateWebsiteList(weeklyWebsiteList, state.currentWeek, "weekly")
  }

  // 更新统计信息
  function updateStatistics() {
    // 周统计数据
    document.getElementById("weeklyTotalDuration").textContent = formatDuration(calculateTotalDuration(state.weeklyData))
    document.getElementById("weeklyAverageDuration").textContent = formatDuration(calculateAverageDuration(state.weeklyData))

    // 日统计数据
    document.getElementById("dailyTotalDuration").textContent = formatDuration(calculateTotalDuration(state.dailyData))
    document.getElementById("dailyFunDuration").textContent = formatDuration(calculateTotalFunDuration(state.dailyData))
  }

  function calculateTotalDuration(data) {
    return data.total.reduce((acc, curr) => acc + curr, 0)
  }

  function calculateAverageDuration(data) {
    return Math.round(calculateTotalDuration(data) / data.total.length)
  }

  function calculateTotalFunDuration(data) {
    return data.fun.reduce((acc, curr) => acc + curr, 0)
  }

  // 等待ECharts加载
  function waitForECharts() {
    return new Promise((resolve) => {
      if (typeof window.echarts !== "undefined") {
        resolve()
        return
      }

      const checkEcharts = () => {
        if (typeof window.echarts !== "undefined") {
          resolve()
        } else {
          setTimeout(checkEcharts, 50)
        }
      }
      checkEcharts()
    })
  }

  // 创建/更新图表
  async function updateCharts() {
    // 销毁旧图表
    if (state.weeklyChart) {
      state.weeklyChart.dispose()
    }
    if (state.dailyChart) {
      state.dailyChart.dispose()
    }

    // 等待ECharts加载完成
    await waitForECharts()

    // 创建新图表
    const weeklyChartElement = document.getElementById("weeklyChart")
    const dailyChartElement = document.getElementById("dailyChart")

    if (weeklyChartElement) {
      state.weeklyChart = window.echarts.init(weeklyChartElement)
      state.weeklyChart.setOption(createEChartsConfig("weekly"))
    }
    if (dailyChartElement) {
      state.dailyChart = window.echarts.init(dailyChartElement)
      state.dailyChart.setOption(createEChartsConfig("daily"))
    }
  }

  // 只更新周图表中"今天"的位置
  function updateWeeklyChartTodayPosition() {
    if (!state.weeklyChart) return

    // 确定"今天"的索引
    const todayIndex = state.currentWeek.findIndex((date) => isSameDay(date, state.currentDate))

    if (todayIndex === -1) return

    // 更新图表配置
    const option = createEChartsConfig("weekly")
    state.weeklyChart.setOption(option)
  }

  // 只更新日数据（不重新加载周数据）
  async function updateDailyDataOnly() {
    // 获取当前日期的数据
    const dailyKey = `hourlyUsage-${getFormattedDate(state.currentDate)}`

    chrome.storage.local.get([dailyKey], async (result) => {
      state.dailyData = result[dailyKey] || {
        total: Array(24).fill(0),
        fun: Array(24).fill(0),
      }

      // 更新日统计信息
      document.getElementById("dailyTotalDuration").textContent = formatDuration(calculateTotalDuration(state.dailyData))
      document.getElementById("dailyFunDuration").textContent = formatDuration(calculateTotalFunDuration(state.dailyData))

      // 更新日图表
      if (state.dailyChart) {
        state.dailyChart.dispose()
      }
      const dailyChartElement = document.getElementById("dailyChart")
      if (dailyChartElement) {
        // 等待ECharts加载完成
        await waitForECharts()
        state.dailyChart = window.echarts.init(dailyChartElement)
        state.dailyChart.setOption(createEChartsConfig("daily"))
      }

      // 更新日网站列表
      const dailyWebsiteList = document.getElementById("daily-website-list")
      updateWebsiteList(dailyWebsiteList, state.currentDate, "daily")
    })
  }

  // 创建ECharts配置
  function createEChartsConfig(type) {
    const labels = type === "weekly" ? chrome.i18n.getMessage("chartLabelWeekdays").split(",") : Array.from({ length: 24 }, (_, i) => i.toString())

    let data = type === "weekly" ? state.weeklyData : state.dailyData

    // 保存原始数据用于tooltip计算
    const originalData = {
      total: [...data.total],
      fun: [...data.fun],
    }

    // 将 daily 数据从秒转换为分钟
    if (type === "daily") {
      data = {
        total: data.total.map((seconds) => Math.round(seconds / 60)),
        fun: data.fun.map((seconds) => Math.round(seconds / 60)),
      }
    }

    // 将 weekly 数据从秒转换为小时
    if (type === "weekly") {
      data = {
        total: data.total.map((seconds) => Math.round((seconds / 3600) * 100) / 100),
        fun: data.fun.map((seconds) => Math.round((seconds / 3600) * 100) / 100),
      }
    }

    // 计算专注时长（总时长 - 娱乐时长）
    const focusData = data.total.map((total, index) => Math.max(0, total - data.fun[index]))

    // 确定"今天"的索引
    let todayIndex = -1
    if (type === "weekly") {
      todayIndex = state.currentWeek.findIndex((date) => isSameDay(date, state.currentDate))
    }

    const option = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: function (params) {
          const index = params[0].dataIndex

          if (type === "weekly") {
            const date = state.currentWeek[index]
            const title = formatDate(date)
            const totalValue = originalData.total[index]
            const funValue = originalData.fun[index]
            const focusValue = totalValue - funValue

            return (
              `${title}<br/>` +
              `${chrome.i18n.getMessage("funLabel")}: ${formatTimeForTooltip(funValue)}<br/>` +
              `${chrome.i18n.getMessage("focusLabel")}: ${formatTimeForTooltip(focusValue)}<br/>` +
              `总计: ${formatTimeForTooltip(totalValue)}`
            )
          } else {
            const title = `${params[0].name}:00`
            const totalValue = originalData.total[index]
            const funValue = originalData.fun[index]
            const focusValue = totalValue - funValue

            return (
              `${title}<br/>` +
              `${chrome.i18n.getMessage("funLabel")}: ${formatTimeForTooltip(funValue)}<br/>` +
              `${chrome.i18n.getMessage("focusLabel")}: ${formatTimeForTooltip(focusValue)}<br/>` +
              `总计: ${formatTimeForTooltip(totalValue)}`
            )
          }
        },
      },
      legend: {
        data: [chrome.i18n.getMessage("focusLabel"), chrome.i18n.getMessage("funLabel")],
        bottom: 0,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLine: {
          show: true,
        },
        axisTick: {
          show: true,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: function (value) {
            return type === "weekly" ? `${value}h` : `${value}m`
          },
        },
        splitLine: {
          show: true,
        },
      },
      series: [],
    }

    // 添加娱乐时长系列
    option.series.push({
      name: chrome.i18n.getMessage("funLabel"),
      type: "bar",
      stack: "total",
      data: data.fun,
      itemStyle: {
        color: "#ff6b00",
      },
      barMaxWidth: type === "weekly" ? 40 : 20,
    })

    // 添加专注时长系列
    option.series.push({
      name: chrome.i18n.getMessage("focusLabel"),
      type: "bar",
      stack: "total",
      data: focusData,
      itemStyle: {
        color: "rgba(0, 200, 83, 0.8)",
      },
      barMaxWidth: type === "weekly" ? 40 : 20,
    })

    // 在周图表中添加"今天"指示器 - 使用 markArea
    if (type === "weekly" && todayIndex !== -1) {
      // 为专注时长系列添加 markArea（假设这是第一个系列）
      const focusSeriesIndex = option.series.findIndex((s) => s.name === chrome.i18n.getMessage("focusLabel"))
      if (focusSeriesIndex !== -1) {
        option.series[focusSeriesIndex].markArea = {
          silent: true,
          itemStyle: {
            color: "rgba(0, 200, 83, 0.08)",
            borderColor: "rgba(0, 200, 83, 0.2)",
            borderWidth: 1,
          },
          data: [[{ xAxis: todayIndex - 0.4 }, { xAxis: todayIndex + 0.4 }]],
        }
      }
    }

    return option
  }

  // 日期工具函数
  function formatDate(date) {
    const d = new Date(date)
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`
  }

  function getFormattedDate(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0") // 月份从0开始，需要+1并补零
    const day = String(d.getDate()).padStart(2, "0") // 日期补零

    return `${year}-${month}-${day}`
  }

  // 获取一周所有日期数组
  function getWeekDatesArray(date) {
    const today = new Date(date)
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()))

    const dates = []
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(firstDay)
      currentDate.setDate(firstDay.getDate() + i)
      dates.push(currentDate)
    }
    return dates
  }

  function getPreviousWeek() {
    const firstDay = state.currentWeek[0]
    // 返回上一周范围
    const date = new Date(firstDay)
    date.setDate(date.getDate() - 7)
    return getWeekDatesArray(date)
  }

  function getNextWeek() {
    const firstDay = state.currentWeek[0]

    // 返回下一周范围
    const date = new Date(firstDay)
    date.setDate(date.getDate() + 7)
    return getWeekDatesArray(date)
  }

  function updateWebsiteList(websiteList, dateOrDates, type = "daily") {
    if (type === "daily") {
      // 单日数据处理
      const websitesTimeKey = generateWebsitesTimeKey(dateOrDates)
      chrome.storage.local.get([websitesTimeKey, "faviconCache", "faviconUrls"], (result) => {
        websitesTimeCache = result[websitesTimeKey] || {} // 缓存数据
        faviconCache = result.faviconCache || {}
        faviconUrls = result.faviconUrls || {}
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
    } else if (type === "weekly") {
      // 周数据处理 - 需要聚合多天的数据
      const websitesTimeKeys = dateOrDates.map((date) => generateWebsitesTimeKey(date))
      const allKeys = [...websitesTimeKeys, "faviconCache", "faviconUrls"]

      chrome.storage.local.get(allKeys, (result) => {
        faviconCache = result.faviconCache || {}
        faviconUrls = result.faviconUrls || {}

        // 聚合一周的数据
        const aggregatedData = {}
        websitesTimeKeys.forEach((key) => {
          const dayData = result[key] || {}
          // 遍历每天的数据并聚合
          Object.entries(dayData).forEach(([mainDomain, subDomains]) => {
            if (!aggregatedData[mainDomain]) {
              aggregatedData[mainDomain] = {}
            }
            // 聚合子域名数据
            Object.entries(subDomains).forEach(([subDomain, pages]) => {
              if (!aggregatedData[mainDomain][subDomain]) {
                aggregatedData[mainDomain][subDomain] = {}
              }
              // 聚合页面数据
              Object.entries(pages).forEach(([pageUrl, pageInfo]) => {
                if (!aggregatedData[mainDomain][subDomain][pageUrl]) {
                  aggregatedData[mainDomain][subDomain][pageUrl] = {
                    time: 0,
                    funTime: 0,
                    title: pageInfo.title,
                  }
                }
                aggregatedData[mainDomain][subDomain][pageUrl].time += pageInfo.time || 0
                aggregatedData[mainDomain][subDomain][pageUrl].funTime += pageInfo.funTime || 0
              })
            })
          })
        })

        websitesTimeCache = aggregatedData
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

    // 从容器元素的 id 判断是 weekly 还是 daily
    const type = websiteList.id === "weekly-website-list" ? "weekly" : "daily"

    // 为两种类型都应用分页
    renderPaginatedWebsiteList(websiteList, domains, maxTotalTime, type)
  }

  // 渲染分页的网站列表
  function renderPaginatedWebsiteList(websiteList, domains, maxTotalTime, type) {
    // 获取对应的分页状态
    const pagination = type === "weekly" ? state.weeklyPagination : state.dailyPagination

    // 更新分页状态
    pagination.totalItems = domains.length
    pagination.totalPages = Math.ceil(domains.length / pagination.itemsPerPage)

    // 确保当前页不超出范围
    if (pagination.currentPage > pagination.totalPages) {
      pagination.currentPage = Math.max(1, pagination.totalPages)
    }

    // 计算当前页的数据范围
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
    const endIndex = startIndex + pagination.itemsPerPage
    const currentPageDomains = domains.slice(startIndex, endIndex)

    // 渲染当前页的域名
    currentPageDomains.forEach((domain) => {
      const domainElement = createDomainElement(domain, maxTotalTime)
      domainElement.dataset.type = type
      websiteList.appendChild(domainElement)
    })

    // 更新分页控件
    updatePaginationControls(type)
  }

  // 更新分页控件
  function updatePaginationControls(type) {
    const pagination = type === "weekly" ? state.weeklyPagination : state.dailyPagination
    const prefix = type === "weekly" ? "weekly" : "daily"

    const paginationContainer = document.getElementById(`${prefix}-pagination`)
    const pageInfo = document.getElementById(`${prefix}-page-info`)
    const prevBtn = document.getElementById(`${prefix}-prev-page`)
    const nextBtn = document.getElementById(`${prefix}-next-page`)

    // 如果只有一页或没有数据，隐藏分页控件
    if (pagination.totalPages <= 1) {
      if (paginationContainer) {
        paginationContainer.classList.add("hidden")
      }
      return
    }

    // 显示分页控件
    if (paginationContainer) {
      paginationContainer.classList.remove("hidden")
    }

    if (pageInfo) {
      pageInfo.textContent = `第 ${pagination.currentPage} 页，共 ${pagination.totalPages} 页`
    }

    if (prevBtn) {
      prevBtn.disabled = pagination.currentPage <= 1
    }

    if (nextBtn) {
      nextBtn.disabled = pagination.currentPage >= pagination.totalPages
    }
  }

  // 分页事件处理
  function setupPaginationEventListeners() {
    // 设置周分页事件监听器
    setupTypeSpecificPaginationListeners("weekly")
    // 设置日分页事件监听器
    setupTypeSpecificPaginationListeners("daily")
  }

  // 设置特定类型的分页事件监听器
  function setupTypeSpecificPaginationListeners(type) {
    const prevBtn = document.getElementById(`${type}-prev-page`)
    const nextBtn = document.getElementById(`${type}-next-page`)
    const pagination = type === "weekly" ? state.weeklyPagination : state.dailyPagination

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (pagination.currentPage > 1) {
          pagination.currentPage--
          // 重新渲染对应的网站列表
          const websiteList = document.getElementById(`${type}-website-list`)
          const dateData = type === "weekly" ? state.currentWeek : state.currentDate
          updateWebsiteList(websiteList, dateData, type)
        }
      })
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (pagination.currentPage < pagination.totalPages) {
          pagination.currentPage++
          // 重新渲染对应的网站列表
          const websiteList = document.getElementById(`${type}-website-list`)
          const dateData = type === "weekly" ? state.currentWeek : state.currentDate
          updateWebsiteList(websiteList, dateData, type)
        }
      })
    }
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

    return `
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

      // 获取数据类型
      const dataType = domainElement.dataset.type || "daily"

      fetchSubDomainData(domain.mainDomain, dataType).then((subDomains) => {
        const sortedSubDomains = sortSubDomains(subDomains)
        renderSubDomains(domainElement, sortedSubDomains)

        // 如果只有一个子域名，自动展开它
        if (sortedSubDomains.length === 1) {
          const subDomainItem = domainElement.querySelector(".subdomain-item")
          if (subDomainItem) {
            subDomainItem.classList.add("active")
            const subDomain = sortedSubDomains[0].subDomain
            fetchPageData(subDomain, dataType).then((pages) => {
              const sortedPages = sortPages(pages)
              renderPages(subDomainItem, sortedPages)
            })
          }
        }
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
  function fetchSubDomainData(mainDomain, dataType = "daily") {
    return new Promise((resolve) => {
      // 对于周数据，websitesTimeCache 已经包含了聚合后的数据
      if (dataType === "weekly" && websitesTimeCache && websitesTimeCache[mainDomain]) {
        resolve(websitesTimeCache[mainDomain])
      } else if (dataType === "daily") {
        // 对于日数据，需要重新获取当前日期的数据
        const websitesTimeKey = generateWebsitesTimeKey(state.currentDate)
        chrome.storage.local.get([websitesTimeKey], (result) => {
          const dayCache = result[websitesTimeKey] || {}
          resolve(dayCache[mainDomain] || {})
        })
      } else {
        resolve({})
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
    // 创建一个容器来包含所有子域名
    const subdomainContainer = document.createElement("ul")
    subdomainContainer.className = "subdomain-list expanded"

    subDomains.forEach(({ subDomain, time }) => {
      const subDomainItem = createSubDomainItem(subDomain, time)
      setupSubDomainItemListener(subDomainItem, subDomain)
      subdomainContainer.appendChild(subDomainItem)
    })

    domainElement.appendChild(subdomainContainer)
  }

  // 创建子域名项元素
  function createSubDomainItem(subDomain, time) {
    const subDomainItem = document.createElement("li")
    subDomainItem.className = "subdomain-item"

    subDomainItem.innerHTML = `
      <div class="subdomain-info">
        <span class="subdomain-name">${subDomain}</span>
        <span class="subdomain-time">${formatTime(time)}</span>
      </div>
    `

    return subDomainItem
  }

  // 设置子域名项点击事件
  function setupSubDomainItemListener(subDomainItem, subDomain) {
    subDomainItem.addEventListener("click", (event) => {
      event.stopPropagation()
      subDomainItem.classList.toggle("active")

      if (subDomainItem.querySelector(".page-list")) {
        subDomainItem.querySelector(".page-list").classList.toggle("expanded")
        return
      }

      // 获取数据类型（从父元素向上查找）
      const domainListElement = subDomainItem.closest(".domain-list")
      const dataType = domainListElement ? domainListElement.dataset.type : "daily"

      fetchPageData(subDomain, dataType).then((pages) => {
        const sortedPages = sortPages(pages)
        renderPages(subDomainItem, sortedPages)
      })
    })
  }

  // 获取页面数据
  function fetchPageData(subDomain, dataType = "daily") {
    return new Promise((resolve) => {
      const mainDomain = parseDomain(subDomain)

      if (dataType === "weekly" && websitesTimeCache && websitesTimeCache[mainDomain]?.[subDomain]) {
        // 对于周数据，直接使用缓存的聚合数据
        resolve(websitesTimeCache[mainDomain][subDomain])
      } else if (dataType === "daily") {
        // 对于日数据，重新获取当前日期的数据
        const websitesTimeKey = generateWebsitesTimeKey(state.currentDate)
        chrome.storage.local.get([websitesTimeKey], (result) => {
          const dayCache = result[websitesTimeKey] || {}
          resolve(dayCache[mainDomain]?.[subDomain] || {})
        })
      } else {
        resolve({})
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

    // 为页面链接添加点击事件，阻止事件冒泡
    const pageLink = pageItem.querySelector(".page-title")
    if (pageLink) {
      pageLink.addEventListener("click", (event) => {
        event.stopPropagation()
        // 让链接正常工作（打开新页面），但阻止事件冒泡到父级
      })
    }

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

  // 格式化时间为 xxhxxm 格式（用于tooltip）
  function formatTimeForTooltip(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return "0m"
    }
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

  // 初始化应用
  init()
})()
