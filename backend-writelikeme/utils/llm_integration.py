import random
import litellm
from dotenv import load_dotenv

from .llm_router import router
from .constants import constants


load_dotenv()
litellm.success_callback = ["langfuse"]
litellm.failure_callback = ["langfuse"]


def get_final_model(model):
    if model == "random":
        model = random.choice(["gemini-free", "gpt-4o-mini", "deepseek-r1", "claude"])
        print(f"final model: {model}")
    return model


def text_completion_with_tracing(messages, model="gemini", temperature=constants.DEFAULT_TEMPERATURE, max_tokens=constants.DEFAULT_MAX_TOKENS_LARGE, metadata={}, stream=False):
    try:
        response = router.completion(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            metadata=metadata,
            stream=stream
        )
        return response
    except Exception as e:
        print(f"Error: {e}")
        raise e


class LLMIntegration:
    
    def generate_content(self, style_profile: dict, topic: str, length: str = "medium", stream: bool = False) -> str:
        """Generate content in the specified style."""
        # Map length to approximate word counts
        length_mapping = {
            "short": "100-200 words",
            "medium": "300-500 words",
            "long": "700-1000 words"
        }
        target_length = length_mapping.get(length, "300-500 words")
        
        # Create prompt for OpenAI with advanced style mimicry techniques
        system_prompt = f"""
        You are an expert writer who perfectly mimics human writing styles in a way that cannot be detected by AI detection tools. 
        You will write in the following specific style:
        
        ## Style Description
        {style_profile['description']}
        
        ## Style Examples
        These are authentic examples of the writing style to mimic:
        
        Example 1: "{style_profile['excerpts'][0]}"
        
        Example 2: "{style_profile['excerpts'][1] if len(style_profile['excerpts']) > 1 else ''}"
        
        Example 3: "{style_profile['excerpts'][2] if len(style_profile['excerpts']) > 2 else ''}"
        
        ## Specific Style Instructions
        {style_profile['mimicry_instructions']}
        
        ## Human Writing Indicators to Include
        - Introduce occasional typos, inconsistencies or filler words (like "really", "actually", "just", etc.)
        - Vary your punctuation patterns - don't be too consistent
        - Include some rewording or self-correction within the text
        - Occasionally use sentence fragments or run-on sentences
        - Use varied formats for emphasis instead of consistency
        - Insert personal anecdotes or asides when appropriate
        - Avoid perfectly balanced sentence structures that are common in AI writing
        - Let ideas unfold naturally rather than in perfectly organized paragraphs
        
        ## Critical Instructions to Avoid Detection
        - Break patterns: Avoid repeating the same sentence structure multiple times
        - Don't overuse linking verbs like "is" and "are"
        - Use a mixture of active and passive voice, but favor the author's preferred style
        - Include unusual word combinations that wouldn't be common in AI training data
        - Your writing should have a sense of spontaneity in how ideas develop
        - Diverge occasionally from perfectly logical ordering of thoughts
        - Incorporate at least 2-3 highly specific details that feel authentic and human
        
        Your task is to write about the given topic in exactly this style.
        The content should be around {target_length} words.
        
        Remember: Your goal is to produce text that would be impossible to distinguish from human writing.
        """
        
        user_prompt = f"Write about the following topic: {topic}"
        
        try:
            response = text_completion_with_tracing(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="gemini-free",
                stream=stream
            )
            if stream:
                return response
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Error generating content: {str(e)}")