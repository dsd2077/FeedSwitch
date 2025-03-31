function removeBiliFeed() {
    const TARGETS = {
        feed: 'main.bili-feed4-layout',
        header: 'div.bili-header__channel',
        header2: 'div.header-channel',
        trending: 'div.trending'
    };

    // 将checkAndRemove提升到observer回调外部
    const checkAndRemove = (root = document) => {
        // 移除feed流模块
        const feed = root.querySelector(TARGETS.feed);
        if (feed?.parentElement) {
            feed.parentElement.removeChild(feed);
            console.log('[Extension] Removed feed layout');
        }

        // 移除顶部频道
        const header = root.querySelector(TARGETS.header);
        if (header?.parentElement) {
            header.parentElement.removeChild(header);
            console.log('[Extension] Removed header channel');
        }

        const header2 = root.querySelector(TARGETS.header2);
        if (header2?.parentElement) {
            header2.parentElement.removeChild(header2);
            console.log('[Extension] Removed header channel');
        }

        // 移除trending模块
        const trending = root.querySelector(TARGETS.trending);
        if (trending?.parentElement) {
            trending.parentElement.removeChild(trending);
            console.log('[Extension] Removed trending layout');
        }
    };

    const observer = new MutationObserver((mutations) => {
        // 立即检查文档主体
        checkAndRemove();

        // 处理新增节点
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    checkAndRemove(node);
                }
            });
        });
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });

    // 初始化执行
    checkAndRemove();
}

function checkAndRemove() {
    // 从存储读取状态
    chrome.storage.local.get(['trackingEnabled'], result => {
        if (result.trackingEnabled === true) { 
            removeBiliFeed();
        } 
    });
}

// // 精确执行控制（仅首页）
if (location.hostname === 'www.bilibili.com' && location.pathname === '/') {
    // 兼容SPA路由变化的检测
    let lastPath = location.pathname;
    const checkSPA = () => {
        if (location.pathname !== lastPath) {
            lastPath = location.pathname;
            checkAndRemove();
        }
    };

    // 初始执行 + 路由监听
    checkAndRemove();
    setInterval(checkSPA, 1000);
}



// // 页面加载时执行
// if (location.hostname === 'www.bilibili.com' && location.pathname === '/') {
//     // 初始执行
//     checkAndRemove();

//     // SPA路由检测（简化版）
//     let lastPath = location.pathname;
//     setInterval(() => {
//         if (location.pathname !== lastPath) {
//             lastPath = location.pathname;
//             if (location.pathname === '/') checkAndRemove();
//         }
//     }, 1000);
// }

