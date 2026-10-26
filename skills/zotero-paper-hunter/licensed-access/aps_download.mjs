#!/usr/bin/env node
// licensed-access/aps_download.mjs —— APS 订阅全文下载(校园网 IP 认证)
// 用法: node aps_download.mjs <DOI|文章页URL|PDF直链URL> <输出.pdf>
// 环境: CHROME_BIN(默认google-chrome) APS_DEBUG_PORT(默认9334) APS_PROFILE(默认系统临时目录/hunter-aps-profile)
// 退出码: 0=成功保存; 2=无订阅(本篇跳过,订阅通道对他篇继续);
//         3=质询/验证码/超时(本会话剩余论文全部停用订阅); 4=环境问题(停用订阅); 5=非APS(本篇跳过)
// 调用方纪律见 README.md: 串行,每次调用间隔>=15秒,直连(本脚本自清代理变量+浏览器--no-proxy-server)
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [TARGET, OUT] = process.argv.slice(2);
if (!TARGET || !OUT) {
  console.error("用法: node aps_download.mjs <DOI|文章页URL|PDF直链URL> <输出.pdf>");
  process.exit(4);
}
// 自清代理变量:之后本进程及拉起的浏览器全部直连
for (const k of ["http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "all_proxy", "ALL_PROXY"]) delete process.env[k];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let chrome = null;
async function cleanup() {
  try {
    const v = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((x) => x.json()).catch(() => null);
    if (v?.webSocketDebuggerUrl) {
      const s = new WebSocket(v.webSocketDebuggerUrl);
      await new Promise((r) => { s.addEventListener("open", r); setTimeout(r, 2000); });
      try { s.send(JSON.stringify({ id: 1, method: "Browser.close" })); } catch {}
      await sleep(1500);
      try { s.close(); } catch {}
    }
  } catch {}
  try { chrome?.kill("SIGTERM"); } catch {}
}
const PORT = process.env.APS_DEBUG_PORT || "9334";
const PROFILE = process.env.APS_PROFILE || path.join(os.tmpdir(), "hunter-aps-profile");
const CHROME = process.env.CHROME_BIN || "google-chrome";
const hardTimer = setTimeout(async () => { console.error("HARD_TIMEOUT: 强制收尾"); await cleanup(); process.exit(3); }, 175000);
hardTimer.unref?.();

let entryUrl;
if (/^10\.\d+\//.test(TARGET)) {
  if (!TARGET.startsWith("10.1103/")) { console.error("非APS DOI,跳过订阅"); process.exit(5); }
  entryUrl = "https://doi.org/" + TARGET;
} else if (/^https?:\/\//.test(TARGET)) {
  if (!TARGET.includes("aps.org")) { console.error("非APS链接,跳过订阅"); process.exit(5); }
  entryUrl = TARGET;
} else { console.error("参数不是DOI也不是URL,跳过"); process.exit(5); }

if (process.platform === "linux" && !process.env.DISPLAY) {
  console.error("无DISPLAY,起不来真实浏览器,停用订阅"); process.exit(4);
}
for (const f of ["SingletonLock", "SingletonSocket", "SingletonCookie"])
  try { fs.rmSync(path.join(PROFILE, f), { force: true }); } catch {}
fs.mkdirSync(PROFILE, { recursive: true });

chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  "--no-proxy-server", "--no-first-run", "--no-default-browser-check", "about:blank",
], { stdio: "ignore" });
chrome.on("error", () => {});
await sleep(1000);
if (chrome.exitCode !== null) { console.error("浏览器起不来(CHROME_BIN?)"); await cleanup(); process.exit(4); }
let up = false;
for (let i = 0; i < 20; i++) {
  await sleep(1000);
  const v = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((x) => x.json()).catch(() => null);
  if (v?.Browser) { up = true; break; }
}
if (!up) { console.error("调试端口无响应"); await cleanup(); process.exit(4); }

