// 作者名称的国际化映射
const authorMap = {
  "Benjamin Franklin": {
    "en": "Benjamin Franklin",
    "zh_CN": "本杰明·富兰克林"
  },
  "Steve Jobs": {
    "en": "Steve Jobs",
    "zh_CN": "史蒂夫·乔布斯"
  },
  "Napoleon Bonaparte": {
    "en": "Napoleon Bonaparte",
    "zh_CN": "拿破仑·波拿巴"
  },
  "Mark Twain": {
    "en": "Mark Twain",
    "zh_CN": "马克·吐温"
  },
  "Peter Drucker": {
    "en": "Peter Drucker",
    "zh_CN": "彼得·德鲁克"
  },
  "Warren Buffett": {
    "en": "Warren Buffett",
    "zh_CN": "沃伦·巴菲特"
  },
  "William Shakespeare": {
    "en": "William Shakespeare",
    "zh_CN": "威廉·莎士比亚"
  },
  "Bertrand Russell": {
    "en": "Bertrand Russell",
    "zh_CN": "伯特兰·罗素"
  },
  "Nathaniel Hawthorne": {
    "en": "Nathaniel Hawthorne",
    "zh_CN": "纳撒尼尔·霍桑"
  },
  "William Penn": {
    "en": "William Penn",
    "zh_CN": "威廉·佩恩"
  },
  "Mahatma Gandhi": {
    "en": "Mahatma Gandhi",
    "zh_CN": "圣雄甘地"
  },
  "Lu Xun": {
    "en": "Lu Xun",
    "zh_CN": "鲁迅"
  },
  "Thomas Huxley": {
    "en": "Thomas Huxley",
    "zh_CN": "赫胥黎"
  },
  "Chinese Proverb": {
    "en": "Chinese Proverb",
    "zh_CN": "中国古训"
  },
  "Tao Yuanming": {
    "en": "Tao Yuanming",
    "zh_CN": "陶渊明"
  },
  "Qian Hetan": {
    "en": "Qian Hetan",
    "zh_CN": "钱鹤滩"
  },
  "Bai Juyi": {
    "en": "Bai Juyi",
    "zh_CN": "白居易"
  },
  "Horace": {
    "en": "Horace",
    "zh_CN": "贺拉斯"
  },
  "Confucius": {
    "en": "Confucius",
    "zh_CN": "孔子"
  }
};

// 名言数据库
const quotes = [
  {
    text: "Dost thou love life? Then do not squander time, for that is the stuff life is made of.",
    author: "Benjamin Franklin",
  },
  {
    text: "Time is money.",
    author: "Benjamin Franklin",
  },
  {
    text: "Your time is limited, so don't waste it living someone else's life.",
    author: "Steve Jobs",
  },
  {
    text: "I may lose a battle, but I shall never lose a minute.",
    author: "Napoleon Bonaparte",
  },
  {
    text: "If it's your job to eat a frog, it's best to do it first thing in the morning.",
    author: "Mark Twain",
  },
  {
    text: "Time is the scarcest resource and unless it is managed nothing else can be managed.",
    author: "Peter Drucker",
  },
  {
    text: "Efficiency is doing things right; effectiveness is doing the right things.",
    author: "Peter Drucker",
  },
  {
    text: "Time is the friend of the wonderful business, the enemy of the mediocre.",
    author: "Warren Buffett",
  },
  {
    text: "Better three hours too soon than a minute too late.",
    author: "William Shakespeare",
  },
  {
    text: "The time you enjoy wasting is not wasted time.",
    author: "Bertrand Russell",
  },
  {
    text: "Time flies over us, but leaves its shadow behind.",
    author: "Nathaniel Hawthorne",
  },
  {
    text: "Lost time is never found again.",
    author: "Benjamin Franklin",
  },
  {
    text: "Time is what we want most, but what we use worst.",
    author: "William Penn",
  },
  {
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
  },
  {
    text: "时间就是生命，无端的空耗别人的时间，其实无异于谋财害命。",
    author: "Lu Xun",
  },
  {
    text: "时间最不偏私，给任何人都是二十四小时；时间也最偏私，给任何人都不是二十四小时。",
    author: "Thomas Huxley",
  },
  {
    text: "一寸光阴一寸金，寸金难买寸光阴。",
    author: "Chinese Proverb",
  },
  {
    text: "光阴似箭，日月如梭。",
    author: "Chinese Proverb",
  },
  {
    text: "盛年不重来，一日难再晨。及时当勉励，岁月不待人。",
    author: "Tao Yuanming",
  },
  {
    text: "明日复明日，明日何其多。我生待明日，万事成蹉跎。",
    author: "Qian Hetan",
  },
  {
    text: "今日事，今日毕。",
    author: "Chinese Proverb",
  },
  {
    text: "年华一去不复返，事业放弃在难成。",
    author: "Bai Juyi",
  },
  {
    text: "时间能使隐匿的东西显露，也能使灿烂夺目的东西黯然无光。",
    author: "Horace",
  },
  {
    text: "逝者如斯夫，不舍昼夜。",
    author: "Confucius",
  },
]

// 获取当前语言
function getCurrentLanguage() {
  // 从chrome.i18n获取当前语言
  const language = chrome.i18n.getUILanguage();
  // 如果是中文，返回zh_CN，否则返回en
  return language.startsWith('zh') ? 'zh_CN' : 'en';
}

// 获取本地化的作者名称
function getLocalizedAuthorName(authorKey) {
  const language = getCurrentLanguage();
  if (authorMap[authorKey] && authorMap[authorKey][language]) {
    return authorMap[authorKey][language];
  }
  // 如果没有找到对应的翻译，返回原始作者名
  return authorKey;
}

// 随机选择名言的函数
function getRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length)
  return quotes[randomIndex]
}

// 页面加载时显示随机名言
function displayRandomQuote() {
  const quote = getRandomQuote()
  const quoteTextElement = document.querySelector(".quote-text")
  const quoteAuthorElement = document.querySelector(".quote-author")

  if (quoteTextElement && quoteAuthorElement) {
    quoteTextElement.textContent = quote.text
    // 使用本地化的作者名称
    const localizedAuthorName = getLocalizedAuthorName(quote.author)
    quoteAuthorElement.textContent = `—— ${localizedAuthorName}`

    // 添加淡入效果
    const heroQuote = document.getElementById("hero-quote")
    if (heroQuote) {
      heroQuote.style.opacity = "0"
      setTimeout(() => {
        heroQuote.style.transition = "opacity 0.5s ease-in-out"
        heroQuote.style.opacity = "1"
      }, 100)
    }
  }
}

// 当页面加载完成时执行
document.addEventListener("DOMContentLoaded", displayRandomQuote)

// 如果页面已经加载完成，直接执行
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", displayRandomQuote)
} else {
  displayRandomQuote()
}
