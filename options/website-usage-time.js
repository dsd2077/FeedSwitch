;(function () {
  // 全局状态管理
  const state = {
    currentDate: new Date(),
    currentWeek: getWeekDatesArray(new Date()),
    weeklyData: [],
    dailyData: [],
    weeklyChart: null,
    dailyChart: null,
  }

  const weeklyDateRange = document.getElementById("weeklyDateRange")
  const dailyDate = document.getElementById("dailyDate")
  // 初始化应用
  function init() {
    document.getElementById("nextDay").disabled = true
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
      updateDateDisplay("weeklyDateRange", state.currentWeek)
      loadDataAndRender()
    })

    document.getElementById("nextWeek")?.addEventListener("click", () => {
      state.currentWeek = getNextWeek()
      updateDateDisplay("weeklyDateRange", state.currentWeek)
      loadDataAndRender()
    })

    document.getElementById("prevDay")?.addEventListener("click", () => {
      state.currentDate = getPreviousDay(state.currentDate)
      updateDateDisplay("dailyDate", state.currentDate)
      loadDataAndRender()
      document.getElementById("nextDay").disabled = false
    })

    document.getElementById("nextDay")?.addEventListener("click", () => {
      state.currentDate = getNextDay(state.currentDate)
      updateDateDisplay("dailyDate", state.currentDate)
      loadDataAndRender()
      if (isToday(state.currentDate)) {
        document.getElementById("nextDay").disabled = true
      }
    })
  }

  function getPreviousDay(date) {
    const prevDate = new Date(date)
    prevDate.setDate(prevDate.getDate() - 1)
    return prevDate
  }

  function isToday(date) {
    const today = new Date()
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
  }
  function getNextDay(date) {
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    return nextDate
  }

  // 加载数据并渲染
  function loadDataAndRender() {
    // 为每一天生成 dailyKey
    const dailyKeys = state.currentWeek.map((date) => `hourlyUsage-${getFormattedDate(date)}`)

    // 获取所有相关数据
    chrome.storage.local.get(dailyKeys, (result) => {
      // 聚合周数据（每个元素代表一天的总时长）
      state.weeklyData = state.currentWeek.map((date) => {
        const dayData = result[`hourlyUsage-${getFormattedDate(date)}`] || []
        return dayData.reduce((acc, curr) => acc + curr, 0)
      })

      // 获取当前日期的 daily 数据
      state.dailyData = result[`hourlyUsage-${getFormattedDate(state.currentDate)}`] || Array(24).fill(0)

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
    return data.reduce((acc, curr) => acc + curr, 0)
  }

  function calculateAverageDuration(data) {
    return calculateTotalDuration(data) / data.length
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
      data = data.map((seconds) => seconds / 60)
    }

    // 将 weekly 数据从秒转换为小时
    if (type === "weekly") {
      data = data.map((seconds) => seconds / 3600)
    }

    // 判断是否显示纵轴标尺
    const showYAxis = data.some((value) => value !== 0)

    return {
      type: "bar",
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
              offset: true,
            },
          },
        },
      },
      data: {
        labels,
        datasets: [
          {
            label: type === "weekly" ? "使用时长（小时）" : "使用时长（分钟）",
            data,
            borderWidth: 1,
          },
        ],
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
  function getWeekDates(weekRange) {
    // 根据周范围返回所有日期
    const [start, end] = weekRange.split(" - ")
    const dates = []
    const currentDate = new Date(start)
    while (currentDate <= new Date(end)) {
      dates.push(formatDate(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }

  function getPreviousWeek() {
    const firstDay = state.weekRange[0]
    // 返回上一周范围
    const date = new Date(firstDay)
    date.setDate(date.getDate() - 7)
    return getWeekDatesArray(date)
  }

  function getNextWeek() {
    const firstDay = state.weekRange[0]

    // 返回下一周范围
    const date = new Date(firstDay)
    date.setDate(date.getDate() + 7)
    return getWeekDatesArray(date)
  }

  // 初始化应用
  init()
})()
