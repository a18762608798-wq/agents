import type { Plugin } from "@opencode/plugin"
import { createHash } from "node:crypto"
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"

// speckit-rework-gate：已有 Spec Kit feature 的返工门禁。
// 正常 /speckit.* 流程完全旁路；普通修改请求必须先评估上游影响，
// 只对受影响层及其下游依赖过门，之后才允许碰实现层。
// 无紧急绕过。只在检测到 Spec Kit 项目时生效。

void existsSync

type Stage = "spec" | "plan" | "tasks" | "checklists"
type Phase =
  | "needs-feature"
  | "impact-pending"
  | "spec-pending"
  | "plan-pending"
  | "tasks-pending"
  | "checklists-pending"
  | "implementation-open"
  | "closed"
  | "blocked"

interface Txn {
  root: string
  featureDir: string // 相对项目根，如 specs/001-foo
  phase: Phase
  affectedStages: Stage[]
  scope: string[] // 评估时申报的可写文件 glob（仓库相对），实现阶段硬约束
  snapshots: Record<string, string> // relpath -> sha256，门之间做 hash 对比
  summaries: Partial<Record<Stage | "impact", string>>
  blockReason?: string
}

interface Ctx {
  session: {
    get: (input: { sessionID: string }) => Promise<{
      location?: { directory?: string }
      subpath?: string
      parentID?: string
    }>
  }
}

const MAX_SESSIONS = 200
const txns = new Map<string, Txn>()
const rootCache = new Map<string, string | null>()

const OFFICIAL_RE = /speckit[\.\-:]/i
const MODIFY_RE =
  /修|改|增|加|重构|实现|修复|删|优化|调整|更新|补丁|支持|完成|迁移|重写|fix|bug|implement|refactor|rework|revise|polish|optimiz|add|update|change|modify|support|feature|migrat|rewrit/i

function touchTxn(sessionID: string, txn: Txn) {
  txns.delete(sessionID)
  txns.set(sessionID, txn)
  if (txns.size > MAX_SESSIONS) {
    const oldest = txns.keys().next().value
    if (oldest) txns.delete(oldest)
  }
}

function deleteTxn(txn: Txn) {
  for (const [sessionID, candidate] of txns.entries()) {
    if (candidate === txn) txns.delete(sessionID)
  }
}

function cacheRoot(sessionID: string, root: string | null) {
  rootCache.delete(sessionID)
  rootCache.set(sessionID, root)
  if (rootCache.size > MAX_SESSIONS) {
    const oldest = rootCache.keys().next().value
    if (oldest) rootCache.delete(oldest)
  }
}

function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex")
}

function hashFile(abs: string): string | null {
  try {
    if (!statSync(abs).isFile()) return null
    return sha256(readFileSync(abs, "utf8"))
  } catch {
    return null
  }
}

// 目录整体 hash（用于 contracts/ 等目录）：排序后拼接文件 hash。
function hashDir(abs: string): string | null {
  try {
    if (!statSync(abs).isDirectory()) return null
    const files: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir).sort()) {
        const p = path.join(dir, name)
        try {
          const st = statSync(p)
          if (st.isDirectory()) walk(p)
          else if (st.isFile()) files.push(p)
        } catch {
          // 忽略单个不可读文件
        }
      }
    }
    walk(abs)
    if (files.length === 0) return "empty-dir"
    return sha256(files.map((f) => `${f}:${hashFile(f)}`).join("\n"))
  } catch {
    return null
  }
}

function hashPath(abs: string): string | null {
  try {
    const st = statSync(abs)
    return st.isDirectory() ? hashDir(abs) : hashFile(abs)
  } catch {
    return null
  }
}

