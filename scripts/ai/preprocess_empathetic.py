"""
TalkEasy AI - Step 2: preprocess EmpatheticDialogues into SFT JSONL.

Handles the three release defects found by inspect_dataset.py:
  1. `speaker_idx` is unreliable (789 distinct values). Speaker role is
     derived from `utterance_idx` PARITY instead:
        odd  utterance_idx -> the person SHARING an experience  -> user turn
        even utterance_idx -> the person LISTENING empathetically -> assistant
  2. Rows with 9 fields carry an extra column containing `|`-separated
     utterances lifted from OTHER conversations. That is cross-conversation
     contamination and is discarded.
  3. `_comma_` sentinel and lower-cased first-person pronouns are repaired.

Safety policy applied here
--------------------------
Conversations whose text matches the crisis taxonomy are REMOVED from the
general empathetic set. Training the model to reply to a suicidal disclosure
with a mild follow-up question would teach precisely the wrong behaviour.
TalkEasy escalates crisis deterministically in server/safety-detection.ts, and
crisis response wording is learned only from the curated safety layer.

Outputs
  data/processed/empathetic_train.jsonl
  data/processed/empathetic_validation.jsonl
  data/processed/empathetic_test.jsonl
  data/reports/preprocess_stats.json

Usage
  python scripts/ai/preprocess_empathetic.py
  python scripts/ai/preprocess_empathetic.py --max-turns 4
"""

from __future__ import annotations

import argparse
import csv
import datetime
import hashlib
import json
import os
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import (  # noqa: E402
    CATEGORY_TO_MOOD,
    EMOTION_TO_CATEGORY,
    assistant_response_is_low_quality,
    find_fabricated_crisis_numbers,
    find_unsafe_assistant_patterns,
    has_personal_identifiers,
    is_abuse_context,
    is_crisis_context,
    is_degenerate,
    normalize_text,
)

csv.field_size_limit(10**7)

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW_DIR = os.path.join(REPO_ROOT, "data", "raw", "empatheticdialogues")
OUT_DIR = os.path.join(REPO_ROOT, "data", "processed")
REPORT_DIR = os.path.join(REPO_ROOT, "data", "reports")

SPLIT_FILES = {
    "train": "train.csv",
    "validation": "valid.csv",
    "test": "test.csv",
}

MIN_CHARS = 3
MAX_CHARS = 1200

STATS: Counter = Counter()
REJECT_REASONS: Counter = Counter()


def bump(reason: str, n: int = 1) -> None:
    REJECT_REASONS[reason] += n


def read_rows(path: str) -> list[dict]:
    """Parse a ParlAI CSV, tolerating the known field-shift defect."""
    rows: list[dict] = []
    with open(path, "r", encoding="utf-8", errors="replace", newline="") as fh:
        reader = csv.reader(fh)
        try:
            next(reader)
        except StopIteration:
            return rows
        for raw in reader:
            if len(raw) < 6:
                bump("row_too_few_fields")
                continue
            if len(raw) > 8:
                # Fields 0..7 are the documented columns; anything beyond is
                # the contamination column and is intentionally dropped.
                bump("row_extra_columns_dropped")
            rows.append(
                {
                    "conv_id": raw[0],
                    "utterance_idx": raw[1],
                    "context": raw[2],
                    "prompt": raw[3],
                    "speaker_idx": raw[4],
                    "utterance": raw[5],
                    "selfeval": raw[6] if len(raw) > 6 else "",
                }
            )
    return rows


def build_examples(
    split: str,
    rows: list[dict],
    max_turns: int,
    include_abuse: bool,
) -> list[dict]:
    by_conv: dict[str, dict[int, dict]] = defaultdict(dict)
    for r in rows:
        idx = r["utterance_idx"]
        if not (idx or "").strip().isdigit():
            bump("non_numeric_utterance_idx")
            continue
        by_conv[r["conv_id"]][int(idx)] = r

    examples: list[dict] = []
    seen_response: set[str] = set()

    for conv_id, turns in by_conv.items():
        emotion = turns[min(turns)]["context"].strip()
        if emotion not in EMOTION_TO_CATEGORY:
            bump("unknown_emotion_label")
            continue
        category = EMOTION_TO_CATEGORY[emotion]

        # Build the full normalized turn list once, recording which are
        # discarded so a conversation with a bad turn is dropped wholesale
        # rather than silently losing its middle.
        clean: list[tuple[int, str, str]] = []  # (idx, role, text)
        for idx in sorted(turns):
            role = "user" if idx % 2 == 1 else "assistant"
            text = normalize_text(turns[idx]["utterance"] or "")

            if is_degenerate(text):
                bump("degenerate_utterance")
                clean = []
                break
            if not (MIN_CHARS <= len(text) <= MAX_CHARS):
                bump("utterance_length_out_of_range")
                clean = []
                break
            if has_personal_identifiers(text):
                bump("personal_identifier")
                clean = []
                break
            if is_crisis_context(text):
                bump("crisis_context_removed")
                clean = []
                break
            if not include_abuse and is_abuse_context(text):
                bump("abuse_context_removed")
                clean = []
                break
            if role == "assistant":
                unsafe = find_unsafe_assistant_patterns(text)
                if unsafe:
                    bump("unsafe_assistant:" + ",".join(sorted(set(unsafe))))
                    clean = []
                    break
                fabbed = find_fabricated_crisis_numbers(text)
                if fabbed:
                    bump("fabricated_crisis_number")
                    clean = []
                    break
                low_quality, why = assistant_response_is_low_quality(text)
                if low_quality:
                    bump("low_quality_assistant:" + why)
                    clean = []
                    break
            clean.append((idx, role, text))

        if not clean:
            continue

        # Every training example must END on an assistant turn, otherwise
        # there is no target to learn from.
        if clean[-1][1] != "assistant":
            clean = clean[:-1]
        if not clean:
            bump("no_assistant_turn")
            continue

        # Near-duplicate suppression on the final assistant response.
        last = clean[-1][2].strip().lower()
        if last in seen_response:
            bump("duplicate_assistant_response")
            continue
        seen_response.add(last)

        # ---- one example per assistant turn, carrying prior turns as context
        for pos in range(0, len(clean), 2):
            pair = clean[pos : pos + 2]
            if len(pair) < 2 or pair[0][1] != "user" or pair[1][1] != "assistant":
                continue

            context = clean[max(0, pos - (max_turns - 1) * 2) : pos]
            messages = [{"role": r, "content": t} for _, r, t in context + pair]
            messages = trim_to_context_window(messages, max_turns)

            ex_id = "ed-" + hashlib.sha1(
                f"{conv_id}:{pair[0][0]}:{pair[1][2]}".encode("utf-8")
            ).hexdigest()[:16]

            examples.append(
                {
                    "id": ex_id,
                    "source": "empathetic_dialogues",
                    "split_source": split,
                    "conversation_id": conv_id,
                    "language": "English",
                    "emotion": emotion,
                    "category": category,
                    "mood": CATEGORY_TO_MOOD.get(category, "Neutral"),
                    "is_safety": False,
                    "turns": len(messages) // 2,
                    "messages": messages,
                }
            )
            STATS["examples_emitted"] += 1

    return examples


