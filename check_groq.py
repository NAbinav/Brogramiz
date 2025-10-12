from groq import Groq
from pydantic import BaseModel,Field
import os
API_KEY=os.getenv("GROQ_API_KEY")
client = Groq(api_key=API_KEY)
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import json
#
# def lineai( code, system_prompt):
#     # Initialize Groq LLM
#     class CodeOutput(BaseModel):
#         finished_code: str = Field(description=system_prompt)
#     print(system_prompt)
#     llm = ChatGroq(
#         model="openai/gpt-oss-120b",
#         temperature=0.8,
#         # api_key=API_KEY
#     )
#     structured_llm=llm.with_structured_output(CodeOutput)
#     input=code 
#     print(code)
#     return(structured_llm.invoke(input).dict())
#
def lineai(code, system_prompt):
    llm = ChatGroq(
        model="openai/gpt-oss-120b",
        temperature=0.8,
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": code}
    ]
    response = llm.invoke(messages)
    return {"finished_code": response.content}  # Manual parsing


    # Define JSON parser with schema
    # parser = JsonOutputParser(pydantic_object=CodeOutput)
    #
    # # Add format instructions for strict JSON output
    # format_instructions = parser.get_format_instructions()
    #
    # # Create prompt with formatting instructions
    # print(format_instructions)
    # prompt = ChatPromptTemplate([
    #     ("system", f"{system_prompt}\n\n{format_instructions}"),
    #     ("user", "{input}")
    # ])
    #
    # # Chain: prompt → model → parser
    # chain = prompt | llm | parser
    #
    # def parse_product(description: str) -> dict:
    #     result = chain.invoke({"input": description})
    #     return {"suggestion": json.dumps(result, indent=2)}
    #
    # return parse_product(f"code: {code}, language: {language}")


