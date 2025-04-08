window.SITE_CONFIG = {
  'www.bilibili.com': {
    targets: [
      'main.bili-feed4-layout',
      'div.bili-header__channel',
      'div.header-channel'
    ],
    extraCheck: (root) => {
      const searchInput = root.querySelector('.nav-search-input');
      if (searchInput?.placeholder) {
        searchInput.removeAttribute('placeholder');
      }
    }
  },
  'www.baidu.com': {
    targets: [
      'div.s-hotsearch-wrapper',
      'div.new_search_guide_bub',
      'div.cr-offset'
    ]
  },
  'www.zhihu.com': {
    targets: [
      'div.Topstory',
      'div.LoadingBar'
    ]
  }
};