const run = (async () => {
  const created = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" }).then((x) => x.json());
  const sock = new WebSocket(created.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("ws超时")), 10000);
    sock.addEventListener("open", () => { clearTimeout(t); res(); });
    sock.addEventListener("error", () => { clearTimeout(t); rej(new Error("ws错误")); });
  });
  let id = 0; const pend = new Map();
  sock.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  });
  const send = (method, params = {}, ms = 25000) => new Promise((res, rej) => {
    const i = ++id;
    const t = setTimeout(() => { pend.delete(i); rej(new Error(method + "超时")); }, ms);
    pend.set(i, (m) => { clearTimeout(t); m.error ? rej(new Error("CDP错")) : res(m.result); });
    sock.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expression, awaitPromise = false) => {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise }, 30000);
    if (r.exceptionDetails) throw new Error("JS异常");
    return r.result.value;
  };
  const close = () => { try { sock.close(); } catch {} };
  try {
    await send("Page.enable");
    await send("Page.navigate", { url: entryUrl });
    let title = "", finalUrl = "";
    for (let i = 0; i < 30; i++) {
      await sleep(3000);
      try {
        const s = JSON.parse(await ev('JSON.stringify({t:document.title,h:location.href})'));
        title = s.t || ""; finalUrl = s.h || "";
      } catch { continue; }
      if (title && !/请稍候|Just a moment|Checking your browser|Verifying you are human/i.test(title)) break;
    }
    if (!title || /请稍候|Just a moment|Checking your browser|Verifying you are human/i.test(title)) {
      console.error("页面未就绪/质询过不去,本会话停用订阅"); close(); return 3;
    }
    console.error("落点:", finalUrl);
    if (!finalUrl.includes("aps.org")) { console.error("DOI未落到APS,跳过订阅"); close(); return 5; }
    const info = JSON.parse(await ev(`JSON.stringify({title:document.title.slice(0,80),
      banner:((document.querySelector("[class*=access],[id*=access]")||{}).textContent||"").trim().replace(/\\s+/g," ").slice(0,60)||null,
      pdf:(document.documentElement.outerHTML.match(/href="([^"]*\\/pdf\\/[^"]*)"/i)||[])[1]||null,
      captcha:/recaptcha|captcha|verify you are|人机验证|异常流量/i.test(document.title+" "+document.body.innerText.slice(0,500))})`));
    console.error("页面:", info.title, "| 横幅:", info.banner || "(无)");
    if (info.captcha) { console.error("遇到验证码,本会话停用订阅"); close(); return 3; }
    let pdfUrl = info.pdf ? (info.pdf.startsWith("http") ? info.pdf : "https://journals.aps.org" + info.pdf)
      : (finalUrl.includes("/abstract/") ? finalUrl.replace("/abstract/", "/pdf/") : null);
    if (!pdfUrl) { console.error("找不到PDF链接,本篇跳过订阅"); close(); return 2; }
    const d = JSON.parse(await ev(`(async()=>{
      const r=await fetch(${JSON.stringify(pdfUrl)},{credentials:'include'});
      const b=await r.arrayBuffer(); const u=new Uint8Array(b); let h='';
      for(let i=0;i<Math.min(u.length,9);i++) h+=String.fromCharCode(u[i]);
      let all=''; const c=0x8000;
      for(let i=0;i<u.length;i+=c) all+=String.fromCharCode.apply(null,u.subarray(i,i+c));
      return JSON.stringify({status:r.status,type:r.headers.get('content-type'),len:u.length,head:h,b64:btoa(all)});})()`, true));
    console.error("PDF响应:", d.status, d.type, d.len, "bytes");
    if (d.head.indexOf("%PDF-") === 0) {
      fs.writeFileSync(OUT, Buffer.from(d.b64, "base64"));
      console.log(`SAVED ${OUT} ${d.len} bytes via=${info.banner ? "subscription" : "oa"}`);
      close(); return 0;
    }
    if (info.banner) { console.error("有横幅但PDF被拦,疑似限流,本会话停用订阅"); close(); return 3; }
    console.error("无横幅且取不到PDF,本篇跳过订阅"); close(); return 2;
  } catch (e) { console.error("异常:", e.message); try { sock.close(); } catch {} return 3; }
})();

const code = await run;
await cleanup();
process.exit(code);
