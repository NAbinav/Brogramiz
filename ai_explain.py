import requests
import os
from dotenv import load_dotenv
import json


def ai_agent(editor_content, language,prompt):
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+ api_key
    )
    json_req = {
        "contents": [
            {
                "parts": [
                    {
                        "text":f"""prompt:{prompt} Language: {language} Code so far:"""+editor_content 
                    }
                ]
            }
        ]
    }
    print(prompt)
    result = requests.post(url, json=json_req)
    a = 10
    return json.loads(result.text)["candidates"][0]["content"]["parts"][0]["text"]

