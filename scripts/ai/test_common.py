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

# ---------------------------------------------------------------- report
print(f"common.py tests: {PASSED} passed, {len(FAILED)} failed")
for f in FAILED:
    print("  FAIL " + f)
sys.exit(1 if FAILED else 0)
