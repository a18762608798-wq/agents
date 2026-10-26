#!/usr/bin/env python3
"""Run trigger evaluation for a skill description.

Tests whether a skill's description causes opencode to invoke it (via the
native ``skill`` tool) for a set of user queries.

Each query runs inside an *isolated* temporary git project so that concurrent
runs never see each other's temporary skills and the tested description is
evaluated against a clean environment.
"""

from __future__ import annotations

import argparse
import json
import os
import select
import shutil
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
from typing import Any

import yaml

from scripts.utils import parse_skill_md

# ---------------------------------------------------------------------------
# Prevent recursive opencode nesting when this script itself is invoked from
# inside an opencode session.
# ---------------------------------------------------------------------------
CHILD_ENV = "SKILL_CREATOR_EVAL_CHILD"

# ---------------------------------------------------------------------------
# env vars we set on child processes to reduce noise
# ---------------------------------------------------------------------------
ISOLATION_ENV = {
    "OPENCODE_DISABLE_CLAUDE_CODE": "true",
    "OPENCODE_DISABLE_CLAUDE_CODE_SKILLS": "true",
    "OPENCODE_DISABLE_CLAUDE_CODE_PROMPT": "true",
}


def _home_isolation_env(tmp: Path) -> dict[str, str]:
    """Build env vars that redirect HOME to an empty temp directory.

    With a blank home, no globally-installed skills (``~/.config/opencode/``,
    ``~/.claude/``, ``~/.agents/``) are discoverable.  Auth credentials are
    copied from the real home so the provider API key remains available.
    """
    temp_home = tmp / "home"
    temp_home.mkdir()

    real_auth = Path.home() / ".local" / "share" / "opencode" / "auth.json"
    if real_auth.exists():
        temp_data = temp_home / ".local" / "share" / "opencode"
        temp_data.mkdir(parents=True, exist_ok=True)
        shutil.copy2(real_auth, temp_data / "auth.json")

    return {
        "HOME": str(temp_home),
        "XDG_CONFIG_HOME": str(temp_home / ".config"),
        "XDG_DATA_HOME": str(temp_home / ".local" / "share"),
    }


# ===================================================================
# Helpers
# ===================================================================


def find_project_root() -> Path:
    """Walk up from *cwd* looking for the nearest .opencode/ or .git/.

    Kept for backward compatibility – the new eval path creates its
    own isolated project and no longer relies on this.
    """
    current = Path.cwd()
    for parent in [current, *current.parents]:
        if (parent / ".opencode").is_dir() or (parent / ".git").is_dir():
            return parent
    return current


def _skill_content(name: str, description: str) -> str:
    """Build a minimal SKILL.md with YAML frontmatter.

    Uses ``yaml.safe_dump`` so that multiline descriptions, special
    characters, and colons are handled correctly.
    """
    frontmatter = yaml.safe_dump(
        {"name": name, "description": description},
        sort_keys=False,
        allow_unicode=True,
    ).strip()
    return f"---\n{frontmatter}\n---\n\n# {name}\n"


def _isolated_project(skill_name: str, skill_description: str) -> Path:
    """Create an isolated temporary git project with a clean opencode config.

    The project contains *only* the test skill and a minimal config that
    allows skill access.  Redirecting HOME to a blank directory prevents
    global skills (``~/.config/opencode/skills/``, ``~/.claude/skills/``,
    ``~/.agents/skills/``) from leaking into the evaluation.
    """
    tmp = Path(tempfile.mkdtemp(prefix=f"skill-eval-{skill_name}-"))
    subprocess.run(
        ["git", "init", "-q", str(tmp)],
        check=True,
        capture_output=True,
    )

    # Project-local skill
    skill_dir = tmp / ".opencode" / "skills" / skill_name
    skill_dir.mkdir(parents=True)
    (skill_dir / "SKILL.md").write_text(
        _skill_content(skill_name, skill_description), encoding="utf-8"
    )

    # Project-local config. V2 rediscovers <project>/opencode.json(c) per
    # session location, so this works against the shared background service.
    # (OPENCODE_CONFIG_CONTENT is not honored by `run` in that setup.)
    (tmp / "opencode.json").write_text(
        json.dumps(
            {
                "permissions": [
                    {"action": "*", "resource": "*", "effect": "allow"},
                ]
            }
        ),
        encoding="utf-8",
    )

    return tmp


