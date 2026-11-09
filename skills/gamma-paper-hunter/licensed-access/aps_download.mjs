#!/usr/bin/env node
// 单篇 APS 校园订阅下载。只操作自己启动的浏览器，后台代理服务保持运行。
import { spawn, spawnSync, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { randomUUID } from "node:crypto";
import { findChrome, findDisplay, directEnvironment, apsTarget, challengeTitle,
  checkboxRef, needsNoSandbox, moveToTrash, pdfIdentity, normalizePdfUrl } from "./browser_runtime.mjs";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const args = process.argv.slice(2);
let CHROME, DISPLAY;
try {
  CHROME = findChrome();
  DISPLAY = findDisplay();
} catch (error) {
  console.error("环境问题: " + error.message);
  process.exit(4);
}
const env = { ...directEnvironment(), DISPLAY };
const PROFILE = process.env.APS_PROFILE ||
  path.join(os.homedir(), ".local/share/gamma-paper-hunter/aps-chrome");
const SESSION = "hunter-aps-" + process.pid + "-" + randomUUID().slice(0, 8);
const sandboxArgs = needsNoSandbox(process.env, CHROME) ? ["--no-sandbox"] : [];
if (args[0] === "--check") {
  console.log(JSON.stringify({ chrome: CHROME, display: DISPLAY, profile: PROFILE,
    noSandbox: Boolean(sandboxArgs.length), proxy: "仅浏览器请求直连，不关闭后台代理" }, null, 2));
  process.exit(0);
}
const prepare = args[0] === "--prepare";
const [TARGET, OUT] = args;
if (!prepare && (!TARGET || !OUT)) {
  console.error("用法: node aps_download.mjs <APS DOI|URL> <输出.pdf> | --check | --prepare");
  process.exit(4);
}
let target;
try { target = prepare ? { url: "about:blank", doi: "" } : apsTarget(TARGET); }
catch (error) { console.error(error.message); process.exit(5); }
if (!prepare && fs.existsSync(OUT)) {
  console.error("目标文件已存在，拒绝覆盖: " + OUT);
  process.exit(4);
}

let chrome = null, browserEndpoint = "", port = 0, agentAttached = false;
async function cleanup() {
  if (agentAttached) {
    try { execFileSync("agent-browser", ["--session", SESSION, "close"],
      { env, timeout: 5000, stdio: "ignore" }); } catch {}
  }
  if (browserEndpoint && chrome?.exitCode === null) {
    try {
      const socket = new WebSocket(browserEndpoint);
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("close timeout")), 2000);
        socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
        socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("close failed")); }, { once: true });
      });
      socket.send(JSON.stringify({ id: 1, method: "Browser.close" }));
      socket.close();
      await sleep(300);
    } catch {}
  }
  if (chrome?.exitCode === null) chrome.kill("SIGTERM"); // 仅自己持有的子进程
}
const hardTimer = setTimeout(async () => {
  console.error("HARD_TIMEOUT: 单篇任务超时，停止本会话订阅尝试");
  await cleanup();
  process.exit(3);
}, 180000);
hardTimer.unref();

async function choosePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(Number(process.env.APS_DEBUG_PORT || 0), "127.0.0.1", resolve);
  });
  const selected = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  return selected;
}

function clickVerificationOnce() {
  // 用户授权的一次普通勾选；不解图片/文字验证码，不刷新挑战。
  const common = ["--session", SESSION, "--cdp", String(port)];
  const snapshot = execFileSync("agent-browser", [...common, "snapshot", "-i"],
    { env, encoding: "utf8", timeout: 15000, maxBuffer: 1024 * 1024 });
  agentAttached = true;
  const ref = checkboxRef(snapshot);
  if (!ref) return false;
  console.error("验证: 点击一次普通真人验证框 " + ref);
  execFileSync("agent-browser", [...common, "click", ref],
    { env, encoding: "utf8", timeout: 15000, maxBuffer: 1024 * 1024 });
  return true;
}

