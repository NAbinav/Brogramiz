import requests
import os
from dotenv import load_dotenv
import json


def full_ai_agent(editor_content, language):
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="
        + api_key
def full_ai_agent(editor_content, language,prompt):
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
                        "text": f"""You are an AI coding assistant. You will be given a programming language and a code snippet. Return  code that logically follow. If there exists brackets at end dont forget it Do not include any explanations, comments, or formatting. Return ONLY the raw code with code block.

    Language: {language}
    Code so far:
    {editor_content}
    Next line(s):"""
                        "text":f"""prompt:{prompt} Language: {language} Code so far:"""+editor_content 
                    }
                ]
            }
        ]
    }

    print(prompt)
    result = requests.post(url, json=json_req)
    return json.loads(result.text)["candidates"][0]["content"]["parts"][0]["text"]
