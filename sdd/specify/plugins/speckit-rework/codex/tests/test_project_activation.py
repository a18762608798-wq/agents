"""Verify project-only Codex activation using an isolated CODEX_HOME and no model turns."""
import json
import os
from pathlib import Path
import subprocess
from tempfile import TemporaryDirectory

from codex_rpc import CodexRPC

MARKETPLACE = Path(__file__).resolve().parents[3]

with TemporaryDirectory(prefix="sdd-codex-scope-") as directory:
    base = Path(directory)
    home = base / "codex-home"
    project = base / "project"
    outside = base / "outside"
    home.mkdir()
    project.mkdir()
    outside.mkdir()
    subprocess.run(["git", "init", "--quiet", str(project)], check=True)
    (project / ".codex").mkdir()
    (project / ".specify").mkdir()
    (project / "specs").mkdir()
    (project / ".codex/config.toml").write_text('[plugins."speckit-rework@sdd-local"]\nenabled = true\n')
    global_config = (
        '[features]\nremote_plugin = false\n'
        '[marketplaces.sdd-local]\nsource_type = "local"\n'
        f'source = {json.dumps(str(MARKETPLACE))}\n'
        f'[projects.{json.dumps(str(project))}]\ntrust_level = "trusted"\n'
    )
    (home / "config.toml").write_text(global_config)
    env = dict(os.environ, CODEX_HOME=str(home))
    # CLI installation populates the cache but defaults to global enablement.
    # Immediately disable that user-level entry; only the project opts in.
    subprocess.run(['codex', 'plugin', 'add', 'speckit-rework@sdd-local', '--json'], cwd=outside, env=env, check=True, capture_output=True, text=True)
    global_config += '\n[plugins."speckit-rework@sdd-local"]\nenabled = false\n'
    (home / 'config.toml').write_text(global_config)
    with CodexRPC(cwd=str(project), env=env) as rpc:
        thread = rpc.request("thread/start", {"cwd": str(project), "ephemeral": True})["thread"]
        hooks = rpc.request("hooks/list", {"threadId": thread["id"]})["data"]
        selected = [h for entry in hooks for h in entry["hooks"] if h.get("pluginId") == "speckit-rework@sdd-local"]
        print("Project hook count:", len(selected), flush=True)
        assert len(selected) == 3
        assert all(h["trustStatus"] == "untrusted" for h in selected)
        servers = rpc.request("mcpServerStatus/list", {"threadId": thread["id"], "serverName": "speckit_rework", "detail": "toolsAndAuthOnly", "limit": 10})["data"]
        server = next(s for s in servers if s["name"] == "speckit_rework")
        assert len(server["tools"]) == 7
        print("PASS: project enabled flag overrides user-level disabled and exposes all seven cached controls", flush=True)
    with CodexRPC(cwd=str(outside), env=env) as rpc:
        thread = rpc.request("thread/start", {"cwd": str(outside), "ephemeral": True})["thread"]
        hooks = rpc.request("hooks/list", {"threadId": thread["id"]})["data"]
        assert not any(h.get("pluginId") == "speckit-rework@sdd-local" for entry in hooks for h in entry["hooks"])
        servers = rpc.request("mcpServerStatus/list", {"threadId": thread["id"], "detail": "toolsAndAuthOnly", "limit": 30})["data"]
        assert not any(s["name"] == "speckit_rework" for s in servers)
        skills = rpc.request('skills/list', {'cwds': [str(outside)], 'forceReload': True})['data']
        assert not any('speckit-rework' in skill.get('name', '') and skill.get('enabled', False) for entry in skills for skill in entry.get('skills', []))
        print("PASS: the cached plugin is not activated outside the opted-in project (hooks, MCP and skills)", flush=True)
    assert (home / "config.toml").read_text() == global_config
    print("PASS: user-level plugin remains disabled; real home/config/auth were not used", flush=True)