# ===================================================================
# JSON event parsers – detect whether the ``skill`` tool was called
# ===================================================================


def _event_triggers_skill(event: dict[str, Any], skill_name: str) -> bool:
    """Return ``True`` if *event* shows a ``skill`` tool invocation for *skill_name*."""

    # Pattern A – OpenCode native tool_use event (primary path)
    # {"type":"tool_use","part":{"type":"tool","tool":"skill","state":{"input":{"name":"..."}}}}
    if event.get("type") == "tool_use":
        part = event.get("part", {})
        if _part_is_skill_tool(part, skill_name):
            return True

    # Pattern B – Anthropic-compatible content_block_start
    if event.get("type") == "content_block_start":
        cb = event.get("content_block", {})
        if cb.get("type") == "tool_use" and _is_skill_tool_call(cb, skill_name):
            return True

    # Pattern C – nested stream_event wrapper
    if event.get("type") == "stream_event":
        inner = event.get("event", {})
        return _event_triggers_skill(inner, skill_name)

    # Pattern D – full assistant message
    if event.get("type") == "assistant":
        for item in event.get("message", {}).get("content", []):
            if item.get("type") == "tool_use" and _is_skill_tool_call(
                item, skill_name
            ):
                return True

    return False


def _extract_skill_call(
    event: dict[str, Any], skill_name: str
) -> dict[str, Any] | None:
    """If *event* is a skill call for *skill_name*, return a summary dict."""
    if event.get("type") == "tool_use":
        part = event.get("part", {})
        if part.get("type") == "tool" and part.get("tool", "").lower() == "skill":
            inp = part.get("state", {}).get("input", {})
            return {"name": inp.get("name", ""), "pattern": "A"}

    if event.get("type") == "content_block_start":
        cb = event.get("content_block", {})
        if cb.get("type") == "tool_use" and (cb.get("name", "")).lower() == "skill":
            inp = cb.get("input", {})
            return {"name": inp.get("name", ""), "pattern": "B"}

    if event.get("type") == "stream_event":
        return _extract_skill_call(event.get("event", {}), skill_name)

    if event.get("type") == "assistant":
        for item in event.get("message", {}).get("content", []):
            if item.get("type") == "tool_use" and item.get("name", "").lower() == "skill":
                inp = item.get("input", {})
                return {"name": inp.get("name", ""), "pattern": "D"}

    return None


def _part_is_skill_tool(part: dict, skill_name: str) -> bool:
    if part.get("type") != "tool":
        return False
    if part.get("tool", "").lower() != "skill":
        return False
    state_input = part.get("state", {}).get("input", {})
    if isinstance(state_input, dict) and state_input.get("name") == skill_name:
        return True
    return False


def _is_skill_tool_call(item: dict, skill_name: str) -> bool:
    name = item.get("name", "")
    if name.lower() != "skill":
        return False
    return _skill_input_matches(item.get("input", {}), skill_name)


def _skill_input_matches(input_obj: dict, skill_name: str) -> bool:
    skill_param = (
        input_obj.get("name")
        or input_obj.get("skill")
        or input_obj.get("file_path")
    )
    if isinstance(skill_param, str) and skill_name in skill_param:
        return True
    raw = json.dumps(input_obj)
    return skill_name in raw


# ===================================================================
# Single-query runner (isolated project)
# ===================================================================


