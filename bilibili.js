function removeBiliFeed() {
    const TARGETS = [
        'main.bili-feed4-layout',
        'div.bili-header__channel',
        'div.header-channel',
        'div.trendings-single',
        'div.trendings-double',
    ];

    // 将checkAndRemove提升到observer回调外部
    const checkAndRemove = (root = document) => {
        TARGETS.forEach(target => {
            const elements = root.querySelector(target);
            if (elements?.parentElement) {
                elements.parentElement.removeChild(elements);
                console.log(`[Extension] Removed ${target}`);
            }
        });
        const searchInput = root.querySelector('.nav-search-input');
        if (searchInput && searchInput.placeholder) {
            searchInput.removeAttribute('placeholder');
            console.log('[Extension] Removed search placeholder');
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
    // 同时读取两个存储空间的数据
    chrome.storage.local.get(['focus', 'websiteTimesDailyFun'], localResult => {
        chrome.storage.sync.get(['limits'], syncResult => {
            // 双重条件判断
            const shouldRemove = localResult.focus === true ||
                (checkTimeLimit('www.bilibili.com', localResult.websiteTimesDailyFun, syncResult.limits));
            if (shouldRemove) {
                removeBiliFeed();
            }
        });
    });
}


// 新增时间校验函数
function checkTimeLimit(domain, timeData = {}, limits = []) {
    const domainLimit = limits.find(l => l.website === domain)?.dailyLimit;
    if (!domainLimit) return false;

    // 转换时间单位（秒转分钟）
    const usedMinutes = Math.floor((timeData[domain] || 0) / 60);
    return usedMinutes >= domainLimit;
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

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes.focus || changes.websiteTimesDailyFun)) {
        checkAndRemove();
    }
});
