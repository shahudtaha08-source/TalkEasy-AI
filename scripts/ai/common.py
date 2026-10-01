"""
TalkEasy AI - shared dataset normalization and safety taxonomy.

Imported by:
  scripts/ai/preprocess_empathetic.py
  scripts/ai/build_talkeasy_dataset.py
  scripts/ai/validate_dataset.py
  scripts/ai/build_splits.py
  scripts/ai/evaluate_model.py

Keeping this in one module means the safety patterns used to *filter* training
data are the same patterns the application uses to *detect* risk at runtime.
That is deliberate: the training-data filter and the runtime guardrail must
never drift apart.

IMPORTANT SAFETY DESIGN NOTE
----------------------------
Crisis/safety handling in TalkEasy is deterministic and lives in
server/safety-detection.ts. It is NOT delegated to the model.

Therefore this module also provides `is_crisis_context()`. The preprocessing
step REMOVES crisis-context conversations from the general empathetic training
set, because training the model to answer a suicidal disclosure with a mild
follow-up question would actively teach the wrong behaviour. Crisis responses
are only ever learned from the hand-reviewed curated layer in
scripts/ai/curated/.
"""

from __future__ import annotations

import re
import sys
import unicodedata


def force_utf8_console() -> None:
    """Make stdout/stderr safe for Devanagari, Arabic and Roman-Urdu output.

    The Windows console defaults to cp1252, which raises UnicodeEncodeError the
    moment a script tries to print a Hindi example. This is a no-op elsewhere.
    """
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")  # py3.7+
        except (AttributeError, ValueError):
            pass

# --------------------------------------------------------------------------
# Text artifact repair
# --------------------------------------------------------------------------

# The ParlAI release escapes commas inside utterances as the literal token
# "_comma_". Left in place the model would learn to emit "_comma_".
_COMMA_ARTIFACT = re.compile(r"_co+mma_", re.IGNORECASE)
# Collapse only *runs* of underscores. A single `_` can be a legitimate
# character inside a token (e.g. snake_case ids in responses), and the ParlAI
# release also contains stray `that_s` style artifacts we must not over-correct.
_SPACING_ARTIFACT = re.compile(r"_{2,}")
_WHITESPACE = re.compile(r"[ \t\r\f\v]+")
_MULTI_NEWLINE = re.compile(r"\n{3,}")
_CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

# ED is crowdsourced and written almost entirely in lowercase, including the
# first-person pronoun. Training on that teaches the model to write "i" and
# lower-case sentence starts, which reads as broken to users.
_I_FIXES = [
    (re.compile(r"(^|(?<=[\s(\"']))i(?=[\s'’.,!?)]|$)"), "I"),
    (re.compile(r"\bi'm\b", re.IGNORECASE), "I'm"),
    (re.compile(r"\bi've\b", re.IGNORECASE), "I've"),
    (re.compile(r"\bi'll\b", re.IGNORECASE), "I'll"),
    (re.compile(r"\bi'd\b", re.IGNORECASE), "I'd"),
    (re.compile(r"\bi'm\b"), "I'm"),
    (re.compile(r"(\s)i's\b"), r"\1It's"),
    (re.compile(r"(\s)you('re)\b"), r"\1You\2"),
    (re.compile(r"(\s)they('re)\b"), r"\1They\2"),
    (re.compile(r"(^|(?<=[\s(\"']))dont\b", re.IGNORECASE), "don't"),
    (re.compile(r"(^|(?<=[\s(\"']))doesnt\b", re.IGNORECASE), "doesn't"),
    (re.compile(r"(^|(?<=[\s(\"']))didnt\b", re.IGNORECASE), "didn't"),
    (re.compile(r"(^|(?<=[\s(\"']))cant\b", re.IGNORECASE), "can't"),
    (re.compile(r"(^|(?<=[\s(\"']))wont\b", re.IGNORECASE), "won't"),
    (re.compile(r"(^|(?<=[\s(\"']))isnt\b", re.IGNORECASE), "isn't"),
    (re.compile(r"(^|(?<=[\s(\"']))wasnt\b", re.IGNORECASE), "wasn't"),
    (re.compile(r"(^|(?<=[\s(\"']))arent\b", re.IGNORECASE), "aren't"),
    (re.compile(r"(^|(?<=[\s(\"']))did\b(?=\s)"), "did"),
    (re.compile(r"\b(\w+)'ll\b"), r"\1'll"),
]

