import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Create a dummy audio file using afplay or just a short base64 string... wait, I'll transcribe an empty or dummy file? 
# Or I can just check the type signatures or create a dummy mp3.
