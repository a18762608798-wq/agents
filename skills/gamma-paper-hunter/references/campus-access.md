# 海南大学校园访问与 APS 订阅下载

先判断请求是否真的从校园出口发出，再判断学校有没有订阅。代理或 Mihomo TUN 开启时，默认路由和 DNS 可能都指向本机代理；出版商返回付费页、登录页或只给元数据，不能直接解释为“学校无权限”。

## 1. 判断当前出口

```bash
env | grep -iE '^(http|https|all|no)_proxy=' || true
ip route get 1.1.1.1
resolvectl status
ip -4 -brief addr show
```

本机 2026-11-10 实测：无线接口 `wlxfc221c1000c2` 有校园 IPv4 `10.17.149.255/21`，校园 DNS 为 `210.37.40.4/5`；默认请求可能显示经 `Mihomo` 和 `198.18.x`。地址会随 DHCP 变化，不硬编码，按上一步重新读取。

发现默认路由是 Mihomo 时，用校园源地址测试到校园 DNS 的连通性；不要直接按域名访问出版商，因为 DNS 可能仍返回 `198.18.x`：

```bash
CAMPUS_IP=$(ip -4 -brief addr show wlxfc221c1000c2 | awk '{print $3}' | cut -d/ -f1)
curl --noproxy '*' --interface "$CAMPUS_IP" -sSIL --max-time 10 'http://210.37.40.4/'
```

返回校园服务器响应（例如 404）即可确认源地址路由可用；超时则报告网络路径未验证，不猜订阅状态。访问出版商仍需下一步的真实地址和 `--resolve`。

## 2. 解析真实地址

Mihomo 可能劫持 DNS，查询校园 DNS 也会得到 `198.18.x` 假地址。使用代理侧 DoH 取真实 A 记录，再把地址传给校园直连的 `--resolve`：

```bash
SPRINGER_IP=$(curl -sS --max-time 20 -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=link.springer.com&type=A' \
  | jq -r '.Answer[] | select(.type==1) | .data' | head -1)
IDP_IP=$(curl -sS --max-time 20 -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=idp.springer.com&type=A' \
  | jq -r '.Answer[] | select(.type==1) | .data' | head -1)
```

不要用 `198.18.x` 地址做校园直连。

## 3. Springer 验证示例

先读文章页并保存 cookie，检查 `Open Access`、`Download PDF`、`Access this article` 或订阅横幅：

```bash
curl --noproxy '*' --interface "$CAMPUS_IP" \
  --resolve link.springer.com:443:"$SPRINGER_IP" \
  --resolve idp.springer.com:443:"$IDP_IP" \
  -sSL --max-time 30 -A 'Mozilla/5.0' \
  -c /tmp/springer.cookies -b /tmp/springer.cookies \
  -o /tmp/article.html \
  'https://link.springer.com/article/<DOI>'

grep -oiE 'Download PDF|Open Access|Access this article|Buy article' /tmp/article.html | sort -u
```

页面确认可访问后，再下载 PDF 并用 `file`、`pdfinfo` 和正文前 3 页核对标题、作者、DOI：

```bash
curl --noproxy '*' --interface "$CAMPUS_IP" \
  --resolve link.springer.com:443:"$SPRINGER_IP" \
  -sSL --max-time 60 -A 'Mozilla/5.0' \
  -b /tmp/springer.cookies -c /tmp/springer.cookies \
  -o /tmp/article.pdf \
  'https://link.springer.com/content/pdf/<DOI>.pdf'

file /tmp/article.pdf
pdfinfo /tmp/article.pdf
```

只有文章页或访问横幅确认校园授权，或文章明确标为 Open Access 时，才记录为合法全文来源。需要登录、验证码或购买时停止；不要尝试绕过访问控制。

## 4. 海南大学 APS 订阅下载

使用本 skill 自带的校园订阅下载器，只处理全文下载，不涉及任何文献库入库流程。先检查目录存在，读取其中 `README.md`：

`~/.agents/skills/gamma-paper-hunter/licensed-access/`

当前支持 APS DOI（`10.1103`）；目录缺失或环境检查失败时报告，不假装已尝试校园订阅。

```bash
bash ~/.agents/skills/gamma-paper-hunter/licensed-access/gate.sh
node ~/.agents/skills/gamma-paper-hunter/licensed-access/aps_download.mjs --check
node ~/.agents/skills/gamma-paper-hunter/licensed-access/aps_download.mjs '<DOI>' '<本任务临时目录>/article.pdf'
```

- 门禁每会话一次，非 0 则本会话跳过订阅分支。网络地址仅是辅助信号；成功的目标 PDF 与海南大学访问横幅才是订阅证据。
- 后台代理继续运行。下载器只让自己的请求直连；TUN 代理还须确认 APS 实际规则是 DIRECT，不能仅靠清除环境变量推断。
- 串行，每次 APS 下载调用间隔至少 15 秒。脚本优先系统 Chrome，其次当前用户缓存，不共享其他 Linux 用户的浏览器资料。
- 退出码 `0` 成功，`2/5` 仅本篇跳过，`3/4` 本会话余下论文停用订阅。保留原因；普通验证框按当前用户授权最多尝试一次，不反复点击或刷新，不自动解图片/文字验证码。
- 脚本验证前 3 页 DOI/标题，记录字节数。仅 `via=subscription` 可写“海南大学订阅”；`via=oa` 写开放获取，`unverified` 不猜来源性质。
- T3 的长命令按全局规则用 `setsid nohup` 后台执行，落盘日志和退出码，再短轮询；不要让 10 秒的 shell 返回清理下载器。
- 下载成功后，经 Gamma `import_pdf_page` 导入真实字节并补原生属性；超过其 16 MiB 上传上限时按 MCP 约定处理。临时文件用 `mv` 移入唯一命名回收站位置，不用 `rm`。
