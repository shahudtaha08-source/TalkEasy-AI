"""
TalkEasy AI - Step 3: validate every example before it can reach the trainer.

This is a gate, not a report. It exits non-zero if any example is unsafe,
malformed, duplicated, or leaking. The trainer refuses to run on invalid data.

Checks
  structural   valid JSONL, non-empty alternating roles, ends on assistant
  safety       no diagnosis / medication / dosage / false credentials in targets
  safety       no fabricated crisis numbers
  safety       no method-of-self-harm content anywhere
  safety       no dependency / isolation / dismissal in targets
  hygiene      no PII, no broken encoding, no degenerate text, length bounds
  integrity    no duplicate ids, no duplicate content, no cross-split leakage
  language     declared language matches script actually used

Usage
  python scripts/ai/validate_dataset.py
  python scripts/ai/validate_dataset.py --files data/train/talkeasy_train.jsonl
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import unicodedata
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import (  # noqa: E402
    find_fabricated_crisis_numbers,
    force_utf8_console,
    find_unsafe_assistant_patterns,
    has_personal_identifiers,
    is_degenerate,
)

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# Content that must never appear in ANY field of ANY example.
_HARMFUL_METHOD = [
    re.compile(r"\bhow to (kill|end your life|commit suicide|self[\s-]?harm)\b", re.IGNORECASE),
    re.compile(r"\b(most effective|best) (way|method) to (die|kill yourself)\b", re.IGNORECASE),
    re.compile(r"\blethal dose\b", re.IGNORECASE),
    re.compile(r"\b(how many|number of)\s+(pills|tablets)\b.{0,30}\b(fatal|die|death)", re.IGNORECASE),
    re.compile(r"\b(painkiller|insecticide|rat poison|bleach)\b.{0,40}\b(drink|swallow|ingest|overdose)", re.IGNORECASE),
    re.compile(r"\bhang(ed)? myself from\b", re.IGNORECASE),
    re.compile(r"\bjump (off|from) (a|the)\b.{0,20}\b(bridge|building|roof|station)", re.IGNORECASE),
    re.compile(r"\b(vein|cut|slit)\b.{0,25}\b(deeper|wrist|thigh)", re.IGNORECASE),
]

_MOJIBAKE = re.compile(r"[\u00c3\u00c2][\u0080-\u00bf]")

# Script detection for language verification.
_DEVANAGARI = re.compile(r"[\u0900-\u097f]")
# Roman-script Indic: Hinglish/Urdu are written in Latin script, so they are
# distinguished by vocabulary rather than by Unicode range.
_HINGLISH_MARKERS = re.compile(
    r"\b(hai|hain|nahi|kya|kar|karke|raha|rahi|mujhe|mere|meri|bahut|thoda|"
    r"accha|acha|pheir|kyunki|lekin|phir|bahar|andar|waqt|baat|log|koi)\b",
    re.IGNORECASE,
)
_URDU_MARKERS = re.compile(
    r"\b(hai|hain|nahi|kya|kar|raha|rahi|mujhe|mujh|bohat|bohat|accha|"
    r"kyunki|lekin|phir|waqt|baat|log|koi|mehsoos|tanhi|khauf|darr)\b",
    re.IGNORECASE,
)

MAX_TOTAL_CHARS = 6000
MIN_TOTAL_CHARS = 20

VALID_ROLES = {"user", "assistant"}


class Validator:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.stats: Counter = Counter()

    def err(self, where: str, msg: str) -> None:
        self.errors.append(f"[{where}] {msg}")

    def warn(self, where: str, msg: str) -> None:
        self.warnings.append(f"[{where}] {msg}")

    # -- structural ------------------------------------------------------
    def check_structure(self, ex: dict, where: str) -> None:
        self.stats["examples"] += 1
        for key in ("id", "source", "language", "category", "messages"):
            if key not in ex:
                self.err(where, f"missing required field '{key}'")
                return
        msgs = ex["messages"]
        if not isinstance(msgs, list) or not msgs:
            self.err(where, "messages must be a non-empty list")
            return
        if len(msgs) % 2 != 0:
            self.err(where, f"messages count {len(msgs)} is odd; must be whole user/assistant pairs")
        for i, m in enumerate(msgs):
            if not isinstance(m, dict) or "role" not in m or "content" not in m:
                self.err(where, f"message {i} malformed")
                return
            if m["role"] not in VALID_ROLES:
                self.err(where, f"message {i} has invalid role {m['role']!r}")
            expect = "user" if i % 2 == 0 else "assistant"
            if m["role"] != expect:
                self.err(where, f"message {i} role {m['role']!r}, expected {expect!r}")
        if msgs and msgs[-1].get("role") != "assistant":
            self.err(where, "example does not end on an assistant turn (no training target)")

        total = sum(len(m.get("content", "")) for m in msgs if isinstance(m, dict))
        if total < MIN_TOTAL_CHARS:
            self.err(where, f"total content too short ({total} chars)")
        if total > MAX_TOTAL_CHARS:
            self.err(where, f"total content too long ({total} chars)")

    # -- content safety --------------------------------------------------
    def check_content(self, ex: dict, where: str) -> None:
        for m in ex.get("messages", []):
            if not isinstance(m, dict):
                continue
            role, text = m.get("role", ""), m.get("content", "") or ""

            for pat in _HARMFUL_METHOD:
                if pat.search(text):
                    self.err(where, f"HARMFUL METHOD CONTENT in {role} turn: {text[:70]!r}")

            if _MOJIBAKE.search(text):
                self.err(where, f"broken encoding in {role} turn")

            if is_degenerate(text):
                self.err(where, f"degenerate text in {role} turn: {text[:60]!r}")

            if has_personal_identifiers(text):
                self.err(where, f"possible PII in {role} turn: {text[:70]!r}")

            if role == "assistant":
                unsafe = find_unsafe_assistant_patterns(text)
                if unsafe:
                    self.err(where, f"UNSAFE assistant target {sorted(set(unsafe))}: {text[:80]!r}")
                fab = find_fabricated_crisis_numbers(text)
                if fab:
                    self.err(where, f"FABRICATED crisis number(s) {fab}: {text[:80]!r}")

            self.stats[f"turns_{role}"] += 1
            self.stats["chars"] += len(text)

    # -- language --------------------------------------------------------
    def check_language(self, ex: dict, where: str) -> None:
        lang = ex.get("language", "English")
        text = " ".join(
            m.get("content", "") for m in ex.get("messages", []) if isinstance(m, dict)
        )
        if lang == "Hindi":
            if not _DEVANAGARI.search(text):
                self.err(where, "declared Hindi but no Devanagari characters found")
        elif lang == "Urdu":
            if _DEVANAGARI.search(text):
                self.err(where, "declared Urdu (Roman) but Devanagari found")
            if not _URDU_MARKERS.search(text):
                self.warn(where, "declared Urdu but no Urdu vocabulary markers found")
        elif lang == "Hinglish":
            if _DEVANAGARI.search(text):
                self.err(where, "declared Hinglish (Roman) but Devanagari found")
            if not _HINGLISH_MARKERS.search(text):
                self.warn(where, "declared Hinglish but no Hinglish markers found")
        elif lang == "English":
            # EmpatheticDialogues is English-only; curated non-English rows must
            # not be mislabelled as English.
            if _DEVANAGARI.search(text):
                self.err(where, "declared English but Devanagari found")


def load_jsonl(path: str) -> list[dict]:
    out: list[dict] = []
    with open(path, "r", encoding="utf-8") as fh:
        for ln, line in enumerate(fh, 1):
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise SystemExit(f"FATAL: {path}:{ln} is not valid JSON: {exc}")
    return out


def main() -> int:
    force_utf8_console()
    ap = argparse.ArgumentParser()
    ap.add_argument("--files", nargs="*", default=None)
    args = ap.parse_args()

    targets = args.files
    if not targets:
        targets = [
            os.path.join(REPO_ROOT, "data", "train", "talkeasy_train.jsonl"),
            os.path.join(REPO_ROOT, "data", "validation", "talkeasy_validation.jsonl"),
            os.path.join(REPO_ROOT, "data", "test", "talkeasy_test.jsonl"),
        ]

    v = Validator()
    all_ids: dict[str, str] = {}
    contents_by_split: dict[str, set] = {}
    per_file: dict[str, int] = {}

    for path in targets:
        if not os.path.exists(path):
            v.err(os.path.basename(path), "FILE MISSING")
            continue
        name = os.path.basename(path)
        rows = load_jsonl(path)
        per_file[name] = len(rows)
        seen_base: set[str] = set()
        for i, ex in enumerate(rows):
            where = f"{name}#{i}"
            v.check_structure(ex, where)
            v.check_content(ex, where)
            v.check_language(ex, where)

            ex_id = ex.get("id", f"<no-id-{i}>")
            if ex_id in all_ids:
                v.err(where, f"duplicate id {ex_id!r} (also in {all_ids[ex_id]})")
            else:
                all_ids[ex_id] = where

            # Content fingerprint: identical text under a different id is
            # still a duplicate and would leak across splits.
            #
            # Intentional safety oversampling is the one allowed exception: a
            # repeat carrying `oversampled: true` shares content with its base
            # example on purpose. It must still have its own unique id.
            #
            # Only NON-oversampled rows are entered into `seen_base`. Recording
            # oversampled fingerprints here too meant that whenever the shuffle
            # placed an oversampled copy ahead of its own base example, the base
            # row was wrongly reported as a duplicate.
            fp = json.dumps(
                [[m.get("role"), m.get("content")] for m in ex.get("messages", [])],
                ensure_ascii=False,
                sort_keys=True,
            )
            if not ex.get("oversampled"):
                if fp in seen_base:
                    v.err(where, "exact duplicate conversation inside the same file")
                seen_base.add(fp)
            contents_by_split.setdefault(name, set()).add(fp)

        split = name.replace("talkeasy_", "").replace(".jsonl", "")
        v.stats[f"examples_{split}"] = len(rows)

    # -- cross-split leakage ---------------------------------------------
    names = list(contents_by_split)
    leaks: dict[str, int] = {}
    for i, a in enumerate(names):
        for b in names[i + 1 :]:
            overlap = contents_by_split[a] & contents_by_split[b]
            leaks[f"{a}|{b}"] = len(overlap)
            if overlap:
                v.err("leakage", f"{len(overlap)} conversations appear in BOTH {a} and {b}")

    # -- report ----------------------------------------------------------
    print("=" * 74)
    print("DATASET VALIDATION")
    print("=" * 74)
    for name, n in per_file.items():
        print(f"  {name:<40} {n:>7} examples")
    print(f"\n  totals: examples={v.stats['examples']} "
          f"user_turns={v.stats['turns_user']} "
          f"assistant_turns={v.stats['turns_assistant']} "
          f"chars={v.stats['chars']:,}")
    if v.stats["chars"] and v.stats["examples"]:
        print(f"  mean chars/example: {v.stats['chars'] / v.stats['examples']:.1f}")
    print(f"\n  cross-split duplicate leakage: {leaks or 'n/a (single file)'}")

    if v.warnings:
        print(f"\n  WARNINGS ({len(v.warnings)}):")
        for w in v.warnings[:25]:
            print(f"    - {w}")
        if len(v.warnings) > 25:
            print(f"    ... and {len(v.warnings) - 25} more")

    if v.errors:
        print(f"\n  ERRORS ({len(v.errors)}) - dataset REJECTED:")
        for e in v.errors[:40]:
            print(f"    ! {e}")
        if len(v.errors) > 40:
            print(f"    ... and {len(v.errors) - 40} more")
        return 1

    print("\n  RESULT: PASS - dataset is structurally valid and safety-checked.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
