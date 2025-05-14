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
        "gcc:13.2.0",  # or another recent gcc version
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
