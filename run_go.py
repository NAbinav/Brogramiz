import subprocess
import shlex


def run_go(input_str: str, code: str) -> str:
    # Escape the code and input safely
    code_esc = shlex.quote(code)
    input_esc = shlex.quote(input_str)

    # Build the shell script to run inside the Docker container
    inner_script = (
        "mkdir -p /app && "
        f"printf %s {code_esc} > /app/Main.go && "
        "cd /app && "
        f"printf %s {input_esc} | go run Main.go"
    )

    # Docker command to run Go inside a secure container
    cmd = [
        "docker", "run", "--rm", "-i",
        "--network=none",
        "--cap-drop=ALL",
        "--security-opt=no-new-privileges",
        "-v", "go-build-cache:/go",  # Mount Go cache
        "--memory=512m",
        "--memory-swap=1024m",
        "--cpus=0.5",
        "--pids-limit=200",
        "golang:1.20-alpine",
        "sh", "-c", inner_script
    ]

    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10  # Timeout in seconds
        )
        return proc.stdout + proc.stderr

    except subprocess.TimeoutExpired:
        return "[Error] Execution timed out."
    except Exception as e:
        return f"[Error] {str(e)}"

