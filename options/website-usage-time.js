// ;(function () {
//   // 获取数据
//   chrome.storage.local.get(["weeklyUsage", "dailyUsage"], (result) => {
//     const weeklyUsage = result.weeklyUsage || {}
//     const dailyUsage = result.dailyUsage || {}

//     // 处理数据
//     const weeklyLabels = Object.keys(weeklyUsage).reverse()
//     const weeklyData = weeklyLabels.map((label) => weeklyUsage[label])
//     const dailyLabels = Object.keys(dailyUsage)
//     const dailyData = dailyLabels.map((label) => dailyUsage[label])

//     // 集中管理DOM元素
//     const dateElements = {
//       weeklyDateRange: document.getElementById("weeklyDateRange"),
//       dailyDate: document.getElementById("dailyDate")
//     };

//     const statsElements = {
//       weeklyTotalDuration: document.getElementById("weeklyTotalDuration"),
//       weeklyAverageDuration: document.getElementById("weeklyAverageDuration"),
//       dailyTotalDuration: document.getElementById("dailyTotalDuration"),
//       dailyWebsiteCount: document.getElementById("dailyWebsiteCount")
//     };

//     // 更新日期信息
//     if (dateElements.weeklyDateRange) {
//       dateElements.weeklyDateRange.textContent = getCurrentWeekRange();
//     }
//     if (dateElements.dailyDate) {
//       dateElements.dailyDate.textContent = getCurrentDate();
//     }

//     // 更新统计信息
//     if (statsElements.weeklyTotalDuration) {
//       statsElements.weeklyTotalDuration.textContent = formatDuration(calculateTotalDuration(weeklyData));
//     }
//     if (statsElements.weeklyAverageDuration) {
//       statsElements.weeklyAverageDuration.textContent = formatDuration(calculateAverageDuration(weeklyData));
//     }
//     if (statsElements.dailyTotalDuration) {
//       statsElements.dailyTotalDuration.textContent = formatDuration(dailyData.reduce((acc, curr) => acc + curr, 0));
//     }
//     if (statsElements.dailyWebsiteCount) {
//       statsElements.dailyWebsiteCount.textContent = dailyData.length;
//     }

