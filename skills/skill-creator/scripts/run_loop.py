#!/usr/bin/env python3
"""Evaluate a skill description against a set of trigger queries.

Runs each query through opencode and reports whether the skill was
invoked.  Optionally generates a *candidate* improved description via
an LLM call — the result is for human review only and is never applied
automatically.
"""

import argparse
import json
import sys
import tempfile
import time
import webbrowser
from pathlib import Path

from scripts.generate_report import generate_html
from scripts.improve_description import improve_description
from scripts.run_eval import run_eval
from scripts.utils import parse_skill_md


def _calc_metrics(results: list[dict]) -> dict:
    """Compute recall, specificity, and balanced_accuracy.

    Queries marked ``"inconclusive"`` are excluded from scoring.
    """
    scored = [r for r in results if r.get("eval_status") != "inconclusive"]
    if not scored:
        return {
            "recall": 0.0,
            "specificity": 0.0,
            "balanced_accuracy": 0.0,
            "tp": 0,
            "tn": 0,
            "fp": 0,
            "fn": 0,
            "inconclusive": len(results),
        }
    pos = [r for r in scored if r["should_trigger"]]
    neg = [r for r in scored if not r["should_trigger"]]
    tp = sum(1 for r in pos if r["pass"])
    tn = sum(1 for r in neg if r["pass"])
    recall = tp / len(pos) if pos else 1.0
    specificity = tn / len(neg) if neg else 1.0
    return {
        "recall": recall,
        "specificity": specificity,
        "balanced_accuracy": (recall + specificity) / 2.0,
        "tp": tp,
        "tn": tn,
        "fp": len(neg) - tn,
        "fn": len(pos) - tp,
        "inconclusive": len(results) - len(scored),
    }


def evaluate_description(
    eval_set: list[dict],
    skill_path: Path,
    description_override: str | None,
    num_workers: int,
    timeout: int,
    runs_per_query: int,
    trigger_threshold: float,
    model: str,
    verbose: bool,
    log_dir: Path | None = None,
    *,
    propose: bool = False,
    isolated: bool = True,
) -> dict:
    """Evaluate one skill description and optionally propose an improvement."""

    name, original_description, content = parse_skill_md(skill_path)
    current_description = description_override or original_description

    # Stable internal IDs — never trust external "id" fields
    for idx, item in enumerate(eval_set):
        item["_eval_id"] = idx

    if verbose:
        print(f"Evaluating: {current_description}", file=sys.stderr)

    t0 = time.time()
    results = run_eval(
        eval_set=eval_set,
        skill_name=name,
        description=current_description,
        num_workers=num_workers,
        timeout=timeout,
        runs_per_query=runs_per_query,
        trigger_threshold=trigger_threshold,
        model=model,
        isolated=isolated,
    )
    elapsed = time.time() - t0

    exit_reason = "completed"
    candidate_description = None

    # -- Infra / preflight failures abort before candidate generation -------
    if "error" in results:
        exit_reason = f"preflight_failed: {results['error']}"
        if verbose:
            print(f"\n{exit_reason}", file=sys.stderr)
        return {
            "exit_reason": exit_reason,
            "evaluated_description": current_description,
            "metrics": None,
            "results": results.get("results", []),
            "candidate_description": None,
        }

    any_inconclusive = any(
        r.get("eval_status") == "inconclusive" for r in results["results"]
    )
    if any_inconclusive:
        n = sum(1 for r in results["results"] if r.get("eval_status") == "inconclusive")
        exit_reason = f"inconclusive_results ({n} queries)"
        if verbose:
            print(f"\n{n} queries inconclusive — infrastructure errors, aborting.", file=sys.stderr)
        return {
            "exit_reason": exit_reason,
            "evaluated_description": current_description,
            "metrics": None,
            "results": results["results"],
            "candidate_description": None,
        }

    # -- Compute metrics ----------------------------------------------------
    metrics = _calc_metrics(results["results"])

    if verbose:
        ba = metrics["balanced_accuracy"]
        print(
            f"\nResults: {metrics['tp'] + metrics['tn']}/{len(results['results'])} correct, "
            f"balanced_acc={ba:.1%} ({elapsed:.1f}s)",
            file=sys.stderr,
        )
        for r in results["results"]:
            status = "PASS" if r["pass"] else "FAIL"
            vr = r.get("valid_runs", r.get("runs", 0))
            rate_str = f"{r['triggers']}/{vr}"
            e_status = r.get("eval_status", "ok")
            tag = f" [{e_status}]" if e_status != "ok" else ""
            print(
                f"  [{status}{tag}] rate={rate_str} expected={r['should_trigger']}: "
                f"{r['query'][:80]}",
                file=sys.stderr,
            )

    # -- Optionally propose a candidate improvement -------------------------
    candidate_description = None
    candidate_error = None

    if propose:
        if verbose:
            print("\nGenerating candidate description...", file=sys.stderr)
        t1 = time.time()
        try:
            train_wrapper = {"results": results["results"], "summary": results["summary"]}
            candidate_description = improve_description(
                skill_name=name,
                skill_content=content,
                current_description=current_description,
                eval_results=train_wrapper,
                history=[],
                model=model,
                log_dir=log_dir,
                iteration=1,
            )
            if verbose:
                print(f"Candidate ({time.time() - t1:.1f}s): {candidate_description}", file=sys.stderr)
        except Exception as exc:
            candidate_error = str(exc)
            if verbose:
                print(f"Candidate generation FAILED: {exc}", file=sys.stderr)

    return {
        "exit_reason": exit_reason,
        "evaluated_description": current_description,
        "metrics": metrics,
        "results": results["results"],
        "candidate_description": candidate_description,
        "candidate_error": candidate_error,
    }


