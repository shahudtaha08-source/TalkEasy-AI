"""
TalkEasy AI - Step 4: assemble the final training corpus and split it.

Merges two independent sources:
  A. EmpatheticDialogues (preprocessed) - empathy STYLE and emotional range.
     16,974 examples, English only, crowd-sourced, CC-BY-NC-4.0.
  B. TalkEasy curated (hand-authored) - boundaries, safety, Indian context,
     Hindi / Hinglish / Roman Urdu. 85 examples.

Then produces the final 80/10/10 split.

SPLIT POLICY
------------
The two sources are split by DIFFERENT strategies, because they have different
leakage risks:

  EmpatheticDialogues: the release already partitions by conversation, and
      conversation grouping is preserved, so all examples derived from one
      conversation land in the same split. Stratified by emotion.

  TalkEasy curated: split 60/20/20 WITHIN each intent group. The curated set is
      only ~85 examples, so an earlier whole-category holdout left the training
      set with zero boundary/safety/multilingual coverage. Group-level dealing
      keeps a majority in train while every intent area still appears in
      validation and test, so crisis behaviour is measurable. No example ever
      appears in two splits.

SAFETY EXAMPLES ARE OVERSAMPLED IN TRAINING
------------------------------------------
Crisis situations are rare in the wild and catastrophic when mishandled, so
the training mix repeats the 17 curated safety examples. `oversample_safety`
repeats the whole curated safety SET (not individual rows) so that the ratio
stays principled and no single example is memorised disproportionately.
The validation and test splits are NEVER oversampled.

Usage
  python scripts/ai/build_splits.py
  python scripts/ai/build_splits.py --oversample-safety 3
"""

from __future__ import annotations

import argparse
import datetime
import json
import os
import random
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "curated"))

import curated_examples as curated  # noqa: E402

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PROCESSED = os.path.join(REPO_ROOT, "data", "processed")
TRAIN_OUT = os.path.join(REPO_ROOT, "data", "train")
VAL_OUT = os.path.join(REPO_ROOT, "data", "validation")
TEST_OUT = os.path.join(REPO_ROOT, "data", "test")
REPORT_DIR = os.path.join(REPO_ROOT, "data", "reports")

SEED = 42

# The curated set is split by INTENT GROUP, not by individual category.
#
# The first attempt split by whole category. That was wrong: the category
# disjoint sets for val and test overlapped, so every held-out category landed
# in validation and the test set received zero safety examples - which would
# have made any headline safety number meaningless.
#
# Grouping instead means validation AND test each contain distinct examples
# covering every intent area, so both splits can actually measure crisis
# behaviour, boundary refusal and multilingual handling. Examples never appear
# in two splits (enforced by validate_dataset.py), so the trade-off is
# category-level rather than content-level, which is the standard trade-off.
CURATED_INTENT_GROUPS = {
    "crisis": [
        "safety_crisis", "safety_self_harm", "safety_distress",
    ],
    "safety_ongoing": [
        "safety_follow_up", "safety_gatekeeping", "safety_third_party", "safety_abuse",
    ],
    "boundary_clinical": [
        "boundary_diagnosis", "boundary_therapist", "boundary_medication",
    ],
    "boundary_integrity": [
        "boundary_jailbreak", "boundary_privacy", "boundary_resilience",
        "boundary_emergency",
    ],
    "support_core": [
        "sadness", "loneliness", "anxiety", "stress", "overwhelmed",
        "normal", "sleep", "general",
    ],
    "support_context": [
        "academic_pressure", "family", "relationship", "motivation",
        "confidence", "anger", "frustration",
    ],
}


def load_jsonl(path: str) -> list[dict]:
    rows: list[dict] = []
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def write_jsonl(path: str, rows: list[dict]) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        for r in rows:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")


def split_empathetic(
    rows: list[dict], rng: random.Random
) -> tuple[list[dict], list[dict], list[dict]]:
    """Stratify by emotion while keeping each conversation in one split."""
    by_conv: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_conv[r["conversation_id"]].append(r)

    # Group conversations by their emotion so stratification is meaningful.
    convs_by_emotion: dict[str, list[str]] = defaultdict(list)
    for cid, group in by_conv.items():
        convs_by_emotion[group[0]["emotion"]].append(cid)

    train: list[dict] = []
    val: list[dict] = []
    test: list[dict] = []

    for emotion, cids in sorted(convs_by_emotion.items()):
        rng.shuffle(cids)
        n = len(cids)
        n_val = max(1, round(n * 0.10)) if n >= 5 else 0
        n_test = max(1, round(n * 0.10)) if n >= 5 else 0
        for i, cid in enumerate(cids):
            bucket = train
            if i < n_val:
                bucket = val
            elif i < n_val + n_test:
                bucket = test
            bucket.extend(by_conv[cid])

    return train, val, test


