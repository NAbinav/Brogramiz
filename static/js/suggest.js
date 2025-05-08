document.addEventListener("keydown", async function (e) {
    if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();

        const code = editor.getValue();
        const language = document.getElementById("language").value;

        const response = await fetch("/suggest", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code, language }),
        });

        if (response.ok) {
            let data = await response.text();
            data = data.trim().split('\n').slice(1, -1).join('\n');

            // Insert AI suggestion at the current cursor position
            const doc = editor.getDoc();
            const cursor = doc.getCursor(); // {line, ch}
            doc.replaceRange(data, cursor);
        } else {
            alert("Error getting suggestion from AI.");
        }
    }
});

