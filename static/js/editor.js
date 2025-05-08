// Store the available modes for dynamic import
const languageModes = {
    cpp: "text/x-c++src",
    c: "text/x-csrc",
    python: "text/x-python",
    java: "text/x-java",
    html: "htmlmixed",
    go: "text/x-go"
};

// Select the initial language (default: cpp)
let currentLanguage = "cpp"; 

// Initialize the CodeMirror editor
const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    mode: languageModes[currentLanguage],
    theme: "monokai",
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    enableCodeFolding: true
});

// Dynamically load the language mode script when the user selects a new language
document.getElementById("language").addEventListener("change", function() {
    const selectedLanguage = this.value;

    // If the new language mode isn't already loaded, load it
    if (!CodeMirror.modes[selectedLanguage]) {
        const script = document.createElement("script");
        script.src = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/${selectedLanguage}/${selectedLanguage}.min.js`;
        script.onload = () => {
            editor.setOption("mode", languageModes[selectedLanguage]);
        };
        document.body.appendChild(script);
    } else {
        editor.setOption("mode", languageModes[selectedLanguage]);
    }

    // Update the current language
    currentLanguage = selectedLanguage;
});

