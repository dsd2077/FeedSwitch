import { SITE_CONFIG } from "../scripts/config.js"
;(function () {
  var limitsContainer = document.getElementById("limits-container")
  var modal = document.getElementById("add-limit-modal")
  var websitesContainer = document.querySelector(".added-websites")
  // var addBtn = document.getElementById("add-website-btn")
  const addLimitBtn = document.getElementById("add-limit-btn")
  const span = modal.querySelector(".close")
  const saveBtn = document.getElementById("save-limit-btn")
  const websiteInput = document.getElementById("website-input")
  const suggestionsDiv = document.getElementById("suggestions")
  const suggestionList = Object.keys(SITE_CONFIG)

  // 自定义时间模态窗口相关元素
  const customTimeModal = document.getElementById("custom-time-modal")
  const customTimeBtn = document.getElementById("custom-time-btn")
  const customTimeClose = document.getElementById("custom-time-close")
  const cancelCustomTime = document.getElementById("cancel-custom-time")
  const saveCustomTime = document.getElementById("save-custom-time")
  const dailyOption = document.getElementById("daily-option")
  const customOption = document.getElementById("custom-option")
  const dailyLimitInput = document.getElementById("daily-limit")
  const deleteLimitBtn = document.getElementById("delete-limit-btn")

  // 存储自定义时间设置
  let customTimeSettings = {
    sunday: 0,
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
  }

  // 延迟生效相关变量和函数
  const modalWarning = document.getElementById("modal-warning")

  // 检查网站是否已存在的函数
  function isWebsiteAlreadyAdded(website) {
    const existingWebsites = Array.from(document.querySelectorAll('[name="websites"]')).map((input) => input.value)
    return existingWebsites.includes(website)
  }

  // 添加网站标签的函数
  function addWebsiteTag(website) {
    // 检查是否重复
    if (isWebsiteAlreadyAdded(website)) {
      return false
    }

    const tag = document.createElement("div")
    tag.className = "website-tag"
    tag.innerHTML = `
      ${website}
      <button class="remove-tag-btn">×</button>
      <input type="hidden" name="websites" value="${website}">
    `
    websitesContainer.appendChild(tag)

    // 重新显示建议以更新选中状态
    updateSuggestionDisplay()

    return true
  }

  // 更新建议显示的函数
  function updateSuggestionDisplay() {
    const input = websiteInput.value.toLowerCase()
    let matches

    if (input.length > 0) {
      matches = suggestionList.filter((item) => item.toLowerCase().includes(input))
    } else {
      matches = suggestionList
    }

    showSuggestions(matches)
  }

  // 获取今天是星期几的索引 (0=Sunday, 1=Monday, ..., 6=Saturday)
  function getTodayIndex() {
    return new Date().getDay()
  }

  // 获取今天的星期名称
  function getTodayName() {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    return dayNames[getTodayIndex()]
  }

  // 获取明天的日期字符串 (YYYY-MM-DD)
  function getTomorrowDateString() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split("T")[0]
  }

  // 检查是否增加了当天的使用时间
  function isIncreasingTodayTime(existingLimit, newLimitData) {
    if (!existingLimit) return false

    const todayName = getTodayName()
    let oldTodayLimit = 0
    let newTodayLimit = 0

    // 获取旧的今日限制
    if (existingLimit.timeType === "daily") {
      oldTodayLimit = existingLimit.dailyLimit || 0
    } else if (existingLimit.timeType === "custom" && existingLimit.customLimits) {
      oldTodayLimit = existingLimit.customLimits[todayName] || 0
    }

    // 获取新的今日限制
    if (newLimitData.timeType === "daily") {
      newTodayLimit = newLimitData.dailyLimit || 0
    } else if (newLimitData.timeType === "custom" && newLimitData.customLimits) {
      newTodayLimit = newLimitData.customLimits[todayName] || 0
    }

    return newTodayLimit > oldTodayLimit
  }

  // 检查是否删除了网站
  function isRemovingWebsites(existingLimit, newLimitData) {
    if (!existingLimit) return false

    const oldWebsites = new Set(existingLimit.websites || [])
    const newWebsites = new Set(newLimitData.websites || [])

    // 检查是否有网站被删除
    for (const website of oldWebsites) {
      if (!newWebsites.has(website)) {
        return true
      }
    }
    return false
  }

  // 检查是否有任何需要延迟生效的更改
  function hasDelayedChanges(existingLimit, newLimitData) {
    if (!existingLimit) return false
    return isIncreasingTodayTime(existingLimit, newLimitData) || isRemovingWebsites(existingLimit, newLimitData)
  }

  // 添加待生效的更改
  function addPendingChange(action, limitData, newLimitData = null) {
    const tomorrowDate = getTomorrowDateString()

    chrome.storage.sync.get(["pendingChanges"], (result) => {
      const pendingChanges = result.pendingChanges || {}
      if (!pendingChanges[tomorrowDate]) {
        pendingChanges[tomorrowDate] = []
      }

      const changeRecord = {
        action: action,
        limitId: limitData.id,
        websites: limitData.websites,
        timestamp: new Date().toISOString(),
        ...(newLimitData && { newLimitData }), // 保存新的限制数据用于次日应用
      }

      // 避免重复添加相同的更改，按limitId查找
      const existingIndex = pendingChanges[tomorrowDate].findIndex((change) => change.limitId === limitData.id)

      if (existingIndex >= 0) {
        pendingChanges[tomorrowDate][existingIndex] = changeRecord
      } else {
        pendingChanges[tomorrowDate].push(changeRecord)
      }

      chrome.storage.sync.set({ pendingChanges }, () => {
        // 重新渲染以显示待生效的状态
        chrome.storage.sync.get(["limits"], (limitsResult) => {
          renderLimits(limitsResult.limits || {})
        })
      })
    })
  }

  // 撤销待生效的更改
  function cancelPendingChange(limitId) {
    const tomorrowDate = getTomorrowDateString()

    chrome.storage.sync.get(["pendingChanges"], (result) => {
      const pendingChanges = result.pendingChanges || {}
      const todayChanges = pendingChanges[tomorrowDate] || []

      // 找到并移除对应的待生效更改
      const updatedChanges = todayChanges.filter((change) => change.limitId !== limitId)

      if (updatedChanges.length === 0) {
        // 如果没有其他待生效更改，删除整个日期条目
        delete pendingChanges[tomorrowDate]
      } else {
        pendingChanges[tomorrowDate] = updatedChanges
      }

      chrome.storage.sync.set({ pendingChanges }, () => {
        if (chrome.runtime.lastError) {
          console.error("撤销失败:", chrome.runtime.lastError)
          alert("撤销失败，请重试")
        } else {
          console.log(`已撤销限制 ${limitId} 的待生效更改`)
          // 重新渲染以移除待生效状态
          chrome.storage.sync.get(["limits"], (limitsResult) => {
            renderLimits(limitsResult.limits || {})
          })
        }
      })
    })
  }

  // 删除限额（延迟生效）
  function deleteLimitWithDelay(limitId) {
    chrome.storage.sync.get(["limits"], (result) => {
      const limits = result.limits || {}
      const existingLimit = limits[limitId]

      if (!existingLimit) {
        alert("找不到要删除的限制")
        return
      }

      // 添加到待生效的删除列表
      const limitWithId = { ...existingLimit, id: limitId }
      addPendingChange("delete", limitWithId)

      // alert("限额删除将于明天生效，以防止一时冲动解除限制。")
      modal.style.display = "none"
    })
  }

  // 时间类型选择事件监听器
  dailyOption.addEventListener("change", function () {
    if (this.checked) {
      dailyLimitInput.disabled = false
      customTimeBtn.disabled = true
      checkAndShowWarning()
    }
  })

  customOption.addEventListener("change", function () {
    if (this.checked) {
      dailyLimitInput.disabled = true
      customTimeBtn.disabled = false
      checkAndShowWarning()
    }
  })

  // 监听时间输入变化
  dailyLimitInput.addEventListener("input", checkAndShowWarning)

  // 检查并显示警告的函数
  function checkAndShowWarning() {
    const editingId = document.getElementById("limit-id").value
    if (!editingId) {
      modalWarning.style.display = "none"
      return
    }

    chrome.storage.sync.get(["limits"], (result) => {
      const limits = result.limits || {}
      const existingLimit = limits[editingId]

      if (!existingLimit) {
        modalWarning.style.display = "none"
        return
      }

      // 获取当前表单数据
      const websites = Array.from(document.querySelectorAll('[name="websites"]'))
        .map((input) => input.value.trim())
        .filter(Boolean)

      const timeType = document.querySelector('input[name="time-type"]:checked').value
      let newLimitData = { websites, timeType }

      if (timeType === "daily") {
        const dailyLimit = parseInt(document.getElementById("daily-limit").value, 10) || 0
        newLimitData.dailyLimit = dailyLimit
      } else if (timeType === "custom") {
        newLimitData.customLimits = { ...customTimeSettings }
      }

      // 检查是否增加了当天时间
      const isIncreasing = isIncreasingTodayTime(existingLimit, newLimitData)
      modalWarning.style.display = isIncreasing ? "block" : "none"
    })
  }

  // 自定义时间按钮点击事件
  customTimeBtn.addEventListener("click", function () {
    // 填充当前设置到模态窗口
    document.getElementById("sunday-limit").value = customTimeSettings.sunday
    document.getElementById("monday-limit").value = customTimeSettings.monday
    document.getElementById("tuesday-limit").value = customTimeSettings.tuesday
    document.getElementById("wednesday-limit").value = customTimeSettings.wednesday
    document.getElementById("thursday-limit").value = customTimeSettings.thursday
    document.getElementById("friday-limit").value = customTimeSettings.friday
    document.getElementById("saturday-limit").value = customTimeSettings.saturday

    customTimeModal.style.display = "block"
  })

  // 关闭自定义时间模态窗口
  customTimeClose.addEventListener("click", function () {
    customTimeModal.style.display = "none"
  })

  cancelCustomTime.addEventListener("click", function () {
    customTimeModal.style.display = "none"
  })

  // 保存自定义时间设置
  saveCustomTime.addEventListener("click", function () {
    customTimeSettings.sunday = parseInt(document.getElementById("sunday-limit").value) || 0
    customTimeSettings.monday = parseInt(document.getElementById("monday-limit").value) || 0
    customTimeSettings.tuesday = parseInt(document.getElementById("tuesday-limit").value) || 0
    customTimeSettings.wednesday = parseInt(document.getElementById("wednesday-limit").value) || 0
    customTimeSettings.thursday = parseInt(document.getElementById("thursday-limit").value) || 0
    customTimeSettings.friday = parseInt(document.getElementById("friday-limit").value) || 0
    customTimeSettings.saturday = parseInt(document.getElementById("saturday-limit").value) || 0

    customTimeModal.style.display = "none"
    checkAndShowWarning() // 检查是否需要显示警告
  })

  // 点击模态窗口外部关闭
  window.addEventListener("click", function (event) {
    if (event.target === customTimeModal) {
      customTimeModal.style.display = "none"
    }
  })

  loadAndDisplayLimits()

  // 删除限额按钮事件
  deleteLimitBtn.addEventListener("click", () => {
    const editingId = document.getElementById("limit-id").value
    if (!editingId) {
      alert("无法删除，请先选择一个限制")
      return
    }

    if (confirm("确定要删除这个限额吗？删除操作将于明天生效。")) {
      deleteLimitWithDelay(editingId)
    }
  })

  addLimitBtn.addEventListener("click", () => {
    console.log("addLimitBtn clicked")
    modal.style.display = "block"
    document.getElementById("website-input").value = ""
    document.getElementById("daily-limit").value = ""
    document.querySelector(".added-websites").innerHTML = ""

    // 清空隐藏的ID字段，确保创建新记录而不是编辑现有记录
    document.getElementById("limit-id").value = ""

    // 隐藏删除按钮（新建时不显示）
    deleteLimitBtn.style.display = "none"

    // 重置时间选项
    dailyOption.checked = true
    customOption.checked = false
    dailyLimitInput.disabled = false
    customTimeBtn.disabled = true

    // 重置自定义时间设置
    customTimeSettings = {
      sunday: 0,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
    }
  })

  span.addEventListener("click", () => (modal.style.display = "none"))

  window.addEventListener("click", (event) => {
    if (event.target === modal) modal.style.display = "none"
  })

  saveBtn.addEventListener("click", () => {
    // 获取输入值
    const websites = Array.from(document.querySelectorAll('[name="websites"]'))
      .map((input) => input.value.trim())
      .filter(Boolean)

    const timeType = document.querySelector('input[name="time-type"]:checked').value
    let timeLimit = null
    let customLimits = null

    // 验证逻辑
    if (websites.length === 0) {
      alert("请至少添加一个网站")
      return
    }

    if (timeType === "daily") {
      const dailyLimit = parseInt(document.getElementById("daily-limit").value, 10)
      if (isNaN(dailyLimit) || dailyLimit < 0) {
        alert("请输入有效的正整数时长")
        return
      }
      timeLimit = dailyLimit
    } else if (timeType === "custom") {
      customLimits = { ...customTimeSettings }
    }
    /* ********************************************
    数据结构示例:
    {
      "limits": {
        // 每日限制类型示例
        "m9colc26qhih9vifpsa": {
          "id": "m9colc26qhih9vifpsa",
          "websites": ["bilibili.com", "zhihu.com"],
          "timeType": "daily",
          "dailyLimit": 30,
          "createdAt": "2025-04-11T11:05:51.438Z"
        },
        // 自定义限制类型示例  
        "n8dplx37rjkf8wjgqtb": {
          "id": "n8dplx37rjkf8wjgqtb", 
          "websites": ["youtube.com", "netflix.com"],
          "timeType": "custom",
          "customLimits": {
            "sunday": 60,
            "monday": 30,
            "tuesday": 30,
            "wednesday": 30,
            "thursday": 30,
            "friday": 45,
            "saturday": 90
          },
          "createdAt": "2025-04-11T12:15:32.789Z"
        }
      }
    }
    ********************************************* */
    // 存储到 chrome.storage.sync
    chrome.storage.sync.get(["limits"], (result) => {
      const limits = result.limits || {}
      const editingId = document.getElementById("limit-id").value // 新增隐藏字段存储ID

      // 查找现有记录
      const existingLimit = editingId ? limits[editingId] : null

      // 创建新的限制对象
      const newLimitData = {
        websites,
        timeType,
        ...(timeType === "daily" ? { dailyLimit: timeLimit } : { customLimits }),
      }

      if (
        existingLimit &&
        JSON.stringify(websites) === JSON.stringify(existingLimit.websites) &&
        JSON.stringify(newLimitData) ===
          JSON.stringify({
            websites: existingLimit.websites,
            timeType: existingLimit.timeType,
            ...(existingLimit.timeType === "daily" ? { dailyLimit: existingLimit.dailyLimit } : { customLimits: existingLimit.customLimits }),
          })
      ) {
        console.log("未作任何更改")
        modal.style.display = "none"
        return
      }

      // 检查是否需要延迟生效
      const needsDelayedEffect = hasDelayedChanges(existingLimit, newLimitData)

      if (needsDelayedEffect) {
        // 延迟生效的情况 - 保持原数据不变，但记录待生效的更改
        const limitWithId = { ...existingLimit, id: editingId }
        addPendingChange("update", limitWithId, newLimitData)

        alert("删除网站或增加当天使用时间的设置将于明天生效，以防止一时冲动解除限制。")
        modal.style.display = "none"
        return
      }

      if (existingLimit) {
        // 更新现有记录（立即生效的更改）
        console.log("更新现有记录")
        limits[editingId] = {
          ...existingLimit,
          ...newLimitData,
        }
      } else {
        // 新增记录（总是立即生效）
        const newId = generateId()
        limits[newId] = {
          id: newId,
          ...newLimitData,
          createdAt: new Date().toISOString(),
        }
      }

      chrome.storage.sync.set({ limits }, () => {
        if (chrome.runtime.lastError) {
          console.error("存储失败:", chrome.runtime.lastError)
          alert("保存失败，请重试")
        } else {
          modal.style.display = "none" // 关闭弹窗
          renderLimits(limits)
        }
      })
    })
  })

  // 删除标签
  websitesContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-tag-btn")) {
      e.target.closest(".website-tag").remove()
      // 重新显示建议以更新选中状态
      updateSuggestionDisplay()
    }
  })

  // 创建建议项的函数
  function createSuggestionItem(match) {
    const div = document.createElement("div")
    const isSelected = isWebsiteAlreadyAdded(match)

    div.style.padding = "5px"
    div.style.display = "flex"
    div.style.alignItems = "center"
    // div.style.justifyContent = "space-between"

    // 创建网站名称部分
    const nameSpan = document.createElement("span")
    nameSpan.textContent = match
    div.appendChild(nameSpan)

    // 如果已选中，添加绿色勾号
    if (isSelected) {
      const checkSpan = document.createElement("span")
      checkSpan.textContent = "✓"
      checkSpan.style.color = "#4CAF50"
      checkSpan.style.fontWeight = "bold"
      checkSpan.style.marginLeft = "10px"
      div.appendChild(checkSpan)
      div.style.cursor = "default"
      div.style.opacity = "0.7"
    } else {
      div.style.cursor = "pointer"
      div.onclick = () => {
        if (addWebsiteTag(match)) {
          suggestionsDiv.innerHTML = ""
          websiteInput.value = ""
        }
      }
    }

    // 添加悬停事件
    if (!isSelected) {
      div.addEventListener("mouseenter", () => {
        // 移除所有激活状态
        suggestionsDiv.querySelectorAll("div").forEach((item) => {
          item.classList.remove("active")
        })
        // 设置当前项激活
        div.classList.add("active")
      })
      div.addEventListener("mouseleave", () => {
        div.classList.remove("active")
      })
    }

    return div
  }

  // 显示建议的函数
  function showSuggestions(matches) {
    suggestionsDiv.innerHTML = ""
    websiteInput.closest(".input-group").classList.add("active")

    matches.forEach((match) => {
      const div = createSuggestionItem(match)
      suggestionsDiv.appendChild(div)
    })
  }

  // 输入框获得焦点时显示所有建议
  websiteInput.addEventListener("focus", function (e) {
    const input = e.target.value.toLowerCase()

    if (input.length > 0) {
      // 如果有输入内容，按现有逻辑过滤显示
      const matches = suggestionList.filter((item) => item.toLowerCase().includes(input))
      showSuggestions(matches)
    } else {
      // 如果没有输入内容，显示所有建议
      showSuggestions(suggestionList) // 显示全部建议
    }
  })

  websiteInput.addEventListener("input", function (e) {
    const input = e.target.value.toLowerCase()
    suggestionsDiv.innerHTML = ""

    if (input.length > 0) {
      const matches = suggestionList.filter((item) => item.toLowerCase().includes(input)) // 显示所有匹配的建议
      showSuggestions(matches)
    } else {
      // 输入为空时显示所有建议
      showSuggestions(suggestionList) // 显示全部建议
    }
  })

  // 添加键盘导航支持
  websiteInput.addEventListener("keydown", (e) => {
    const items = [...suggestionsDiv.children]
    let active = suggestionsDiv.querySelector(".active")
    if (items.length === 0) return
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        active = active?.nextElementSibling || items[0]
        break
      case "ArrowUp":
        e.preventDefault()
        active = active?.previousElementSibling || items[items.length - 1]
        break
      case "Enter":
        e.preventDefault()
        if (active) {
          // 获取网站名称（第一个span的文本内容）
          const websiteName = active.querySelector("span")?.textContent || active.textContent
          if (addWebsiteTag(websiteName)) {
            suggestionsDiv.innerHTML = ""
            websiteInput.value = ""
          }
        }

        return // 提前返回避免执行后续代码
    }

    items.forEach((item) => item.classList.remove("active"))
    if (active) {
      active.classList.add("active")
      // 自动滚动到可见区域
      active.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      })
    }
  })

  document.addEventListener("click", (e) => {
    if (!websiteInput.contains(e.target)) {
      websiteInput.closest(".input-group").classList.remove("active")
    }
  })

  function loadAndDisplayLimits() {
    chrome.storage.sync.get(["limits"], (result) => {
      if (chrome.runtime.lastError) {
        console.error("读取失败:", chrome.runtime.lastError)
        return
      }
      renderLimits(result.limits || {})
    })
  }

  function renderLimits(limits) {
    // 获取待生效的更改
    chrome.storage.sync.get(["pendingChanges"], (result) => {
      const pendingChanges = result.pendingChanges || {}
      const tomorrowDate = getTomorrowDateString()
      const pendingUpdates = pendingChanges[tomorrowDate] || []

      // 创建待生效更改的映射
      const pendingMap = {}
      pendingUpdates.forEach((change) => {
        pendingMap[change.limitId] = change
      })

      limitsContainer.innerHTML = Object.values(limits)
        .map((item) => {
          let timeDisplay = ""
          if (item.timeType === "daily") {
            timeDisplay = `${chrome.i18n.getMessage("dailyOptionLabel")} ${chrome.i18n.getMessage("limitLabel")}：${
              item.dailyLimit
            }${chrome.i18n.getMessage("minutesUnit")}`
          } else if (item.timeType === "custom") {
            const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
            const dayNames = [
              chrome.i18n.getMessage("weekdaySunday"),
              chrome.i18n.getMessage("weekdayMonday"),
              chrome.i18n.getMessage("weekdayTuesday"),
              chrome.i18n.getMessage("weekdayWednesday"),
              chrome.i18n.getMessage("weekdayThursday"),
              chrome.i18n.getMessage("weekdayFriday"),
              chrome.i18n.getMessage("weekdaySaturday"),
            ]
            const activeDays = days
              .map((day, index) =>
                item.customLimits[day] > 0 ? `${dayNames[index]}:${item.customLimits[day]}${chrome.i18n.getMessage("minutesUnit")}` : null,
              )
              .filter(Boolean)
            timeDisplay = `${chrome.i18n.getMessage("customOptionLabel")} ${chrome.i18n.getMessage("limitLabel")}：${activeDays.join(", ")}`
          } else {
            // 兼容旧数据
            timeDisplay = `${chrome.i18n.getMessage("dailyOptionLabel")} ${chrome.i18n.getMessage("limitLabel")}：${
              item.dailyLimit || 0
            }${chrome.i18n.getMessage("minutesUnit")}`
          }

          const pendingChange = pendingMap[item.id]
          const isPendingUpdate = !!pendingChange && pendingChange.action === "update"
          const isPendingDelete = !!pendingChange && pendingChange.action === "delete"

          let itemClass = "limit-item"
          if (isPendingUpdate) {
            itemClass = "limit-item pending-update"
          } else if (isPendingDelete) {
            itemClass = "limit-item pending-delete"
          }

          let pendingPreview = ""
          if (isPendingUpdate && pendingChange.newLimitData) {
            const newData = pendingChange.newLimitData
            let newTimeDisplay = ""

            if (newData.timeType === "daily") {
              newTimeDisplay = `每日限制：${newData.dailyLimit}分钟`
            } else if (newData.timeType === "custom") {
              const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
              const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
              const activeDays = days
                .map((day, index) => (newData.customLimits[day] > 0 ? `${dayNames[index]}:${newData.customLimits[day]}分钟` : null))
                .filter(Boolean)
              newTimeDisplay = `自定义限制：${activeDays.join(", ")}`
            }

            pendingPreview = `
              <div class="pending-changes-preview">
                <div class="label">${chrome.i18n.getMessage("pendingChangesPreviewLabel")}</div>
                <div class="change-row">
                  <div class="change-content">${newData.websites.join(", ")} - ${newTimeDisplay}</div>
                  <button class="cancel-pending-btn" data-limit-id="${item.id}">${chrome.i18n.getMessage("cancelButton")}</button>
                </div>
              </div>
            `
          } else if (isPendingDelete) {
            pendingPreview = `
              <div class="pending-changes-preview">
                <div class="change-row">
                  <button class="cancel-pending-btn" data-limit-id="${item.id}">${chrome.i18n.getMessage("cancelButton")}</button>
                </div>
              </div>
            `
          }

          return `<div class="${itemClass}" data-id="${item.id}">
            <div>${item.websites.join(", ")} - ${timeDisplay}</div>
            ${pendingPreview}
          </div>`
        })
        .join("")

      // 添加撤销按钮事件
      document.querySelectorAll(".cancel-pending-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation() // 防止触发父元素的点击事件
          const limitId = btn.getAttribute("data-limit-id")
          if (confirm(chrome.i18n.getMessage("confirmCancelPendingChange"))) {
            cancelPendingChange(limitId)
          }
        })
      })

      // 添加点击事件
      document.querySelectorAll(".limit-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          // 如果点击的是撤销按钮，不执行编辑操作
          if (e.target.classList.contains("cancel-pending-btn")) {
            return
          }
          const limit = limits[item.dataset.id]

          // const websitesContainer = document.querySelector(".added-websites");
          websitesContainer.innerHTML = ""

          // 填充网站标签
          limit.websites.forEach((website) => {
            const tag = document.createElement("div")
            tag.className = "website-tag"
            tag.innerHTML = `
                    ${website}
                    <button class="remove-tag-btn">×</button>
                    <input type="hidden" name="websites" value="${website}">
                `
            websitesContainer.appendChild(tag)
          })

          // 设置隐藏ID字段
          document.getElementById("limit-id").value = limit.id

          // 显示删除按钮（编辑现有限制时显示）
          deleteLimitBtn.style.display = "block"

          // 根据时间类型设置界面
          if (limit.timeType === "custom") {
            customOption.checked = true
            dailyOption.checked = false
            dailyLimitInput.disabled = true
            customTimeBtn.disabled = false
            document.getElementById("daily-limit").value = ""

            // 设置自定义时间
            customTimeSettings = { ...limit.customLimits }
          } else {
            // 默认为每日限制（兼容旧数据）
            dailyOption.checked = true
            customOption.checked = false
            dailyLimitInput.disabled = false
            customTimeBtn.disabled = true
            document.getElementById("daily-limit").value = limit.dailyLimit || 0

            // 重置自定义时间设置
            customTimeSettings = {
              sunday: 0,
              monday: 0,
              tuesday: 0,
              wednesday: 0,
              thursday: 0,
              friday: 0,
              saturday: 0,
            }
          }

          // 清除警告显示
          modalWarning.style.display = "none"
          modal.style.display = "block"
        })
      })
    })
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
})()
