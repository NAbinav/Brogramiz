# run_c.py
import os
import subprocess
import tempfile
from pathlib import Path
import stat


def run_c(input_str: str, code: str) -> str:
    with tempfile.TemporaryDirectory(prefix="c_run_") as tmpdir:
        # 1) Make dir/world‑accessible
        os.chmod(tmpdir, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)  # 0o777

        # 2) Write source & set perms
        src = Path(tmpdir) / "main.c"
        src.write_text(code)
        os.chmod(
            src, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH
        )  # 0o644

        # 3) Compile & execute in one step
        cmd = [
            "docker",
            "run",
            "--rm",
            "-i",
            "--cpus=0.5",
            "--memory=128m",
            "--pids-limit=64",
            "--network=none",
            "--cap-drop=ALL",
            "--security-opt",
            "no-new-privileges",
            "-v",
            f"{tmpdir}:/app",  # read‑write
            "gcc:latest",
            "sh",
            "-c",
            "cd /app && gcc main.c -o main && timeout 5 ./main",
        ]

        try:
            res = subprocess.run(
                cmd,
                input=input_str,
                capture_output=True,
                text=True,
                timeout=10,
            )
            return res.stdout + res.stderr

        except subprocess.TimeoutExpired:
            return "[Error] Execution timed out."
