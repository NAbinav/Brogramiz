import subprocess
import shlex


def run_go(input_str: str, code: str) -> str:

    code_esc = shlex.quote(code)
    input_esc = shlex.quote(input_str)
    inner_script = (
        "mkdir -p /app && "
        f"printf %s {code_esc} > /app/Main.go && "
        "export GOMODULE=off && "
        f"printf %s {input_esc} | go run /app/Main.go"
    )
    cmd = [
    "docker",
    "run",
    "--rm",
    "-i",
    "--network=none",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    # mount persistent cache directory
    "-v",
    "go-build-cache:/go/pkg/mod",
    # resource limits here:
    "--memory=512m",          # limit RAM to 512 MB
    "--memory-swap=128m",     # disallow swap beyond memory limit
    "--cpus=0.5",             # limit to 1 CPU core
    "--pids-limit=200",       # limit number of processes to 200
    "golang:1.20-alpine",
    "sh",
    "-c",
    inner_script,
]

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
        )
        return proc.stdout + proc.stderr

    except subprocess.TimeoutExpired:
        return "[Error] Execution timed out."
