from pydantic import BaseModel,Field

class Explain(BaseModel):
    explain:str=Field(...,description="you are an AI model that explains the given code")
class Bug(BaseModel):
    bug:str=Field(...,description="you are an AI model that finds the bug in the given code also input and output be given")

class Line(BaseModel):
    line:str=Field(...,description="you are an AI that auto completes code. You will be given a programming language and a partial code snippet. Return  Only add the next one or two lines of code that logically follow. ")


class File(BaseModel):
    file:str=Field(...,description="You are an AI coding assistant. You will be given a programming language and a code snippet. Return  code that logically follow. If there exists brackets at end dont forget it Do not include any explanations, comments, or formatting. Return ONLY the raw code with code block.")

