export const SITE_CONFIG = {
  "bilibili.com": {
    targets: [
      "main.bili-feed4-layout",
      "div.bili-header__channel",
      "div.header-channel",
      "#i_cecream > div.bili-feed4 > div.bili-header.large-header > div.bili-header__bar > div > div > div > div.trending > div.trendings-double",
      "#i_cecream > div.bili-feed4 > div.bili-header.large-header > div.bili-header__bar > div > div > div > div.trending > div",
      "div.adblock-tips",
    ],
    extraCheck: (root) => {
      const searchInput = root.querySelector(".nav-search-input")
      if (searchInput?.placeholder) {
        searchInput.removeAttribute("placeholder")
      }
    },
  },
  "baidu.com": {
    targets: ["div.s-hotsearch-wrapper", "div.new_search_guide_bub", "div.cr-offset"],
  },
  "zhihu.com": {
    targets: [
      "div.Topstory",
      "div.LoadingBar",
      "div.Card.TopSearch.TopSearch--new",
      "div.css-knqde",
      "#root > div > main > div > div.Post-Row-Content > div.Post-Row-Content-right.css-1qyytj7",
      // 'div.AutoComplete-group'
    ],
    extraCheck: (root) => {
      // 删除搜索框中的placeholder
      const searchInput = root.querySelector("#Popover1-toggle")
      if (searchInput?.placeholder) {
        searchInput.removeAttribute("placeholder")
      }
      // 删除搜索框中的搜索发现
      const discoveryGroups = root.querySelectorAll(".AutoComplete-group")
      discoveryGroups.forEach((group) => {
        const label = group.querySelector(".SearchBar-label")
        if (label?.textContent?.includes("搜索发现")) {
          group.remove()
        }
      })
      const searchMain = root.querySelector("#SearchMain")
      if (searchMain) {
        searchMain.style.width = "1000px" // 设置行内样式优先级更高
      }
      const Post_Row_Content_left = document.querySelector("#root > div > main > div > div.Post-Row-Content > div")
      if (Post_Row_Content_left) {
        Post_Row_Content_left.style.width = "1000px" // 设置行内样式优先级更高
      }
    },
  },
  "csdn.net": {
    targets: [
      "div.swiper-slide-box-remuneration",
      "div#asideHotArticle.aside-box",
      "div#asideCategory.aside-box ",
      "div#asideArchive.aside-box",
      "div#asideNewComments.aside-box",
      "div.toolbar-advert",
      "div.rightside-fixed-hide",
    ],
  },
  "juejin.cn": {
    targets: [
      "div.sidebar-block.shadow",
      "div.top-banners-container",
      "#juejin > div:nth-child(1) > div > main > div > div.main-area.article-area > article > img",
    ],
  },
  "xiaohongshu.com": {
    targets: ["#exploreFeeds", "#mfContainer > div.channel-container"],
  },
  "jianshu.com": {
    targets: ["aside._2OwGUo"],
  },
  "youtube.com": {
    targets: [
      // 首页信息流（仅限首页，不影响订阅页面）
      "ytd-browse[page-subtype='home'] ytd-rich-grid-renderer",

      // 侧边栏导航项（首页、Shorts等）
      "ytd-guide-entry-renderer:has([title*='首页'])",
      "ytd-guide-entry-renderer:has([title*='Home'])",
      "ytd-guide-entry-renderer:has([title*='Shorts'])",
      "ytd-guide-entry-renderer:has([title*='短片'])",
    ],
    extraCheck: (root) => {
      // 隐藏通知数字标题
      const removeNotificationNumber = (titleElement) => {
        const titleRegex = /^\(\d+\) +/
        if (titleRegex.test(titleElement.innerText)) {
          titleElement.innerText = titleElement.innerText.replace(titleRegex, "")
        }
      }

      const title = root.querySelector("title")
      if (title && title.nodeType === Node.ELEMENT_NODE) {
        removeNotificationNumber(title)
        // 监听标题变化
        const observer = new MutationObserver(() => {
          const currentTitle = root.querySelector("title")
          if (currentTitle && currentTitle.nodeType === Node.ELEMENT_NODE) {
            removeNotificationNumber(currentTitle)
          }
        })
        try {
          observer.observe(title, { childList: true })
        } catch (e) {
          console.warn("Failed to observe title element:", e)
        }
      }

      // 屏蔽探索部分
      const removeExploreSection = () => {
        // 找到#sections下的ytd-guide-section-renderer元素，隐藏第三个
        const sectionsContainer = root.querySelector("#sections")
        if (sectionsContainer) {
          const guideSections = sectionsContainer.querySelectorAll("ytd-guide-section-renderer")
          if (guideSections.length >= 3) {
            guideSections[2].style.display = "none" // 隐藏第三个元素（索引为2）
          }
        }
      }

      // 执行探索部分屏蔽
      removeExploreSection()
    },
  },
  "douyin.com": {
    targets: [
      "#douyin-right-container > div.Da2ISZXp.route-scroll-container.IhmVuo1S",

      // 精选导航项 - 使用类名选择器更精确
      "div.tab-discover",
      "div.tab-recommend",
      "div.tab-live",
      "div.tab-vs",
      "div.tab-series",
    ],
    extraCheck: () => {
      // 重定向到AI搜索页面
      const currentUrl = window.location.href
      if (currentUrl.includes("douyin.com/?recommend=1")) {
        window.location.replace("https://www.douyin.com/jingxuan")
      }
    },
  },
  "v.qq.com": {
    targets: [
      "#channel-main-container", // 主页信息流
      ".channel-page",
      ".web-channel",
      "#channel-page-scroll",
      ".flex-container",
      "#hot-search", //热搜
      "#iwan-gamesearchrank-page", //热门游戏
      "#root > div.qqhome-content-wrap",
    ],
  },
  "iqiyi.com": {
    targets: ["#root > div.App_App__p1BHw > div > div.pages_side__pWNLH > div > div > div.side_outer__mjJJn > div > div"], //导航栏
    extraCheck: (root) => {
      // 检测是否处于搜索状态
      const searchElement = root.querySelector("#search")
      const isSearchMode = searchElement && searchElement.offsetParent !== null

      // 如果不是搜索状态，则屏蔽指定容器
      if (!isSearchMode) {
        // 屏蔽pages_page_view_bk__C5fSj容器
        const pageViewContainers = root.querySelectorAll("div.pages_page_view_bk__C5fSj")
        pageViewContainers.forEach((container) => {
          if (container) {
            container.style.display = "none"
          }
        })
      }
    },
  },
  "weibo.com": {
    targets: [
      "#scroller > div.vue-recycle-scroller__item-wrapper", //首页信息流
      "#scroller > div.vue-recycle-scroller__slot > div > div", //加载条
      "#__sidebar > div > div:nth-child(2) > div > div", //右侧边栏
      "#app > div > div.woo-box-flex.woo-box-justifyBetween.Frame_content1_3ZhYn > div.Frame_main1_1_6JQ > div > div.recommend", //视频推荐流
      "#app > div > div.woo-box-flex.woo-box-justifyBetween.Frame_content1_3ZhYn > div.Frame_main1_1_6JQ > div > div.woo-panel-main.woo-panel-top.woo-panel-right.woo-panel-bottom.woo-panel-left.Card_wrap_2ibWe.List_card_2xvIN", //视频榜单
      "#pl_right_side", //搜索结果有侧边栏
      "#app > div > div.woo-box-flex.woo-box-justifyBetween.Frame_content1_3ZhYn > div.Frame_main1_1_6JQ > div > div.recommend", //未登录状态视频推荐流
      "#app > div > div.woo-box-flex.woo-box-justifyBetween.Frame_content1_3ZhYn > div.Frame_side1_2Wnvp > div > div > div:nth-child(6) > div.woo-box-flex.woo-box-column", //精选频道
    ],
  },
  "youku.com": {
    targets: [],
    extraCheck: (root) => {
      // 查找 channel_module_container 容器，使用隐藏而不是删除
      const channelContainer = root.querySelector("#channel_module_container")
      if (channelContainer) {
        // 获取所有直接子div元素
        const childDivs = channelContainer.querySelectorAll(":scope > div")
        // 隐藏除第一个div之外的所有子div元素
        for (let i = 1; i < childDivs.length; i++) {
          if (childDivs[i] && childDivs[i].style) {
            childDivs[i].style.display = "none"
          }
        }
      }
    },
  },
}
