import subprocess
from pathlib import Path


def run_py(input_content, editor_content):
    # Create a temporary directory to store the Python script
    temp_dir = Path.home() / "code_runner_tmp"
    temp_dir.mkdir(exist_ok=True)

    # Write the provided Python code to a file
    py_file = temp_dir / "script.py"
    py_file.write_text(editor_content)

    # Docker command to run the script inside a container
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
        f"{temp_dir}:/app:ro",  # Mount the temp directory to /app in the container
        "-i",  # Interactive mode for stdin
        "python:3.9-slim",  # Use the Python 3.9 slim image
        "python",
        "/app/script.py",  # Run the script
    ]

    # Run the command, passing the input content, and capture the output
    result = subprocess.run(
        cmd,
        input=input_content,  # Pass input directly
        capture_output=True,
        text=True,  # Ensure output is captured as a string
    )

    # Return the combined stdout and stderr as the result
    return result.stdout + result.stderr
