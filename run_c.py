import subprocess
import shlex


def run_c(input_str: str, code: str) -> str:

    code_esc = shlex.quote(code)
    input_esc = shlex.quote(input_str)
    inner_script = (
        "mkdir -p /app && "
        f"printf %s {code_esc} > /app/main.c && "
        "gcc /app/main.c -o /app/main && "
        f"printf %s {input_esc} | /app/main"
    )

    cmd = [
    "docker",
    "run",
    "--rm",
    "-i",
    "--network=none",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    # Resource limits:
    "--memory=256m",            # Limit memory to 256MB
    "--memory-swap=256m",       # Disable swap beyond 256MB (same as memory)
    "--cpus=0.5",               # Limit to 50% of one CPU core
    "--pids-limit=100",         # Limit number of processes
    "gcc:13.2.0",
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
