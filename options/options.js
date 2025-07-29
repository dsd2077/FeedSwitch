// 获取元素
var sidebarLinks = document.querySelectorAll(".sidebar a")
var contentArea = document.getElementById("content-area")

// 添加点击事件监听器
sidebarLinks.forEach((link) => {
  link.addEventListener("click", function (event) {
    event.preventDefault() // 阻止默认行为（比如a标签跳转）
    var page = this.getAttribute("data-page")

    // 更新 URL 哈希
    window.location.hash = page

    loadPage(page)
  })
})

// 加载页面内容
function loadPage(page) {
  fetch(`${page}.html`)
    .then((response) => response.text())
    .then((data) => {
      contentArea.innerHTML = data

      // Apply translations to the newly loaded content
      if (window.applyTranslations) {
        window.applyTranslations(contentArea)
      }

      const scripts = Array.from(contentArea.querySelectorAll("script"))
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script")
        newScript.src = oldScript.src + "?t=" + Date.now()
        newScript.type = "module"

        const baseSrc = oldScript.src.split("?")[0]
        document.querySelectorAll(`script[src^="${baseSrc}"]`).forEach((s) => s.remove())

        document.body.appendChild(newScript)
      })
    })
    .catch((error) => {
      console.error("Error loading page:", error)
    })
}

// 检查 URL 哈希并加载相应页面
function loadPageFromHash() {
  const hash = window.location.hash.substring(1) // 去除 # 符号
  if (hash && ["website-usage-time", "webpage-limits", "about"].includes(hash)) {
    loadPage(hash)
  } else {
    loadPage("website-usage-time")
  }
}

// 监听哈希变化
window.addEventListener("hashchange", loadPageFromHash)

// 初始化页面加载
loadPageFromHash()
