
// === UTILS: Dynamic Script and CSS Loader ===
export function loadScript(src) {
	return new Promise((resolve, reject) => {
	  if (document.querySelector(`script[src="${src}"]`)) return resolve();
	  const script = document.createElement("script");
	  script.src = src;
	  script.onload = resolve;
	  script.onerror = () => reject(new Error(`Failed to load ${src}`));
	  document.head.appendChild(script);
	});
	}

	export function loadCSS(href) {
	if (document.querySelector(`link[href="${href}"]`)) return;
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = href;
	document.head.appendChild(link);
}

// === Load CodeMirror core + selected language mode ===
export async function loadCodeMirror(language) {
	const baseURL = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13";

	const langMap = {
	  cpp: "clike",
	  c: "clike",
	  python: "python",
	  java: "clike",
	  html: "htmlmixed",
	  go: "go",
	};

	const modeMap = {
	  cpp: "text/x-c++src",
	  c: "text/x-csrc",
	  python: "text/x-python",
	  java: "text/x-java",
	  html: "htmlmixed",
	  go: "text/x-go",
	};

	const mode = langMap[language] || "clike";
	await loadScript(`${baseURL}/mode/${mode}/${mode}.min.js`);

	return modeMap[language] || "text/x-c++src";
}

export async function initEditor(language) {
const mode = await loadCodeMirror(language);
editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
  mode,
  theme: "monokai",
  lineNumbers: true,
  matchBrackets: true,
  autoCloseBrackets: true,
});
editor.setSize("100%", "100%");

attachAISuggestions();
}

