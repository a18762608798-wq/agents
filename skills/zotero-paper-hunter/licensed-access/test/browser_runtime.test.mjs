import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findChrome, findDisplay, directEnvironment, apsTarget, checkboxRef,
  challengeTitle, pdfIdentity, needsNoSandbox, moveToTrash, normalizePdfUrl } from "../browser_runtime.mjs";

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aps-runtime-test-"));
  t.after(() => moveToTrash(dir));
  return dir;
}
function binary(root, relative) {
  const name = path.join(root, relative);
  fs.mkdirSync(path.dirname(name), { recursive: true });
  fs.writeFileSync(name, "#!/bin/sh\n", { mode: 0o700 });
  return name;
}

test("缓存升级后选择较新的完整 Chrome，跳过 headless-shell", t => {
  const home = fixture(t);
  binary(home, ".agent-browser/browsers/chrome-90/chrome");
  binary(home, ".agent-browser/browsers/chrome-155/chrome");
  const newest = binary(home, ".agent-browser/browsers/chrome-156/chrome");
  binary(home, ".agent-browser/browsers/headless-999/chrome");
  assert.equal(findChrome({ PATH: "" }, home), newest);
});

test("系统 PATH 中的 Chrome 优先于用户缓存", t => {
  const home = fixture(t);
  const systemChrome = binary(home, "system-bin/google-chrome");
  binary(home, ".agent-browser/browsers/chrome-999/chrome");
  assert.equal(findChrome({ PATH: path.join(home, "system-bin") }, home), systemChrome);
});

test("支持 npm/Puppeteer 的下载目录及显式路径", t => {
  const home = fixture(t);
  const chrome = binary(home, ".cache/puppeteer/chrome/linux-156/chrome-linux64/chrome");
  assert.equal(findChrome({ PATH: "" }, home), chrome);
  assert.equal(findChrome({ CHROME_BIN: chrome, PATH: "" }, home), chrome);
  assert.throws(() => findChrome({ CHROME_BIN: "/nonexistent/chrome", PATH: "" }, home), /CHROME_BIN/);
});

test("支持 Playwright 的完整 Chromium 缓存", t => {
  const home = fixture(t);
  const chrome = binary(home, ".cache/ms-playwright/chromium-1234/chrome-linux64/chrome");
  assert.equal(findChrome({ PATH: "" }, home), chrome);
});

test("遵守当前用户自定义的 npm 浏览器缓存路径", t => {
  const home = fixture(t);
  const puppeteer = binary(home, "custom-puppeteer/chrome/linux-156/chrome-linux64/chrome");
  assert.equal(findChrome({ PATH: "", PUPPETEER_CACHE_DIR: path.join(home, "custom-puppeteer") }, home),
    puppeteer);
  const playwright = binary(home, "custom-playwright/chromium-1234/chrome-linux64/chrome");
  assert.equal(findChrome({ PATH: "", PLAYWRIGHT_BROWSERS_PATH: path.join(home, "custom-playwright") }, home),
    playwright);
});

test("当前用户没有浏览器时给出可操作的错误", t => {
  const home = fixture(t);
  assert.throws(() => findChrome({ PATH: "" }, home), /CHROME_BIN/);
});

test("无 DISPLAY 时只在唯一 X 显示器下自动选择", t => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir, "X1"), "");
  assert.equal(findDisplay({}, dir), ":1");
  fs.writeFileSync(path.join(dir, "X2"), "");
  assert.throws(() => findDisplay({}, dir), /多个显示器/);
  assert.equal(findDisplay({ APS_DISPLAY: ":2" }, dir), ":2");
  assert.equal(findDisplay({ DISPLAY: ":3" }, dir), ":3");
});

test("只清理下载子进程的代理环境，保留调用者原环境", () => {
  const original = { http_proxy: "http://127.0.0.1:7890", ALL_PROXY: "socks5://localhost:7891",
    AGENT_BROWSER_PROXY: "http://localhost:7890", PATH: "/usr/bin", DISPLAY: ":1" };
  const child = directEnvironment(original);
  assert.equal(original.http_proxy, "http://127.0.0.1:7890");
  assert.equal(child.http_proxy, undefined);
  assert.equal(child.ALL_PROXY, undefined);
  assert.equal(child.AGENT_BROWSER_PROXY, undefined);
  assert.equal(child.DISPLAY, ":1");
  assert.match(child.NO_PROXY, /127\.0\.0\.1/);
});

