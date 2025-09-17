import subprocess
import tempfile
import os

def run_python(input_str: str, code: str) -> str:
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

def run_c(input_str: str, code: str) -> str:
    with tempfile.TemporaryDirectory() as temp_dir:
        code_path = os.path.join(temp_dir, 'program.c')
        exe_path = os.path.join(temp_dir, 'program')
        with open(code_path, 'w') as f:
            f.write(code)
        
        # Compile
        compile_result = subprocess.run(
            ['firejail', '--net=none', '--private', 'gcc', code_path, '-o', exe_path],
            capture_output=True,
            timeout=10
        )
        if compile_result.returncode != 0:
            return compile_result.stderr.decode().strip() or "Compilation error"
        
        # Run
        run_result = subprocess.run(
            ['firejail', '--net=none', '--rlimit-cpu=5', exe_path],
            input=input_str.encode(),
            capture_output=True,
            timeout=10
        )
        if run_result.returncode != 0:
            return run_result.stderr.decode().strip() or "Execution error"
        return run_result.stdout.decode().strip()

def run_cpp(input_str: str, code: str) -> str:
    with tempfile.TemporaryDirectory() as temp_dir:
        code_path = os.path.join(temp_dir, 'program.cpp')
        exe_path = os.path.join(temp_dir, 'program')
        with open(code_path, 'w') as f:
            f.write(code)
        
        # Compile
        compile_result = subprocess.run(
            ['firejail', '--net=none', '--private', 'g++', code_path, '-o', exe_path],
            capture_output=True,
            timeout=10
        )
        if compile_result.returncode != 0:
            return compile_result.stderr.decode().strip() or "Compilation error"
        
        # Run
        run_result = subprocess.run(
            ['firejail', '--net=none', '--rlimit-cpu=5', exe_path],
            input=input_str.encode(),
            capture_output=True,
            timeout=10
        )
        if run_result.returncode != 0:
            return run_result.stderr.decode().strip() or "Execution error"
        return run_result.stdout.decode().strip()

def run_go(input_str: str, code: str) -> str:
    with tempfile.TemporaryDirectory() as temp_dir:
        code_path = os.path.join(temp_dir, 'main.go')
        with open(code_path, 'w') as f:
            f.write(code)
        
        # Run directly with go run (for simplicity; could build for perf)
        run_result = subprocess.run(
            ['firejail', '--net=none', '--rlimit-cpu=5', 'go', 'run', code_path],
            input=input_str.encode(),
            capture_output=True,
            timeout=10
        )
        if run_result.returncode != 0:
            return run_result.stderr.decode().strip() or "Execution error"
        return run_result.stdout.decode().strip()