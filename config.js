window.SITE_CONFIG = {
  "www.bilibili.com": {
    targets: ["main.bili-feed4-layout", "div.bili-header__channel", "div.header-channel", "div.trending"],
    extraCheck: (root) => {
      const searchInput = root.querySelector(".nav-search-input")
      if (searchInput?.placeholder) {
        searchInput.removeAttribute("placeholder")
      }
    },
  },
  "www.baidu.com": {
    targets: ["div.s-hotsearch-wrapper", "div.new_search_guide_bub", "div.cr-offset"],
  },
  "www.zhihu.com": {
    targets: [
      "div.Topstory",
      "div.LoadingBar",
      "div.Card.TopSearch.TopSearch--new",
      "div.css-knqde",
      // 'div.AutoComplete-group'
    ],
    extraCheck: (root) => {
      const searchInput = root.querySelector("#Popover1-toggle")
      if (searchInput?.placeholder) {
        searchInput.removeAttribute("placeholder")
      }
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
    },
  },
  "blog.csdn.net": {
    targets: ["div.swiper-slide-box-remuneration", "div#asideHotArticle.aside-box", "div#asideCategory.aside-box ", "div#asideArchive.aside-box", "div#asideNewComments.aside-box"],
  },
  "www.juejin.cn": {
    targets: ["div.sidebar-block.shadow", "div.top-banners-container"],
    extraCheck: (root) => {
      // 删除特定图片
      const targetImage = root.querySelector('img[src="https://p6-piu.byteimg.com/tos-cn-i-8jisjyls3a/fa501ba562f845bcb9d5207fdec8886f~tplv-8jisjyls3a-image.image"]')
      if (targetImage) {
        targetImage.remove()
      }
    },
  },
  "www.xiaohongshu.com": {
    targets: ["div.with-side-bar.main-content"],
  },
  "www.jianshu.com": {
    targets: ["aside._2OwGUo"],
  },
}
