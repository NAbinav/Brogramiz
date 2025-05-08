import subprocess
from pathlib import Path


def run_java(input_content, editor_content):
    # Create a persistent temp directory on the host
    temp_dir = Path.home() / "code_runner_tmp"
    temp_dir.mkdir(exist_ok=True)

    # Write Java source code (must be public class Main)
    java_file = temp_dir / "Main.java"
    java_file.write_text(editor_content)

    # Docker command: read-only code mount, tmpfs for /run (writable in-container space)
    cmd = [
        "docker",
        "run",
        "--rm",
        "--read-only",
        "--network=none",
        "--cap-drop=ALL",
        "--security-opt",
        "no-new-privileges",
        "-v",
        f"{temp_dir}:/app:ro",  # Read-only source
        "--tmpfs",
        "/run",  # Writable tmpfs for compilation and execution
        "-i",
        "openjdk:17-slim",
        "sh",
        "-c",
        "cp /app/Main.java /run/ && cd /run && javac Main.java && java Main",
    ]

    # Execute with input and capture output
    result = subprocess.run(
        cmd,
        input=input_content,
        capture_output=True,
        text=True,
    )

    return result.stdout + result.stderr
