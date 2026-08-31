#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
if ! python3 - <<'PY'
import torch
if not torch.cuda.is_available():
    raise SystemExit("CUDA GPU is required for this production training launcher")
print("Using", torch.cuda.get_device_name(0))
PY
then
  exit 2
fi

rm -rf backend/app/ai/model_artifacts_candidate
python3 -m backend.app.ai.train \
  --train-file data/combined/train.jsonl \
  --eval-file data/combined/valid.jsonl \
  --output-dir backend/app/ai/model_artifacts_candidate \
  --backbone distilbert/distilbert-base-uncased \
  --epochs "${EPOCHS:-3}" \
  --train-batch-size "${TRAIN_BATCH_SIZE:-16}" \
  --eval-batch-size "${EVAL_BATCH_SIZE:-16}" \
  --tasks category priority \
  --seed "${SEED:-42}" \
  --fp16 \
  --logging-steps 100

python3 -m backend.app.ai.evaluate \
  --model-dir backend/app/ai/model_artifacts_candidate \
  --eval-file data/combined/valid.jsonl \
  --report model_eval_candidate.json \
  --min-macro-f1 "${MIN_MACRO_F1:-0.70}"

echo "Candidate passed the configured quality gate. Review model_eval_candidate.json, then promote explicitly with:"
echo "  rm -rf backend/app/ai/model_artifacts_previous"
echo "  mv backend/app/ai/model_artifacts backend/app/ai/model_artifacts_previous"
echo "  mv backend/app/ai/model_artifacts_candidate backend/app/ai/model_artifacts"