//     // 图表配置
//     const chartConfig = {
//       type: "bar",
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         scales: {
//           y: { beginAtZero: true }
//         }
//       }
//     };

//     // 创建图表
//     if (document.getElementById("weeklyChart")) {
//       const weeklyChartCtx = document.getElementById("weeklyChart").getContext("2d");
//       new Chart(weeklyChartCtx, {
//         ...chartConfig,
//         data: {
//           labels: weeklyLabels,
//           datasets: [{
//             data: weeklyData,
//             backgroundColor: "rgba(75, 192, 192, 0.2)",
//             borderColor: "rgba(75, 192, 192, 1)",
//             borderWidth: 1
//           }]
//         }
//       });
//     }

//     if (document.getElementById("dailyChart")) {
//       const dailyChartCtx = document.getElementById("dailyChart").getContext("2d");
//       new Chart(dailyChartCtx, {
//         ...chartConfig,
//         data: {
//           labels: dailyLabels,
//           datasets: [{
//             data: dailyData,
//             backgroundColor: "rgba(75, 192, 192, 0.2)",
//             borderColor: "rgba(75, 192, 192, 1)",
//             borderWidth: 1
//           }]
//         }
//       });
//     }
//   });

//   // 辅助函数
//   function formatDuration(seconds) {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;
//     return `${hours}h ${minutes}m ${secs}s`;
//   }

//   function calculateTotalDuration(data) {
//     return data.reduce((acc, curr) => acc + curr, 0);
//   }

//   function calculateAverageDuration(data) {
//     return calculateTotalDuration(data) / data.length;
//   }

//   function getCurrentDate() {
//     const today = new Date();
//     const month = String(today.getMonth() + 1).padStart(2, '0');
//     const day = String(today.getDate()).padStart(2, '0');
//     return `${month}/${day}`;
//   }

//   function getCurrentWeekRange() {
//     const today = new Date();
//     const firstDayOfWeek = new Date(today);
//     firstDayOfWeek.setDate(today.getDate() - today.getDay());
//     const lastDayOfWeek = new Date(firstDayOfWeek);
//     lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

//     const formatDate = (date) => {
//       const month = String(date.getMonth() + 1).padStart(2, '0');
//       const day = String(date.getDate()).padStart(2, '0');
//       return `${month}/${day}`;
//     };

//     return `${formatDate(firstDayOfWeek)} - ${formatDate(lastDayOfWeek)}`;
//   }
// })()

// website-usage-time.js
;(function () {
  // 全局状态管理
  const state = {
    currentDate: new Date(),
    currentWeek: getCurrentWeekRange(new Date()),
    weeklyData: [],
    dailyData: [],
    weeklyChart: null,
    dailyChart: null,
  }

  const weeklyDateRange = document.getElementById("weeklyDateRange")
  const dailyDate = document.getElementById("dailyDate")
  // 初始化应用
  function init() {
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
      weeklyDateRange.textContent = date
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
      state.currentWeek = getPreviousWeek(state.currentWeek)
      updateDateDisplay("weeklyDateRange", state.currentWeek)
      loadDataAndRender()
    })

    document.getElementById("nextWeek")?.addEventListener("click", () => {
      state.currentWeek = getNextWeek(state.currentWeek)
      updateDateDisplay("weeklyDateRange", state.currentWeek)
      loadDataAndRender()
    })

    document.getElementById("prevDay")?.addEventListener("click", () => {
      state.currentDate = getPreviousDay(state.currentDate)
      updateDateDisplay("dailyDate", state.currentDate)
      loadDataAndRender()
    })

    document.getElementById("nextDay")?.addEventListener("click", () => {
      state.currentDate = getNextDay(state.currentDate)
      updateDateDisplay("dailyDate", state.currentDate)
      loadDataAndRender()
    })
  }

  function getPreviousDay(date) {
    const prevDate = new Date(date)
    prevDate.setDate(prevDate.getDate() - 1)
    return formatDate(prevDate)
  }

  function getNextDay(date) {
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    return formatDate(nextDate)
  }

  // 加载数据并渲染
  function loadDataAndRender() {
    // 模拟数据键生成逻辑（需要根据实际存储结构调整）
    const weeklyKey = `weeklyUsage-${getTodayDate()}`
    const dailyKey = `hourlyUsage-${getTodayDate(state.currentDate)}`

    chrome.storage.local.get([weeklyKey, dailyKey], (result) => {
      // 数据处理
      state.weeklyData = processWeeklyData(result[weeklyKey] || {})
      state.dailyData = result[dailyKey] || Array(24).fill(0)

      console.log("Weekly Data:", state.weeklyData)
      console.log("Daily Data:", state.dailyData)

      // 更新统计信息
      updateStatistics()

      // 更新图表
      updateCharts()
    })
  }

  // 处理周数据
  function processWeeklyData(data) {
    // 根据当前周范围过滤/处理数据
    const weekDates = getWeekDates(state.currentWeek)
    return weekDates.map((date) => data[date] || 0)
  }

  // 处理日数据
  function processDailyData(data) {
    // 返回扁平化的分钟数数组
    return Object.values(data)
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
            backgroundColor: [
              "rgba(255, 99, 132, 0.2)",
              "rgba(255, 159, 64, 0.2)",
              "rgba(255, 205, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(153, 102, 255, 0.2)",
              "rgba(201, 203, 207, 0.2)",
            ],
            borderColor: [
              "rgb(255, 99, 132)",
              "rgb(255, 159, 64)",
              "rgb(255, 205, 86)",
              "rgb(75, 192, 192)",
              "rgb(54, 162, 235)",
              "rgb(153, 102, 255)",
              "rgb(201, 203, 207)",
            ],
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

  function getTodayDate(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0") // 月份从0开始，需要+1并补零
    const day = String(d.getDate()).padStart(2, "0") // 日期补零

    return `${year}-${month}-${day}`
  }

  function getCurrentWeekRange(date) {
    // 返回当前周的起始日期范围
    const today = new Date(date)
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay() + 1))
    const lastDay = new Date(today.setDate(firstDay.getDate() + 6))
    return `${formatDate(firstDay)} - ${formatDate(lastDay)}`
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

  function getPreviousWeek(weekRange) {
    // 返回上一周范围
    const [start] = weekRange.split(" - ")
    const date = new Date(start)
    date.setDate(date.getDate() - 7)
    return getCurrentWeekRange(date)
  }

  function getNextWeek(weekRange) {
    // 返回下一周范围
    const [start] = weekRange.split(" - ")
    const date = new Date(start)
    date.setDate(date.getDate() + 7)
    return getCurrentWeekRange(date)
  }

  // 初始化应用
  init()
})()
