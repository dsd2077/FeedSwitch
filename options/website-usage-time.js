;(function () {
  // 全局状态管理
  const state = {
    currentDate: new Date(),
    currentWeek: getWeekDatesArray(new Date()),
    weeklyData: {},
    dailyData: {},
    weeklyChart: null,
    dailyChart: null,
  }

  const weeklyDateRange = document.getElementById("weeklyDateRange")
  const dailyDate = document.getElementById("dailyDate")
  // 初始化应用
  function init() {
    document.getElementById("nextDay").disabled = true
    document.getElementById("nextWeek").disabled = true
    initializeDateUI()
    setupEventListeners()
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

      loadDataAndRender()

      if (isThisWeek()) {
        document.getElementById("nextWeek").disabled = true
      }
    })

    document.getElementById("prevDay")?.addEventListener("click", () => {
      state.currentDate = getPreviousDay(state.currentDate)
      updateDateDisplay("dailyDate", state.currentDate)

      // 判断是否需要切换周
      if (!isDateInWeek(state.currentDate, state.currentWeek)) {
        state.currentWeek = getPreviousWeek()
        updateDateDisplay("weeklyDateRange", state.currentWeek)
      }
      loadDataAndRender()
      document.getElementById("nextDay").disabled = false
    })

    document.getElementById("nextDay")?.addEventListener("click", () => {
      state.currentDate = getNextDay(state.currentDate)

      // 判断是否需要切换周
      if (!isDateInWeek(state.currentDate, state.currentWeek)) {
        state.currentWeek = getNextWeek()
        updateDateDisplay("weeklyDateRange", state.currentWeek)
      }

      updateDateDisplay("dailyDate", state.currentDate)
      loadDataAndRender()
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
  }

  // 更新统计信息
  function updateStatistics() {
    // 周统计数据
    document.getElementById("weeklyTotalDuration").textContent = formatDuration(calculateTotalDuration(state.weeklyData))
    document.getElementById("weeklyAverageDuration").textContent = formatDuration(calculateAverageDuration(state.weeklyData))

    // 日统计数据
    document.getElementById("dailyTotalDuration").textContent = formatDuration(calculateTotalDuration(state.dailyData))
    document.getElementById("dailyWebsiteCount").textContent = state.dailyData.length
  }

  function calculateTotalDuration(data) {
    return data.total.reduce((acc, curr) => acc + curr, 0)
  }

  function calculateAverageDuration(data) {
    return Math.round(calculateTotalDuration(data) / data.total.length)
  }

  // 创建/更新图表
  function updateCharts() {
    // 销毁旧图表
    if (state.weeklyChart) {
      state.weeklyChart.destroy()
    }
    if (state.dailyChart) {
      state.dailyChart.destroy()
    }

    // 创建新图表
    const weeklyChartCtx = document.getElementById("weeklyChart")?.getContext("2d")
    const dailyChartCtx = document.getElementById("dailyChart")?.getContext("2d")

    if (weeklyChartCtx) {
      state.weeklyChart = new Chart(weeklyChartCtx, createChartConfig("weekly"))
    }
    if (dailyChartCtx) {
      state.dailyChart = new Chart(dailyChartCtx, createChartConfig("daily"))
    }
  }

  // 创建图表配置
  function createChartConfig(type) {
    const labels = type === "weekly" ? ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] : Array.from({ length: 24 }, (_, i) => i.toString())

    let data = type === "weekly" ? state.weeklyData : state.dailyData

    // 将 daily 数据从秒转换为分钟
    if (type === "daily") {
      data.total = data.total.map((seconds) => Math.round(seconds / 60))
      data.fun = data.fun.map((seconds) => Math.round(seconds / 60))
    }

    // 将 weekly 数据从秒转换为小时
    if (type === "weekly") {
      data.total = data.total.map((seconds) => Math.round((seconds / 3600) * 10) / 10)
      data.fun = data.fun.map((seconds) => Math.round((seconds / 3600) * 10) / 10)
    }

    // 确定“今天”的索引
    let todayIndex = -1
    if (type === "weekly") {
      todayIndex = state.currentWeek.findIndex((date) => isSameDay(date, state.currentDate))
    }

    // 创建“今天”的数据集
    const todayData = Array(data.total.length).fill(0)
    const maxValue = Math.max(...data.total)
    if (todayIndex !== -1) {
      todayData[todayIndex] = maxValue + maxValue * 0.02
    }

    // 判断是否显示纵轴标尺
    const showYAxis = data.total.some((value) => value !== 0)
    // 构建 datasets
    const datasets = [
      {
        label: "娱乐",
        data: data.fun,
        borderWidth: 1,
        backgroundColor: "#ff6b00",
        barPercentage: type === "weekly" ? 0.5 : 0.9,
      },

      {
        label: "专注",
        data: data.total,
        borderWidth: 1,
        backgroundColor: "rgba(0, 200, 83, 0.5)",
        barPercentage: type === "weekly" ? 0.5 : 0.9,
      },
    ]
    // 只在 weekly 图表上添加浅色条形
    if (type === "weekly") {
      datasets.push({
        label: "今天",
        data: todayData,
        borderWidth: 0,
        backgroundColor: "rgba(0, 200, 83, 0.1)", // 浅色条形
        barPercentage: 1, // 更宽的条形
        categoryPercentage: 1,
        showTooltip: true, // 默认为 true，也可以显式设置
      })
    }

    return {
      type: "bar",
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            enabled: false,
          },
          tooltip: {
            // 使用 filter 过滤掉 label 匹配的数据集
            filter: function (tooltipItem) {
              return tooltipItem.dataset.label !== "今天"
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            display: showYAxis,
            grid: {
              display: true,
            },
            ticks: {
              display: true,
              callback: function (value, index, values) {
                return type === "weekly" ? `${value}h` : `${value}m`
              },
              maxTicksLimit: 10, // 最多显示 10 个刻度
            },
          },
          x: {
            grid: {
              display: true, // 移除纵轴的网格线
              drawTicks: true, // 添加小刻线
              tickLength: 10, // 小刻线长度
              drawOnChartArea: false, // 不绘制在图表区域
            },
            barPercentage: 0.3, // 示例：让条形更窄
            categoryPercentage: 0.5, // 可选，用于多数据集的情况
            stacked: true,
          },
        },
      },
      data: {
        labels,
        datasets,
      },
    }
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

  // 初始化应用
  init()
})()