test("只接受 APS DOI 或真实的 APS 域名", () => {
  assert.equal(apsTarget("10.1103/PhysRevLett.110.260601").doi, "10.1103/PhysRevLett.110.260601");
  assert.equal(apsTarget("https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.110.260601").doi,
    "10.1103/PhysRevLett.110.260601");
  assert.equal(apsTarget("https://journals.aps.org/prl/pdf/10.1103/PhysRevLett.110.260601").url,
    "https://doi.org/10.1103/PhysRevLett.110.260601");
  for (const wrong of ["10.1038/example", "https://evil.test/aps.org",
    "https://aps.org.evil.test/pdf/file", "https://user:pass@journals.aps.org/file",
    "file:///aps.org", "10.1103/example extra"]) assert.throws(() => apsTarget(wrong));
});

test("APS 元数据中的旧 HTTP PDF 链接升级为 HTTPS，并拒绝外站", () => {
  assert.equal(normalizePdfUrl("http://link.aps.org/pdf/10.1103/PhysRevLett.110.260601"),
    "https://link.aps.org/pdf/10.1103/PhysRevLett.110.260601");
  assert.equal(normalizePdfUrl("/prl/pdf/10.1103/test", "https://journals.aps.org/prl/abstract/test"),
    "https://journals.aps.org/prl/pdf/10.1103/test");
  assert.throws(() => normalizePdfUrl("https://evil.test/pdf/file"));
});

test("只定位可见快照中的普通真人复选框，不操作已勾选项或其他框", () => {
  const cn = '- checkbox "请验证您是真人" [checked=false, ref=e9]';
  assert.equal(checkboxRef(cn), "@e9");
  assert.equal(checkboxRef('- checkbox "Verify you are human" [ref=e2]'), "@e2");
  assert.equal(checkboxRef('- checkbox "请验证您是真人" [checked=true, ref=e9]'), null);
  assert.equal(checkboxRef('- checkbox "Subscribe to newsletter" [ref=e4]'), null);
  assert.equal(checkboxRef('- textbox "输入验证码" [ref=e5]'), null);
  assert.equal(checkboxRef('- heading "Performing security verification" [ref=e1]'), null);
});

test("验证页面不会被当作文章已就绪", () => {
  assert.equal(challengeTitle("Just a moment..."), true);
  assert.equal(challengeTitle("请稍候…"), true);
  assert.equal(challengeTitle("Phys. Rev. Lett. - Article"), false);
});

test("PDF 通过 DOI 或完整标题核实，错误文章不能保存", () => {
  const doi = "10.1103/PhysRevLett.110.260601";
  assert.equal(pdfIdentity("DOI: 10.1103/PhysRevLett.\n110.260601", doi, ""), true);
  assert.equal(pdfIdentity("Unrelated article 10.1103/PhysRevLett.999.000001", doi, ""), false);
  assert.equal(pdfIdentity("Universal Slow Growth\nof Entanglement", "", "Universal Slow Growth of Entanglement"), true);
  assert.equal(pdfIdentity("Unrelated article", "", "Universal Slow Growth of Entanglement"), false);
});

test("可显式保留 Chrome 沙箱", () => {
  assert.equal(needsNoSandbox({ APS_NO_SANDBOX: "0" }), false);
  assert.equal(needsNoSandbox({ APS_NO_SANDBOX: "1" }), true);
});

test("当前系统 Chrome 的原生沙箱保持启用", t => {
  if (!fs.existsSync("/opt/google/chrome/chrome-sandbox")) return t.skip("未安装系统 Chrome");
  assert.equal(needsNoSandbox({}, "/usr/bin/google-chrome"), false);
  assert.equal(needsNoSandbox({ APS_NO_SANDBOX: "1" }, "/usr/bin/google-chrome"), true);
});
