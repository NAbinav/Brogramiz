import os
import subprocess
import tempfile
import uuid


def run_go(input_str: str, code: str):
    with tempfile.TemporaryDirectory() as tmpdir:
        src = os.path.join(tmpdir, "main.go")

        # Write Go source
        with open(src, "w") as f:
            f.write(code)

        try:
            cmd = [
                "docker",
                "run",
                "--rm",
                "-i",
                "--cpus",
                "0.5",
                "--memory",
                "256m",
                "--pids-limit",
                "64",
                "--network",
                "none",
                "--cap-drop",
                "ALL",
                "--security-opt",
                "no-new-privileges",
                "-v",
                f"{tmpdir}:/app",
                "golang:1.22.1",
                "sh",
                "-c",
                "cd /app && go run main.go",
            ]
            result = subprocess.run(
                cmd,
                input=input_str,
                capture_output=True,
                text=True,
            )
            return result.stdout + result.stderr

        except subprocess.TimeoutExpired:
            return "[Error] Execution timed out."
