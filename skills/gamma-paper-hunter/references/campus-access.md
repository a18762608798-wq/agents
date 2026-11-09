# 海南大学 APS 订阅下载

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