# ======================================================================
# CLI
# ======================================================================


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Evaluate a skill description against trigger queries"
    )
    parser.add_argument("--eval-set", required=True, help="Path to eval set JSON file")
    parser.add_argument("--skill-path", required=True, help="Path to skill directory")
    parser.add_argument("--description", default=None, help="Override description to evaluate")
    parser.add_argument("--num-workers", type=int, default=2, help="Number of parallel workers")
    parser.add_argument("--timeout", type=int, default=60, help="Timeout per query (seconds)")
    parser.add_argument("--runs-per-query", type=int, default=3, help="Runs per query")
    parser.add_argument("--trigger-threshold", type=float, default=0.5, help="Trigger rate threshold")
    parser.add_argument("--model", required=True, help="Model for opencode run (provider/model)")
    parser.add_argument("--verbose", action="store_true", help="Print progress to stderr")
    parser.add_argument("--isolated", action="store_true", default=True, help=argparse.SUPPRESS)
    parser.add_argument("--no-isolated", action="store_true", help="Debug: use real HOME (may load global skills; not recommended)")
    parser.add_argument("--propose", action="store_true", help="Generate a candidate improved description (LLM call)")
    parser.add_argument("--report", default="none", help="Generate HTML report (default: 'none', 'auto' for temp file)")
    parser.add_argument("--results-dir", default=None, help="Save results to timestamped subdirectory")
    args = parser.parse_args()

    if args.no_isolated:
        args.isolated = False

    eval_set = json.loads(Path(args.eval_set).read_text())
    skill_path = Path(args.skill_path)

    if not (skill_path / "SKILL.md").exists():
        print(f"Error: No SKILL.md found at {skill_path}", file=sys.stderr)
        sys.exit(1)

    name, _, _ = parse_skill_md(skill_path)

    # Live report
    live_report_path = None
    if args.report != "none":
        if args.report == "auto":
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            live_report_path = (
                Path(tempfile.gettempdir())
                / f"skill_description_eval_{skill_path.name}_{timestamp}.html"
            )
        else:
            live_report_path = Path(args.report)
        live_report_path.write_text(
            "<html><body><h1>Evaluating skill description...</h1>"
            "<meta http-equiv='refresh' content='5'></body></html>"
        )
        webbrowser.open(str(live_report_path))

    # Results directory
    results_dir = None
    log_dir = None
    if args.results_dir:
        timestamp = time.strftime("%Y-%m-%d_%H%M%S")
        results_dir = Path(args.results_dir) / timestamp
        results_dir.mkdir(parents=True, exist_ok=True)
        log_dir = results_dir / "logs"

    output = evaluate_description(
        eval_set=eval_set,
        skill_path=skill_path,
        description_override=args.description,
        num_workers=args.num_workers,
        timeout=args.timeout,
        runs_per_query=args.runs_per_query,
        trigger_threshold=args.trigger_threshold,
        model=args.model,
        verbose=args.verbose,
        log_dir=log_dir,
        propose=args.propose,
        isolated=args.isolated,
    )

    json_output = json.dumps(output, indent=2)
    print(json_output)

    if results_dir:
        (results_dir / "results.json").write_text(json_output)

    if live_report_path:
        single_iter = [{
            "iteration": 1,
            "description": output["evaluated_description"],
            "passed": sum(1 for r in output["results"] if r["pass"]),
            "failed": sum(1 for r in output["results"] if not r["pass"]),
            "total": len(output["results"]),
            "results": output["results"],
        }]
        report_data = {
            "original_description": output["evaluated_description"],
            "best_description": output["evaluated_description"],
            "best_score": f"{output['metrics']['tp'] + output['metrics']['tn']}" if output["metrics"] else "N/A",
            "iterations_run": 1,
            "history": single_iter,
            "candidate_description": output.get("candidate_description"),
            "candidate_error": output.get("candidate_error"),
        }
        live_report_path.write_text(generate_html(report_data, auto_refresh=False, skill_name=name))
        print(f"\nReport: {live_report_path}", file=sys.stderr)

    if results_dir and live_report_path:
        (results_dir / "report.html").write_text(generate_html(report_data, auto_refresh=False, skill_name=name))

    if results_dir:
        print(f"Results saved to: {results_dir}", file=sys.stderr)


if __name__ == "__main__":
    main()
