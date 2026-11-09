# licensed-access:校园订阅全文下载(海南大学)

Gamma 论文猎手获取全文流程第 2 步。OA 拿不到全文时,在 sci-hub 之前先试机构订阅。
目前只实现 **APS**(已实测),他家按下表占位。

## DOI 路由表

| DOI 前缀 | 出版社 | 状态 |
|---|---|---|
| `10.1103` | APS | ✅ 已实现(`aps_download.mjs`),见下表订阅刊 |
| `10.1038` | Nature | 信号已验证(Download PDF),下载器未实现,暂跳过 |
| `10.1126` | Science | 同上 |
| `10.1016` | Elsevier ScienceDirect | 同上(只到2009年) |
| `10.1002` | Wiley | 同上 |
| `10.1109` | IEEE | 同上 |
| `10.1007`/`10.1063`/`10.1088` 等 | Springer/AIP/IOP | 无订阅,直接走 sci-hub |

APS 订阅刊(校园网实测,横幅 `Access Provided by Hainan University`):
PRL RMP PRA PRB PRC PRD PRE PRApplied PRFluids PRMaterials。
APS 金色 OA 刊(无横幅,免费直下,连校园网都不需要):
PRX PRXQuantum PRXEnergy PRResearch PRAB PRPER。

## 用法

```bash
# 会话级门禁,整个会话只跑一次,记住结论;非0则本会话所有论文跳过本目录
bash licensed-access/gate.sh

# 单篇下载(门禁通过且有DOI才调)
node licensed-access/aps_download.mjs <DOI> /tmp/<文件名>.pdf; echo "exit=$?"
```

退出码: `0`=已保存(输出行含 `via=subscription|oa|unverified`，诊断模式下表示检查通过);
`2`=无订阅(仅本篇跳过);
`3`=普通验证框尝试一次仍未通过、图片/文字验证码、限流或超时(**本会话剩余论文全部停用订阅**);
`4`=环境问题(同 3 处理); `5`=非 APS(仅本篇跳过)。
下载器会读取 PDF 前三页核实 DOI 或完整标题，并拒绝覆盖已有输出文件；临时文件移入回收站。HTML 验证页面不会被保存为 PDF。

## 纪律(防封全校出口 IP,底线)

- 串行,每次调用间隔**至少 15 秒**,无并发。
- 后台代理可以继续开启。脚本只清理下载子进程的代理变量，并为本次浏览器设置 `--no-proxy-server`。这不能绕过 TUN；TUN 开启时还应确认实际运行规则中 `aps.org` 分流为 DIRECT。
- 使用有界面的完整 Chrome。用户授权后，普通真人验证框允许通过 agent-browser 的页面快照定位并点击一次；等待通过后再下载。不反复点击、刷新或自动解决图片/文字验证码。
- exit 3/4 后本会话不再碰订阅;全程记日志(DOI、横幅、字节数)。
- 校外(门禁不过)整条路径跳过,不碰 CARSI/WebVPN 密码。

## 浏览器与显示器

无需把下载缓存搬到全局目录。下载器依次查找：CHROME_BIN / AGENT_BROWSER_EXECUTABLE_PATH / PUPPETEER_EXECUTABLE_PATH、系统 PATH、当前用户的 agent-browser、Puppeteer、Playwright 缓存。缓存中优先较新的完整浏览器，忽略 headless-shell；显式指定的路径失效时直接报错。

诊断环境及测试启动、快照定位和一次普通复选框操作（不访问 APS）：

    node licensed-access/aps_download.mjs --check
    node licensed-access/aps_download.mjs --prepare

DISPLAY 未设置时自动寻找 /tmp/.X11-unix 中唯一的显示器；多个显示器时通过 APS_DISPLAY 指定。资料目录默认为当前用户的 ~/.local/share/zotero-paper-hunter/aps-chrome，可用 APS_PROFILE 指定；不会删除 Singleton 锁或关闭其他浏览器。

系统 Chrome 若具有 root 所有且不可被普通用户改写的 SUID 沙箱，默认保留沙箱；用户缓存版缺少该能力且 Ubuntu/Mint 限制未特权用户命名空间时，才为自己的浏览器添加 --no-sandbox。APS_NO_SANDBOX=0 可强制保留沙箱，APS_NO_SANDBOX=1 可显式启用兼容参数。不修改系统的 AppArmor 或代理配置。

多 Linux 用户共用程序时，优先由管理员安装系统浏览器，并保留每个人独立的资料目录。不要把 /home/dell 的浏览器缓存或资料目录作为全用户公共安装；用户目录权限及缓存升级都会影响它的可用性。

## 成功判定与运行方式

成功日志包含 SAVED、字节数及 identity=verified。只有识别到 Access Provided by Hainan University 等机构访问横幅，才标记 via=subscription；明确的免费阅读标记使用 via=oa，其余为 via=unverified，不能把缺少横幅直接当成 OA 或机构订阅。

校园网门禁的本地 IPv6 和出口归属信息仅是辅助线索，真正的订阅能力以出版社机构识别及成功取回目标 PDF 为准。目前实现范围仍只有 APS。

在 T3 工具环境中，长于 10 秒的调用按全局规则用 setsid nohup 在后台执行，并分别落盘日志与退出码，再读取日志；普通终端可直接执行上述单篇下载命令。

离线回归检查：

    node --test licensed-access/test/browser_runtime.test.mjs
