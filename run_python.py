import subprocess
import shlex


def run_py(input_str: str, code: str) -> str:

    code_esc = shlex.quote(code)
    input_esc = shlex.quote(input_str)
    inner_script = (
        "mkdir -p /app && "
        f"printf %s {code_esc} > /app/main.py && "
        f"printf %s {input_esc} | python3 /app/main.py"
    )

    cmd = [
    "docker",
    "run",
    "--rm",
    "-i",
    "--network=none",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--memory=256m",        # limit memory to 256MB
    "--memory-swap=256m",   # no swap beyond 256MB
    "--cpus=0.5",           # limit CPU to half core
    "python:3.9-slim",
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
