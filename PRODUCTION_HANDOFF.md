# Production handoff

## Scope completed

The baseline was hardened for production-oriented use. The trainer is now reproducible and task-aware, with explicit seed control, validation of input records, safe handling of missing labels, macro-F1 quality metrics, checkpoint retention, and a `training_manifest.json` artifact. The default profile trains category and priority only; sentiment is opt-in because the supplied sentiment values are machine-assisted and should be human-reviewed before automated routing.

The API now rejects blank or unknown fields, enforces request-size limits, returns `/health` and model-loading `/ready` endpoints, adds processing-time and content-type safety headers, reports a model version, and avoids exposing internal exception details for unexpected failures. The container includes `accelerate` for Hugging Face Trainer and a Docker health check against `/ready`.

A standalone evaluator is included at `backend/app/ai/evaluate.py`. It writes task-level, per-label, and per-source metrics and fails the process when macro-F1 falls below the configured gate. `audit_dataset.py` verifies missing fields, duplicates, and cross-split leakage.

## Data findings

The supplied `tickets.json` contains zero records. The usable source is `support_tickets.json`, containing 8,077 records. The prepared split contains 6,461 training records and 1,616 validation records, with no duplicate keys within either split and no cross-split overlap. The current prepared data is product-support only, with five categories and four priorities. Sentiment is highly imbalanced and should not be treated as production ground truth without annotation review.

## Validation performed

`python3 -m compileall -q backend` passed. The FastAPI smoke test passed against the included baseline checkpoint, including health behavior, strict validation, and classification response handling. The dataset audit passed with zero missing subject/body/category values, zero duplicate keys, and zero cross-split overlap.

## Full retraining command

Run this on a machine with sufficient RAM or GPU memory; the sandbox could not complete a full DistilBERT fine-tune under its memory/time constraints and the incomplete candidate checkpoint was removed rather than promoted:

```bash
python3 -m backend.app.ai.train \
  --train-file data/combined/train.jsonl \
  --eval-file data/combined/valid.jsonl \
  --output-dir backend/app/ai/model_artifacts_candidate \
  --epochs 3 \
  --train-batch-size 16 \
  --eval-batch-size 16 \
  --tasks category priority \
  --seed 42 \
  --fp16

python3 -m backend.app.ai.evaluate \
  --model-dir backend/app/ai/model_artifacts_candidate \
  --eval-file data/combined/valid.jsonl \
  --report model_eval.json \
  --min-macro-f1 0.70
```

Promote the candidate only after reviewing `model_eval.json` by source and label, then set `MODEL_DIR` and `MODEL_VERSION` explicitly in deployment. Do not commit customer records, API keys, or model weights to a public repository.
