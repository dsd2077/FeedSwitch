(function init() {
  const generateId = () =>
    Date.now().toString(36) + Math.random().toString(36).substr(2);
  const limitsContainer = document.getElementById("limits-container");

  const addLimitBtn = document.getElementById("add-limit-btn");
  if (!addLimitBtn) return; // 防止元素不存在时报错

  const modal = document.getElementById("add-limit-modal");
  const span = modal.querySelector(".close");
  const saveBtn = document.getElementById("save-limit-btn");

  addLimitBtn.addEventListener("click", () => {
    console.log("addLimitBtn clicked");
    modal.style.display = "block";
    document.getElementById("website-input").value = "";
    document.getElementById("daily-limit").value = "";
    document.querySelector(".added-websites").innerHTML = "";
  });

  span.addEventListener("click", () => (modal.style.display = "none"));

  window.addEventListener("click", (event) => {
    if (event.target === modal) modal.style.display = "none";
  });
  saveBtn.addEventListener("click", () => {
    // 获取输入值
    const websites = Array.from(document.querySelectorAll('[name="websites"]'))
      .map((input) => input.value.trim())
      .filter(Boolean);

    const dailyLimit = parseInt(
      document.getElementById("daily-limit").value,
      10
    );

    // 验证逻辑
    if (websites.length === 0) {
      alert("请至少添加一个网站");
      return;
    }
    if (isNaN(dailyLimit) || dailyLimit <= 0) {
      alert("请输入有效的正整数时长");
      return;
    }

    // 存储到 chrome.storage.sync
    chrome.storage.sync.get(["limits"], (result) => {
      const limits = result.limits || [];
      const editingId = document.getElementById("limit-id").value; // 新增隐藏字段存储ID

      // 查找现有记录
      const existingIndex = limits.findIndex((item) =>
        editingId ? item.id === editingId : false
      );
      if (existingIndex > -1 && JSON.stringify(websites) === JSON.stringify(limits[existingIndex].websites) && dailyLimit == limits[existingIndex].dailyLimit) {
        console.log("未作任何更改");
        return;
      } else if (existingIndex > -1) {
        // 更新现有记录
        console.log("更新现有记录");
        limits[existingIndex] = {
          ...limits[existingIndex],
          websites,
          dailyLimit,
        };
      } else {
        // 新增记录
        limits.push({
          id: generateId(),
          websites,
          dailyLimit,
          createdAt: new Date().toISOString(),
        });
      }

      chrome.storage.sync.set({ limits }, () => {
        if (chrome.runtime.lastError) {
          console.error("存储失败:", chrome.runtime.lastError);
          alert("保存失败，请重试");
        } else {
          modal.style.display = "none"; // 关闭弹窗
          renderLimits(limits);
        }
      });
    });
  });

  // 新增函数：渲染限额列表
  function renderLimits(limits) {
    
    limitsContainer.innerHTML = limits
      .map(
        (item) => `
        <div class="limit-item" data-id="${item.id}"style="...">
            ${item.websites.join(", ")} - 每日限制：${item.dailyLimit}分钟
        </div>`
      )
      .join("");

    // 添加点击事件
    document.querySelectorAll(".limit-item").forEach((item) => {
      item.addEventListener("click", () => {
        const limit = limits.find((l) => l.id === item.dataset.id); // 改为用ID查找

        const websitesContainer = document.querySelector(".added-websites");
        websitesContainer.innerHTML = "";

        // 填充网站标签
        limit.websites.forEach((website) => {
          const tag = document.createElement("div");
          tag.className = "website-tag";
          tag.innerHTML = `
                    ${website}
                    <button class="remove-tag-btn">×</button>
                    <input type="hidden" name="websites" value="${website}">
                `;
          websitesContainer.appendChild(tag);
        });

        // 设置隐藏ID字段
        document.getElementById("limit-id").value = limit.id;
        document.getElementById("daily-limit").value = limit.dailyLimit;
        modal.style.display = "block";
      });
    });
  }

  // 新增函数：加载并显示数据
  function loadAndDisplayLimits() {
    chrome.storage.sync.get(["limits"], (result) => {
      if (chrome.runtime.lastError) {
        console.error("读取失败:", chrome.runtime.lastError);
        return;
      }
      renderLimits(result.limits || []);
    });
  }

  loadAndDisplayLimits();
})();

const websitesContainer = document.querySelector(".added-websites");
const addBtn = document.getElementById("add-website-btn");

// 添加网站标签
addBtn.addEventListener("click", () => {
  const input = document.getElementById("website-input");
  const website = input.value.trim();

  if (!website) {
    alert("请输入有效网站");
    return;
  }

  // 创建标签元素
  const tag = document.createElement("div");
  tag.className = "website-tag";
  tag.innerHTML = `
        ${website}
        <button class="remove-tag-btn">×</button>
        <input type="hidden" name="websites" value="${website}">
    `;

  websitesContainer.appendChild(tag);
  input.value = ""; // 清空输入框
});

// 删除标签
websitesContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-tag-btn")) {
    e.target.closest(".website-tag").remove();
  }
});
