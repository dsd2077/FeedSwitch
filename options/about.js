// 名言数据库
const quotes = [
  {
    text: "Dost thou love life? Then do not squander time, for that is the stuff life is made of.",
    author: "本杰明·富兰克林",
  },
  {
    text: "Time is money.",
    author: "本杰明·富兰克林",
  },
  {
    text: "Your time is limited, so don't waste it living someone else's life.",
    author: "史蒂夫·乔布斯",
  },
  {
    text: "I may lose a battle, but I shall never lose a minute.",
    author: "拿破仑·波拿巴",
  },
  {
    text: "If it's your job to eat a frog, it's best to do it first thing in the morning.",
    author: "马克·吐温",
  },
  {
    text: "Time is the scarcest resource and unless it is managed nothing else can be managed.",
    author: "彼得·德鲁克",
  },
  {
    text: "Efficiency is doing things right; effectiveness is doing the right things.",
    author: "彼得·德鲁克",
  },
  {
    text: "Time is the friend of the wonderful business, the enemy of the mediocre.",
    author: "沃伦·巴菲特",
  },
  {
    text: "Better three hours too soon than a minute too late.",
    author: "威廉·莎士比亚",
  },
  {
    text: "The time you enjoy wasting is not wasted time.",
    author: "伯特兰·罗素",
  },
  {
    text: "Time flies over us, but leaves its shadow behind.",
    author: "纳撒尼尔·霍桑",
  },
  {
    text: "Lost time is never found again.",
    author: "本杰明·富兰克林",
  },
  {
    text: "Time is what we want most, but what we use worst.",
    author: "威廉·佩恩",
  },
  {
    text: "The future depends on what you do today.",
    author: "圣雄甘地",
  },
  {
    text: "时间就是生命，无端的空耗别人的时间，其实无异于谋财害命。",
    author: "鲁迅",
  },
  {
    text: "时间最不偏私，给任何人都是二十四小时；时间也最偏私，给任何人都不是二十四小时。",
    author: "赫胥黎",
  },
  {
    text: "一寸光阴一寸金，寸金难买寸光阴。",
    author: "中国古训",
  },
  {
    text: "光阴似箭，日月如梭。",
    author: "中国古训",
  },
  {
    text: "盛年不重来，一日难再晨。及时当勉励，岁月不待人。",
    author: "陶渊明",
  },
  {
    text: "明日复明日，明日何其多。我生待明日，万事成蹉跎。",
    author: "钱鹤滩",
  },
  {
    text: "今日事，今日毕。",
    author: "中国古训",
  },
  {
    text: "浪费时间是一桩大罪过。",
    author: "卢梭",
  },
  {
    text: "年华一去不复返，事业放弃在难成。",
    author: "白居易",
  },
  {
    text: "时间能使隐匿的东西显露，也能使灿烂夺目的东西黯然无光。",
    author: "贺拉斯",
  },
  {
    text: "逝者如斯夫，不舍昼夜。",
    author: "孔子",
  },
]

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
    quoteAuthorElement.textContent = `—— ${quote.author}`

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
