import subprocess
import shlex


def run_cpp(input_str: str, code: str) -> str:

    code_esc = shlex.quote(code)
    input_esc = shlex.quote(input_str)
    inner_script = (
        "mkdir -p /app && "
        f"printf %s {code_esc} > /app/main.cpp && "
        "g++ /app/main.cpp -o /app/main && "
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
    "--memory=256m",         # limit RAM to 256MB
    "--memory-swap=256m",    # no swap allowed beyond memory limit
    "--cpus=0.5",            # limit CPU to 50%
    "--pids-limit=100",      # limit max processes to 100
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
