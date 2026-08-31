# AI Support Ticket System — Ready-to-Run Package

This package contains the FastAPI support-ticket classifier and one enriched dataset, `support_tickets.json`, with a `sentiment` field on every record. The current dataset uses four sentiment labels: `angry`, `sad`, `disappointed`, and `happy`.

## Run on Linux or macOS

```bash
cd ai_support_ticket_ready
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

The package already includes prepared training files under `data/combined/`. To train the model and generate learned weights, run:

```bash
python -m backend.app.ai.train \
  --train-file data/combined/train.jsonl \
  --eval-file data/combined/valid.jsonl \
  --output-dir backend/app/ai/model_artifacts \
  --epochs 3 \
  --train-batch-size 4 \
  --eval-batch-size 4 \
  --max-length 128
```

This package now includes a trained checkpoint under `backend/app/ai/model_artifacts/`, including `model.safetensors`. You can run the API immediately after installation. The included checkpoint was produced with a short 0.2-epoch CPU-friendly pass so the ZIP contains usable weights; for production quality, retrain with `--epochs 3`.

After training, verify the artifacts:

```bash
find backend/app/ai/model_artifacts -maxdepth 1 -type f -printf '%f — %s bytes\\n' | sort
```

You should see a model-weight file such as `model.safetensors` or `pytorch_model.bin`, along with `config.json`, `ticket_config.json`, `label_maps.json`, and tokenizer files.

Start the API:

```bash
export MODEL_DIR="$(pwd)/backend/app/ai/model_artifacts"
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

In another terminal, test it:

```bash
curl -X POST http://127.0.0.1:8000/api/tickets/classify \
  -H 'Content-Type: application/json' \
  -d '{"subject":"Billing problem","body":"I was charged twice and I am very disappointed."}'
```

## Important

The ZIP contains the current uploaded dataset and its generated sentiment labels. The sentiment labels are machine-assisted annotations and should be reviewed on a sample before production use. The prepared training data is ready to train immediately. The second dataset can be added later and prepared with the updated `backend/app/ai/prepare_data.py`, which now preserves sentiment values. The included model weights are a baseline checkpoint and should be evaluated before production use.

Do not commit customer data, API keys, or trained weights to a public repository.
