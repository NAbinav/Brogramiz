import subprocess
import tempfile
import os

def run_py(input_str: str, code: str) -> str:
    with tempfile.NamedTemporaryFile(suffix='.py', delete=False) as temp_file:
        temp_file.write(code.encode())
        temp_file_path = temp_file.name
    
    try:
        result = subprocess.run(
            ['firejail', '--net=none', '--rlimit-cpu=5', 'python3', temp_file_path],
            input=input_str.encode(),
            capture_output=True,
            timeout=10  # Overall timeout in seconds
        )
        if result.returncode != 0:
            return result.stderr.decode().strip() or "Execution error"
        return result.stdout.decode().strip()
    except subprocess.TimeoutExpired:
        return "Execution timed out"
    finally:
        os.unlink(temp_file_path)