def run_single_query(
    query: str,
    skill_name: str,
    skill_description: str,
    timeout: int,
    model: str | None = None,
    *,
    isolated: bool = True,
) -> dict[str, Any]:
    """Run *query* in a project and detect skill triggering.

    By default runs in isolated mode (blank HOME, no global skills).
    Set ``isolated=False`` to test against the real user environment."""

    tmp = _isolated_project(skill_name, skill_description)
    try:
        cmd = [
            "opencode",
            "run",
            query,
            "--format",
            "json",
        ]
        if model:
            cmd.extend(["--model", model])

        env = {
            **os.environ,
            CHILD_ENV: "1",
            **ISOLATION_ENV,
        }
        if isolated:
            env.update(_home_isolation_env(tmp))

        with tempfile.TemporaryFile() as stderr_file:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=stderr_file,
                cwd=str(tmp),
                env=env,
            )

            triggered = False
            timed_out = False
            skill_calls: list[dict[str, Any]] = []
            start_time = time.time()
            buffer = ""

            try:
                while time.time() - start_time < timeout:
                    if process.poll() is not None:
                        remaining = process.stdout.read()
                        if remaining:
                            buffer += remaining.decode("utf-8", errors="replace")
                        break

                    ready, _, _ = select.select([process.stdout], [], [], 1.0)
                    if not ready:
                        continue

                    chunk = os.read(process.stdout.fileno(), 8192)
                    if not chunk:
                        # Empty read is only a real EOF if the process has
                        # exited: opencode (bun) may briefly close/replace
                        # stdout mid-run, producing a transient b'' while
                        # still alive. Breaking here loses later events and
                        # misreports a healthy run as timed out.
                        if process.poll() is not None:
                            remaining = process.stdout.read()
                            if remaining:
                                buffer += remaining.decode("utf-8", errors="replace")
                            break
                        continue
                    buffer += chunk.decode("utf-8", errors="replace")

                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            event = json.loads(line)
                        except json.JSONDecodeError:
                            continue

                        if _event_triggers_skill(event, skill_name):
                            triggered = True
                            call = _extract_skill_call(event, skill_name)
                            if call:
                                skill_calls.append(call)

            finally:
                if process.poll() is None:
                    timed_out = True
                    try:
                        process.kill()
                    except ProcessLookupError:
                        # Exited between poll() and kill(): not a timeout.
                        timed_out = False
                    process.wait()

            # Post-mortem scan of any remaining output
            if not triggered and buffer:
                for line in buffer.split("\n"):
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if _event_triggers_skill(event, skill_name):
                        triggered = True
                        call = _extract_skill_call(event, skill_name)
                        if call:
                            skill_calls.append(call)

            returncode = process.returncode
            stderr_file.seek(0)
            stderr_bytes = stderr_file.read()
            stderr_text = stderr_bytes.decode("utf-8", errors="replace")[-2000:]

            if timed_out:
                status = "infra_error"
            elif returncode != 0:
                status = "infra_error"
            elif triggered:
                status = "triggered"
            else:
                status = "not_triggered"

            return {
                "status": status,
                "returncode": returncode,
                "timed_out": timed_out,
                "stderr": stderr_text,
                "skill_calls": skill_calls,
            }

    finally:
        shutil.rmtree(tmp)


# ===================================================================
# Preflight probes
# ===================================================================


def _run_preflight(
    skill_name: str,
    skill_description: str,
    timeout: int,
    model: str | None = None,
    *,
    isolated: bool = True,
) -> tuple[bool, str]:
    """Verify skill discovery and parser health via forced invocation."""

    forced_prompt = (
        f'IMPORTANT: You MUST use the "skill" tool with name exactly '
        f'"{skill_name}" right now. Call the skill tool, then reply '
        f"with exactly PREFLIGHT_OK and nothing else."
    )
    result = run_single_query(
        forced_prompt, skill_name, skill_description, timeout * 2, model,
        isolated=isolated,
    )
    if result["status"] == "infra_error":
        return False, (
            f"Preflight failed (infra_error): "
            f"returncode={result['returncode']}, stderr={result['stderr'][:300]}"
        )
    if result["status"] != "triggered":
        return False, (
            "Preflight FAILED: model did not invoke the skill tool when "
            "explicitly instructed. Either the skill is not discoverable, "
            "the skill tool is not available, or the JSON event parser "
            "cannot detect tool_use events."
        )

    return True, "preflight OK (forced skill invocation detected)"


# ===================================================================
# Batch evaluator
# ===================================================================