function findProjectRoot(startDir: string): string | null {
  let dir = path.resolve(startDir)
  for (let i = 0; i < 6; i++) {
    try {
      if (
        statSync(path.join(dir, ".specify")).isDirectory() &&
        statSync(path.join(dir, "specs")).isDirectory()
      ) {
        return dir
      }
    } catch {
      // 继续向上找
    }
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
  return null
}

function readFeaturePointer(root: string): string {
  try {
    const raw = readFileSync(path.join(root, ".specify", "feature.json"), "utf8")
    const data = JSON.parse(raw) as { feature_directory?: unknown }
    return typeof data.feature_directory === "string" ? data.feature_directory : ""
  } catch {
    return ""
  }
}

interface FeatureCandidate {
  directory: string
  hasSpec: boolean
  hasPlan: boolean
  hasTasks: boolean
  completedTasks: number
  eligible: boolean
  reason: string
}

function countBoxes(text: string): { total: number; checked: number } {
  const total = (text.match(/^- \[[ xX]\]/gm) ?? []).length
  const checked = (text.match(/^- \[[xX]\]/gm) ?? []).length
  return { total, checked }
}

function listFeatures(root: string): FeatureCandidate[] {
  const specsDir = path.join(root, "specs")
  let names: string[] = []
  try {
    names = readdirSync(specsDir)
      .filter((n) => {
        try {
          return statSync(path.join(specsDir, n)).isDirectory() && !n.startsWith(".")
        } catch {
          return false
        }
      })
      .sort()
  } catch {
    return []
  }
  return names.map((n) => {
    const dir = path.posix.join("specs", n)
    const abs = path.join(root, dir)
    const hasSpec = hashFile(path.join(abs, "spec.md")) !== null
    const hasPlan = hashFile(path.join(abs, "plan.md")) !== null
    const hasTasks = hashFile(path.join(abs, "tasks.md")) !== null
    let completedTasks = 0
    if (hasTasks) {
      try {
        completedTasks = countBoxes(readFileSync(path.join(abs, "tasks.md"), "utf8")).checked
      } catch {
        completedTasks = 0
      }
    }
    const eligible = hasSpec && hasPlan && hasTasks && completedTasks > 0
    let reason = "ok"
    if (!hasSpec || !hasPlan || !hasTasks) reason = "missing-artifacts"
    else if (completedTasks === 0) reason = "never-implemented"
    return {
      directory: dir,
      hasSpec,
      hasPlan,
      hasTasks,
      completedTasks,
      eligible,
      reason,
    }
  })
}

function pointedEligibleFeature(root: string): FeatureCandidate | null {
  const pointer = readFeaturePointer(root)
  if (!pointer) return null
  const normalized = path.posix.normalize(pointer.replace(/\\/g, "/"))
  if (normalized.startsWith("..") || path.posix.isAbsolute(normalized)) return null
  const feature = listFeatures(root).find((candidate) => candidate.directory === normalized)
  return feature?.eligible ? feature : null
}

function snapshotFeature(root: string, featureDir: string): Record<string, string> {
  const snap: Record<string, string> = {}
  const take = (rel: string) => {
    const h = hashPath(path.join(root, rel))
    if (h !== null) snap[rel] = h
  }
  take(path.posix.join(featureDir, "spec.md"))
  take(path.posix.join(featureDir, "plan.md"))
  take(path.posix.join(featureDir, "research.md"))
  take(path.posix.join(featureDir, "data-model.md"))
  take(path.posix.join(featureDir, "quickstart.md"))
  take(path.posix.join(featureDir, "contracts"))
  take(path.posix.join(featureDir, "tasks.md"))
  return snap
}

function stageFiles(featureDir: string, stage: Stage): string[] {
  if (stage === "spec") return [path.posix.join(featureDir, "spec.md")]
  if (stage === "tasks") return [path.posix.join(featureDir, "tasks.md")]
  return [
    path.posix.join(featureDir, "plan.md"),
    path.posix.join(featureDir, "research.md"),
    path.posix.join(featureDir, "data-model.md"),
    path.posix.join(featureDir, "quickstart.md"),
    path.posix.join(featureDir, "contracts"),
  ]
}

function phaseForStage(stage: Stage): Phase {
  return `${stage}-pending` as Phase
}

function nextAffectedPhase(txn: Txn, current: Stage): Phase {
  const index = txn.affectedStages.indexOf(current)
  const next = txn.affectedStages[index + 1]
  return next ? phaseForStage(next) : "implementation-open"
}

function expectedStage(phase: Phase): Stage | null {
  if (phase === "spec-pending") return "spec"
  if (phase === "plan-pending") return "plan"
  if (phase === "tasks-pending") return "tasks"
  if (phase === "checklists-pending") return "checklists"
  return null
}

// checklist 只读扫描：无 checklists 目录 / 无有效 checkbox 则跳过；
// 只要存在一个未勾选就阻止实现。
function scanChecklists(
  root: string,
  featureDir: string,
): {
  skipped: boolean
  pass: boolean
  detail: string
} {
  const dir = path.join(root, featureDir, "checklists")
  try {
    if (!statSync(dir).isDirectory()) return { skipped: true, pass: true, detail: "no checklists dir" }
  } catch {
    return { skipped: true, pass: true, detail: "no checklists dir" }
  }
  let files: string[] = []
  try {
    files = readdirSync(dir)
      .filter((n) => n.endsWith(".md"))
      .sort()
  } catch {
    return { skipped: true, pass: true, detail: "unreadable checklists dir" }
  }
  let total = 0
  let unchecked = 0
  const perFile: string[] = []
  for (const f of files) {
    try {
      const text = readFileSync(path.join(dir, f), "utf8")
      const { total: t, checked: c } = countBoxes(text)
      total += t
      unchecked += t - c
      perFile.push(`${f}: ${c}/${t}`)
    } catch {
      // 忽略单个不可读文件
    }
  }
  if (total === 0) return { skipped: true, pass: true, detail: "no checkbox items" }
  return {
    skipped: false,
    pass: unchecked === 0,
    detail: perFile.join("; "),
  }
}

type PathKind =
  | { kind: "outside" }
  | { kind: "infra" }
  | { kind: "speckit-cmd" }
  | { kind: "spec"; stage: Stage; rel: string }
  | { kind: "impl"; rel: string }

function classify(root: string, featureDir: string, resource: string): PathKind {
  const abs = path.isAbsolute(resource) ? path.normalize(resource) : path.join(root, resource)
  const rel = path.relative(root, abs)
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) return { kind: "outside" }
  const parts = rel.split(path.sep)
  if (parts[0] === ".specify") return { kind: "infra" }
  if (parts[0] === ".opencode" && parts[1] === "commands" && (parts[2] ?? "").startsWith("speckit")) {
    return { kind: "speckit-cmd" }
  }
  const posix = rel.split(path.sep).join(path.posix.sep)
  const feat = featureDir.split(path.sep).join(path.posix.sep)
  if (posix === `${feat}/spec.md`) return { kind: "spec", stage: "spec", rel: posix }
  if (
    posix === `${feat}/plan.md` ||
    posix === `${feat}/research.md` ||
    posix === `${feat}/data-model.md` ||
    posix === `${feat}/quickstart.md` ||
    posix === `${feat}/contracts` ||
    posix.startsWith(`${feat}/contracts/`)
  ) {
    return { kind: "spec", stage: "plan", rel: posix }
  }
  if (posix === `${feat}/tasks.md`) return { kind: "spec", stage: "tasks", rel: posix }
  if (posix === `${feat}/checklists` || posix.startsWith(`${feat}/checklists/`)) {
    return { kind: "spec", stage: "checklists", rel: posix }
  }
  // 其他 feature 的产物一律视为冻结的 spec 工件
  if (posix.startsWith("specs/")) return { kind: "spec", stage: "spec", rel: posix }
  return { kind: "impl", rel: posix }
}

