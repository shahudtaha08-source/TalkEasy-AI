"""
TalkEasy AI - Step 1: Inspect the raw EmpatheticDialogues CSVs.

This script performs READ-ONLY inspection of the downloaded ParlAI CSV files.
It answers, concretely and with evidence:
  - how many real CSV data rows exist per split
  - whether the documented column order actually holds
  - whether any row is field-shifted (comma-in-unquoted-text corruption)
  - the real distribution of `context` (emotion labels)
  - the real distribution of `speaker_idx`
  - how many conversations overlap between splits (leakage risk)
  - presence of the `_comma_` and other tokenizer artifacts
  - encoding / mojibake / control-character problems

It writes a machine-readable report to data/reports/inspection.json so the
preprocessing step can be audited against what was actually observed.

Usage:
    python scripts/ai/inspect_dataset.py
"""

from __future__ import annotations

import csv
import json
import os
import re
import sys
import unicodedata
from collections import Counter, defaultdict

csv.field_size_limit(10**7)

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW_DIR = os.path.join(REPO_ROOT, "data", "raw", "empatheticdialogues")
REPORT_DIR = os.path.join(REPO_ROOT, "data", "reports")

SPLITS = {"train": "train.csv", "validation": "valid.csv", "test": "test.csv"}

# The dataset escapes commas inside utterances as the literal token
# "_comma_" (see ParlAI preprocessing). Treating it as punctuation-free
# text would badly damage the style we want the model to learn.
ARTIFACT_TOKENS = ["_comma_", "_conma_", "__"]

CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


# Codepoints that appear when UTF-8 bytes are decoded as latin-1/cp1252.
_MOJIBAKE_LEAD = {0xC3, 0xC2, 0xE2, 0xEF, 0xC5, 0xE0, 0xF0}
_MOJIBAKE_TRAIL = set(range(0x80, 0xC0)) | set(range(0x201A, 0x2016))


def detect_mojibake(text: str) -> bool:
    """Heuristic for UTF-8 bytes mistakenly decoded as latin-1/cp1252.

    Implemented with explicit codepoint arithmetic instead of a regex so the
    Windows console/encoding layer cannot mangle the pattern.
    """
    for i, ch in enumerate(text):
        if ord(ch) not in _MOJIBAKE_LEAD:
            continue
        if i + 1 < len(text) and ord(text[i + 1]) in _MOJIBAKE_TRAIL:
            return True
    return False


def inspect_split(name: str, filename: str) -> dict:
    path = os.path.join(RAW_DIR, filename)
    if not os.path.exists(path):
        return {"error": f"missing file: {path}"}

    header: list[str] = []
    raw_lines = 0
    rows: list[dict] = []
    ragged: list[dict] = []
    artifact_counts: Counter = Counter()
    bad_encoding = 0
    control_char_rows = 0
    mojibake_rows = 0
    empty_utterance = 0
    empty_context = 0

    with open(path, "r", encoding="utf-8", errors="replace", newline="") as fh:
        reader = csv.reader(fh)
        for record in reader:
            if not header:
                header = record
                continue
            raw_lines += 1
            if len(record) != len(header):
                # Field-shifted row: the release has unescaped commas in some
                # utterance fields. Record it rather than silently mis-parsing.
                ragged.append(
                    {
                        "line": raw_lines + 1,
                        "expected_fields": len(header),
                        "got_fields": len(record),
                        "preview": " | ".join(record)[:200],
                    }
                )
                continue

            row = dict(zip(header, record))
            utt = row.get("utterance", "") or ""
            ctx = row.get("context", "") or ""

            for tok in ARTIFACT_TOKENS:
                if tok in utt or tok in (row.get("prompt", "") or ""):
                    artifact_counts[tok] += 1

            if not utt.strip():
                empty_utterance += 1
            if not ctx.strip():
                empty_context += 1
            if CONTROL_CHARS.search(utt):
                control_char_rows += 1
            if detect_mojibake(utt) or detect_mojibake(row.get("prompt", "") or ""):
                mojibake_rows += 1

            rows.append(row)

    speaker_counter = Counter((r.get("speaker_idx") or "").strip() for r in rows)
    context_counter = Counter((r.get("context") or "").strip() for r in rows)
    conv_ids = {r.get("conv_id", "") for r in rows}
    idx_counter = Counter((r.get("utterance_idx") or "").strip() for r in rows)

    # Consecutive utterances must increment utterance_idx within a conversation.
    by_conv: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_conv[r.get("conv_id", "")].append(r)
    non_monotonic = 0
    multi_turn = 0
    turn_hist: Counter = Counter()
    for cid, group in by_conv.items():
        group.sort(key=lambda r: int(r["utterance_idx"]) if (r.get("utterance_idx") or "").isdigit() else 0)
        idxs = [int(r["utterance_idx"]) for r in group if (r.get("utterance_idx") or "").isdigit()]
        if any(b <= a for a, b in zip(idxs, idxs[1:])):
            non_monotonic += 1
        if len(group) > 1:
            multi_turn += 1
        turn_hist[len(group)] += 1

    return {
        "split": name,
        "file": filename,
        "header": header,
        "total_physical_lines": raw_lines + 1,
        "data_rows_parsed": len(rows),
        "ragged_rows": len(ragged),
        "ragged_examples": ragged[:5],
        "conversations": len(conv_ids),
        "multi_turn_conversations": multi_turn,
        "turns_per_conversation_histogram": dict(sorted(turn_hist.items())),
        "non_monotonic_utterance_idx_conversations": non_monotonic,
        "speaker_idx_distinct_values": len(speaker_counter),
        "speaker_idx_top20": speaker_counter.most_common(20),
        "speaker_idx_is_binary": set(speaker_counter.keys()) <= {"0", "1"},
        "emotion_label_count": len(context_counter),
        "emotion_labels": dict(context_counter.most_common()),
        "artifact_token_counts": dict(artifact_counts),
        "empty_utterance_rows": empty_utterance,
        "empty_context_rows": empty_context,
        "control_char_rows": control_char_rows,
        "mojibake_rows": mojibake_rows,
        "broken_encoding_placeholder_rows": bad_encoding,
        "utterance_idx_distinct": len(idx_counter),
        "conversations_set": sorted(conv_ids),
    }


