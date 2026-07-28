# Pixel

[English](README.md) · [在线站点](https://ao2233.github.io)

给长文和小型归档用的 Hugo 主题。视觉来自旧屏幕和轻小说：点阵字、章节编号、细线，以及克制的红色。它有游戏界面的节奏，但正文仍然像正文。

![Pixel 浅色首页](screenshots/home-light.png)

## 阅读优先

正文宽度保持在适合长时间阅读的范围。`CH` 和 `SCENE` 随文章结构编号，每个 Chapter 内的 Scene 重新计数。宽屏下，目录可以像便签一样移动、缩放；空间不足时，它会自动回到正文里。

![Pixel 浅色文章页](screenshots/article-light.png)

<table>
  <tr>
    <td width="68%"><img src="screenshots/article-dark.png" alt="Pixel 深色文章页"></td>
    <td width="32%"><img src="screenshots/article-mobile.png" alt="Pixel 移动端文章页"></td>
  </tr>
  <tr>
    <td align="center">深色</td>
    <td align="center">移动端</td>
  </tr>
</table>

## 内置

- 跟随系统的亮色与暗色模式，移动端使用全宽排版
- 面向中日韩文本的像素字体、代码高亮、KaTeX 与 Mermaid
- 可移动、可缩放的文章目录，以及空间不足时的文内回退
- 图片缩放、提示框、折叠框和常用媒体短代码

全部内容组件的参数和可直接复制的示例，集中整理在 [Shortcode 参考](SHORTCODES.zh-CN.md)中。

## 使用

添加主题：

```sh
git submodule add https://github.com/AO2233/pixel.git themes/pixel
```

在 Hugo 配置中启用：

```yaml
theme: pixel
```

仓库内的 [`hugo.yaml`](hugo.yaml) 可以直接作为配置参考，其中包含 Goldmark、代码高亮、目录、菜单和主题参数。

## 许可与致谢

Pixel 的原创主题代码采用 [MIT License](LICENSE)。`static/fonts/` 中的主题字体不属于该许可证的授权范围，本仓库也不为这些字体授予公开许可。发布或再分发主题前，请先阅读[字体声明](FONT_NOTICE.md)。

主题使用的 JavaScript 库保留各自的许可证。具体版本、上游项目和致谢见[第三方组件声明](THIRD_PARTY_NOTICES.md)。
