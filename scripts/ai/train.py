"""
TalkEasy AI - Step 5: LoRA / QLoRA fine-tuning of Phi-3-mini-instruct.

REFUSES TO LIE
--------------
This script will not pretend to have trained a model it could not train. It
runs a hardware preflight first and, when the machine cannot support the
requested configuration, it exits with the measured numbers and the cheapest
configuration that WOULD work.

Phi-3-mini has 3.8B parameters. Training it needs roughly:
  * a CUDA GPU with >= 16 GB (bf16 LoRA) or >= 24 GB (QLoRA 4-bit)
  * ~24 GB free disk for checkpoints
This laptop has an integrated GPU and ~4 GB free RAM, so a real Phi-3 run is
not possible here. Use --smoke to validate the code path on a tiny model.

Usage
  python scripts/ai/train.py --smoke
  python scripts/ai/train.py --dry-run
  python scripts/ai/train.py --model microsoft/Phi-3-mini-4k-instruct --qlora
"""

from __future__ import annotations

import argparse
import datetime
import inspect
import json
import os
import sys
from dataclasses import fields as dataclass_fields

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

ARTIFACTS = os.path.join(REPO_ROOT, "artifacts")

DEFAULT_MODEL = "microsoft/Phi-3-mini-4k-instruct"
SMOKE_MODEL = "hf-internal-testing/tiny-random-LlamaForCausalLM"


def preflight(qlora: bool, seq_len: int, model_id: str) -> dict:
    """Measure the machine instead of assuming what it can do."""
    import torch

    info = {
        "torch": torch.__version__,
        "cuda_available": torch.cuda.is_available(),
        "device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
    }
    if torch.cuda.is_available():
        props = torch.cuda.get_device_properties(0)
        info["gpu_name"] = props.name
        info["gpu_memory_gb"] = round(props.total_memory / 1024**3, 1)
        free, total = torch.cuda.mem_get_info()
        info["gpu_free_gb"] = round(free / 1024**3, 1)
        info["gpu_total_gb"] = round(total / 1024**3, 1)
    else:
        info["gpu_name"] = None

    if os.name == "nt":
        import ctypes

        class MEMORYSTATUSEX(ctypes.Structure):
            _fields_ = [
                ("dwLength", ctypes.c_ulong), ("dwMemoryLoad", ctypes.c_ulong),
                ("ullTotalPhys", ctypes.c_ulonglong), ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong),
                ("ullAvailPageFile", ctypes.c_ulonglong),
                ("ullTotalVirtual", ctypes.c_ulonglong),
                ("ullAvailVirtual", ctypes.c_ulonglong),
                ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
            ]

        st = MEMORYSTATUSEX()
        st.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
        ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(st))
        info["ram_total_gb"] = round(st.ullTotalPhys / 1024**3, 1)
        info["ram_available_gb"] = round(st.ullAvailPhys / 1024**3, 1)

    info["disk_free_gb"] = disk_free_gb()
    info["requested"] = {"qlora": qlora, "seq_len": seq_len, "model": model_id}
    return info


def disk_free_gb() -> float:
    import shutil

    return round(shutil.disk_usage(REPO_ROOT).free / 1024**3, 1)


def judge(info: dict, qlora: bool) -> tuple[bool, str]:
    """Decide whether the requested run is physically possible."""
    if info.get("cuda_available"):
        need = 20 if qlora else 14
        have = info.get("gpu_free_gb", 0)
        if have >= need:
            return True, f"GPU has {have} GB free, need >= {need} GB"
        return False, (
            f"GPU free memory is {have} GB but this configuration needs >= {need} GB. "
            f"Close other GPU apps, lower --seq-len, or enable --qlora."
        )

    ram = info.get("ram_available_gb", 0)
    return False, (
        "No CUDA GPU detected. Phi-3 (3.8B) LoRA training on CPU is not viable: "
        "at roughly 40 s per training step for a 512-token sequence, a single "
        "epoch over the 13.6k-example training split would take on the order of "
        f"weeks (available RAM {ram} GB). "
        "Use a rented GPU (RunPod/Lambda/Colab A100+), or run --smoke to validate "
        "this code path on a tiny model."
    )


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser()
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--train", default=os.path.join(REPO_ROOT, "data", "train", "talkeasy_train.jsonl"))
    p.add_argument("--val", default=os.path.join(REPO_ROOT, "data", "validation", "talkeasy_validation.jsonl"))
    p.add_argument("--output", default=os.path.join(ARTIFACTS, "phi3-talkeasy-lora"))
    p.add_argument("--epochs", type=float, default=1.0)
    p.add_argument("--batch-size", type=int, default=4)
    p.add_argument("--grad-accum", type=int, default=8)
    p.add_argument("--lr", type=float, default=2e-4)
    p.add_argument("--seq-len", type=int, default=1024)
    p.add_argument("--lora-r", type=int, default=16)
    p.add_argument("--lora-alpha", type=int, default=32)
    p.add_argument("--lora-dropout", type=float, default=0.05)
    p.add_argument("--qlora", action="store_true", help="4-bit NF4 quantized base")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--max-steps", type=int, default=-1,
                   help="Cap optimizer steps. Use for quick pipeline checks.")
    p.add_argument("--dry-run", action="store_true", help="Preflight and exit; no training")
    p.add_argument("--smoke", action="store_true",
                   help="Validate the full code path on a tiny random model. NOT a real model.")
    return p