function block(txn: Txn, sessionID: string, reason: string): { content: string } {
  txn.phase = "blocked"
  txn.blockReason = reason
  touchTxn(sessionID, txn)
  return { content: JSON.stringify({ ok: false, error: `rework blocked: ${reason}` }) }
}

function reject(reason: string): { content: string } {
  return fail(reason)
}

const SHELL_WRITE_RE =
  /(^|[\s;&|])(sed\s+[^\n]*?\s-i\b|tee\b|[^\n&|]*?[^>&-]>[^>&\n]*\S)/

function shellLooksLikeWrite(command: string): boolean {
  try {
    return SHELL_WRITE_RE.test(` ${command}`)
  } catch {
    return false
  }
}

// scope glob 匹配：支持 **、*、?，仓库相对路径，统一用 posix 分隔符。
function scopeMatch(glob: string, relPosix: string): boolean {
  const g = glob.replace(/\\/g, "/").replace(/^\.\//, "")
  const p = relPosix.replace(/\\/g, "/")
  if (g === p) return true
  // 转正则：先占位 **，再处理 * ?，最后还原 ** 为 .*
  const PH = "\u0000"
  let re = g.replace(/\*\*/g, PH).replace(/[.+^${}()|[\]\\]/g, "\\$&")
  re = re.replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]")
  re = re.split(PH).join(".*")
  try {
    return new RegExp(`^${re}$`).test(p)
  } catch {
    return false
  }
}

function inScope(scope: string[], relPosix: string): boolean {
  return scope.some((g) => scopeMatch(g, relPosix))
}

// 从 shell 命令中提取显式写目标（重定向 > >>、tee 文件参数）。
// 只做启发式：Copy-Item/cp/mv 等 cmdlet 不解析，缺口由 edit 钩子覆盖。
function shellWriteTargets(command: string): string[] {
  const targets: string[] = []
  const redir = /(?:^|[\s;&|])(?:\d*)>>?\s*("([^"]+)"|'([^']+)'|([^\s"';&|]+))/g
  let m: RegExpExecArray | null
  while ((m = redir.exec(command)) !== null) {
    const t = m[2] ?? m[3] ?? m[4]
    if (!t || t.startsWith("&") || /^\d+$/.test(t) || t.toUpperCase() === "NUL") continue
    targets.push(t)
  }
  const teeRe = /(?:^|[\s;&|])tee(?:\s+-[^\s]+)*\s+("([^"]+)"|'([^']+)'|([^\s"';&|]+))/g
  while ((m = teeRe.exec(command)) !== null) {
    const t = m[2] ?? m[3] ?? m[4]
    if (!t || t.startsWith("-")) continue
    targets.push(t)
  }
  return targets
}