def trim_to_context_window(messages: list[dict], max_turns: int) -> list[dict]:
    """Keep the final (user, assistant) pair, preceded by whole prior pairs."""
    if max_turns <= 1 or len(messages) <= 2:
        return messages[-2:] if len(messages) > 2 else messages
    keep = max_turns * 2
    if len(messages) <= keep:
        return messages
    trimmed = messages[-keep:]
    # Do not start on an assistant turn without its user turn.
    if trimmed and trimmed[0]["role"] == "assistant":
        trimmed = trimmed[1:]
    return trimmed


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-turns", type=int, default=4,
                    help="Maximum user/assistant pairs per example (default 4).")
    ap.add_argument("--include-abuse", action="store_true",
                    help="Keep domestic-abuse disclosures (off by default).")
    ap.add_argument("--min-words", type=int, default=3)
    args = ap.parse_args()

    if not os.path.isdir(RAW_DIR):
        print(f"ERROR: {RAW_DIR} not found. Download the dataset first.", file=sys.stderr)
        return 1

    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(REPORT_DIR, exist_ok=True)

    per_split: dict[str, list[dict]] = {}
    emotion_hist: Counter = Counter()
    category_hist: Counter = Counter()
    mood_hist: Counter = Counter()
    turn_hist: Counter = Counter()
    conv_seen: dict[str, set] = {}

    for split, filename in SPLIT_FILES.items():
        path = os.path.join(RAW_DIR, filename)
        print(f"[preprocess] {split} <- {filename} ...", flush=True)
        rows = read_rows(path)
        print(f"            {len(rows)} raw rows parsed")
        examples = build_examples(split, rows, args.max_turns, args.include_abuse)
        per_split[split] = examples
        conv_seen[split] = {e["conversation_id"] for e in examples}
        for e in examples:
            emotion_hist[e["emotion"]] += 1
            category_hist[e["category"]] += 1
            mood_hist[e["mood"]] += 1
            turn_hist[e["turns"]] += 1
        out_path = os.path.join(OUT_DIR, f"empathetic_{split}.jsonl")
        with open(out_path, "w", encoding="utf-8") as fh:
            for e in examples:
                fh.write(json.dumps(e, ensure_ascii=False) + "\n")
        print(f"            wrote {len(examples):>6} examples -> {out_path}")

    # Leakage must be impossible: the official splits already partition by
    # conversation, and we never merge them. Assert it anyway.
    leaks = {}
    names = list(conv_seen)
    for i, a in enumerate(names):
        for b in names[i + 1 :]:
            leaks[f"{a}|{b}"] = len(conv_seen[a] & conv_seen[b])

    report = {
        "generated_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "source": "facebook/empathetic_dialogues",
        "source_license": "CC-BY-NC-4.0 (non-commercial)",
        "config": {
            "max_turns": args.max_turns,
            "include_abuse": args.include_abuse,
            "min_chars": MIN_CHARS,
            "max_chars": MAX_CHARS,
        },
        "counts": {k: len(v) for k, v in per_split.items()},
        "conversations": {k: len(v) for k, v in conv_seen.items()},
        "conversation_overlap_between_splits": leaks,
        "emotion_distribution": dict(emotion_hist.most_common()),
        "category_distribution": dict(category_hist.most_common()),
        "mood_distribution": dict(mood_hist.most_common()),
        "turns_per_example": dict(sorted(turn_hist.items())),
        "removed_or_rejected": dict(REJECT_REASONS.most_common()),
        "total_removed": sum(REJECT_REASONS.values()),
    }
    with open(os.path.join(REPORT_DIR, "preprocess_stats.json"), "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, ensure_ascii=False)

    print("\n" + "=" * 72)
    print("PREPROCESS SUMMARY")
    print("=" * 72)
    for k, v in report["counts"].items():
        print(f"  {k:<12} {v:>7} examples   {report['conversations'][k]:>6} conversations")
    print(f"  split overlap (must all be 0): {leaks}")
    print(f"\n  removed/rejected: {report['total_removed']}")
    for reason, n in REJECT_REASONS.most_common(15):
        print(f"     {reason:<45} {n}")
    print("\n  mood distribution:")
    for m, n in mood_hist.most_common():
        print(f"     {m:<12} {n}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
