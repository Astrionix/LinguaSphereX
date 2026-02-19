# ISO-639-1 to NLLB Code Mapping (Common Languages)
# NLLB uses FLORES-200 codes: https://github.com/facebookresearch/flores/blob/main/flores200/README.md

NLLB_CODES = {
    "en": "eng_Latn",
    "es": "spa_Latn", # Spanish
    "fr": "fra_Latn", # French
    "de": "deu_Latn", # German
    "zh": "zho_Hans", # Chinese (Simplified)
    "ja": "jpn_Jpan", # Japanese
    "hi": "hin_Deva", # Hindi
    "ru": "rus_Cyrl", # Russian
    "ar": "arb_Arab", # Arabic (Modern Standard)
    "pt": "por_Latn", # Portuguese
    "it": "ita_Latn", # Italian
    "nl": "nld_Latn", # Dutch
    "pl": "pol_Latn", # Polish
    "tr": "tur_Latn", # Turkish
    "ko": "kor_Hang", # Korean
    "vi": "vie_Latn", # Vietnamese
    "id": "ind_Latn", # Indonesian
    "th": "tha_Thai", # Thai
    "te": "tel_Telu", # Telugu (Added)
}

def get_nllb_code(lang_code: str) -> str:
    """Returns the NLLB code for a given ISO language code, defaulting to English."""
    return NLLB_CODES.get(lang_code, "eng_Latn")