# The crowdsourced corpus systematically drops the apostrophe in contractions
# ("youre", "dont", "im"). Restoring them materially improves the English the
# fine-tuned model will learn to produce. Each pair is unambiguous, so this is
# safe to apply mechanically.
_MISSING_APOSTROPHE = {
    "youre": "You're", "theyre": "They're", "weve": "We've", "youve": "You've",
    "im": "I'm", "ive": "I've", "ill": "I'll", "id": "I'd", "youll": "You'll",
    "well": "We'll", "hell": "He'll", "shes": "She's", "hes": "He's",
    "thats": "That's", "theres": "There's", "whats": "What's", "lets": "Let's",
    "dont": "don't", "didnt": "didn't", "doesnt": "doesn't", "cant": "can't",
    "wont": "won't", "isnt": "isn't", "arent": "aren't", "wasnt": "wasn't",
    "werent": "weren't", "couldnt": "couldn't", "shouldnt": "shouldn't",
    "wouldnt": "wouldn't", "havent": "haven't", "hasnt": "hasn't",
    "aint": "ain't", "youd": "you'd", "theyd": "they'd", "wed": "we'd",
}
_MISSING_APOS_RE = re.compile(
    r"(?<![\w'])(?:" + "|".join(sorted(_MISSING_APOSTROPHE, key=len, reverse=True)) + r")(?![\w'])",
    re.IGNORECASE,
)

# Sentences that should be followed by a capital letter.
_SENTENCE_START = re.compile(r"([.!?]\s+)([a-z])")

# Abbreviations after which a full stop does NOT start a new sentence.
_ABBREV = {
    "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "vs", "etc", "eg", "ie",
    "approx", "no", "fig", "inc", "ltd", "co", "u.s", "u.k", "a.m", "p.m",
}
_ABBREV_GUARD = re.compile(
    r"(?:\b(?:" + "|".join(re.escape(a) for a in sorted(_ABBREV, key=len, reverse=True)) + r")\.)"
    r"\s+(?=[a-z])",
    re.IGNORECASE,
)
# Lowercase words that must stay lowercase at the head of a sentence.
_NEVER_CAPITALIZE = {
    "i", "i'm", "i've", "i'll", "i'd", "im", "ive", "id",
}
# Honorifics/abbreviations: "dr." should never become "DR." and must not
# trigger sentence-capitalisation of the following word.
_ABBREV_TOKENS = _ABBREV

# Words that must be capitalised when they open a string or a sentence.
_SENTENCE_LEADERS = (
    "i", "i'm", "i've", "i'll", "i'd", "you're", "youre", "they're", "theyre",
    "it's", "its", "he's", "she's", "that's", "thats", "there's", "theres",
    "we're", "were", "don't", "dont", "didn't", "didnt", "doesn't", "doesnt",
    "can't", "cant", "won't", "wont", "isn't", "isnt", "wasn't", "wasnt",
    "aren't", "arent",
)
_LEADER_RE = re.compile(
    r"(^|(?<=[.!?]\s))(" + "|".join(re.escape(w) for w in sorted(_SENTENCE_LEADERS, key=len, reverse=True)) + r")\b",
    re.IGNORECASE,
)


def _fix_leader(m: re.Match) -> str:
    return m.group(1) + m.group(2)[0].upper() + m.group(2)[1:]


def _capitalize_after_stop(text: str) -> str:
    """Uppercase the first alphabetic character of the string and of every
    sentence, skipping known abbreviations and lone `i`-forms."""
    out = []
    prev_stop = True  # treat start-of-string as a sentence boundary
    for i, ch in enumerate(text):
        if prev_stop and ch.isalpha():
            # Don't capitalise a lowercase word that must stay lowercase.
            word = re.match(r"[A-Za-z']+", text[i:])
            token = word.group(0).lower() if word else ""
            if token in _NEVER_CAPITALIZE:
                out.append(ch)
            else:
                out.append(ch.upper())
            prev_stop = False
            continue
        out.append(ch)
        if ch in ".!?":
            prev_stop = True
        elif not ch.isspace():
            prev_stop = False
    return "".join(out)


