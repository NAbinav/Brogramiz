import subprocess
import tempfile
import os

def run_cpp(input_str: str, code: str) -> str:
    input_str = input_str.strip()
    with tempfile.TemporaryDirectory() as temp_dir:
        code_path = os.path.join(temp_dir, 'program.cpp')
        exe_path = os.path.join(temp_dir, 'program')
        with open(code_path, 'w') as f:
            f.write(code)
        
        # Compile
        compile_result = subprocess.run(
            ['firejail', '--net=none', '--private', '/usr/bin/g++', code_path, '-o', exe_path],
            capture_output=True,
            timeout=10
        )
        if compile_result.returncode != 0:
            return compile_result.stderr.decode().strip() or "Compilation error"
        
        # Run
        run_result = subprocess.run(
            ['firejail', '--net=none','--private', '--rlimit-cpu=5', exe_path],
            input=input_str,
            capture_output=True,
            timeout=10
        )
        print(run_result.returncode)
        if run_result.returncode != 0:
            return run_result.stderr.decode().strip() or "Execution error"
        return run_result.stdout.decode().strip()


