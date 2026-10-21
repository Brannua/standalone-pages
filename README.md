# standalone-pages

这里存放 [liupj.top](https://liupj.top) 的独立 markdown 页面，与 hexo 博客完全分开。

## 为什么独立出来

想快速发布一些临时或专题内容，所以这些页面不属于 hexo 博客，也就无需污染 hexo 的源码仓库。

## 发布方式

1. 在仓库根目录新增一个 `.md` 文件，例如 `intro.md`
2. 直接 push 到 main 分支
3. 等待约 5 分钟，即可通过 `https://liupj.top/intro` 访问

## 路径对应

| 文件路径 | 网址 |
|---------|------|
| `intro.md` | `https://liupj.top/intro` |
| `about.md` | `https://liupj.top/about` |
| `notes/hello.md` | `https://liupj.top/notes/hello` |

## 可选 frontmatter

```markdown
---
title: 页面标题
date: 2026-10-21
---

# 正文
```

不写 frontmatter 也没关系，页面不会显示标题，保持清爽。
