import os
import random
from litellm import Router
from dotenv import load_dotenv


load_dotenv()

def get_model_name(platform="groq"):
    if platform == "openai" or platform == "gpt-4o-mini":
        return os.getenv("OPENAI_COMPLETION_MODEL_MINI")
    elif platform == "gemini":
        return os.getenv("GEMINI_TEXT_COMPLETION_MODEL")
    elif platform == "groq":
        return os.getenv("GROQ_TEXT_COMPLETION_MODEL")
    

def get_gemini_api_key():
    return os.getenv(f"GCP_GEMINI_SECRET")


def get_groq_api_key():
    return os.getenv(f"GROQ_ROUND_ROBIN_SECRET")


router = Router(
    model_list=[
        {
            "model_name": "groq",
            "litellm_params": {
                "model": f"groq/{get_model_name(platform='groq')}",
                "api_base": "https://api.groq.com/openai/v1",
                "api_key": get_groq_api_key(),
            },
        },
        {
            "model_name": "gemini",
            "litellm_params": {
                "model": f"gemini/{get_model_name(platform='gemini')}",
                "api_key": get_gemini_api_key(),
            },
            "rpm": os.getenv("GCP_GEMINI_RPM", 20),
        },
        {
            "model_name": "gpt-4o-mini", 
            "litellm_params": {
                "model": f'openai/{get_model_name(platform="openai")}',
                "api_key": os.getenv("OPENAI_API_KEY"),
            },
        },
        {
        "model_name": "deepseek-r1",
        "litellm_params": {
            "model": "deepseek/deepseek-reasoner",
            "api_key": os.getenv("DEEPSEEK_API_KEY")
        }
        },
        {
            "model_name": "claude", 
            "litellm_params": {
                "model": f"anthropic/{os.getenv('CLAUDE_TEXT_COMPLETION_MODEL')}",
                "api_key": os.getenv("CLAUDE_API_KEY"),
            }
        }
    ],
    fallbacks=[
        {"gemini": ["gpt-4o-mini"]},
        {"groq": ["gpt-4o-mini"]},
        {"gpt-4o-mini": ["gemini-paid"]},
        {"deepseek-r1": ["gemini-paid"]},
        {"gemini-free": ["gpt-4o-mini"]},
        {"claude": ["gpt-4o-mini"]},
    ],
    num_retries=2,
    retry_after=30,
    cooldown_time=20,
    timeout=300,
    set_verbose=False,
    debug_level="ERROR",
)