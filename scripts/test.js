console.log(normalizeUrl("https://www.bilibili.com/video/BV1Ub411w7zn/?spm_id_from=333.337.search-card.all.click"))
console.log(normalizeUrl("https://www.bilibili.com/video/BV1Ub411w7zn/?spm_id_from=333.337.search-card.all.click&vd_source=836e2cbc96ae006034Obeef17d34df94"))

function normalizeUrl(url) {
  try {
    const u = new URL(url)
    // 保留协议、主机、路径，去除查询参数和hash
    return `${u.origin}${u.pathname}`
  } catch {
    return url
  }
}