def main() -> int:
    if not os.path.isdir(RAW_DIR):
        print(f"ERROR: raw directory not found: {RAW_DIR}", file=sys.stderr)
        print("Download first: see docs/FINE_TUNING_RUNBOOK.md", file=sys.stderr)
        return 1

    os.makedirs(REPORT_DIR, exist_ok=True)

    report: dict = {
        "source": "facebook/empathetic_dialogues (ParlAI release tarball)",
        "source_url": "https://dl.fbaipublicfiles.com/parlai/empatheticdialogues/empatheticdialogues.tar.gz",
        "declared_license": "cc-by-nc-4.0",
        "inspected_at_utc": None,
        "splits": {},
    }

    import datetime

    report["inspected_at_utc"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    conv_sets: dict[str, set] = {}
    for name, filename in SPLITS.items():
        print(f"[inspect] {name} ({filename}) ...", flush=True)
        res = inspect_split(name, filename)
        conv_sets[name] = set(res.pop("conversations_set", []))
        report["splits"][name] = res
        print(
            f"         rows={res['data_rows_parsed']} convs={res['conversations']} "
            f"ragged={res['ragged_rows']} emotions={res['emotion_label_count']} "
            f"speaker_idx_binary={res['speaker_idx_is_binary']}"
        )

    # ---- leakage check across the official splits -------------------------
    leakage = {}
    for a in SPLITS:
        for b in SPLITS:
            if a >= b:
                continue
            leakage[f"{a}|{b}"] = len(conv_sets[a] & conv_sets[b])
    report["conversation_overlap_between_official_splits"] = leakage

    total_rows = sum(s["data_rows_parsed"] for s in report["splits"].values())
    total_convs = sum(s["conversations"] for s in report["splits"].values())
    report["totals"] = {
        "data_rows": total_rows,
        "conversations": total_convs,
        "ragged_rows": sum(s["ragged_rows"] for s in report["splits"].values()),
    }

    out_path = os.path.join(REPORT_DIR, "inspection.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, ensure_ascii=False)

    # Human-readable console summary
    print("\n" + "=" * 72)
    print("RAW DATASET INSPECTION SUMMARY")
    print("=" * 72)
    print(f"Total data rows      : {total_rows}")
    print(f"Total conversations  : {total_convs}")
    print(f"Ragged/shifted rows  : {report['totals']['ragged_rows']}")
    print(f"Cross-split conv leak: {leakage}")
    print()
    for name, s in report["splits"].items():
        print(f"-- {name} --")
        print(f"   emotions ({s['emotion_label_count']}): {', '.join(sorted(s['emotion_labels']))}")
        print(f"   artifacts: {s['artifact_token_counts']}")
        print(f"   empty_utterance={s['empty_utterance_rows']} empty_context={s['empty_context_rows']}")
        print(f"   control_char_rows={s['control_char_rows']} mojibake_rows={s['mojibake_rows']}")
        print(f"   speaker_idx binary={s['speaker_idx_is_binary']} distinct={s['speaker_idx_distinct_values']}")
        print(f"   speaker_idx top: {s['speaker_idx_top20'][:8]}")
        print(f"   turns/conv histogram: {s['turns_per_conversation_histogram']}")
        print()
    print(f"Full report written to: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
