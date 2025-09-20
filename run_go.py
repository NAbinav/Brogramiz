import subprocess
import tempfile
import os

def run_go(input_str: str, code: str) -> str:
    with tempfile.TemporaryDirectory() as temp_dir:
        code_path = os.path.join(temp_dir, 'main.go')
        with open(code_path, 'w') as f:
            f.write(code)
        
        # Run directly with go run (for simplicity; could build for perf)
        run_result = subprocess.run(
            ['firejail', '--private','--net=none', '--rlimit-cpu=5', 'go', 'run', code_path],
            input=input_str.encode(),
            capture_output=True,
            timeout=10
        )
        if run_result.returncode != 0:
            return run_result.stderr.decode().strip() or "Execution error"
        return run_result.stdout.decode().strip()