def detokenize_commas(text: str) -> str:
    """Turn the ParlAI `_comma_` sentinel back into a real comma."""
    text = _COMMA_ARTIFACT.sub(",", text)
    # A comma directly followed by a letter (no space) is the artifact form
    # "...people, but it only..."  ->  "...people, but it only..."
    text = re.sub(r",(?=[^\s\d])", ", ", text)
    return text


def fix_first_person(text: str) -> str:
    text = _MISSING_APOS_RE.sub(
        lambda m: _MISSING_APOSTROPHE[m.group(0).lower()], text
    )
    for pattern, repl in _I_FIXES:
        text = pattern.sub(repl, text)
    return text


def capitalize_sentences(text: str) -> str:
    text = _LEADER_RE.sub(_fix_leader, text)
    # Repair "a.b" style breaks that the abbreviation guard protects.
    text = _ABBREV_GUARD.sub(lambda m: m.group(0).upper(), text)
    text = _capitalize_after_stop(text)
    # Honourifics read as "DR." / "MR." after the pass above; restore them.
    for abbr in ("dr", "mr", "mrs", "ms", "prof", "sr", "jr", "st"):
        text = re.sub(rf"\b{abbr.upper()}\.", abbr.capitalize() + ".", text)
    return text


def normalize_text(text: str, *, fix_case: bool = True) -> str:
    """Full normalization pipeline for one utterance."""
    if not text:
        return ""
    # NFKC folds full-width punctuation and ligatures, then NFC re-composes.
    text = unicodedata.normalize("NFKC", text)
    text = _CONTROL.sub(" ", text)
    text = detokenize_commas(text)
    text = _SPACING_ARTIFACT.sub(" ", text)
    text = _WHITESPACE.sub(" ", text)
    text = _MULTI_NEWLINE.sub("\n\n", text)
    text = text.strip().strip('"').strip()
    if fix_case:
        text = fix_first_person(text)
        text = capitalize_sentences(text)
    return text.strip()


# --------------------------------------------------------------------------
# Malformed-content filters
# --------------------------------------------------------------------------

_URL = re.compile(r"(https?://|www\.)\S+", re.IGNORECASE)
_EMAIL = re.compile(r"\S+@\S+\.\S+")
_PHONE = re.compile(r"\+?\d[\d\s\-()]{8,}\d")
_SENTINEL = re.compile(r"irregular_colon_format|irregular_", re.IGNORECASE)
_REPEAT_CHAR = re.compile(r"(.)\1{7,}")


def has_personal_identifiers(text: str) -> bool:
    """Conservative PII screen. Empathetic dialogue should not carry these."""
    return bool(_URL.search(text) or _EMAIL.search(text) or _PHONE.search(text))


def is_degenerate(text: str) -> bool:
    """Junk that survives length checks but teaches nothing."""
    if not text or len(text.strip()) < 2:
        return True
    if _SENTINEL.search(text):
        return True
    if _REPEAT_CHAR.search(text):
        return True
    letters = sum(ch.isalpha() for ch in text)
    if letters / max(len(text), 1) < 0.55:
        # Heavy on punctuation/digits - usually a table, URL remnant or emoji soup.
        return True
    return False


# --------------------------------------------------------------------------
# Crisis taxonomy (mirrors server/safety-detection.ts)
# --------------------------------------------------------------------------

CRISIS_PATTERNS = [
    re.compile(r"\b(kill|end|take)\s+myself\b", re.IGNORECASE),
    re.compile(r"\b(suicid|self[\s\-]?harm)", re.IGNORECASE),
    re.compile(r"\b(hurt|harming|injur\w*|cut|cutting)\s+(myself|my ?self)\b", re.IGNORECASE),
    # Covers "don't want to live", "do not want to live", "dont wanna live".
    re.compile(r"\b(do(?:n'?t| not)|does ?n'?t|dont)\s+(want|wanna|feel like)\s+(to\s+)?(live|be alive|exist)\b", re.IGNORECASE),
    re.compile(r"\bwant to die\b", re.IGNORECASE),
    re.compile(r"\bbetter off (dead|without me)\b", re.IGNORECASE),
    re.compile(r"\bend (it all|my life)\b", re.IGNORECASE),
    re.compile(r"\b(going to|planning to|about to|decided to)\s+(kill|end|take)\b", re.IGNORECASE),
    re.compile(r"\bno reason to live\b", re.IGNORECASE),
    re.compile(r"\bwake up dead\b", re.IGNORECASE),
]