def run_eval(
    eval_set: list[dict],
    skill_name: str,
    description: str,
    num_workers: int,
    timeout: int,
    project_root: Path | None = None,  # kept for bw-compat, unused
    runs_per_query: int = 3,
    trigger_threshold: float = 0.5,
    model: str | None = None,
    skip_preflight: bool = False,
    *,
    isolated: bool = True,
) -> dict[str, Any]:
    """Run the full eval set and return aggregated results."""

    # ------------------------------------------------------------------
    # Preflight
    # ------------------------------------------------------------------
    msg = "skipped"
    if not skip_preflight:
        ok, msg = _run_preflight(skill_name, description, timeout, model, isolated=isolated)
        if not ok:
            return {
                "skill_name": skill_name,
                "description": description,
                "error": msg,
                "results": [],
                "summary": {"total": 0, "passed": 0, "failed": 0, "infra_errors": 0},
            }

    # ------------------------------------------------------------------
    # Submit all runs
    # ------------------------------------------------------------------
    query_results: dict[int, list[dict[str, Any]]] = {}
    query_items: dict[int, dict] = {}

    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        future_to_info: dict[Any, tuple[int, dict, int]] = {}
        for idx, item in enumerate(eval_set):
            eval_id = idx
            for run_idx in range(runs_per_query):
                future = executor.submit(
                    run_single_query,
                    item["query"],
                    skill_name,
                    description,
                    timeout,
                    model,
                    isolated=isolated,
                )
                future_to_info[future] = (eval_id, item, run_idx)

        for future in as_completed(future_to_info):
            eval_id, item, _ = future_to_info[future]
            query_items[eval_id] = item
            if eval_id not in query_results:
                query_results[eval_id] = []
            try:
                query_results[eval_id].append(future.result())
            except Exception as exc:
                query_results[eval_id].append(
                    {
                        "status": "infra_error",
                        "returncode": -1,
                        "timed_out": False,
                        "stderr": f"ProcessPool exception: {exc}",
                        "skill_calls": [],
                    }
                )

    # ------------------------------------------------------------------
    # Aggregate per-query
    # ------------------------------------------------------------------
    results: list[dict[str, Any]] = []
    total_infra = 0

    for eval_id, run_results in query_results.items():
        item = query_items[eval_id]
        should_trigger = item["should_trigger"]

        num_runs = len(run_results)
        num_triggered = sum(1 for r in run_results if r["status"] == "triggered")
        num_infra = sum(1 for r in run_results if r["status"] == "infra_error")
        valid_runs = num_runs - num_infra
        total_infra += num_infra

        # Require at least <runs_per_query> valid runs; otherwise the
        # query is inconclusive and MUST NOT participate in scoring.
        if valid_runs < runs_per_query:
            trigger_rate = 0.0
            did_pass = False
            status = "inconclusive"
        else:
            trigger_rate = num_triggered / valid_runs
            did_pass = (
                trigger_rate >= trigger_threshold
                if should_trigger
                else trigger_rate < trigger_threshold
            )
            status = "ok"

        diagnostics = None
        if num_infra > 0:
            diagnostics = [
                {
                    "status": r["status"],
                    "returncode": r["returncode"],
                    "timed_out": r["timed_out"],
                    "stderr": r["stderr"][:500],
                }
                for r in run_results
                if r["status"] == "infra_error"
            ]

        results.append(
            {
                "_eval_id": eval_id,
                "source_id": item.get("id"),
                "query": item["query"],
                "should_trigger": should_trigger,
                "trigger_rate": trigger_rate,
                "triggers": num_triggered,
                "runs": num_runs,
                "valid_runs": valid_runs,
                "infra_errors": num_infra,
                "pass": did_pass,
                "eval_status": status,
                "diagnostics": diagnostics,
            }
        )

    # Sort by internal id so report order is deterministic
    results.sort(key=lambda r: r["_eval_id"])

    total = len(results)
    passed = sum(1 for r in results if r["pass"] and r.get("eval_status") != "inconclusive")
    inconclusive = sum(1 for r in results if r.get("eval_status") == "inconclusive")
    scored_results = [r for r in results if r.get("eval_status") != "inconclusive"]
    scored = len(scored_results)

    n_pos = sum(1 for r in scored_results if r["should_trigger"])
    n_neg = scored - n_pos
    tp = sum(1 for r in scored_results if r["should_trigger"] and r["pass"])
    tn = sum(1 for r in scored_results if not r["should_trigger"] and r["pass"])
    fp = n_neg - tn
    fn = n_pos - tp
    recall = tp / n_pos if n_pos > 0 else 1.0
    specificity = tn / n_neg if n_neg > 0 else 1.0
    balanced_acc = (recall + specificity) / 2.0

    return {
        "skill_name": skill_name,
        "description": description,
        "preflight": msg,
        "results": results,
        "summary": {
            "total": total,
            "scored": scored,
            "inconclusive": inconclusive,
            "passed": passed,
            "failed": scored - passed,
            "infra_errors": total_infra,
            "recall": recall,
            "specificity": specificity,
            "false_positive_rate": fp / n_neg if n_neg > 0 else 0.0,
            "balanced_accuracy": balanced_acc,
            "true_positives": tp,
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
        },
    }


