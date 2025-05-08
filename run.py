from run_cpp import run_cpp
from run_python import run_py
from run_java import run_java
from run_c import run_c
from run_go import run_go
import html

def run(input_content, editor_content, lang):
    if lang == "python":
        return run_py(input_content, editor_content)
    elif lang == "cpp":
        return run_cpp(input_content, editor_content)
    elif lang == "c":
        return run_c(input_content, editor_content)
    elif lang == "java":
        return run_java(input_content, editor_content)
    elif lang == "html":
        return f'''
<iframe
    sandbox="allow-scripts"
    style="width:100%; height:100%; border:none;"
    srcdoc="{html.escape(editor_content)}">
</iframe>
'''

    elif lang == "go":
        return run_go(input_content, editor_content)
    else:
        return "[Error] Unknown language selected."

