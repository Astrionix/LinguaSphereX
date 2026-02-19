import re

def clean_text(text: str) -> str:
    """
    Removes unwanted characters and normalizes whitespace.
    """
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def format_timestamp(ts):
    return ts.strftime("%Y-%m-%d %H:%M:%S")
