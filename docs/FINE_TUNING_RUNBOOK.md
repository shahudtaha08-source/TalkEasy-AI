# TalkEasy Fine-Tuning Runbook

Operational reference for reproducing the dataset, training, export and
evaluation. Findings and honest status: `docs/AI_FINE_TUNING.md`.

---

## Prerequisites

```powershell
python --version        # 3.11+
pip install -q torch --index-url https://download.pytorch.org/whl/cpu
pip install -q transformers peft trl datasets accelerate sentencepiece protobuf
ollama --version
```

Inference and evaluation need only Ollama. Training needs a CUDA GPU
(≥16 GB for bf16 LoRA, ≥24 GB for QLoRA).

---

## Pipeline

Every step is idempotent and seeded. Run in order.

### 1. Inspect the source

```powershell
python scripts/ai/inspect_dataset.py
```

→ `data/reports/inspection.json`

Reports field-count anomalies, `speaker_idx` distribution, `_comma_` artefacts
and cross-split conversation overlap. **Read this before trusting the CSV** —
the published release has alignment defects.

### 2. Preprocess

```powershell
python scripts/ai/preprocess_empathetic.py
```

→ `data/processed/empathetic_{train,validation,test}.jsonl`

Roles are assigned by `utterance_idx` parity, **not** by `speaker_idx`, which is
corrupt in the release.

### 3. Build splits

```powershell
python scripts/ai/build_splits.py                    # default ×2 safety oversample
python scripts/ai/build_splits.py --oversample-safety 3
```

→ `data/{train,validation,test}/talkeasy_*.jsonl`, `data/reports/dataset_stats.json`

### 4. Validate — mandatory gate

```powershell
python scripts/ai/validate_dataset.py
```

Exits **1** if the dataset has any structural, safety, hygiene or leakage
violation. Never train on a dataset that fails this.

### 5. Unit tests

```powershell
python scripts/ai/test_common.py     # 78 assertions
```

---

## Training

### Preflight

```powershell
python scripts/ai/train.py --dry-run
```

Prints measured hardware and `feasible: True/False`. **On CPU this reports
`False` for Phi-3** — 3.8B parameters, no GPU, weeks per epoch. Use it to
document *why* training was skipped rather than guessing.

### Pipeline smoke test

```powershell
python scripts/ai/train.py --smoke --epochs 1 --max-steps 6
```

Runs the complete path (LoRA attach → tokenize → label masking → train → eval →
save) on a tiny random model. Proves the mechanics work. **The resulting
weights are random and must be deleted** — `export_gguf.py` refuses anything
under ~1 MB precisely so they cannot be shipped by accident.

### Real training

On a GPU host:

```powershell
python scripts/ai/train.py --qlora --epochs 2 --batch-size 4 --grad-accum 8
```

Defaults: `microsoft/Phi-3-mini-4k-instruct`, r=16, α=32, dropout 0.05,
lr 2e-4 cosine, seq 1024, seed 42.

→ `artifacts/phi3-talkeasy-lora/`, `data/reports/training_run.json`

Failure is recorded to `data/reports/training_attempt.json` with the measured
hardware — never silently skipped.

---

## Evaluation

### Safety and boundary suite

```powershell
python scripts/ai/evaluate.py --model phi3:latest
python scripts/ai/evaluate.py --model phi3:latest --model talkeasy-phi3 --compare
```

12 fixed cases (3 crisis, 5 boundary, 4 normal) scored against the same
`SAFETY_SYSTEM_PROMPT` the app sends. A **hard safety violation is always a
failure** regardless of overall score.

Flags:
- `--skip-crisis` — omit self-harm prompts
- `--no-system-prompt` — measure the bare model (shows how much the prompt
  alone contributes; not how the app runs)

A pass means *no automated rule was violated*. It does **not** establish empathy
or clinical appropriateness.

### Indic language audit

```powershell
python scripts/ai/check_language_support.py --model phi3:latest
```

Checks script purity, phrase looping, topical relevance and emergency-number
presence. Script purity alone is **insufficient** — well-formed nonsense passes
it. The topical-overlap and 112 checks are what catch real failures.

### Established baseline

| Group | `phi3:latest` (Q4_0) |
|---|---|
| Crisis | **0/3** |
| Boundary | 5/5 |
| Normal | 4/4 |
| Overall | 75% |
| Indic usable | **4/9** |

Compare against this — not against zero.

---

## Export to Ollama

On the GPU host, after training:

```powershell
python scripts/ai/export_gguf.py --adapter artifacts/phi3-talkeasy-lora --dry-run
python scripts/ai/export_gguf.py --adapter artifacts/phi3-talkeasy-lora
```

1. Merges LoRA into base weights → `artifacts/merged/`
2. GGUF F16 conversion
3. `llama-quantize` → Q4_K_M
4. Writes `Modelfile` with the safety system prompt and ChatML template
5. `ollama create talkeasy-phi3`

The script **refuses** if the adapter has no plausible weights. Exporting the
base model with a discarded adapter produces a model that looks fine and
silently ignores training — worse than having no model.

Verify:

```powershell
ollama list
python scripts/ai/evaluate.py --model talkeasy-phi3 --model phi3:latest --compare
```

Then set `OLLAMA_MODEL=talkeasy-phi3` in `.env`.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `warmup_ratio` TypeError | transformers 5.x removed it | Script filters kwargs by introspection; upgrade |
| `tokenizer` TypeError in SFTTrainer | TRL 1.x renamed it | Handled automatically |
| `pad_token_id` warning | tiny model has `pad_token = None` | Harmless for smoke runs |
| Every Hindi example "degenerate" | `isalpha()` misses Mn marks | Fixed in `common.py`; keep the Devanagari tests |
| Validator flags oversampled rows as duplicates | Shuffled oversample landed before its base | Only non-oversampled rows enter the seen-set |
| Ollama model ignores training | Adapter was empty at export | `export_gguf.py` blocks this |
| Indic output is gibberish | Q4_0 Phi-3 limitation | Not fixable by prompting; route to a stronger model |
| Devanagari breaks `print()` | Windows cp1252 console | `force_utf8_console()` is called in every script |

---

## Rules

1. `validate_dataset.py` must pass before any training run.
2. Never train on CPU for Phi-3 — use the preflight to record why.
3. Never register an Ollama model that failed evaluation.
4. Never describe an automated safety pass as proof of safety.
5. Never remove or weaken `server/safety-detection.ts`. It is deterministic and
   independent of the model by design.
6. Never claim an improvement without a base-vs-tuned comparison.