# run_py.py

import os
import subprocess
import uuid

SHARED_DIR = "/code_exec"  # where FastAPI writes
EXECUTOR_CONTAINER = "python-executor"


def run_py(input_str: str, code: str):
    file_id = f"{uuid.uuid4()}.py"
    host_path = os.path.join(SHARED_DIR, file_id)

    # 1) write the user code
    with open(host_path, "w") as f:
        f.write(code)

    try:
        # 2) exec into python-executor to run it
        result = subprocess.run(
            ["docker", "exec", "-i", EXECUTOR_CONTAINER, "python", f"/app/{file_id}"],
            input=input_str,
            capture_output=True,
            text=True,
            timeout=10,
        )
        return result.stdout + result.stderr

    except subprocess.TimeoutExpired:
        return "[Error] Execution timed out."

    finally:
        # 3) clean up
        try:
            os.remove(host_path)
        except OSError:
            pass