// 写目标落在仓库内但超出 scope 时返回它们；仓库外/不可解析的不管。
function outOfScopeTargets(root: string, scope: string[], command: string): string[] {
  const bad: string[] = []
  for (const raw of shellWriteTargets(command)) {
    const t = raw.replace(/\\/g, "/")
    if (t.startsWith("~")) continue
    let rel: string
    if (path.posix.isAbsolute(t) || /^[A-Za-z]:\//.test(t)) {
      const r = path.relative(root, path.normalize(t))
      if (r === "" || r.startsWith("..") || path.isAbsolute(r)) continue
      rel = r.split(path.sep).join(path.posix.sep)
    } else {
      if (t.startsWith("..")) continue
      rel = path.posix.normalize(t)
      if (rel.startsWith("..") || path.posix.isAbsolute(rel)) continue
    }
    if (!inScope(scope, rel)) bad.push(rel)
  }
  return [...new Set(bad)]
}

function normalizeScopeEntry(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const t = raw.trim().replace(/\\/g, "/").replace(/^\.\//, "")
  if (!t || t.startsWith("..") || t.startsWith("/") || t.includes("\0")) return null
  return t
}

async function resolveRoot(ctx: Ctx, sessionID: string): Promise<string | null> {
  const cached = rootCache.get(sessionID)
  if (cached !== undefined) return cached
  let chain: string | undefined = sessionID
  let depth = 0
  while (chain && depth < 5) {
    depth += 1
    try {
      const info = await ctx.session.get({ sessionID: chain })
      const dir = info?.location?.directory
      if (typeof dir === "string" && dir.length > 0) {
        const start = info?.subpath ? path.join(dir, info.subpath) : dir
        const root = findProjectRoot(start)
        if (root) {
          cacheRoot(sessionID, root)
          return root
        }
      }
      const cachedParent = chain !== sessionID ? rootCache.get(chain) : undefined
      if (cachedParent) {
        cacheRoot(sessionID, cachedParent)
        return cachedParent
      }
      chain = info?.parentID
    } catch {
      break
    }
  }
  cacheRoot(sessionID, null)
  return null
}

// 子 session 继承父 session 的事务：沿 parentID 链查找，命中后建立别名。
async function getActiveTxn(ctx: Ctx, sessionID: string): Promise<Txn | undefined> {
  const direct = txns.get(sessionID)
  if (direct) return direct
  let chain: string | undefined = sessionID
  let depth = 0
  while (chain && depth < 5) {
    depth += 1
    try {
      const info = await ctx.session.get({ sessionID: chain })
      const parent = info?.parentID
      if (!parent) return undefined
      const parentTxn = txns.get(parent)
      if (parentTxn) {
        touchTxn(sessionID, parentTxn)
        return parentTxn
      }
      chain = parent
    } catch {
      return undefined
    }
  }
  return undefined
}

function ok(data: Record<string, unknown>): { content: string } {
  return { content: JSON.stringify({ ok: true, ...data }) }
}

function fail(error: string): { content: string } {
  return { content: JSON.stringify({ ok: false, error }) }
}

export default {
  id: "speckit-rework-gate",
  async setup(ctx) {
    const c = ctx as unknown as Ctx

    await ctx.tool.transform((editor) => {
      editor.namespace({
        name: "speckit_rework",
        description: "Spec Kit rework gates: feature select and stage checks",
      })

      editor.add({
        name: "speckit_rework_list_features",
        description:
          "List existing Spec Kit features with rework eligibility. Call this first when handling an ordinary modification request in a Spec Kit project.",
        input: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        execute: async (_input, context) => {
          const root = await resolveRoot(c, context.sessionID as string)
          if (!root) return fail("not a Spec Kit project")
          return ok({ pointer: readFeaturePointer(root), features: listFeatures(root) })
        },
      })

      editor.add({
        name: "speckit_rework_select_feature",
        description:
          "Select the existing feature for this rework. Writes .specify/feature.json pointer only, never creates features or switches git branches. Feature must come from speckit_rework_list_features.",
        input: {
          type: "object",
          properties: {
            featureDirectory: {
              type: "string",
              description: "Feature directory relative to project root, e.g. specs/001-user-auth",
            },
          },
          required: ["featureDirectory"],
          additionalProperties: false,
        },
        execute: async (input, context) => {
          const sessionID = context.sessionID as string
          const root = await resolveRoot(c, sessionID)
          if (!root) return fail("not a Spec Kit project")
          const raw = (input as { featureDirectory?: unknown }).featureDirectory
          if (typeof raw !== "string" || raw.length === 0) {
            return fail("featureDirectory is required")
          }
          const normalized = path.posix.normalize(raw.replace(/\\/g, "/"))
          if (normalized.startsWith("..") || path.posix.isAbsolute(normalized)) {
            return fail("featureDirectory must be a specs/ relative path")
          }
          const hit = listFeatures(root).find((f) => f.directory === normalized)
          if (!hit) {
            return fail(`unknown feature '${normalized}'. Use speckit_rework_list_features and never create features in rework mode.`)
          }
          if (!hit.hasSpec || !hit.hasPlan || !hit.hasTasks) {
            return fail(
              `feature '${normalized}' misses spec/plan/tasks artifacts. Stop and ask the user to run the matching /speckit.* command.`,
            )
          }
          if (hit.completedTasks === 0) {
            return fail(
              `feature '${normalized}' has no completed tasks, so it never went through implement. Rework mode refused; use the normal /speckit.* flow.`,
            )
          }
          let pointer: Record<string, unknown> = {}
          try {
            pointer = JSON.parse(
              readFileSync(path.join(root, ".specify", "feature.json"), "utf8"),
            ) as Record<string, unknown>
          } catch {
            pointer = {}
          }
          pointer.feature_directory = normalized
          try {
            writeFileSync(
              path.join(root, ".specify", "feature.json"),
              `${JSON.stringify(pointer, null, 2)}\n`,
              "utf8",
            )
          } catch (e) {
            return fail(`cannot write feature pointer: ${String(e)}`)
          }
          touchTxn(sessionID, {
            root,
            featureDir: normalized,
            phase: "impact-pending",
            affectedStages: [],
            scope: [],
            snapshots: snapshotFeature(root, normalized),
            summaries: {},
          })
          return ok({
            featureDirectory: normalized,
            next: "call speckit_rework_assess_impact with affectedStages AND scope (repo-relative writable globs) before editing",
          })
        },
      })

      editor.add({
        name: "speckit_rework_reset",
        description:
          "Explicitly reset the current rework transaction after a recoverable gate error or when abandoning the rework.",
        input: {
          type: "object",
          properties: {
            reason: { type: "string", description: "Why the current rework transaction is being reset" },
          },
          required: ["reason"],
          additionalProperties: false,
        },
        execute: async (input, context) => {
          const sessionID = context.sessionID as string
          const txn = await getActiveTxn(c, sessionID)

          if (!txn) {
            return fail("no active rework transaction")
          }

          const reason = (input as { reason?: unknown }).reason
          if (typeof reason !== "string" || reason.trim().length === 0) {
            return fail("reason is required")
          }

          deleteTxn(txn)

          return ok({
            reset: true,
            featureDirectory: txn.featureDir,
            reason: reason.trim(),
            next: "call speckit_rework_select_feature again",
          })
        },
      })

      editor.add({
        name: "speckit_rework_assess_impact",
        description:
          "Record which upstream artifacts are affected before implementation. The plugin automatically includes downstream dependent stages and only gates those stages; an empty list opens implementation after recording the rationale.",
        input: {
          type: "object",
          properties: {
            affectedStages: {
              type: "array",
              items: { type: "string", enum: ["spec", "plan", "tasks", "checklists"] },
              description: "Stages that need changes; downstream dependent stages are added automatically.",
            },
            summary: {
              type: "string",
              description: "Impact assessment, including why omitted stages do not need changes.",
            },
            scope: {
              type: "array",
              items: { type: "string" },
              description:
                "REQUIRED: repo-relative file globs writable during implementation (e.g. ['docs/paper-outline.md', 'scripts/plot_*.py']). Writes outside scope are denied once implementation opens.",
            },
          },
          required: ["affectedStages", "summary", "scope"],
          additionalProperties: false,
        },
        execute: async (input, context) => {
          const sessionID = context.sessionID as string
          const txn = await getActiveTxn(c, sessionID)
          const parsed = input as { affectedStages?: unknown; summary?: unknown; scope?: unknown }
          if (!txn || txn.phase !== "impact-pending") {
            return fail("impact assessment is only accepted before rework stage gates")
          }
          if (!Array.isArray(parsed.affectedStages) || parsed.affectedStages.some(
            (stage) => stage !== "spec" && stage !== "plan" && stage !== "tasks" && stage !== "checklists",
          )) {
            return fail("affectedStages must contain only spec, plan, tasks or checklists")
          }
          if (typeof parsed.summary !== "string" || parsed.summary.trim().length === 0) {
            return fail("summary is required and must explain why omitted stages are unaffected")
          }
          if (!Array.isArray(parsed.scope) || parsed.scope.length === 0) {
            return fail("scope is required: list repo-relative writable file globs for this implementation")
          }
          const scope: string[] = []
          for (const entry of parsed.scope as unknown[]) {
            const n = normalizeScopeEntry(entry)
            if (n === null) {
              return fail(`invalid scope entry '${String(entry)}': must be a repo-relative path glob`)
            }
            scope.push(n)
          }

          const affected = new Set(parsed.affectedStages as Stage[])
          if (affected.has("spec")) {
            affected.add("plan")
            affected.add("tasks")
            affected.add("checklists")
          }
          if (affected.has("plan")) {
            affected.add("tasks")
            affected.add("checklists")
          }
          if (affected.has("tasks")) affected.add("checklists")
          txn.affectedStages = (["spec", "plan", "tasks", "checklists"] as Stage[])
            .filter((stage) => affected.has(stage))
          txn.summaries = { ...txn.summaries, impact: parsed.summary.trim() }
          txn.scope = scope
          txn.phase = txn.affectedStages.length > 0
            ? phaseForStage(txn.affectedStages[0])
            : "implementation-open"
          touchTxn(sessionID, txn)
          return ok({
            affectedStages: txn.affectedStages,
            phase: txn.phase,
            next: txn.affectedStages[0] ?? "implementation",
          })
        },
      })

      editor.add({
        name: "speckit_rework_close",
        description:
          "Close the current rework transaction after implementation is done. After closing, all edits are blocked until a new select + impact assessment.",
        input: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "What was implemented within the declared scope.",
            },
          },
          required: ["summary"],
          additionalProperties: false,
        },
        execute: async (input, context) => {
          const sessionID = context.sessionID as string
          const txn = await getActiveTxn(c, sessionID)
          if (!txn) return fail("no active rework transaction")
          if (txn.phase !== "implementation-open") {
            return fail(`cannot close from phase ${txn.phase}`)
          }
          const summary = (input as { summary?: unknown }).summary
          if (typeof summary !== "string" || summary.trim().length === 0) {
            return fail("summary is required")
          }
          txn.summaries.impact = `${txn.summaries.impact ?? ""} [closed] ${summary.trim()}`
          txn.phase = "closed"
          touchTxn(sessionID, txn)
          return ok({
            phase: txn.phase,
            next: "implementation closed; call speckit_rework_select_feature + speckit_rework_assess_impact before further edits",
          })
        },
      })

      editor.add({
        name: "speckit_rework_gate",
        description:
          "Submit one affected rework stage at a time in dependency order. Only stages declared by speckit_rework_assess_impact are gated; update requires files to change and no-change requires them unchanged.",
        input: {
          type: "object",
          properties: {
            stage: { type: "string", description: "One of: spec, plan, tasks, checklists" },
            decision: { type: "string", description: "update if this change required editing the stage, else no-change" },
            summary: { type: "string", description: "Why this decision was made" },
          },
          required: ["stage", "decision", "summary"],
          additionalProperties: false,
        },
        execute: async (input, context) => {
          const sessionID = context.sessionID as string
          const txn = await getActiveTxn(c, sessionID)
          const parsed = input as { stage?: unknown; decision?: unknown; summary?: unknown }
          if (!txn) return fail("no active rework transaction for this session")
          if (txn.phase === "blocked") {
            return fail(`transaction blocked: ${txn.blockReason ?? "unknown"}`)
          }
          if (txn.phase === "implementation-open" || txn.phase === "needs-feature" || txn.phase === "closed") {
            return fail(`gate not accepted in phase ${txn.phase}`)
          }
          if (
            parsed.stage !== "spec" &&
            parsed.stage !== "plan" &&
            parsed.stage !== "tasks" &&
            parsed.stage !== "checklists"
          ) {
            return fail("stage must be spec, plan, tasks or checklists")
          }
          if (parsed.decision !== "update" && parsed.decision !== "no-change") {
            return fail("decision must be update or no-change")
          }
          if (typeof parsed.summary !== "string" || parsed.summary.trim().length === 0) {
            return fail("summary is required")
          }
          const expected = expectedStage(txn.phase)
          if (parsed.stage !== expected) {
            return block(
              txn,
              sessionID,
              `stage out of order: got ${String(parsed.stage)}, expected ${expected}. Stages must follow dependency order: spec -> plan -> tasks -> checklists.`,
            )
          }
          if (parsed.stage === "checklists") {
            const scan = scanChecklists(txn.root, txn.featureDir)
            if (!scan.pass) {
              return block(txn, sessionID, `checklists failing: ${scan.detail}. Implementation refused.`)
            }
            txn.summaries.checklists = scan.skipped ? `skipped (${scan.detail})` : `passed (${scan.detail})`
            txn.phase = nextAffectedPhase(txn, "checklists")
            touchTxn(sessionID, txn)
            return ok({
              phase: txn.phase,
              checklists: scan.skipped ? `skipped: ${scan.detail}` : `passed: ${scan.detail}`,
              next: txn.phase === "implementation-open" ? "implementation" : expectedStage(txn.phase),
            })
          }
          const files = stageFiles(txn.featureDir, parsed.stage)
          const before = txn.snapshots
          const now: Record<string, string | null> = {}
          for (const rel of files) now[rel] = hashPath(path.join(txn.root, rel))
          const changed = files.filter((rel) => (before[rel] ?? null) !== (now[rel] ?? null))
          const othersChanged = Object.keys(before).filter(
            (rel) => !files.includes(rel) && before[rel] !== hashPath(path.join(txn.root, rel)),
          )
          if (othersChanged.length > 0) {
            return block(
              txn,
              sessionID,
              `files outside stage ${parsed.stage} changed during this stage: ${othersChanged.join(", ")}.`,
            )
          }
          if (parsed.decision === "update" && changed.length === 0) {
            return reject(`stage ${parsed.stage} reported update but no stage file changed.`)
          }
          if (parsed.decision === "no-change" && changed.length > 0) {
            return reject(
              `stage ${parsed.stage} reported no-change but files changed: ${changed.join(", ")}.`,
            )
          }
          txn.summaries[parsed.stage] = parsed.summary
          for (const rel of files) {
            const h = now[rel]
            if (h === null) delete txn.snapshots[rel]
            else txn.snapshots[rel] = h
          }
          txn.phase = nextAffectedPhase(txn, parsed.stage)
          touchTxn(sessionID, txn)
          return ok({
            phase: txn.phase,
            changed,
            next: txn.phase === "implementation-open" ? "implementation" : expectedStage(txn.phase),
          })
        },
      })

      editor.add({
        name: "speckit_rework_complete_task",
        description:
          "Mark one tasks.md task as done during the implementation phase. Only checkbox toggles are allowed; task text can never be edited in rework implementation.",
        input: {
          type: "object",
          properties: {
            taskId: { type: "string", description: "Substring identifying one unchecked task line, e.g. 2.3" },
          },
          required: ["taskId"],
          additionalProperties: false,
        },
        execute: async (input, context) => {
          const sessionID = context.sessionID as string
          const txn = await getActiveTxn(c, sessionID)
          if (!txn || txn.phase !== "implementation-open") {
            return fail("tasks can only be checked off after gates open implementation")
          }
          const taskId = (input as { taskId?: unknown }).taskId
          if (typeof taskId !== "string" || taskId.trim().length === 0) {
            return fail("taskId is required")
          }
          const tasksRel = path.posix.join(txn.featureDir, "tasks.md")
          const tasksAbs = path.join(txn.root, tasksRel)
          let text: string
          try {
            text = readFileSync(tasksAbs, "utf8")
          } catch (e) {
            return fail(`cannot read tasks.md: ${String(e)}`)
          }
          const lines = text.split("\n")
          const hits: number[] = []
          lines.forEach((line, i) => {
            if (/^- \[ \]/.test(line) && line.includes(taskId)) hits.push(i)
          })
          if (hits.length === 0) {
            return fail(`no unchecked task line contains '${taskId}'`)
          }
          if (hits.length > 1) {
            return fail(`ambiguous taskId '${taskId}', matches ${hits.length} lines`)
          }
          lines[hits[0]] = lines[hits[0]].replace("- [ ]", "- [x]")
          try {
            writeFileSync(tasksAbs, lines.join("\n"), "utf8")
          } catch (e) {
            return fail(`cannot write tasks.md: ${String(e)}`)
          }
          const h = hashFile(tasksAbs)
          if (h !== null) txn.snapshots[tasksRel] = h
          touchTxn(sessionID, txn)
          return ok({ line: lines[hits[0]].trim() })
        },
      })
    })

    await ctx.session.hook("prompt", async (event) => {
      const text = event.prompt.text ?? ""
      const sessionID = event.sessionID as string
      if (OFFICIAL_RE.test(text)) {
        // 正常 Spec Kit 流程：插件完全旁路，清除返工事务。
        const existing = await getActiveTxn(c, sessionID)
        if (existing) deleteTxn(existing)
        else txns.delete(sessionID)
        return
      }
      if (!MODIFY_RE.test(text)) return
      const root = await resolveRoot(c, sessionID)
      if (!root) return
      const existing = await getActiveTxn(c, sessionID)
      // An active or blocked transaction is never replaced by a later prompt.
      // Recovery is explicit: use speckit_rework_reset, select the feature again,
      // or use /speckit.*. A closed transaction is finished and may be replaced.
      if (existing && existing.phase !== "closed") return
      if (existing) deleteTxn(existing)
      const feature = pointedEligibleFeature(root)
      // The normal Spec Kit flow and not-yet-implemented features are outside
      // this plugin's scope. The official feature pointer is the authority for
      // deciding which already-implemented feature a rework request targets.
      if (!feature) return
      touchTxn(sessionID, {
        root,
        featureDir: feature.directory,
        phase: "impact-pending",
        affectedStages: [],
        scope: [],
        snapshots: snapshotFeature(root, feature.directory),
        summaries: {},
      })
    })

    await ctx.session.hook("context", async (event) => {
      const txn = await getActiveTxn(c, event.sessionID as string)
      if (!txn) return
      const lines = [
        "[speckit-rework-gate] Rework transaction state machine (authoritative):",
        `phase=${txn.phase} feature=${txn.featureDir || "(unselected)"}`,
        "Rules: /speckit.* commands bypass this plugin. Before implementation, call speckit_rework_assess_impact with affectedStages, scope (repo-relative writable globs), and explain why omitted stages are unaffected. Only affected stages and their downstream dependencies are gated, in spec -> plan -> tasks -> checklists order. An empty affectedStages list opens implementation after the assessment. Close with speckit_rework_close when done.",
        "Never create features, never switch git branches, never bypass the impact assessment. Shell redirect/tee targets outside scope are denied; other shell file writes (cp/mv/cmdlets) are not auto-checked, prefer edit tools. Blocked transactions stay blocked unless explicitly reset.",
      ]
      if (txn.summaries.impact) lines.push(`impactAssessment=${txn.summaries.impact}`)
      if (txn.affectedStages.length > 0) lines.push(`affectedStages=${txn.affectedStages.join(",")}`)
      if (txn.scope.length > 0) lines.push(`scope=${txn.scope.join(",")}`)
      if (txn.phase === "blocked" && txn.blockReason) lines.push(`blockReason=${txn.blockReason}`)
      if (txn.phase === "closed") {
        lines.push("Transaction closed. Further edits require speckit_rework_select_feature + speckit_rework_assess_impact.")
      }
      if (txn.phase === "implementation-open") {
        lines.push(
        "Implementation is open for this session. tasks.md checkbox updates only via speckit_rework_complete_task; task text is frozen. If implementation reveals an upstream artifact was missed, stop implementation and start a new rework assessment.",
        )
      }
      event.system.push({ type: "text", text: lines.join("\n") })
    })

    await ctx.permission.hook("evaluate", async (event) => {
      const sessionID = event.sessionID as string
      const txn = await getActiveTxn(c, sessionID)
      if (!txn) return
      if (event.action !== "edit" && event.action !== "shell") return

      if (event.action === "shell") {
        if (txn.phase === "implementation-open") {
          for (const resource of event.resources) {
            if (!shellLooksLikeWrite(resource)) continue
            const bad = outOfScopeTargets(txn.root, txn.scope, resource)
            if (bad.length > 0) {
              event.effect = "deny"
              event.message = `[speckit-rework-gate] Shell write target outside assessed scope: ${bad.join(", ")}. Scope=[${txn.scope.join(", ")}]. Re-run speckit_rework_assess_impact with an expanded scope.`
              return
            }
          }
          return
        }
        for (const resource of event.resources) {
          if (shellLooksLikeWrite(resource)) {
            event.effect = "deny"
            event.message = `[speckit-rework-gate] Shell writes are blocked during rework review (phase=${txn.phase}). Complete the upstream impact assessment and any declared stage gates first.`
            return
          }
        }
        return
      }

      for (const resource of event.resources) {
        const kind = classify(txn.root, txn.featureDir || "specs/__unselected__", resource)
        if (kind.kind === "outside") continue
        if (kind.kind === "infra" || kind.kind === "speckit-cmd") {
          event.effect = "deny"
          event.message = "[speckit-rework-gate] Spec Kit infrastructure is always read-only in rework mode."
          return
        }
        if (txn.phase === "blocked" || txn.phase === "needs-feature" || txn.phase === "closed") {
          event.effect = "deny"
          event.message =
            txn.phase === "blocked"
              ? `[speckit-rework-gate] Transaction blocked: ${txn.blockReason ?? "unknown"}. No edits allowed.`
              : txn.phase === "closed"
                ? "[speckit-rework-gate] Transaction closed. Further edits require speckit_rework_select_feature + speckit_rework_assess_impact."
                : "[speckit-rework-gate] Select a feature first via speckit_rework_list_features + speckit_rework_select_feature. No edits allowed before that."
          return
        }
        if (txn.phase === "implementation-open") {
          if (kind.kind === "spec") {
            event.effect = "deny"
            event.message =
              kind.stage === "tasks"
                ? "[speckit-rework-gate] tasks.md text is frozen. Use speckit_rework_complete_task for checkbox updates."
                : "[speckit-rework-gate] Spec artifacts are frozen once implementation is open."
            return
          }
          if (kind.kind === "impl" && !inScope(txn.scope, kind.rel)) {
            event.effect = "deny"
            event.message = `[speckit-rework-gate] ${kind.rel} is outside the assessed scope [${txn.scope.join(", ")}]. Re-run speckit_rework_assess_impact with an expanded scope.`
            return
          }
          continue
        }
        if (txn.phase === "impact-pending") {
          event.effect = "deny"
          event.message = "[speckit-rework-gate] Implementation and artifact edits are blocked until speckit_rework_assess_impact records the upstream impact assessment."
          return
        }
        const expected = expectedStage(txn.phase)
        if (kind.kind === "impl" || kind.kind === "spec") {
          const allowed = kind.kind === "spec" && kind.stage === expected
          if (!allowed) {
            event.effect = "deny"
            event.message = `[speckit-rework-gate] Phase=${txn.phase}: only affected stage ${expected} is writable now. Implementation edits stay blocked until the declared affected stages pass.`
            return
          }
        }
      }
    })
  },
} satisfies Plugin.Plugin
