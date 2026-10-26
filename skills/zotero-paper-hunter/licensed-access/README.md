# licensed-access:校园订阅全文下载(海南大学)

hunter 流程 §4 第 2 步。OA 拿不到全文时,在 sci-hub 之前先试机构订阅。
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

退出码: `0`=已保存(输出行含 `via=subscription|oa`);
`2`=无订阅(仅本篇跳过);
`3`=质询/验证码/超时(**本会话剩余论文全部停用订阅**,转 sci-hub);
`4`=环境问题(同 3 处理); `5`=非 APS(仅本篇跳过)。
下载后必须读 PDF 第一页验标题,对不上就丢弃(与 §4 原验标题条同)。

## 纪律(防封全校出口 IP,底线)

- 串行,每次调用间隔 **≥15 秒**,无并发。
- 直连:脚本自清代理变量 + 浏览器 `--no-proxy-server`;不要套任何代理。
- 真实浏览器是必需的(APS 有 Cloudflare 质询,headless/curl 一律 403),需要本机 DISPLAY。
- exit 3/4 后本会话不再碰订阅;全程记日志(DOI、横幅、字节数)。
- 校外(门禁不过)整条路径跳过,不碰 CARSI/WebVPN 密码。
