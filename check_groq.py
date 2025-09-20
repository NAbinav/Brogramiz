from groq import Groq
import os
API_KEY=os.getenv("GROQ_API_KEY")
client = Groq(api_key=API_KEY)
def ai(language,code,prompt):
    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
             {
            "role": "system",
            "content": prompt 
          },
          {
            "role": "user",
                "content": "code:"+code+"language:"+language
          }
        ],
        temperature=1,
        max_completion_tokens=8192,
        top_p=1,
        reasoning_effort="low",
        stream=True,
        stop=None
    )
    out=""
    for chunk in completion:
        out+=(chunk.choices[0].delta.content or "")
    print(out)

