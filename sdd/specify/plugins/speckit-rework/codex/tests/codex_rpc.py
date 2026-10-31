"""Small stdio inspection client. Does not send model turns or approve hooks."""
import json
import queue
import subprocess
import threading
import time


class CodexRPC:
    def __init__(self, extra_args=(), cwd="/tmp", env=None):
        self.process = subprocess.Popen(
            ["codex", "app-server", "--stdio", *extra_args], cwd=cwd, env=env,
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, bufsize=1,
        )
        self.messages = queue.Queue()
        self.diagnostics = []
        self.sequence = 0
        threading.Thread(target=self._read, daemon=True).start()
        threading.Thread(target=self._read_errors, daemon=True).start()
        self.request("initialize", {
            "clientInfo": {"name": "local_plugin_validation", "version": "1.0.0"},
            "capabilities": {"experimentalApi": True},
        })
        self.send({"method": "initialized", "params": {}})

    def _read(self):
        for line in self.process.stdout:
            try:
                self.messages.put(json.loads(line))
            except ValueError:
                pass
        self.messages.put(None)

    def _read_errors(self):
        for line in self.process.stderr:
            if len(self.diagnostics) < 40:
                self.diagnostics.append(line.strip())

    def send(self, message):
        self.process.stdin.write(json.dumps(message) + "\n")
        self.process.stdin.flush()

    def request(self, method, params, timeout=120):
        self.sequence += 1
        identifier = self.sequence
        self.send({"id": identifier, "method": method, "params": params})
        deadline = time.monotonic() + timeout
        while True:
            message = self.messages.get(timeout=max(0.01, deadline - time.monotonic()))
            if message is None:
                raise RuntimeError("App server exited: " + "\n".join(self.diagnostics[-5:]))
            if message.get("id") == identifier:
                if "error" in message:
                    raise RuntimeError(method + ": " + json.dumps(message["error"]))
                return message["result"]

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.process.stdin.close()
        self.process.wait(timeout=25)
