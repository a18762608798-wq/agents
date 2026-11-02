# Times New Roman 绘图字体

本项目使用用户提供的四个原始字体文件，已纳入 Git：

| 文件 | 字形 |
| --- | --- |
| `times.ttf` | Regular |
| `timesbd.ttf` | Bold |
| `timesi.ttf` | Italic |
| `timesbi.ttf` | Bold Italic |

`scripts/figure_style.py` 中的 `apply_figure_style()` 会按文件注册这四种字形，优先于系统同名 Times New Roman；不需要安装到操作系统。字体注册只对当前 Python 进程有效，因此每个绘图进程均须调用该 helper。

目录定位从 helper 文件向上查找 `assets/fonts/times-new-roman/`，不依赖启动时的工作目录。通用 helper 可通过 `font_dir=...` 显式指定目录；若存在本地目录但缺字形或字体族不匹配，立即报错，不静默换字体。数学字体仍用 Matplotlib 自带 STIX，不使用中文论文的 Noto 字体。

## 授权说明

这些字体是 Microsoft/Monotype 字体，不是开源字体，也不适用旁边 Noto 字体的 SIL OFL。纳入本项目 Git 不会授予额外的使用、复制或再分发权利；公开发布或再分发前须确认原授权允许。

`times.ttf` 内嵌说明包括：

> Microsoft supplied font. You may use this font to create, display, and print content as permitted by the license terms or terms of use, of the Microsoft product, service, or content in which this font was included. You may only (i) embed this font in content as permitted by the embedding restrictions included in this font; and (ii) temporarily download this font to a printer or other output device to help print content. Any other use is prohibited.

原字体中的版权、商标及嵌入限制保持不变。字体内部分 Hebrew layout logic 的 MIT 声明不代表整套字体采用 MIT 许可证。四个原始字体文件及本说明随 `scientific-computing` preset 的 `assets/fonts/times-new-roman/` 保存；新项目通过该 preset 的 `scripts/install-fonts.sh` 复制到项目同名目录。
