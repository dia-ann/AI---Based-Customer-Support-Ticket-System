import re
from dataclasses import dataclass

@dataclass(frozen=True)
class RedactionResult:
    text: str
    replacements: int

_EMAIL = re.compile(r"\b[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+\b")
_PHONE = re.compile(r"(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)(?!\w)")
_CARD = re.compile(r"(?<!\w)(?:\d[ -]*?){13,19}(?!\w)")

def redact_pii(text: str) -> RedactionResult:
    if not isinstance(text, str):
        raise TypeError("text must be a string")
    replacements = 0

    def replace(match, token):
        nonlocal replacements
        replacements += 1
        return token

    text = _EMAIL.sub(lambda m: replace(m, "<email>"), text)
    text = _CARD.sub(lambda m: replace(m, "<acc_num>"), text)
    text = _PHONE.sub(lambda m: replace(m, "<tel_num>"), text)
    return RedactionResult(text=text, replacements=replacements)