async function main() {
  // 在启动前检查 agent-browser，失败时给出诊断，不更换浏览器绕行。
  const doctor = spawnSync("agent-browser", ["doctor", "--offline", "--quick"],
    { env, encoding: "utf8", timeout: 10000 });
  if (doctor.error || doctor.status !== 0) {
    console.error("agent-browser 诊断未通过: " + (doctor.error?.message || doctor.stdout || doctor.stderr));
    return 4;
  }
  port = await choosePort();
  fs.mkdirSync(PROFILE, { recursive: true, mode: 0o700 });
  // 不删除 Singleton*，避免破坏另一个正在使用该资料目录的浏览器。
  try {
    fs.lstatSync(path.join(PROFILE, "SingletonLock"));
    console.error("专用资料目录仍有浏览器锁，拒绝改写或删除它；请先关闭该目录的浏览器");
    return 4;
  } catch (error) { if (error.code !== "ENOENT") throw error; }
  const defaultProfile = path.join(PROFILE, "Default");
  fs.mkdirSync(defaultProfile, { recursive: true, mode: 0o700 });
  const preferencesFile = path.join(defaultProfile, "Preferences");
  const preferences = fs.existsSync(preferencesFile) ?
    JSON.parse(fs.readFileSync(preferencesFile, "utf8")) : {};
  preferences.plugins = { ...preferences.plugins, always_open_pdf_externally: true };
  fs.writeFileSync(preferencesFile, JSON.stringify(preferences), { mode: 0o600 });
  console.error("浏览器: " + CHROME + " | DISPLAY=" + DISPLAY);
  console.error("资料目录: " + PROFILE + " | session=" + SESSION);
  let chromeLog = "", launchError;
  chrome = spawn(CHROME, [
    "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=" + port,
    "--user-data-dir=" + PROFILE, "--no-proxy-server", "--no-first-run",
    "--no-default-browser-check", ...sandboxArgs, "about:blank",
  ], { env, stdio: ["ignore", "ignore", "pipe"] });
  chrome.on("error", error => { launchError = error; });
  chrome.stderr.on("data", data => {
    chromeLog = (chromeLog + data).slice(-12000);
    browserEndpoint ||= chromeLog.match(/DevTools listening on (ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\/[^\s]+)/)?.[1] || "";
  });
  for (let i = 0; i < 100 && !browserEndpoint && chrome.exitCode === null && !launchError; i++) await sleep(100);
  if (!browserEndpoint) {
    console.error("浏览器启动失败: " + (launchError?.message || chromeLog.slice(-2000)));
    return 4;
  }
  const created = (await fetch("http://127.0.0.1:" + port + "/json/list").then(r => r.json()))
    .find(tab => tab.type === "page");
  if (!created) throw new Error("浏览器没有可操作的页面");
  const socket = new WebSocket(created.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("CDP 连接超时")), 10000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("CDP 连接失败")); }, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", event => {
    const value = JSON.parse(event.data);
    if (value.id && pending.has(value.id)) { pending.get(value.id)(value); pending.delete(value.id); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(method + " 超时")); }, 40000);
    pending.set(id, message => {
      clearTimeout(timer);
      message.error ? reject(new Error(method + ": " + message.error.message)) : resolve(message.result);
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression, awaitPromise = false) => {
    const value = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise });
    if (value.exceptionDetails) throw new Error("页面脚本异常: " + (value.exceptionDetails.text || ""));
    return value.result.value;
  };
  try {
    if (prepare) {
      // 离线检查 CDP 附着、快照引用及普通复选框点击，不访问 APS。
      await evaluate("document.body.innerHTML='<label><input type=\"checkbox\">Verify you are human</label>'");
      if (!clickVerificationOnce() ||
          !(await evaluate("document.querySelector('input').checked"))) {
        console.error("浏览器已启动，但普通复选框操作检查失败");
        return 4;
      }
      console.log("READY: 已自动找到并启动 Chrome，快照定位与一次复选框点击通过");
      return 0;
    }
    await send("Page.enable");
    await send("Page.navigate", { url: target.url });
    let state, clicked = false, snapshots = 0;
    for (let i = 0; i < 24; i++) {
      await sleep(3000);
      try { state = await evaluate("({title:document.title,url:location.href})"); } catch { continue; }
      if (state?.title && !challengeTitle(state.title)) break;
      if (i >= 2 && !clicked && snapshots < 5) {
        snapshots++;
        try { clicked = clickVerificationOnce(); }
        catch (error) { console.error("验证框操作失败: " + error.message.slice(0, 500)); clicked = true; }
      }
    }
    if (!state?.title || challengeTitle(state.title)) {
      console.error("普通验证框未能通过；本篇及本会话的订阅尝试停止，不重复点击或刷新");
      return 3;
    }
    try { apsTarget(state.url); } catch { console.error("文章未落到 APS"); return 5; }
    const info = await evaluate("(" + function() {
      const text = document.body?.innerText || "";
      const meta = name => document.querySelector('meta[name="' + name + '"]')?.content || "";
      return {
        title: meta("citation_title") || document.title,
        doi: meta("citation_doi"),
        banner: text.match(/(?:Access\s+provided\s+by|Provided\s+by|Access\s+through)\s*:?\s*Hainan\s+University/i)?.[0] || "",
        free: /\bFree to Read\b|\bOpen Access\b/.test(text.slice(0, 2000)),
        pdf: meta("citation_pdf_url") || Array.from(document.querySelectorAll("a[href]"))
          .map(a => a.href).find(href => /\/pdf\//.test(href)) || "",
      };
    }.toString() + ")()");
    if (target.doi && info.doi && info.doi.toLowerCase() !== target.doi.toLowerCase()) {
      console.error("文章页 DOI 与目标不一致"); return 2;
    }
    console.error("页面: " + info.title + " | 机构横幅: " + (info.banner || "(未确认)"));
    let pdfUrl = state.url.includes("/abstract/") ?
      state.url.replace("/abstract/", "/pdf/") : info.pdf;
    if (!pdfUrl && state.url.includes("/pdf/")) pdfUrl = state.url;
    if (!pdfUrl) { console.error("找不到 PDF 链接"); return 2; }
    pdfUrl = normalizePdfUrl(pdfUrl, state.url);
    const output = path.resolve(OUT);
    const stagingDir = fs.mkdtempSync(path.join(path.dirname(output), ".aps-download-"));
    try {
      // 使用浏览器原生下载携带站点会话，允许出版商正常的跨域跳转，不导出 Cookie。
      console.error("PDF 链接: " + pdfUrl);
      await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: stagingDir });
      await send("Page.navigate", { url: pdfUrl });
      let staging = "";
      for (let i = 0; i < 45; i++) {
        await sleep(1000);
        const files = fs.readdirSync(stagingDir).map(name => path.join(stagingDir, name));
        if (files.some(file => fs.statSync(file).size > 40000000)) {
          console.error("PDF 超过 40 MB，停止下载"); return 3;
        }
        staging = files.find(file => !file.endsWith(".crdownload") && fs.statSync(file).isFile()) || "";
        if (staging) break;
        if (i === 8 && !clicked) {
          const pdfState = await evaluate("({title:document.title})");
          if (challengeTitle(pdfState.title)) {
            try { clicked = clickVerificationOnce(); }
            catch (error) { console.error("PDF 验证未通过: " + error.message.slice(0, 500)); clicked = true; }
          }
        }
      }
      if (!staging) { console.error("浏览器未取得 PDF，本会话停止订阅尝试"); return 3; }
      const bytes = fs.readFileSync(staging);
      if (!bytes.subarray(0, 8).toString("ascii").startsWith("%PDF-")) {
        console.error("下载内容不是 PDF，拒绝保存"); return 2;
      }
      const text = spawnSync("pdftotext", ["-f", "1", "-l", "3", staging, "-"],
        { encoding: "utf8", timeout: 15000, maxBuffer: 2 * 1024 * 1024 });
      if (text.error?.code === "ENOENT") {
        console.error("缺少 pdftotext，请安装: sudo apt install poppler-utils"); return 4;
      }
      if (text.status !== 0 || !pdfIdentity(text.stdout || "", target.doi || info.doi, info.title)) {
        console.error("PDF 首三页未能确认目标 DOI/标题，拒绝保存"); return 2;
      }
      fs.copyFileSync(staging, output, fs.constants.COPYFILE_EXCL);
      const via = info.banner ? "subscription" : info.free ? "oa" : "unverified";
      console.log("SAVED " + output + " " + bytes.length + " bytes via=" + via + " identity=verified");
      return 0;
    } finally { moveToTrash(stagingDir); }
  } finally { socket.close(); }
}

let code = 4;
try { code = await main(); }
catch (error) { console.error("下载异常: " + error.message); code = 4; }
finally { await cleanup(); clearTimeout(hardTimer); }
process.exitCode = code;