VIOLENCE_PATTERNS = [
    re.compile(r"\b(kill|murder|hurt|harm|stab|shoot|poison)\s+(someone|them|him|her|people|others|myself)\b", re.IGNORECASE),
    re.compile(r"\b(hurt|harm|abuse|attack)\s+(others|people|someone|everybody)\b", re.IGNORECASE),
    re.compile(r"\bwant to (kill|hurt|harm|attack)\b", re.IGNORECASE),
]

# Subject is deliberately broad: domestic-abuse disclosures rarely name the
# perpetrator with a pronoun ("my husband beats me", "dad hits me").
ABUSE_PATTERNS = [
    re.compile(
        r"\b(he|she|they|my (husband|wife|partner|boyfriend|girlfriend|father|dad|mother|mom|"
        r"brother|sister|uncle|aunt|teacher|boss|landlord))\s+"
        r"(beats?|beating|hits?|hitting|hurts?|hurting|abuses?|abusing|tortures?|threatens?)\s+me\b",
        re.IGNORECASE,
    ),
    re.compile(r"\b(beats?|abuses?|tortures?|threatens?|hits?)\s+me\s+(all the time|whenever|every day|constantly)\b", re.IGNORECASE),
    re.compile(r"\bsexual(ly)?\s+(assault|abuse|harass)\w*\b", re.IGNORECASE),
    re.compile(r"\b(rape|raped|molest\w+|groomed)\b", re.IGNORECASE),
    re.compile(r"\b(he|she|they)\s+(does not|doesn'?t|do ?n'?t)\s+let me leave\b", re.IGNORECASE),
]


def is_crisis_context(text: str) -> bool:
    """True when the text signals self-harm, suicide, or harm to others.

    Used to REMOVE such conversations from the general empathetic training
    set. Crisis responses are learned only from the curated safety layer.
    """
    return any(p.search(text) for p in CRISIS_PATTERNS + VIOLENCE_PATTERNS)


def is_abuse_context(text: str) -> bool:
    return any(p.search(text) for p in ABUSE_PATTERNS)


# --------------------------------------------------------------------------
# Assistant-response quality gates
# --------------------------------------------------------------------------

# Responses that would teach the model to break TalkEasy's own boundaries.
UNSAFE_ASSISTANT_PATTERNS = [
    (re.compile(r"\byou (have|are suffering from|are diagnosed with)\s+\w*\s*(depress|anxiet|bipolar|ptsd|adhd|schizo|bipolar|insomnia|anorexi)", re.IGNORECASE), "diagnosis"),
    (re.compile(r"\b(you should|you need to|i recommend|i suggest) (take|start|stop|increase|decrease|try)\b[^.?!]{0,40}\b(prozac|zoloft|lexapro|xanax|valium|ssri|antidepressant|antianxiety|medication|pills?|lithium|sertraline|fluoxetine|clonazepam|diazepam|adderall|risperidone|quetiapine|olanzapine)\b", re.IGNORECASE), "medication_advice"),
    (re.compile(r"\btake \d+\s*(mg|ml)\b", re.IGNORECASE), "dosage_advice"),
    (re.compile(r"\b(i am|i'?m) (a|your) (therapist|psychiatrist|psychologist|doctor|psychiatric|counsellor|counselor|clinician|licensed)\b", re.IGNORECASE), "false_credentials"),
    (re.compile(r"\b(i|i'?ve|i'?m)[\s\w]{0,18}?(called|contacted|notified|alerted|dispatched|reported to)\b[^.?!]{0,18}?\b(police|emergency|911|112|ambulance|authorit|paramedic)\b", re.IGNORECASE), "false_emergency_claim"),
    (re.compile(r"\b(guarantee|cure|will fix|definitely cure|100% (cure|works))\b", re.IGNORECASE), "overpromise"),
    (re.compile(r"\byou[\s\w]{0,12}?(should|just|need to|have to|must|want to)[\s\w]{0,12}?(kill|end your life|commit suicide|hurt yourself|harm yourself)\b", re.IGNORECASE), "harmful_instruction"),
    (re.compile(r"\b(don'?t|dont) (tell|tell anyone|speak to anyone|go to)\b[^.?!]{0,40}\b(parents?|family|doctor|therapist|police|anyone)\b", re.IGNORECASE), "isolation_encouragement"),
    (re.compile(r"\bcall (me|us) (anytime|whenever|day or night)\b", re.IGNORECASE), "dependency_encouragement"),
    (re.compile(r"\bi'?m the only one who (understands?|cares?)\b", re.IGNORECASE), "dependency_encouragement"),
    (re.compile(r"\b(you'?re|you are) (fine|okay|ok) now,? (stop|quit)\b", re.IGNORECASE), "dismissal"),
    (re.compile(r"\bit'?s (just|nothing but) (stress|stages|phase)\b", re.IGNORECASE), "dismissal"),
    (re.compile(r"\b(calm down|cheer up|get over it|stop being so)\b", re.IGNORECASE), "dismissal"),
]

