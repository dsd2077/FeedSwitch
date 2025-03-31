(function init() {
    const limitsContainer = document.getElementById('limits-container');
    let editingWebsite = null; // 用于跟踪当前编辑的网站

    const addLimitBtn = document.getElementById("add-limit-btn");
    if (!addLimitBtn) return; // 防止元素不存在时报错

    const modal = document.getElementById("add-limit-modal");
    const span = modal.querySelector(".close");
    const saveBtn = document.getElementById("save-limit-btn");

    addLimitBtn.addEventListener('click', () => {
        console.log("addLimitBtn clicked");
        modal.style.display = "block";
    });

    span.addEventListener('click', () => modal.style.display = "none");

    window.addEventListener('click', (event) => {
        if (event.target === modal) modal.style.display = "none";
    });

    saveBtn.addEventListener('click', () => {
        // 获取输入值
        const website = document.getElementById('website').value.trim();
        const dailyLimit = parseInt(document.getElementById('daily-limit').value, 10);

        // 验证输入
        if (!website) {
            alert("请输入网站地址");
            return;
        }

        if (isNaN(dailyLimit) || dailyLimit <= 0) {
            alert("请输入有效的正整数时长");
            return;
        }

        // 存储到 chrome.storage.sync
        chrome.storage.sync.get(['limits'], (result) => {
            const limits = result.limits || [];

            // 检查重复项
            const existingIndex = limits.findIndex(item => item.website === (editingWebsite || website));
            if (existingIndex > -1) {
                limits[existingIndex].dailyLimit = dailyLimit;
                if (editingWebsite && editingWebsite !== website) {
                    limits[existingIndex].website = website;
                }
            } else {
                limits.push({ website, dailyLimit }); // 添加新记录
            }

            chrome.storage.sync.set({ limits }, () => {
                if (chrome.runtime.lastError) {
                    console.error('存储失败:', chrome.runtime.lastError);
                    alert("保存失败，请重试");
                } else {
                    modal.style.display = "none";  // 关闭弹窗
                    // 清空输入框
                    document.getElementById('website').value = '';
                    document.getElementById('daily-limit').value = '';
                    editingWebsite = null; // 重置编辑状态
                    loadAndDisplayLimits(); // 刷新列表
                }
            });
        });
    });


    // 新增函数：渲染限额列表
    function renderLimits(limits) {
        limitsContainer.innerHTML = limits.map(item => `
        <div class="limit-item" 
             data-website="${item.website}"
             style="cursor: pointer; padding: 8px; margin: 5px 0; border: 1px solid #eee; border-radius: 4px;">
            ${item.website} - 每日限制：${item.dailyLimit}分钟
        </div>
    `).join('');

        // 添加点击事件
        document.querySelectorAll('.limit-item').forEach(item => {
            item.addEventListener('click', () => {
                editingWebsite = item.dataset.website;
                const limit = limits.find(l => l.website === editingWebsite);

                // 填充表单
                document.getElementById('website').value = limit.website;
                document.getElementById('daily-limit').value = limit.dailyLimit;
                modal.style.display = 'block';
            });
        });
    }

    // 新增函数：加载并显示数据
    function loadAndDisplayLimits() {
        chrome.storage.sync.get(['limits'], (result) => {
            if (chrome.runtime.lastError) {
                console.error('读取失败:', chrome.runtime.lastError);
                return;
            }
            renderLimits(result.limits || []);
        });
    }
    loadAndDisplayLimits();
})();

