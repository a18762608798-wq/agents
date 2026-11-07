import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

export function executable(file) {
  try { fs.accessSync(file, fs.constants.X_OK); return fs.statSync(file).isFile(); }
  catch { return false; }
}

function onPath(name, env) {
  if (name.includes("/")) return executable(name) ? path.resolve(name) : null;
  for (const dir of (env.PATH || "").split(path.delimiter)) {
    const candidate = path.join(dir, name);
    if (executable(candidate)) return candidate;
  }
  return null;
}

export function findChrome(env = process.env, home = os.homedir()) {
  for (const key of ["CHROME_BIN", "AGENT_BROWSER_EXECUTABLE_PATH", "PUPPETEER_EXECUTABLE_PATH"]) {
    if (!env[key]) continue;
    const found = onPath(env[key], env);
    if (!found) throw new Error(key + " 指定的浏览器不可执行: " + env[key]);
    return found;
  }
  for (const name of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    const found = onPath(name, env);
    if (found) return found;
  }
  const roots = [
    [path.join(home, ".agent-browser/browsers"), ["chrome"]],
    [path.join(env.PUPPETEER_CACHE_DIR || path.join(home, ".cache/puppeteer"), "chrome"),
      ["chrome-linux64/chrome", "chrome-linux/chrome"]],
    [env.PLAYWRIGHT_BROWSERS_PATH || path.join(home, ".cache/ms-playwright"),
      ["chrome-linux64/chrome", "chrome-linux/chrome"]],
  ];
  for (const [root, endings] of roots) {
    let versions;
    try { versions = fs.readdirSync(root).sort((a, b) => b.localeCompare(a, undefined, { numeric: true })); }
    catch { continue; }
    for (const version of versions) {
      if (/headless/i.test(version)) continue;
      for (const ending of endings) {
        const candidate = path.join(root, version, ending);
        if (executable(candidate)) return candidate;
      }
    }
  }
  throw new Error("未找到 Chrome。设置 CHROME_BIN，或运行 agent-browser install 安装用户空间浏览器。");
}

export function findDisplay(env = process.env, socketDir = "/tmp/.X11-unix") {
  if (env.APS_DISPLAY || env.DISPLAY) return env.APS_DISPLAY || env.DISPLAY;
  let displays = [];
  try { displays = fs.readdirSync(socketDir).filter(name => /^X\d+$/.test(name)); } catch {}
  if (displays.length === 1) return ":" + displays[0].slice(1);
  throw new Error(displays.length ? "存在多个显示器，请设置 APS_DISPLAY。" : "没有图形显示器，请先登录桌面或设置 APS_DISPLAY。");
}

export function directEnvironment(env = process.env) {
  const child = { ...env };
  for (const name of ["http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "all_proxy",
    "ALL_PROXY", "AGENT_BROWSER_PROXY", "AGENT_BROWSER_PROXY_BYPASS"]) delete child[name];
  child.NO_PROXY = child.no_proxy = "localhost,127.0.0.1,::1";
  return child;
}

export function apsTarget(input) {
  if (/^10\.\d+\//.test(input)) {
    if (!/^10\.1103\/[^\s?#]+$/i.test(input)) throw new Error("非 APS DOI");
    return { url: "https://doi.org/" + input, doi: input };
  }
  let url;
  try { url = new URL(input); } catch { throw new Error("参数不是 DOI 或 APS URL"); }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password ||
      !(url.hostname === "aps.org" || url.hostname.endsWith(".aps.org"))) throw new Error("非 APS URL");
  const doi = decodeURIComponent(url.pathname).match(/10\.1103\/[^?#]+/i)?.[0] || "";
  return { url: doi && url.pathname.includes("/pdf/") ? "https://doi.org/" + doi : url.href, doi };
}

export function challengeTitle(title) {
  return /请稍候|Just a moment|Checking your browser|Verifying you are human|security verification/i.test(title || "");
}

export function normalizePdfUrl(input, base) {
  const url = new URL(input, base);
  apsTarget(url.href);
  // APS 的旧 citation_pdf_url 仍可能是 http://link.aps.org/pdf/...。
  // 升级到同一官方主机的 HTTPS，避免混合内容与仅 HTTPS 网络策略。
  url.protocol = "https:";
  return url.href;
}

export function checkboxRef(snapshot) {
  for (const line of snapshot.split("\n")) {
    if (!/\bcheckbox\b/i.test(line) || !/真人|human|not a robot|不是机器人/i.test(line) ||
        /checked[=:]\s*true/i.test(line)) continue;
    const match = line.match(/\bref[=:]\s*(e\d+)\b/) || line.match(/\[ref=(e\d+)\]/);
    if (match) return "@" + match[1];
  }
  return null;
}

export function needsNoSandbox(env = process.env, chrome = "") {
  if (env.APS_NO_SANDBOX !== undefined) return env.APS_NO_SANDBOX === "1";
  if (process.platform !== "linux") return false;
  // 系统安装的 Chrome 带有 root 所有的 SUID 沙箱，不应仅因 AppArmor
  // 限制未特权用户命名空间就关闭它。用户缓存版仍保留原来的兼容判断。
  if (chrome) {
    try {
      const helper = path.join(path.dirname(fs.realpathSync(chrome)), "chrome-sandbox");
      const stat = fs.statSync(helper);
      if (stat.isFile() && stat.uid === 0 && (stat.mode & 0o4000) && !(stat.mode & 0o022))
        return false;
    } catch {}
  }
  try { return fs.readFileSync("/proc/sys/kernel/apparmor_restrict_unprivileged_userns", "utf8").trim() === "1"; }
  catch { return false; }
}

export function moveToTrash(file, home = os.homedir()) {
  if (!fs.existsSync(file)) return;
  const trash = path.join(home, ".local/share/Trash/files");
  fs.mkdirSync(trash, { recursive: true });
  execFileSync("mv", ["--", file, path.join(trash, path.basename(file) + "-" + randomUUID())]);
}

export function pdfIdentity(text, doi, title) {
  const compact = text.toLowerCase().replace(/\s+/g, "");
  if (doi && compact.includes(doi.toLowerCase().replace(/\s+/g, ""))) return true;
  const normalize = value => value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
  return Boolean(title && normalize(title).length > 15 && normalize(text).includes(normalize(title)));
}
