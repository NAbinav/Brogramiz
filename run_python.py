import subprocess
import tempfile
import os


def run_py(input_str: str, code: str):
    # Create a temporary directory for storing the Python script
    with tempfile.TemporaryDirectory() as tmpdir:
        script_path = os.path.join(tmpdir, "script.py")

        # Save the Python code to a file in the temporary directory
        with open(script_path, "w") as f:
            f.write(code)

        try:
            result = subprocess.run(
                [
                    "docker",
                    "run",
                    "--rm",
                    "-i",  # Run the Python container
                    "--network",
                    "fastapi_default",  # Network used by Docker Compose
                    "-v",
                    f"{tmpdir}:/app:ro",  # Mount the temporary directory with code
                    "python:3.9-slim",  # Python image
                    "python",
                    "/app/script.py",  # Execute the script inside the container
                ],
                input=input_str,
                capture_output=True,
                text=True,
                timeout=10,  # Set a timeout for execution
            )
            return (
                result.stdout + result.stderr
            )  # Return the output and errors from the script

        except subprocess.TimeoutExpired:
            return "[Error] Execution timed out."
