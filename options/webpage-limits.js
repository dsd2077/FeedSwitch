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
  // console.log("suggestionList", suggestionList)
  // console.log("SITE_CONFIG", SITE_CONFIG)

  // 时间类型选择事件监听器
  dailyOption.addEventListener("change", function () {
    if (this.checked) {
      dailyLimitInput.disabled = false
      customTimeBtn.disabled = true
    }
  })

  customOption.addEventListener("change", function () {
    if (this.checked) {
      dailyLimitInput.disabled = true
      customTimeBtn.disabled = false
    }
  })

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
  })

  // 点击模态窗口外部关闭
  window.addEventListener("click", function (event) {
    if (event.target === customTimeModal) {
      customTimeModal.style.display = "none"
    }
  })

  loadAndDisplayLimits()

  addLimitBtn.addEventListener("click", () => {
    console.log("addLimitBtn clicked")
    modal.style.display = "block"
    document.getElementById("website-input").value = ""
    document.getElementById("daily-limit").value = ""
    document.querySelector(".added-websites").innerHTML = ""

    // 清空隐藏的ID字段，确保创建新记录而不是编辑现有记录
    document.getElementById("limit-id").value = ""

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
      // 验证自定义时间设置
      // const totalTime = Object.values(customTimeSettings).reduce((sum, time) => sum + time, 0)
      // if (totalTime === 0) {
      //   alert("请至少为一天设置时间限制")
      //   return
      // }
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

      if (existingLimit) {
        // 更新现有记录
        console.log("更新现有记录")
        limits[editingId] = {
          ...existingLimit,
          ...newLimitData,
        }
      } else {
        // 新增记录
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
    }
  })

  websiteInput.addEventListener("input", function (e) {
    const input = e.target.value.toLowerCase()
    suggestionsDiv.innerHTML = ""

    if (input.length > 0) {
      // 添加激活状态（触发CSS显示）
      websiteInput.closest(".input-group").classList.add("active")
      const matches = suggestionList.filter((item) => item.toLowerCase().includes(input)).slice(0, 5) // 显示最多5条建议

      matches.forEach((match) => {
        const div = document.createElement("div")
        div.textContent = match
        div.style.padding = "5px"
        div.style.cursor = "pointer"
        div.onclick = () => {
          suggestionsDiv.innerHTML = ""
          websiteInput.value = ""
          // 创建标签元素
          const tag = document.createElement("div")
          tag.className = "website-tag"
          tag.innerHTML = `
                ${match}
                <button class="remove-tag-btn">×</button>
                <input type="hidden" name="websites" value="${match}">
            `
          websitesContainer.appendChild(tag)
        }
        // 添加悬停事件
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
        suggestionsDiv.appendChild(div)
      })
    } else {
      websiteInput.closest(".input-group").classList.remove("active")
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
          suggestionsDiv.innerHTML = ""
          websiteInput.value = ""
          const tag = document.createElement("div")
          tag.className = "website-tag"
          tag.innerHTML = `
                ${active.textContent}
                <button class="remove-tag-btn">×</button>
                <input type="hidden" name="websites" value="${active.textContent}">
            `
          websitesContainer.appendChild(tag)
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
    limitsContainer.innerHTML = Object.values(limits)
      .map((item) => {
        let timeDisplay = ""
        if (item.timeType === "daily") {
          timeDisplay = `每日限制：${item.dailyLimit}分钟`
        } else if (item.timeType === "custom") {
          const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
          const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
          const activeDays = days
            .map((day, index) => (item.customLimits[day] > 0 ? `${dayNames[index]}:${item.customLimits[day]}分钟` : null))
            .filter(Boolean)
          timeDisplay = `自定义限制：${activeDays.join(", ")}`
        } else {
          // 兼容旧数据
          timeDisplay = `每日限制：${item.dailyLimit || 0}分钟`
        }

        return `<div class="limit-item" data-id="${item.id}" style="...">
          ${item.websites.join(", ")} - ${timeDisplay}
        </div>`
      })
      .join("")

    // 添加点击事件
    document.querySelectorAll(".limit-item").forEach((item) => {
      item.addEventListener("click", () => {
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

        modal.style.display = "block"
      })
    })
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
})()
