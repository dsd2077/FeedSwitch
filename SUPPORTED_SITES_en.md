# Supported Websites and Blocked Content

FeedSwitch currently provides feed, recommendation, and distracting-element blocking rules for several popular websites. Rules may change as websites update; please open an issue if a rule stops working.


### 1. Bilibili (bilibili.com)

**Blocked Content:**

- Main feed layout
- Header channel navigation
- Hot search trending areas and double trending displays
- Ad block tips
- Right-side recommendation list
- End-screen related recommendations

**Additional Features:**

- Remove search input placeholder text

### 2. Baidu (baidu.com)

**Blocked Content:**

- Hot search wrapper
- New search guide bubble
- Offset content area

### 3. Zhihu (zhihu.com)

**Blocked Content:**

- Main story feed
- Loading progress bar
- Hot search cards
- Specific style elements
- Post right-side content area

**Additional Features:**

- Remove search input placeholder text
- Delete "Search Discovery" related content
- Adjust search main area and post content area width to 1000px

### 4. CSDN (csdn.net)

**Blocked Content:**

- Carousel slide paid content
- Sidebar hot articles
- Sidebar categories
- Sidebar archives
- Sidebar new comments
- Toolbar advertisements
- Right-side fixed hidden elements

### 5. Juejin (juejin.cn)

**Blocked Content:**

- Sidebar blocks
- Top banner container
- Image advertisements in article areas

### 6. Xiaohongshu (xiaohongshu.com)

**Blocked Content:**

- Explore feeds
- Channel container

### 7. Jianshu (jianshu.com)

**Blocked Content:**

- Sidebar

### 8. YouTube (youtube.com)

**Blocked Content:**

- Homepage feed (homepage only, doesn't affect subscription page)
- Sidebar navigation items:
  - Home links
  - Shorts links
- Right sidebar related videos on watch pages

**Additional Features:**

- Automatically remove notification numbers from page title
- Hide sidebar "Explore" section (third navigation area)

### 9. Douyin (douyin.com)

**Blocked Content:**

- Right container content
- Navigation tabs:
  - Discover tab
  - Recommend tab
  - Live tab
  - VS tab
  - Series tab

**Additional Features:**

- Automatically redirect to featured page when accessing recommendation page

### 10. Weibo (weibo.com)

**Blocked Content:**

- Homepage feed
- Loading progress bars
- Right sidebar content
- Video recommendation feeds
- Video ranking lists
- Search result sidebars
- Featured channels

### 11. Tencent Video (v.qq.com)

**Blocked Content:**

- Main channel container
- Channel pages
- Web channels
- Channel page scroll areas
- Flex containers
- Hot search areas
- Popular games section
- Homepage content wrapper

### 12. iQiyi (iqiyi.com)

**Blocked Content:**

- Navigation sidebar
- Page view containers (when not in search mode)

**Additional Features:**

- Intelligently detects search mode and adjusts blocking accordingly

### 13. Youku (youku.com)

**Blocked Content:**

- Channel module containers (hides all child divs except the first one)

### 14. TikTok (tiktok.com)

**Blocked Content:**

- Homepage hot page side actions container
- Explore entries and related containers (sidebar/topbar)
- Live entries and related containers (sidebar/topbar)
- Explore layout containers

**Additional Features:**

- Mute all media within explore-related containers
- Hide progress indicators within explore containers
- Fallback hiding of the explore containers themselves

### 15. Facebook (facebook.com)

**Blocked Content:**

- Feed container
- Single post articles
- Paged/virtualized feed units (pagelets starting with FeedUnit\_)
- Watch entry
- Gaming entries and related external links
- Reels entry

### 16. X (x.com)

**Blocked Content:**

- Home/Explore timeline regions
- Tweet article containers
- Tweet outer cell elements (virtual list cells)
- New posts status bars

**Scope:**

- Applies only on /home, /explore, and paths containing /communities

### 17. Instagram (instagram.com)

**Blocked Content:**

- Main content area
- Footer/contentinfo

**Scope:**

- Applies on /, /explore, and /reels

### 18. Reddit (reddit.com)

**Blocked Content:**

- Main content container `#subgrid-container`

**Scope:**

- Applies on `/`, `/r/all`, `/explore`, and `/r/popular`

**Additional Features:**

- Uses dynamic hiding instead of removal for better compatibility
