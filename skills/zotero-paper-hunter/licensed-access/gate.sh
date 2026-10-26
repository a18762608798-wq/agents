#!/usr/bin/env bash
# licensed-access/gate.sh —— 会话级校园网门禁(整个会话只跑一次,记住结论)
# exit 0 = 在校园网内,可试订阅下载; exit 非0 = 不在,直接跳过订阅走 sci-hub
# 本脚本第一件事就是清掉代理变量,之后所有检测全部直连,不受外部代理设置影响
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY all_proxy ALL_PROXY no_proxy NO_PROXY
PREFIX="${CAMPUS_IPV6_PREFIX:-2001:250:3801}"

if ! command -v ip >/dev/null 2>&1; then
  echo "FAIL: 无 ip 命令,无法检测,跳过订阅"
  exit 1
fi

# --- 第1层:本机全局 IPv6 是否落在校园段(离线快检) ---
if ip -6 addr show scope global 2>/dev/null | grep -q "$PREFIX"; then
  echo "本地hint: 本机全局IPv6命中校园段 $PREFIX"
else
  echo "FAIL: 本机无校园网IPv6段($PREFIX),跳过订阅走 sci-hub"
  exit 1
fi

# --- 第2层:出口IP确认(直连回显服务) ---
EGRESS=$(curl -s --max-time 10 https://myip.ipip.net 2>/dev/null || true)
echo "出口IP(直连): ${EGRESS:-回显服务不可达}"
if [ -z "$EGRESS" ]; then
  echo "PASS(警告): 回显不可达,凭本地hint放行;以文章页订阅横幅为终判"
  exit 0
fi
if echo "$EGRESS" | grep -qE "教育网|海南|海口|CERNET"; then
  echo "PASS: 出口IP为校园网,可试订阅下载"
  exit 0
else
  echo "FAIL: 出口IP非校园网,跳过订阅走 sci-hub"
  exit 1
fi
