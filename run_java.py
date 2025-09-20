import subprocess
import tempfile
import os

def run_java(input_str: str, code: str) -> str:
    with tempfile.TemporaryDirectory() as temp_dir:
        code_path = os.path.join(temp_dir, 'Main.java')
        with open(code_path, 'w') as f:
            f.write(code)
        
        # Compile
        compile_result = subprocess.run(
            ['firejail', '--net=none', '--private', 'javac', code_path],
            capture_output=True,
            timeout=10
        )
        if compile_result.returncode != 0:
            return compile_result.stderr.decode().strip() or "Compilation error"
        
        # Run
        run_result = subprocess.run(
            ['firejail', '--net=none', '--rlimit-cpu=5', 'java', '-cp', temp_dir, 'Main'],
            input=input_str.encode(),
            capture_output=True,
            timeout=10
        )
        if run_result.returncode != 0:
            return run_result.stderr.decode().strip() or "Execution error"
        return run_result.stdout.decode().strip()


