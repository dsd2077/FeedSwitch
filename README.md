<div align="center">
  <a href="./README.md">中文</a> / <a href="./README_en.md">English</a>
</div>

<p align="center">
  <img src="./icons/宣传图/promotion1.png" alt="FeedSwitch：重新掌控你的注意力" width="440">
</p>

# FeedSwitch

FeedSwitch 是一个 Chrome 浏览器扩展，帮助你减少信息流和推荐内容带来的干扰，把时间和注意力还给真正重要的事情。它把“屏蔽干扰”“时间记录”和“使用限额”放在同一个轻量的工具里：需要专注时一键开启，休息时随时恢复。

## 你可以用 FeedSwitch 做什么

- **专注 / 娱乐模式**：一键切换。专注模式隐藏已支持网站的信息流和推荐区域；娱乐模式恢复这些内容。
- **记录网站使用时间**：按网站、日期和时段查看使用情况，并区分专注时间与娱乐时间。
- **设置网站限额**：为网站设置每日或按星期自定义的使用时长，帮助你把“少刷一会儿”变成可执行的规则。
- **延迟生效**：删除限额或增加当天可用时间会在次日生效，避免冲动地绕过刚设好的限制。
- **快速切换和搜索**：从浏览器工具栏弹窗切换模式、搜索已记录的网站、固定常用网站。
- **隐私友好**：数据保存在浏览器本地，不需要注册账号或上传浏览记录。

> FeedSwitch 的核心是帮助你管理注意力，而不是完全禁止上网。你可以按自己的工作、学习和休息节奏配置规则。

## 快速开始

### 1. 安装并编译项目

你需要 Node.js（推荐 22 LTS，包含 npm）、Git 和 Google Chrome。在终端执行：

```bash
git clone https://github.com/dsd2077/FeedSwitch.git
cd FeedSwitch
npm ci
npm run build
```

`npm ci` 根据 `package-lock.json` 安装依赖；`npm run build` 使用 Vite 编译内容脚本，并生成 `dist/content.js`。

### 2. 在 Chrome 中加载扩展

1. 在 Chrome 打开 `chrome://extensions/`。
2. 打开右上角的 **开发者模式**。
3. 点击 **加载已解压的扩展程序**。
4. 选择包含 `manifest.json` 的 **FeedSwitch 项目根目录**，不要只选择 `dist/`。
5. 打开任意已支持的网站，点击工具栏中的 FeedSwitch 图标。

加载后修改代码时，先运行 `npm run build`，再在扩展管理页面点击扩展卡片上的刷新按钮，并刷新目标网页。

### 3. 第一次使用

1. 在弹窗顶部打开 **专注**，立即隐藏已支持网站的信息流和推荐内容。
2. 查看弹窗中的网站列表，点击网站可展开页面记录；使用搜索框快速定位网站。
3. 点击设置入口，进入 **网站限额**，添加域名并设置每日或按星期的时长。
4. 打开 **统计** 页面，查看本周和当天的使用分布。
5. 如需快捷键，可前往 `chrome://extensions/shortcuts` 设置 `toggle-tracking`。

<p align="center">
  <img src="./icons/popup%20400%2A640.png" alt="FeedSwitch 弹窗：切换模式并查看网站使用时间" width="400">
</p>

## 界面一览

### 弹窗：查看当天使用情况

弹窗会按网站列出当天的总时长，并用进度条区分专注时间和娱乐时间。点击网站条目可以继续查看子域名和页面；图钉按钮可以把常用网站固定在顶部。

### 统计：理解你的时间分布

统计页面提供周视图和日视图：可以查看总时长、平均时长、每个网站的使用时间，以及专注和娱乐时间的分布。数据在本地按日期保存。

<p align="center">
  <img src="./icons/time-usage%201400%2A560.png" alt="FeedSwitch 网站使用时间统计" width="100%">
</p>

### 限额：提前设定边界

在“网页限额”页面添加域名后，可以选择每天统一限额，或分别设置周日至周六的时长。删除限额、删除网站或增加当天时长的操作会在次日生效。

<p align="center">
  <img src="./icons/limits.png" alt="FeedSwitch 网页限额设置" width="100%">
</p>

## 支持范围

FeedSwitch 内置了针对多个常见中文和国际网站的信息流、推荐区域及页面干扰元素的规则。完整的网站列表和每个网站的生效范围，请查看 [支持的网站及屏蔽内容](./SUPPORTED_SITES.md)。

网站页面结构会持续变化。如果发现某个规则失效，请提交 [Issue](https://github.com/dsd2077/FeedSwitch/issues)，并附上网站、页面地址和复现步骤。

## 开发、监听与打包

在项目根目录运行：

```bash
# 单次编译
npm run build

# 修改内容脚本后自动重新编译
npm run watch

# 编译并创建 Chrome 扩展压缩包
npm run create-zip
```

`npm run create-zip` 会先执行编译，再生成 `feedSwitch-extension.zip`。打包脚本依赖系统中的 `zip` 命令；发布或上传前请确认压缩包根目录直接包含 `manifest.json`。

## 常见问题

**为什么加载后页面没有变化？** 先确认选择的是项目根目录，并且其中存在 `manifest.json` 和已生成的 `dist/content.js`。然后在 `chrome://extensions/` 刷新扩展，再刷新网页。

**为什么设置的限额没有立即删除或增加？** 这是延迟生效机制：删除限额或增加当天使用时长会在次日生效，当前日期的限制不会被临时放宽。

**为什么有些网站没有被屏蔽？** 只有已配置规则的网站和对应页面会执行信息流屏蔽。请查看 [支持列表](./SUPPORTED_SITES.md)；如果网站不在列表中，可以提交 Issue。

**数据会上传到服务器吗？** 不会。使用时间、限额和模式状态保存在 Chrome 的本地扩展存储中。

## 注意事项

- 网站改版可能导致个别规则暂时失效。
- 专注模式会改变部分网站的默认页面布局；切换到娱乐模式即可恢复信息流。
- 扩展需要访问网页内容，才能识别并隐藏页面中的目标区域。

## 相关文档

- [支持的网站及屏蔽内容](./SUPPORTED_SITES.md)
- [延迟变更说明](./DELAYED_CHANGES_SUMMARY.md)
- [English README](./README_en.md)

---

FeedSwitch 希望帮你减少无意识的滚动，把注意力留给你主动选择的事情。
