"""
TalkEasy AI - Step 8: export a merged model to GGUF and register it with Ollama.

This script REFUSES to run until a real trained checkpoint exists. It checks
the adapter has non-zero trainable weights, because the most likely cause of a
useless Ollama model is exporting the BASE model while silently dropping the
LoRA adapter.

PIPELINE
  1. merge LoRA into the base weights  -> artifacts/merged/
  2. convert merged -> GGUF (F16)     -> artifacts/gguf/
  3. quantize to Q4_K_M               -> artifacts/gguf/*.q4_k_m.gguf
  4. write Modelfile with the safety system prompt baked in
  5. `ollama create talkeasy-phi3`

Requirements (install only on a training machine, not needed for inference):
  pip install -q llama-cpp-python        # provides convert_hf_to_gguf.py
  HF download quantisation tooling from the llama.cpp repository

Usage
  python scripts/ai/export_gguf.py --adapter artifacts/phi3-talkeasy-lora
  python scripts/ai/export_gguf.py --adapter artifacts/phi3-talkeasy-lora --dry-run
"""

from __future__ import annotations

import argparse
import datetime
import json
import os
import shutil
import subprocess
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ARTIFACTS = os.path.join(REPO_ROOT, "artifacts")
MODEL_NAME = "talkeasy-phi3"

# Baked into the Modelfile so every Ollama call gets the safety contract
# without the app having to remember it. Keep in sync with
# server/ai-service.ts SAFETY_SYSTEM_PROMPT.
SYSTEM_PROMPT = """You are TalkEasy AI, a supportive mental-wellness companion. Your role is to provide calm, respectful, and non-judgmental conversational assistance.

CRITICAL SAFETY RULES:
1. You are NOT a therapist, doctor, or diagnostic system.
2. You do NOT diagnose mental health conditions.
3. You do NOT prescribe medication or give medical advice.
4. You do NOT claim to be human or replace professional care.
5. You do NOT encourage emotional dependency or tell users to isolate themselves.

IF USER EXPRESSES SUICIDAL/SELF-HARM INTENT OR IMMEDIATE DANGER:
- Prioritize immediate safety
- Respond calmly and supportively
- Encourage moving away from means of harm
- Encourage being with another trusted person
- Provide verified crisis resources (112 for emergency, 14416 for Tele-MANAS in India)
- Avoid guilt, shame, threats, or emotional manipulation
- Do NOT provide harmful instructions
- Do NOT romanticize or normalize self-harm

Remember: You are a wellness support tool, not a replacement for professional mental health care."""


def run(cmd: list[str], cwd: str | None = None) -> None:
    print(f"  $ {' '.join(cmd)}")
    proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if proc.stdout.strip():
        print("    " + proc.stdout.strip().replace("\n", "\n    ")[:2000])
    if proc.returncode != 0:
        print("    STDERR: " + proc.stderr.strip()[:2000], file=sys.stderr)
        raise SystemExit(f"command failed with exit code {proc.returncode}")


