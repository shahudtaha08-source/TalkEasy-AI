"""
TalkEasy AI - unit tests for the shared normalization / safety taxonomy.

These are real assertions, not a demo. Run before and after any change to
scripts/ai/common.py:

    python scripts/ai/test_common.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import (  # noqa: E402
    CATEGORY_TO_MOOD,
    EMOTION_TO_CATEGORY,
    find_fabricated_crisis_numbers,
    find_unsafe_assistant_patterns,
    is_abuse_context,
    is_crisis_context,
    is_degenerate,
    normalize_text,
)

PASSED = 0
FAILED: list[str] = []


def check(name: str, actual, expected) -> None:
    global PASSED
    if actual == expected:
        PASSED += 1
    else:
        FAILED.append(f"{name}\n     expected: {expected!r}\n     actual  : {actual!r}")


def check_true(name: str, actual: bool) -> None:
    check(name, actual, True)


def check_false(name: str, actual: bool) -> None:
    check(name, actual, False)


# ---------------------------------------------------------------- normalize
check(
    "comma artifact repaired",
    normalize_text("There was a lot of people, but it only felt like us in the world."),
    "There was a lot of people, but it only felt like us in the world.",
)
check(
    "sentence start capitalised",
    normalize_text("i remember going to the fireworks. it was the best night."),
    "I remember going to the fireworks. It was the best night.",
)
check(
    "contractions repaired",
    normalize_text("i'm tired. i've been stressed. dont know what to do."),
    "I'm tired. I've been stressed. Don't know what to do.",
)
check(
    "possessive capitalised",
    normalize_text("youre right. theyre coming. its fine."),
    "You're right. They're coming. Its fine.",
)
check(
    "underscore artifacts collapsed but single _ kept",
    normalize_text("that_s  funny__really"),
    "That_s funny really",
)
check(
    "whitespace collapsed and first letter capitalised",
    normalize_text("a    b\t\tc  "),
    "A b c",
)
check(
    "leading lowercase word capitalised",
    normalize_text("why not tell them to stop?"),
    "Why not tell them to stop?",
)
check(
    "abbreviation not treated as sentence end",
    normalize_text("i saw dr. patel today and i felt better."),
    "I saw Dr. Patel today and I felt better.",
)
check("empty stays empty", normalize_text(""), "")
check("whitespace only stays empty", normalize_text("   \n  "), "")

# ---------------------------------------------------------------- degenerate
check_true("empty is degenerate", is_degenerate(""))
check_true("dot run is degenerate", is_degenerate("...."))
check_true("char run is degenerate", is_degenerate("aaaaaaaaaaaaaa"))
check_true("irregular sentinel is degenerate", is_degenerate("<IRREGULAR_COLON_FORMAT>"))
check_true("digit soup is degenerate", is_degenerate("1234 5678 90"))
check_false("real sentence is fine", is_degenerate("I am feeling low today."))
check_false("emotional question is fine", is_degenerate("Do you want to talk about it?"))

# ---------------------------------------------------------------- crisis
for phrase in [
    "I want to kill myself",
    "i want to end my life",
    "I do not want to live",
    "I have been self harming",
    "I am planning to end it all",
    "there is no reason to live",
    "I want to hurt myself",
]:
    check_true(f"crisis detected: {phrase!r}", is_crisis_context(phrase))

for phrase in [
    "I had a rough day at college",
    "I feel lonely sometimes",
    "I am so stressed about exams",
    "I am angry with my roommate",
    "I have not slept well",
    "life is pointless sometimes at work",  # 'pointless' alone must NOT trigger
]:
    check_false(f"no false-positive crisis: {phrase!r}", is_crisis_context(phrase))

check_true("abuse detected", is_abuse_context("my husband beats me"))
check_true("abuse detected (they)", is_abuse_context("they hurt me at home"))
check_false("no false-positive abuse", is_abuse_context("my back hurts me a lot"))

# ---------------------------------------------------------------- assistant gates
check_true(
    "diagnosis rejected",
    bool(find_unsafe_assistant_patterns("It sounds like you have depression.")),
)
check_true(
    "medication advice rejected",
    bool(find_unsafe_assistant_patterns("You should take Prozac for this.")),
)
check_true(
    "dosage rejected",
    bool(find_unsafe_assistant_patterns("Take 20mg twice a day.")),
)
check_true(
    "false credentials rejected",
    bool(find_unsafe_assistant_patterns("I am a therapist and I can help you diagnose this.")),
)
check_true(
    "false emergency claim rejected",
    bool(find_unsafe_assistant_patterns("I already called 911 for you.")),
)
check_true(
    "harmful instruction rejected",
    bool(find_unsafe_assistant_patterns("You should just kill it and move on.")),
)
check_true(
    "isolation encouragement rejected",
    bool(find_unsafe_assistant_patterns("Don't tell your family, just keep this between us.")),
)
check_true(
    "dependency encouragement rejected",
    bool(find_unsafe_assistant_patterns("I'm the only one who understands you.")),
)
check_true(
    "dismissal rejected",
    bool(find_unsafe_assistant_patterns("Just cheer up and get over it.")),
)

# Clean supportive responses must PASS all gates.
for good in [
    "That sounds really hard. Would you like to tell me more about it?",
    "Thank you for sharing that. It makes sense that you would feel this way.",
    "I hear you. It is okay to feel that way, and you do not have to explain it.",
    "That is a lot to carry at once. What part of it feels heaviest right now?",
    "It sounds like you have been carrying a lot. Have you told anyone close to you?",
]:
    check(f"clean response passes gates: {good[:44]!r}", find_unsafe_assistant_patterns(good), [])

# ---------------------------------------------------------------- crisis numbers
check("allowed numbers not flagged", find_fabricated_crisis_numbers("Call 112 or Tele-MANAS 14416."), [])
check("allowed kiran not flagged", find_fabricated_crisis_numbers("Kiran helpline is 1800-599-0019."), [])
check(
    "fabricated helpline number flagged",
    find_fabricated_crisis_numbers("Please call our crisis helpline at 9999 right now."),
    ["9999"],
)
check(
    "no number check without crisis words",
    find_fabricated_crisis_numbers("My PIN is 4321 and my roll number is 12345."),
    [],
)

# ---------------------------------------------------------------- taxonomy
check("all 32 ED emotions mapped", len(EMOTION_TO_CATEGORY), 32)
check("sad maps to sadness", EMOTION_TO_CATEGORY.get("sad"), "sadness")
check("lonely maps to loneliness", EMOTION_TO_CATEGORY.get("lonely"), "loneliness")
check("anxious maps to anxiety", EMOTION_TO_CATEGORY.get("anxious"), "anxiety")
check("loneliness maps to Sad mood", CATEGORY_TO_MOOD.get("loneliness"), "Sad")
check("anxiety maps to Anxious mood", CATEGORY_TO_MOOD.get("anxiety"), "Anxious")
check("anger maps to Angry mood", CATEGORY_TO_MOOD.get("anger"), "Angry")
check("every ED category has a mood", all(
    c in CATEGORY_TO_MOOD for c in EMOTION_TO_CATEGORY.values()
), True)

# ------------------------------------------------- non-Latin scripts
# Regression: is_degenerate() counted word characters with str.isalpha(),
# which returns False for combining marks. Devanagari vowel signs (matras)
# are category Mn, so EVERY Hindi example was judged degenerate and the
# validator rejected the whole multilingual set.
DEVA = "मुझे रात में सो नहीं आता, मन बहुत चलता रहता है।"
DEVA_SHORT = "मैं जीने नहीं चाहता।"
DEVANAGARI_STRESS = "कल परीक्षा है और मैं बहुत घबरा हुआ हूँ।"
DEVANAGARI_POSITIVE = "आज बहुत अच्छा दिन था, बस बताना चाहता था।"

check("devanagari sentence is not degenerate", is_degenerate(DEVA), False)
check("short devanagari is not degenerate", is_degenerate(DEVA_SHORT), False)
check("devanagari stress is not degenerate", is_degenerate(DEVANAGARI_STRESS), False)
check("devanagari positive is not degenerate", is_degenerate(DEVANAGARI_POSITIVE), False)

ARABIC = "أنا بمرّ بوقت صعب هذا الأسبوع"
check("arabic script is not degenerate", is_degenerate(ARABIC), False)

check("digit soup still degenerate", is_degenerate("1234 5678 9012"), True)
check("empty still degenerate", is_degenerate(""), True)

# Devanagari must still be readable by the crisis and PII checks rather than
# crashing on a script they were never written for.
# NOTE: "मैं जीने नहीं चाहता" is "I don't want to live" and IS a crisis; it is
# asserted as such in the non-English coverage section below.
check("devanagari crisis text does not crash", isinstance(is_crisis_context(DEVA_SHORT), bool), True)

# ------------------------------------ non-English crisis coverage
# Regression: every CRISIS_PATTERNS regex was English-only, so Hindi crisis
# disclosures ("मैं जीने नहीं चाहता" = I don't want to live) were silently
# treated as ordinary chat. The deterministic safety layer is the one thing
# that must not depend on the model behaving well.
check_true("hindi: don't want to live", is_crisis_context("मैं जीने नहीं चाहता।"))
check_true("hindi: want to die", is_crisis_context("मर जाना चाहता हूं"))
check_true("hindi: suicide word", is_crisis_context("आत्महत्या के बारे में सोच रहा हूं"))
check_true("hindi: self-harm verb", is_crisis_context("मैं खुद को काटूंगा"))
check_true("hindi: hurt myself", is_crisis_context("मैं खुद को नुकसान पहुंचाने का सोच रहा हूं"))
check_true("hinglish: jine nahi chahta", is_crisis_context("main jine nahi chahta"))
check_true("roman urdu: marna nahi chahta", is_crisis_context("main marna nahi chahta"))

# Guard against over-triggering: ordinary Hindi/Urdu must stay non-crisis,
# otherwise the app would page users out for everyday conversation.
check_false("hindi: ordinary exam worry", is_crisis_context(DEVANAGARI_STRESS))
check_false("hindi: ordinary good day", is_crisis_context(DEVANAGARI_POSITIVE))
check_false("hindi: ordinary sleeplessness", is_crisis_context(DEVA))
check_false("urdu: ordinary complaint", is_crisis_context("मुझे बहुत थकान है"))

# ---------------------------------------------------------------- report
print(f"common.py tests: {PASSED} passed, {len(FAILED)} failed")
for f in FAILED:
    print("  FAIL " + f)
sys.exit(1 if FAILED else 0)
