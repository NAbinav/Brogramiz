import subprocess
from pathlib import Path


def run_go(input_content, editor_content):
    temp_dir = Path("/tmp/code_runner")
    temp_dir.mkdir(parents=True, exist_ok=True)
    go_path = temp_dir / "main.go"
    go_path.write_text(editor_content)

    cmd = [
        "docker",
        "run",
        "--rm",
        "--cpus=0.5",
        "--memory=256m",
        "--pids-limit=64",
        "--read-only",
        "--network=none",
        "--cap-drop=ALL",
        "--security-opt",
        "no-new-privileges",
        "-v",
        f"{temp_dir}:/app:ro",
        "golang:1.22",
        "go",
        "run",
        "/app/main.go",
    ]

    result = subprocess.run(cmd, input=input_content.encode(), capture_output=True)
    return result.stdout.decode() + result.stderr.decode()
