"""Inspect a manually installed project-scoped gate; no model turn or trust bypass."""
import argparse
from pathlib import Path

from codex_rpc import CodexRPC

parser = argparse.ArgumentParser()
parser.add_argument("--project", required=True, type=Path, help="Project already configured and trusted in Codex")
args = parser.parse_args()
project = args.project.expanduser().resolve()
assert (project / ".codex/config.toml").is_file(), "Missing project .codex/config.toml"

with CodexRPC(cwd=str(project)) as rpc:
    thread = rpc.request("thread/start", {"cwd": str(project), "ephemeral": True})["thread"]
    entries = rpc.request("hooks/list", {"threadId": thread["id"]})["data"]
    hooks = [hook for entry in entries for hook in entry["hooks"] if hook.get("pluginId") == "speckit-rework@sdd-local"]
    assert len(hooks) == 3, "Project hooks missing: check cache installation, user-level false, project-level true and project trust"
    for hook in hooks:
        assert hook["enabled"]
        print("HOOK:", hook["eventName"], "trust=" + hook["trustStatus"])
    status = rpc.request("mcpServerStatus/list", {"threadId": thread["id"], "serverName": "speckit_rework", "detail": "toolsAndAuthOnly", "limit": 10})["data"]
    server = next(server for server in status if server["name"] == "speckit_rework")
    assert len(server["tools"]) == 7
    print("PASS: three project hooks and seven rework controls discovered")
    if any(hook["trustStatus"] in {"untrusted", "modified"} for hook in hooks):
        print("ACTION REQUIRED: review/trust this project's rework hooks in /hooks")
    print("No model turn, hook trust grant, project write or Zotero write performed.")
