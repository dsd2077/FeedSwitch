import fs from "fs"
import { execSync } from "child_process"

console.log("开始构建Chrome插件包...")

// 先构建content脚本
console.log("正在构建content脚本...")
execSync("npm run build", { stdio: "inherit" })

// 需要包含的文件和目录
const filesToInclude = ["manifest.json", "_locales", "icons", "libs", "options", "popup", "scripts", "dist"]

console.log("正在创建zip文件...")

try {
  // 删除旧的zip文件（如果存在）
  if (fs.existsSync("feedSwitch-extension.zip")) {
    fs.unlinkSync("feedSwitch-extension.zip")
  }

  // 构建zip命令，只包含必要的文件
  const zipCommand = `zip -r feedSwitch-extension.zip ${filesToInclude.join(" ")}`

  execSync(zipCommand, { stdio: "inherit" })

  console.log("✅ Chrome插件包创建成功: feedSwitch-extension.zip")
  console.log("")
  console.log("📁 zip文件位置: 项目根目录/feedSwitch-extension.zip")
  console.log("")
  console.log("🚀 现在你可以将 feedSwitch-extension.zip 上传到Chrome Web Store了！")
  console.log("")
  console.log("上传步骤：")
  console.log("1. 访问 https://chrome.google.com/webstore/devconsole/")
  console.log('2. 点击"新增项目"')
  console.log("3. 上传 feedSwitch-extension.zip 文件")
} catch (error) {
  console.error("创建zip文件时出错:", error.message)
  console.log("")
  console.log("手动打包说明：")
  console.log("1. 选中以下文件和文件夹：")
  filesToInclude.forEach((file) => {
    console.log(`   - ${file}`)
  })
  console.log("2. 右键创建压缩包，命名为 feedSwitch-extension.zip")
  console.log("3. 确保 manifest.json 在zip包的根目录")
}