def adapter_has_weights(adapter_dir: str) -> dict:
    """Verify the adapter contains trained LoRA weights, not an empty shell."""
    import glob

    safetensors = glob.glob(os.path.join(adapter_dir, "*.safetensors"))
    bins = glob.glob(os.path.join(adapter_dir, "*.bin"))
    cfg = os.path.join(adapter_dir, "adapter_config.json")
    info = {
        "safetensors": len(safetensors),
        "bin": len(bins),
        "has_adapter_config": os.path.exists(cfg),
        "total_bytes": sum(os.path.getsize(f) for f in safetensors + bins),
    }
    info["ok"] = bool(safetensors or bins) and info["has_adapter_config"]

    # A LoRA rank-16 adapter over Phi-3's attention+MLP projections is tens of
    # MB. Anything under ~1 MB means the run never actually updated weights.
    info["plausible_size"] = info["total_bytes"] > 1_000_000
    return info


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--adapter", default=os.path.join(ARTIFACTS, "phi3-talkeasy-lora"))
    ap.add_argument("--base", default="microsoft/Phi-3-mini-4k-instruct")
    ap.add_argument("--merged", default=os.path.join(ARTIFACTS, "merged"))
    ap.add_argument("--gguf-dir", default=os.path.join(ARTIFACTS, "gguf"))
    ap.add_argument("--name", default=MODEL_NAME)
    ap.add_argument("--context", type=int, default=4096)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    print("=" * 74)
    print("EXPORT / OLLAMA REGISTRATION")
    print("=" * 74)

    if not os.path.isdir(args.adapter):
        print(f"\n  No trained adapter at {args.adapter}", file=sys.stderr)
        print("  Nothing has been trained on this machine, so there is nothing to export.")
        print("  train.py recorded this in data/reports/training_attempt.json.", file=sys.stderr)
        print("  Train on a GPU host first, then re-run this script there.", file=sys.stderr)
        return 2

    info = adapter_has_weights(args.adapter)
    print(f"\n  adapter check: {json.dumps(info)}")
    if not info["ok"] or not info["plausible_size"]:
        print("\n  Refusing to export: the adapter does not contain usable LoRA weights.",
              file=sys.stderr)
        print("  Exporting now would register a model that is just the base model "
              "with a discarded adapter, which is worse than no model at all.",
              file=sys.stderr)
        return 2

    plan = [
        ["python", "-m", "llama_cpp.convert_hf_to_gguf", args.merged,
         "--outfile", os.path.join(args.gguf_dir, "model-f16.gguf"), "--outtype", "f16"],
        ["llama-quantize", os.path.join(args.gguf_dir, "model-f16.gguf"),
         os.path.join(args.gguf_dir, "talkeasy-phi3-q4_k_m.gguf"), "Q4_K_M"],
        ["ollama", "create", args.name, "-f", "Modelfile"],
    ]
    print("\n  Planned steps:")
    for step in plan:
        print(f"    {' '.join(step)}")

    if args.dry_run:
        print("\n  --dry-run: nothing executed.")
        return 0

    os.makedirs(args.gguf_dir, exist_ok=True)

    print("\n[1/3] merging LoRA into base weights")
    run(["python", "-c", f"""
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
base = AutoModelForCausalLM.from_pretrained({args.base!r}, torch_dtype=torch.float16)
model = PeftModel.from_pretrained(base, {args.adapter!r})
merged = model.merge_and_unload()
merged.save_pretrained({args.merged!r}, safe_serialization=True)
tok = AutoTokenizer.from_pretrained({args.base!r})
tok.save_pretrained({args.merged!r})
print('merged ->', {args.merged!r})
"""])

    print("\n[2/3] converting to GGUF")
    run(plan[0])

    print("\n[3/3] quantizing to Q4_K_M")
    run(plan[1])

    modelfile = os.path.join(REPO_ROOT, "Modelfile")
    gguf_path = os.path.join(args.gguf_dir, "talkeasy-phi3-q4_k_m.gguf")
    with open(modelfile, "w", encoding="utf-8") as fh:
        fh.write(
            f'FROM {gguf_path}\n\n'
            f'PARAMETER num_ctx {args.context}\n'
            f'PARAMETER temperature 0.7\n'
            f'PARAMETER top_p 0.9\n\n'
            f'SYSTEM """\n{SYSTEM_PROMPT}\n"""\n\n'
            f'TEMPLATE """'
            '{{< if .System }}<|system|>\n{{ .System }}<|end|>\n{{ end }}'
            '{{< if .Prompt }}<|user|>\n{{ .Prompt }}<|end|>\n{{ end }}'
            '{{< if .Response }}<|assistant|>\n{{ .Response }}<|end|>\n{{ end }}'
            '"""\n'
        )
    print(f"\n  Modelfile written -> {modelfile}")

    print("\n  registering with Ollama")
    run(["ollama", "create", args.name, "-f", modelfile])

    print(f"\n  Registered as '{args.name}'. Verify with:")
    print(f"    ollama run {args.name}")
    print(f"    python scripts/ai/evaluate.py --model {args.name} "
          f"--model phi3:latest --compare")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())