# The only crisis numbers TalkEasy is permitted to state. Anything else in a
# training target is a hallucinated resource and must be rejected.
ALLOWED_CRISIS_NUMBERS = {
    "112",
    "14416",
    "18005990019",
    "18602662345",
    "9152987821",
    "1098",
    "181",
    "100",
}
# Also accept the digits-only form in case a writer spaced the number out.
_ALLOWED_NUMBER_STRINGS = set(ALLOWED_CRISIS_NUMBERS) | {
    re.sub(r"\D", "", n) for n in ALLOWED_CRISIS_NUMBERS
}

# Match a candidate number INCLUDING internal hyphens/spaces so that
# "1800-599-0019" is read as one token rather than three separate numbers.
_FABRICATED_NUMBER = re.compile(r"(?<!\d)\d[\d\-\s]{2,}\d(?!\d)|(?<!\d)\d{3,4}(?!\d)")
_CRISIS_CONTEXT_WORDS = re.compile(
    r"(helpline|crisis|hotline|emergency|ambulance|toll[\s-]?free|24\s*x?\s*7|suicid|self[\s\-]?harm)",
    re.IGNORECASE,
)


# --------------------------------------------------------------------------
# Assistant-response quality gate
# --------------------------------------------------------------------------
#
# The corpus is crowdsourced, so a minority of listener responses are contentless
# interjections ("yea I coud understand that", "wow", "same"). Training on those
# teaches the model a dismissive, low-effort register - the opposite of what a
# wellness product needs. They are removed rather than "repaired", because we
# cannot know what the worker actually meant.

_MIN_ASSISTANT_WORDS = 6
# A short but genuine question is a strong empathetic move ("Were you scared?",
# "What did she want?"), so questions get their own, lower threshold.
_MIN_QUESTION_WORDS = 3

# Register markers that indicate a genuinely responsive answer.
_RESPONSIVE_MARKERS = (
    # questions
    "how ", "what ", "why ", "when ", "who ", "where ",
    "did you", "do you", "are you", "is there", "was there", "have you",
    "will you", "would you", "can you", "could you", "any idea", "tell me",
    # acknowledgement / validation
    "sorry", "thank", "glad", "hear you", "i understand", "understand",
    "feel", "sounds", "sound like", "must be", "must have", "makes sense",
    "that is terrible", "that's terrible", "i bet", "makes me think",
    "i hope", "i'm happy", "i am happy", "happy for you", "good for you",
    "no worries", "i remember", "i love", "i can relate", "i also",
    "i agree", "you sound", "you also", "you're not", "you are not",
    "i've", "i have", "i'm", "i would", "let me", "how about",
    # encouragement
    "keep going", "hang in there", "you've got", "you have got",
    "it will get", "that's great", "that's awesome", "that's wonderful",
    "proud of you", "well done", "good job",
)

# Pure filler. If the response is only these, it teaches nothing.
_FILLER_ONLY = {
    "yea", "yeah", "yep", "yes", "no", "nope", "wow", "oh", "lol", "haha",
    "hah", "nice", "cool", "same", "true", "right", "ok", "okay", "sure",
    "thanks", "thank you", "oh wow", "oh no", "wow!", "nice!", "cool!",
    "exactly", "definitely", "agreed", "true!", "me too", "good", "aww",
    "aw", "hmm", "ah", "ahh", "woww", "yay", "aww", "done", "hahaa", "hahah",
    "sorry", "congrats", "congratulations", "good job", "well said", "amazing",
    "beautiful", "sweet", "cute", "nice one", "facts", "real", "word", "bet",
}

_WORD_RE = re.compile(r"[A-Za-z']+")


