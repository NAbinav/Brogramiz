
# from ast import Str
# from pydantic import BaseModel, Field
# import requests
# import os
# from dotenv import load_dotenv
# import json
# from google.genai import types
# from google import genai
# def create_model(prompt):
#
#     class Code(BaseModel):
#         output:str =Field(...,description=prompt)
#     return Code
#
#
# def call_llm(code,language,prompt): 
#     load_dotenv()
#     api_key = os.getenv("GEMINI_API_KEY")
#     model=genai.Client(api_key=api_key)
#     Structure=create_model(prompt=prompt)
#     response=model.models.generate_content(
#             model="gemini-2.0-flash",
#                                 contents=f"""prompt:{prompt} Language: {language} Code so far:"""+code ,
#
#             config= types.GenerateContentConfig(
#     response_mime_type="application/json",
#     response_schema=Structure
# )           )
#     print(response.text)
#     return (response.text)