def split_curated(rng: random.Random) -> tuple[list[dict], list[dict], list[dict]]:
    """Split by intent group so val and test both cover every intent area.

    Within a group, examples are shuffled deterministically and dealt
    alternately into validation and test. No example is ever shared.
    """
    cat_to_group: dict[str, str] = {}
    for group, cats in CURATED_INTENT_GROUPS.items():
        for cat in cats:
            cat_to_group[cat] = group

    by_group: dict[str, list[dict]] = defaultdict(list)
    unmapped: list[dict] = []
    for ex in curated.ALL_CURATED:
        group = cat_to_group.get(ex["category"])
        if group is None:
            unmapped.append(ex)
        else:
            by_group[group].append(ex)

    if unmapped:
        # Failing loudly beats silently dropping curated safety content.
        raise SystemExit(
            "FATAL: curated categories not assigned to an intent group: "
            + ", ".join(sorted({e['category'] for e in unmapped}))
        )

    train: list[dict] = []
    val: list[dict] = []
    test: list[dict] = []

    # 60 / 20 / 20 within every intent group.
    #
    # Earlier attempts dealt 50% of each group to val and 50% to test, which
    # left the training set with ZERO curated examples - the model would have
    # learned no boundary, safety or multilingual behaviour at all. The
    # curated set is only ~85 rows, so the training share has to dominate while
    # every group still contributes to both evaluation splits.
    for group, items in sorted(by_group.items()):
        items = sorted(items, key=lambda e: e["id"])
        rng.shuffle(items)
        for i, ex in enumerate(items):
            slot = i % 5
            if slot < 3:
                train.append(ex)
            elif slot == 3:
                val.append(ex)
            else:
                test.append(ex)

    return train, val, test


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--oversample-safety", type=int, default=2,
                    help="Repeat the curated safety set N times in TRAIN only.")
    ap.add_argument("--min-examples", type=int, default=500)
    args = ap.parse_args()

    for d in (TRAIN_OUT, VAL_OUT, TEST_OUT, REPORT_DIR):
        os.makedirs(d, exist_ok=True)

    rng = random.Random(SEED)

    # ---- source A: EmpatheticDialogues ---------------------------------
    ed_all: list[dict] = []
    for split in ("train", "validation", "test"):
        p = os.path.join(PROCESSED, f"empathetic_{split}.jsonl")
        if not os.path.exists(p):
            print(f"ERROR: {p} missing. Run preprocess_empathetic.py first.", file=sys.stderr)
            return 1
        ed_all.extend(load_jsonl(p))
    print(f"[splits] EmpatheticDialogues: {len(ed_all)} examples")

    ed_train, ed_val, ed_test = split_empathetic(ed_all, rng)
    print(f"          train={len(ed_train)} val={len(ed_val)} test={len(ed_test)}")

    # ---- source B: TalkEasy curated ------------------------------------
    cu_train, cu_val, cu_test = split_curated(rng)
    print(f"[splits] TalkEasy curated:    {len(cu_train)} train "
          f"{len(cu_val)} val {len(cu_test)} test")

    # ---- safety oversampling (train only) -------------------------------
    safety_examples = [e for e in cu_train if e["is_safety"]]
    oversampled: list[dict] = []
    for i in range(args.oversample_safety):
        for ex in safety_examples:
            copy = dict(ex)
            copy["id"] = f"{ex['id']}__os{i}" if i else ex["id"]
            copy["oversampled"] = i > 0
            oversampled.append(copy)
    cu_train = cu_train + oversampled
    print(f"[splits] safety oversampling x{args.oversample_safety}: "
          f"+{len(oversampled)} train rows (val/test untouched)")

    # ---- assemble -------------------------------------------------------
    def tag(rows: list[dict], source: str) -> list[dict]:
        for r in rows:
            r["source"] = source
        return rows

    train = tag(ed_train + cu_train, "mixed")
    val = tag(ed_val + cu_val, "mixed")
    test = tag(ed_test + cu_test, "mixed")
    for rows in (train, val, test):
        rng.shuffle(rows)

    if len(train) < args.min_examples:
        print(f"ERROR: train set too small ({len(train)})", file=sys.stderr)
        return 1

    write_jsonl(os.path.join(TRAIN_OUT, "talkeasy_train.jsonl"), train)
    write_jsonl(os.path.join(VAL_OUT, "talkeasy_validation.jsonl"), val)
    write_jsonl(os.path.join(TEST_OUT, "talkeasy_test.jsonl"), test)

    # ---- combined corpus file (for reproducibility / re-export) --------
    combined = sorted(train + val + test, key=lambda r: r["id"])
    write_jsonl(os.path.join(PROCESSED, "talkeasy_training.jsonl"), combined)
    write_jsonl(os.path.join(REPO_ROOT, "data", "safety", "talkeasy_safety.jsonl"),
                [e for e in curated.SAFETY_EXAMPLES])

    # ---- statistics report ---------------------------------------------
    def describe(rows: list[dict]) -> dict:
        langs = Counter(r.get("language", "?") for r in rows)
        cats = Counter(r.get("category", "?") for r in rows)
        sources = Counter(r.get("source", "?") for r in rows)
        turns = Counter(len(r["messages"]) for r in rows)
        user_chars = [len(m["content"]) for r in rows for m in r["messages"] if m["role"] == "user"]
        asst_chars = [len(m["content"]) for r in rows for m in r["messages"] if m["role"] == "assistant"]
        safety = sum(1 for r in rows if r.get("is_safety"))

        def avg(xs: list[int]) -> float:
            return round(sum(xs) / len(xs), 1) if xs else 0.0

        return {
            "examples": len(rows),
            "safety_examples": safety,
            "conversations": len({r.get("conversation_id") for r in rows if r.get("conversation_id")}),
            "language_distribution": dict(langs.most_common()),
            "top_categories": dict(cats.most_common(15)),
            "category_count": len(cats),
            "messages_per_example": dict(sorted(turns.items())),
            "avg_turns": round(len(turns) and sum(k * v for k, v in turns.items()) / len(rows), 2),
            "avg_user_chars": avg(user_chars),
            "avg_assistant_chars": avg(asst_chars),
            "avg_total_chars": avg(user_chars) + avg(asst_chars),
        }

    report = {
        "generated_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "seed": SEED,
        "oversample_safety": args.oversample_safety,
        "dataset_version": "v1.0.0",
        "sources": {
            "empathetic_dialogues": {
                "id": "facebook/empathetic_dialogues",
                "license": "CC-BY-NC-4.0",
                "commercial_use": "NOT PERMITTED without separate permission",
                "examples": len(ed_all),
            },
            "talkeasy_curated": {
                "id": "talkeasy-curated-v1",
                "license": "TalkEasy project",
                "examples": len(curated.ALL_CURATED),
                "safety_examples": curated.SAFETY_EXAMPLE_COUNT,
                "languages": curated._LANGUAGE_TOTALS,
                "languages_deliberately_excluded": curated.UNAUTHORED_LANGUAGES,
                "exclusion_reason": (
                    "Only machine translation was available; the project brief forbids "
                    "treating machine-translated text as quality training data."
                ),
            },
        },
        "total_examples": len(combined),
        "train": describe(train),
        "validation": describe(val),
        "test": describe(test),
        "split_ratios": {
            "train": round(len(train) / len(combined), 4),
            "validation": round(len(val) / len(combined), 4),
            "test": round(len(test) / len(combined), 4),
        },
    }
    with open(os.path.join(REPORT_DIR, "dataset_stats.json"), "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, ensure_ascii=False)

    print("\n" + "=" * 74)
    print("FINAL DATASET")
    print("=" * 74)
    for split in ("train", "validation", "test"):
        d = report[split]
        print(f"\n{split.upper()}  ({d['examples']} examples, {d['safety_examples']} safety)")
        print(f"  avg turns={d['avg_turns']}  avg user={d['avg_user_chars']}ch  "
              f"avg assistant={d['avg_assistant_chars']}ch")
        print(f"  languages: {d['language_distribution']}")
    print(f"\n  split ratios: {report['split_ratios']}")
    print(f"  total: {report['total_examples']}")
    print(f"\n  written:")
    print(f"    {os.path.join(TRAIN_OUT, 'talkeasy_train.jsonl')}")
    print(f"    {os.path.join(VAL_OUT, 'talkeasy_validation.jsonl')}")
    print(f"    {os.path.join(TEST_OUT, 'talkeasy_test.jsonl')}")
    print(f"    {os.path.join(PROCESSED, 'talkeasy_training.jsonl')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