def assistant_response_is_low_quality(text: str) -> tuple[bool, str]:
    """Return (is_low_quality, reason) for a candidate assistant target."""
    words = _WORD_RE.findall(text.lower())
    is_question = text.rstrip().endswith("?")

    if len(words) < _MIN_ASSISTANT_WORDS:
        if is_question and len(words) >= _MIN_QUESTION_WORDS:
            pass  # short empathetic questions are valuable, keep them
        else:
            return True, "assistant_too_short"

    # Every meaningful word is filler.
    content = [w for w in words if w not in _FILLER_ONLY]
    if not content:
        return True, "assistant_filler_only"

    # Long filler run with almost nothing else.
    if len(content) <= 2 and len(words) >= 4:
        return True, "assistant_filler_heavy"

    # Must show at least some responsiveness.
    low = text.lower()
    if not any(marker in low for marker in _RESPONSIVE_MARKERS):
        return True, "assistant_unresponsive"

    return False, ""


def find_unsafe_assistant_patterns(text: str) -> list[str]:
    hits: list[str] = []
    for pattern, name in UNSAFE_ASSISTANT_PATTERNS:
        if pattern.search(text):
            hits.append(name)
    return hits


def find_fabricated_crisis_numbers(text: str) -> list[str]:
    """Detect invented helpline numbers near crisis language.

    TalkEasy ships a fixed, verified resource list. A model response that
    invents another number is worse than one that names none, because a user in
    crisis may actually dial it.
    """
    if not _CRISIS_CONTEXT_WORDS.search(text):
        return []
    found: set[str] = set()
    for raw in _FABRICATED_NUMBER.findall(text):
        digits = re.sub(r"\D", "", raw)
        if not digits or digits in _ALLOWED_NUMBER_STRINGS:
            continue
        # Ignore short numbers that are clearly not helplines (e.g. "3 am").
        if len(digits) < 4 and not digits.startswith(("1", "9")):
            continue
        found.add(digits)
    return sorted(found)


# --------------------------------------------------------------------------
# Emotion -> TalkEasy category mapping
# --------------------------------------------------------------------------

# 32 EmpatheticDialogues emotion labels -> TalkEasy wellness categories.
EMOTION_TO_CATEGORY = {
    "afraid": "fear",
    "angry": "anger",
    "annoyed": "frustration",
    "anticipating": "anticipation",
    "anxious": "anxiety",
    "apprehensive": "anxiety",
    "ashamed": "shame",
    "caring": "empathy",
    "confident": "confidence",
    "content": "contentment",
    "devastated": "grief",
    "disappointed": "disappointment",
    "disgusted": "disgust",
    "embarrassed": "shame",
    "excited": "positive",
    "faithful": "trust",
    "furious": "anger",
    "grateful": "gratitude",
    "guilty": "guilt",
    "hopeful": "hopeful",
    "impressed": "admiration",
    "jealous": "jealousy",
    "joyful": "positive",
    "lonely": "loneliness",
    "nostalgic": "nostalgia",
    "prepared": "anticipation",
    "proud": "pride",
    "sad": "sadness",
    "sentimental": "reflective",
    "surprised": "surprise",
    "terrified": "fear",
    "trusting": "trust",
}

# Categories the existing TalkEasy mood vocabulary already understands.
# Used to keep the fine-tuned model's emotional range aligned with the UI.
CATEGORY_TO_MOOD = {
    "fear": "Anxious",
    "anger": "Angry",
    "frustration": "Angry",
    "anxiety": "Anxious",
    "loneliness": "Sad",
    "sadness": "Sad",
    "grief": "Sad",
    "disappointment": "Sad",
    "guilt": "Sad",
    "shame": "Sad",
    "jealousy": "Angry",
    "disgust": "Angry",
    "surprise": "Neutral",
    "stress": "Overwhelmed",
    "overwhelmed": "Overwhelmed",
    "hopeful": "Excited",
    "positive": "Happy",
    "pride": "Happy",
    "joyful": "Happy",
    "gratitude": "Happy",
    "contentment": "Calm",
    "confident": "Happy",
    "confidence": "Happy",
    "calm": "Calm",
    "reflective": "Neutral",
    "admiration": "Happy",
    "trust": "Calm",
    "anticipation": "Neutral",
    "nostalgia": "Neutral",
    "empathy": "Calm",
    "surprise": "Neutral",
    "neutral": "Neutral",
}
