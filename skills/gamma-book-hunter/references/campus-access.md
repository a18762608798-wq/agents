# 海南大学校园直连与 WebVPN

先判断请求是否真的从校园出口发出，再判断出版社有没有授权。开着 Mihomo TUN 时，默认路由可能走 `198.18.x`；要绑定校园接口源地址直连，不能只看浏览器是否打开了校园网。

## 凭据来源

WebVPN/CARSI 使用当前 shell 的环境变量，不在 skill、项目或 Git 中保存明文：

```bash
test -n "$HAINANU_USERNAME" && test -n "$HAINANU_PASSWORD" && echo OK
```

变量应由用户放入仅本人可读的 shell 配置，例如 `~/.bashrc`（权限 `600`）。不要 `echo` 密码，不要把密码写进命令历史或报告；缺失时请用户自行设置。非交互 shell 可能不会执行 `~/.bashrc`，读取变量时用 `bash -lic`，或先确认变量长度。

## 1. 先走校园直连

按 `gamma-paper-hunter/references/campus-access.md` 读取当前校园 IPv4、默认路由和真实 DNS：

```bash
ip -4 -brief addr show
ip route get 1.1.1.1
ip route get 1.1.1.1 from <校园IPv4>
```

用校园源地址访问出版商，不使用 TUN 出口：

```bash
curl --noproxy '*' --interface <校园IPv4> \
  --resolve <出版商域名>:443:<DoH得到的真实A记录> \
  -sSL -A 'Mozilla/5.0' '<目标URL>' -o /tmp/target.html
```

只有页面明确出现机构访问横幅或可用的 `Download PDF`/`Read Online`，才算校园直连成功。`GET ACCESS`、登录提示或“You do not have access”都不能当作成功。

## 2. CARSI/机构登录

如果页面有 `Login with Institution`，先搜索学校名称。机构列表是 T&F 服务器返回的真实列表，不凭图书馆通知假定一定存在。若学校不在列表，停止 CARSI，不要反复刷新或猜机构 ID。

## 3. WebVPN（最后手段）

入口：

```text
https://webvpn.hainanu.edu.cn/
```

统一认证需要 `HAINANU_USERNAME` 和 `HAINANU_PASSWORD`。登录后通常会进入二次认证页，要求短信或企业微信动态码；必须由用户提供，不能自动破解、复用旧码或绕过。验证码有时效，过期后重新发送并再次询问。

WebVPN 只在直连和 CARSI 都不成功时使用，并记录实际原因。不要把“登录成功”当成“已有全文”，最终仍以出版社页面权限、真实 PDF 字节和文件身份为准。

## 2026-11-10 实测记录

- 校园无线接口绑定后公网出口为 `202.100.214.101`（海口电信），不是 TUN 的海外节点。
- T&F `An Introduction to the Bootstrap`（DOI `10.1201/9780429246593`）在该出口仍显示 `You do not have access to this content currently`；另一本 CRC 书也相同。
- CARSI 门户有海南大学，且能完成学校 IdP 登录；但 T&F eBooks 的“访问资源”跳转最终返回 `ENTITY_ID_NOT_AVAILABLE`，说明 T&F 没有登记该 IdP 实体。T&F 自己的机构接口返回 1671 个机构，搜索 `Hainan`/`海南` 也无结果。
- 因此这不是“忘了绕 TUN”：校园直连 IP 未被 T&F 授权，CARSI 实体也未在 T&F 配置。可请图书馆核对校园 NAT 出口和 CARSI/T&F 实体配置；WebVPN 是仍需二次认证的后备路径。
