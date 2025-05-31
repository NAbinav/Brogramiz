# run_java.py
import subprocess
import shlex


def run_java(input_str: str, code: str) -> str:

    code_esc = shlex.quote(code)
    input_esc = shlex.quote(input_str)

    inner_script = (
        "mkdir -p /app && "
        f"printf %s {code_esc} > /app/Main.java && "
        "javac /app/Main.java && "
        f"printf %s {input_esc} |  java -cp /app Main"
    )

    cmd = [
        "docker",
        "run",
        "--rm",
        "-i",
        "--network=none",
        "--cap-drop=ALL",
        "--security-opt=no-new-privileges",
        "openjdk:17-slim",
        "sh",
        "-c",
        "--memory=128m", "--cpus=0.5",
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
