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
}
