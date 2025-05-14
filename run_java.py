# run_java.py
import os, subprocess, tempfile
from pathlib import Path


def run_java(input_str: str, code: str) -> str:
    with tempfile.TemporaryDirectory() as tmpdir:
        src = Path(tmpdir) / "Main.java"
        src.write_text(code)

        cmd = [
            "docker",
            "run",
            "--rm",
            "-i",
            "-v",
            f"{tmpdir}:/app",
            "openjdk:17-slim",
            "sh",
            "-c",
            "javac /app/Main.java && java -cp /app Main",
        ]
        try:
            res = subprocess.run(
                cmd, input=input_str, capture_output=True, text=True, timeout=15
            )
            return res.stdout + res.stderr
        except subprocess.TimeoutExpired:
            return "[Error] Execution timed out."
