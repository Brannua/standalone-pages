# standalone-pages

這裡存放 [liupj.top](https://liupj.top) 的獨立 markdown 頁面，與 hexo 部落格完全分開。

## 發布方式

1. 在倉庫根目錄新增一個 `.md` 檔案，例如 `intro.md`
2. 直接 push 到 main 分支
3. 等待約 5 分鐘，即可透過 `https://liupj.top/intro` 訪問

## 路徑對應

| 檔案路徑 | 網址 |
|---------|------|
| `intro.md` | `https://liupj.top/intro` |
| `about.md` | `https://liupj.top/about` |
| `notes/hello.md` | `https://liupj.top/notes/hello` |

## 可選 frontmatter

```markdown
---
title: 頁面標題
date: 2026-10-21
---

# 正文
```

不寫 frontmatter 也沒關係，會自動使用檔案名作為標題。