# ===================================================================
# CLI
# ===================================================================


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run trigger evaluation for a skill description"
    )
    parser.add_argument(
        "--eval-set", required=True, help="Path to eval set JSON file"
    )
    parser.add_argument(
        "--skill-path", required=True, help="Path to skill directory"
    )
    parser.add_argument(
        "--description",
        default=None,
        help="Override description to test",
    )
    parser.add_argument(
        "--num-workers",
        type=int,
        default=2,
        help="Number of parallel workers (default: 2, previously 10)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=60,
        help="Timeout per query in seconds (default: 60, previously 30)",
    )
    parser.add_argument(
        "--runs-per-query",
        type=int,
        default=3,
        help="Number of runs per query",
    )
    parser.add_argument(
        "--trigger-threshold",
        type=float,
        default=0.5,
        help="Trigger rate threshold",
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Model for opencode run, in provider/model format",
    )
    parser.add_argument(
        "--no-preflight",
        action="store_true",
        help="Skip preflight probes (use only when you are sure the env is healthy)",
    )
    parser.add_argument(
        "--isolated",
        action="store_true",
        help="Run in isolated mode (blank HOME, no global skills). Default: realistic mode.",
    )
    parser.add_argument(
        "--verbose", action="store_true", help="Print progress to stderr"
    )
    args = parser.parse_args()

    eval_set = json.loads(Path(args.eval_set).read_text())
    skill_path = Path(args.skill_path)

    if not (skill_path / "SKILL.md").exists():
        print(f"Error: No SKILL.md found at {skill_path}", file=sys.stderr)
        sys.exit(1)

    name, original_description, _content = parse_skill_md(skill_path)
    description = args.description or original_description

    if args.verbose:
        print(f"Evaluating: {description}", file=sys.stderr)

    output = run_eval(
        eval_set=eval_set,
        skill_name=name,
        description=description,
        num_workers=args.num_workers,
        timeout=args.timeout,
        project_root=None,
        runs_per_query=args.runs_per_query,
        trigger_threshold=args.trigger_threshold,
        model=args.model,
        skip_preflight=args.no_preflight,
        isolated=args.isolated,
    )

    if args.verbose:
        summary = output["summary"]
        n_pass = summary["passed"]
        n_total = summary["total"]
        n_scored = summary.get("scored", n_total)
        n_inconclusive = summary.get("inconclusive", 0)
        n_infra = summary.get("infra_errors", 0)
        ba = summary.get("balanced_accuracy", 0)
        print(
            f"Results: {n_pass}/{n_scored} passed "
            f"(inconclusive={n_inconclusive}, infra_errors={n_infra}, balanced_acc={ba:.1%})",
            file=sys.stderr,
        )
        for r in output["results"]:
            e_status = r.get("eval_status", "ok")
            if e_status == "inconclusive":
                status = "INCONCLUSIVE"
            else:
                status = "PASS" if r["pass"] else "FAIL"
            rate_str = f"{r['triggers']}/{r['valid_runs']}"
            diag = ""
            if r.get("infra_errors", 0) > 0:
                diag = f" [!{r['infra_errors']} infra]"
            print(
                f"  [{status}] rate={rate_str} expected={r['should_trigger']}{diag}: "
                f"{r['query'][:70]}",
                file=sys.stderr,
            )

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
