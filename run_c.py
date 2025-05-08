import subprocess
from pathlib import Path


def run_c(input_content, editor_content):
    # Create a temporary directory on the host for storing the C++ source code and compiled binary
    temp_dir = Path("/tmp/code_runner_tmp")
    temp_dir.mkdir(exist_ok=True)

    # Write the provided C++ code to a file
    cpp_file = temp_dir / "script.cpp"
    cpp_file.write_text(editor_content)

    # Write the input content to a file for passing it to the container
    input_file = temp_dir / "input.txt"
    input_file.write_text(input_content)

    # Docker command to compile and run the C++ code
    cmd_compile = [
        "docker",
        "run",
        "--rm",
        "-v",
        f"{str(temp_dir)}:/tmp:rw",  # Mount the host directory to /tmp inside container
        "gcc:latest",  # Official GCC Docker image
        "gcc",
        "/tmp/script.cpp",
        "-o",
        "/tmp/script",  # Compile the C++ code
    ]

    # Run the compile command
    compile_result = subprocess.run(cmd_compile, capture_output=True, text=True)

    # Check for compilation errors
    if compile_result.returncode != 0:
        return compile_result.stdout + compile_result.stderr

    # Docker command to run the compiled binary
    cmd_run = [
        "docker",
        "run",
        "--rm",
        "-v",
        f"{str(temp_dir)}:/tmp:rw",  # Mount the host directory to /tmp inside container
        "-i",  # Interactive mode for stdin
        "gcc:latest",  # Use the gcc:latest image for running the compiled code
        "/tmp/script",  # Path to the compiled binary inside the container
    ]

    # Run the command, passing the input content to stdin
    result = subprocess.run(
        cmd_run,
        input=input_content,  # Pass input directly to stdin
        capture_output=True,
        text=True,  # Ensure output is captured as a string
    )

    # Return the combined stdout and stderr as the result
    return result.stdout + result.stderr
