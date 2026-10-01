# TalkEasy Dataset Card

**Version:** `v1.0.0`
**Total examples:** 17,081
**Split:** train 13,655 (80.0%) · validation 1,708 (10.0%) · test 1,718 (10.1%)
**Generator:** `python scripts/ai/build_splits.py` (seed 42, deterministic)
**Machine-readable stats:** `data/reports/dataset_stats.json`

---

## Sources

| Source | Examples | License | Commercial use |
|---|---|---|---|
| `facebook/empathetic_dialogues` (preprocessed) | 16,974 | CC-BY-NC-4.0 | **Not permitted** |
| TalkEasy curated v1 | 85 | Project-owned | Yes |

### ⚠ Licensing blocker

EmpatheticDialogues is **CC-BY-NC-4.0 — non-commercial only**. 99.5% of this
dataset derives from it. TalkEasy is a product, so this dataset must not be
used to ship a commercial model until permission is obtained or the source is
replaced. This is unresolved.

---

## Schema

One JSON object per line:

```json
{
  "id": "te-safe-crisis-001",
  "source": "curated",
  "language": "English",
  "category": "safety_crisis",
  "emotion": "sad",
  "mood": "Sad",
  "is_safety": true,
  "conversation_id": "ed-0042",
  "messages": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

Invariants enforced by `validate_dataset.py`:
- `messages` is alternating `user`/`assistant`, always **ending on assistant**
- non-empty, 20–6000 chars total
- unique `id`; no duplicate content within a split; **zero cross-split leakage**

---

## Composition

| Property | Value |
|---|---|
| Languages | English 13,616 · Hindi 13 · Urdu 6 · Hinglish 4 (train) |
| Safety examples | 33 in train (11 base + 22 oversampled), 3 val, 3 test |
| Avg turns | 3.05 |
| Avg user chars | 81.4 |
| Avg assistant chars | 65.4 |

### Curated set (85 examples, 29 categories)

- **Support** (36) — sadness, loneliness, anxiety, stress, family, academic
- **Boundaries** (15) — diagnosis, medication, jailbreak, therapist, privacy,
  resilience
- **Safety** (13) — crisis, self-harm, distress, follow-up, gatekeeping,
  third-party, abuse
- **Multilingual** (21) — English, Hindi, Hinglish, Roman Urdu

Languages **deliberately excluded**: Marathi, Tamil, Telugu, Malayalam,
Kannada, Bengali, Gujarati. Only machine translation was available, and
machine-translated text is not acceptable as quality training data. Documented
as a known gap, not silently omitted.

---

## Preprocessing decisions

| Issue found in raw release | Handling |
|---|---|
| `speaker_idx` unreliable (789 distinct values in train) | Ignored; used `utterance_idx` parity (odd=user, even=assistant) |
| 9th CSV field containing other conversations | Discarded |
| 5,717 misaligned validation rows + 5 malformed rows | Defensive parse, bad rows dropped |
| 29,094 rows with `_comma_` placeholders | Repaired |
| `<IRREGULAR_COLON_FORMAT>` sentinels | Removed |
| PII, crisis-without-response, diagnosis/medication targets | Filtered |
| Unresponsive/degenerate assistant turns | Filtered |

Survival rate ≈ 13k of 99k raw utterances. Most source dialogue is one-word
acknowledgement ("That's great.") that teaches nothing.

---

## Splitting

- **EmpatheticDialogues** — grouped by `conversation_id`, stratified by
  emotion. Conversation overlap: **0**.
- **Curated** — 60/20/20 within intent groups, so train, validation and test
  each cover every intent area.

Safety examples oversampled ×2 in **training only**. Validation and test are
never oversampled, so evaluation measures generalisation rather than
memorisation.

---

## Intended use

Training a small empathy-assistant (Phi-3-mini LoRA/QLoRA) for TalkEasy:
warm, non-clinical conversational support, correct boundary refusals, crisis
resource referral.

## Out-of-scope / must not be used for

- Diagnosis, treatment, medication advice, or any clinical purpose
- Crisis intervention as a *primary* mechanism — the deterministic
  `server/safety-detection.ts` layer is the safety boundary, not the model
- Any commercial distribution until licensing is resolved
- Languages not represented above

## Known limitations

- 99.5% English; Indic capability rests on 85 hand-written examples
- Seven Indian languages unsupported (see above)
- EmpatheticDialogues is crowd-sourced and noisy; filtering is heuristic
- Crisis examples are synthetic and narrow — 3 in validation, 3 in test is a
  regression net, **not** a clinical validation set
- No demographic or clinical-validity review has been performed

## Validation

```
python scripts/ai/validate_dataset.py     # exits 1 on any violation
```

Current result: **PASS** — 17,081 examples, 0 within-file duplicates,
0 cross-split leakage.