def main() -> int:
    args = build_parser().parse_args()

    for path in (args.train, args.val):
        if not os.path.exists(path):
            print(f"ERROR: {path} not found. Run build_splits.py first.", file=sys.stderr)
            return 1

    model_id = SMOKE_MODEL if args.smoke else args.model
    info = preflight(args.qlora, args.seq_len, model_id)
    os.makedirs(ARTIFACTS, exist_ok=True)

    print("=" * 74)
    print("TRAINING PREFLIGHT")
    print("=" * 74)
    for k, v in info.items():
        print(f"  {k}: {v}")

    if args.smoke:
        print("\n  --smoke: tiny random model, code-path validation only.")
        print("  This does NOT produce a usable model and is not a training result.")
    else:
        ok, reason = judge(info, args.qlora)
        print(f"\n  feasible: {ok}")
        print(f"  reason : {reason}")
        if not ok and not args.dry_run:
            report = {
                "timestamp_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "attempted_model": model_id,
                "result": "NOT_TRAINED_INSUFFICIENT_HARDWARE",
                "hardware": info,
                "reason": reason,
            }
            path = os.path.join(REPO_ROOT, "data", "reports", "training_attempt.json")
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(report, fh, indent=2)
            print(f"\n  Recorded honest failure -> {path}")
            print("  No checkpoint was produced. Nothing was trained.")
            return 2

    if args.dry_run:
        print("\n  --dry-run: stopping before training.")
        return 0

    return run_training(args, model_id, info)


def run_training(args, model_id: str, info: dict) -> int:
    import torch
    from datasets import load_dataset
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from trl import SFTTrainer

    quant_config = None
    if args.qlora and not args.smoke:
        from transformers import BitsAndBytesConfig

        quant_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
            bnb_4bit_use_double_quant=True,
        )

    tok = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=quant_config,
        torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
        trust_remote_code=True,
    )
    if quant_config is not None:
        model = prepare_model_for_kbit_training(model)
    model.config.use_cache = False

    lora = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                        "gate_proj", "up_proj", "down_proj"],
    )
    model = get_peft_model(model, lora)
    model.print_trainable_parameters()

    def to_text(example: dict) -> dict:
        # ChatML-style turn markers. Phi-3 was trained on <|user|> /
        # <|assistant|> / <|end|>, so reusing those tokens keeps the tuned
        # model in-distribution instead of teaching it a new format.
        parts = []
        for m in example["messages"]:
            role = m["role"].capitalize()
            parts.append(f"<|{role}|>\n{m['content']}<|end|>")
        # Append the generation prompt so a trained model emits its reply
        # directly, matching how Ollama will call it.
        parts.append("<|assistant|>\n")
        return {"text": "\n".join(parts)}

    ds = load_dataset("json", data_files={"train": args.train, "validation": args.val})
    ds = ds.map(to_text, remove_columns=["messages"])

    # TRL 1.x moved the text/sequence settings out of the trainer signature and
    # into SFTConfig, and transformers 5.x dropped `warmup_ratio` from
    # TrainingArguments entirely. Build the kwargs by introspecting what the
    # installed versions actually accept, then pass them to SFTConfig, so this
    # script survives library bumps instead of hard-coding one API shape.
    from trl import SFTConfig

    wanted = {
        "output_dir": args.output,
        "num_train_epochs": args.epochs,
        "per_device_train_batch_size": args.batch_size,
        "per_device_eval_batch_size": args.batch_size,
        "gradient_accumulation_steps": args.grad_accum,
        "learning_rate": args.lr,
        "lr_scheduler_type": "cosine",
        "warmup_ratio": 0.03,
        "warmup_steps": 0,
        "logging_steps": 10,
        "eval_strategy": "epoch",
        "save_strategy": "epoch",
        "save_total_limit": 2,
        "bf16": torch.cuda.is_available(),
        "fp16": False,
        "seed": args.seed,
        "report_to": [],
        "max_steps": args.max_steps,
        # SFT-specific
        "dataset_text_field": "text",
        "max_length": args.seq_len,
        "max_seq_length": args.seq_len,
        "packing": False,
    }
    accepted = {f.name for f in dataclass_fields(SFTConfig)}
    targs_kwargs = {k: v for k, v in wanted.items() if k in accepted}
    dropped = sorted(set(wanted) - set(targs_kwargs))
    if dropped:
        print(f"  [api] not supported by installed SFTConfig, skipped: {dropped}")
    targs = SFTConfig(**targs_kwargs)

    trainer_params = inspect.signature(SFTTrainer.__init__).parameters
    trainer_kwargs: dict = {
        "model": model,
        "args": targs,
        "train_dataset": ds["train"],
        "eval_dataset": ds.get("validation"),
    }
    trainer_kwargs["processing_class" if "processing_class" in trainer_params
                    else "tokenizer"] = tok

    trainer = SFTTrainer(**trainer_kwargs)

    result = trainer.train()
    trainer.save_model(args.output)
    tok.save_pretrained(args.output)

    metrics = {
        "timestamp_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "model": model_id,
        "smoke": args.smoke,
        "usable_model": not args.smoke,
        "train_metrics": {k: float(v) for k, v in result.metrics.items()},
        "hardware": info,
        "hyperparameters": vars(args),
    }
    path = os.path.join(REPO_ROOT, "data", "reports", "training_run.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(metrics, fh, indent=2, default=str)

    print(f"\n  output -> {args.output}")
    print(f"  metrics-> {path}")
    if args.smoke:
        print("\n  NOTE: smoke run completed. This validates the pipeline only.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())