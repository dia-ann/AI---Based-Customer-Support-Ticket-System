import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from transformers import pipeline

from backend.app.ai.redact_pii import redact_pii

# Load environment variables from .env
load_dotenv()

logger = logging.getLogger(__name__)

CONFIDENCE_THRESHOLD = 0.5

DEPT_REPO = "pratik14212/deskwise-departments"
PRIORITY_REPO = "pratik14212/deskwise-priorities"
SENTIMENT_REPO = "pratik14212/deskwise-sentiments"

# Load fallback/index label mappings
MAPPINGS_FILE = Path(__file__).parent / "label_mappings.json"
id_to_dept: dict[str, str] = {}
id_to_priority: dict[str, str] = {}
id_to_sentiment: dict[str, str] = {}

if MAPPINGS_FILE.exists():
    try:
        with open(MAPPINGS_FILE, encoding="utf-8") as f:
            mappings = json.load(f)
        id_to_dept = {f"LABEL_{v}": k for k, v in mappings.get("department", {}).items()}
        id_to_dept.update({str(v): k for k, v in mappings.get("department", {}).items()})

        id_to_priority = {f"LABEL_{v}": k for k, v in mappings.get("priority", {}).items()}
        id_to_priority.update({str(v): k for k, v in mappings.get("priority", {}).items()})

        id_to_sentiment = {f"LABEL_{v}": k for k, v in mappings.get("sentiment", {}).items()}
        id_to_sentiment.update({str(v): k for k, v in mappings.get("sentiment", {}).items()})
    except Exception as exc:
        logger.warning("Could not load label mappings: %s", exc)

_pipelines: dict = {}


def _get_pipeline(repo_id: str):
    """Retrieve or initialize the classification pipeline cached in memory."""
    if repo_id not in _pipelines:
        token = os.getenv("HF_TOKEN")
        _pipelines[repo_id] = pipeline(
            "text-classification",
            model=repo_id,
            token=token,
        )
    return _pipelines[repo_id]


def _predict(text: str, repo_id: str, label_map: dict[str, str], default_label: str) -> dict:
    """Run text classification using the Hugging Face model pipeline."""
    try:
        classifier = _get_pipeline(repo_id)
        results = classifier(text, truncation=True)
        if results:
            top = results[0]
            raw_label = str(top.get("label", ""))
            score = float(top.get("score", 0.0))

            label = label_map.get(raw_label, raw_label).strip()
            confidence = round(score, 3)
            return {
                "label": label if label else default_label,
                "confidence": confidence,
                "needs_human_review": confidence < CONFIDENCE_THRESHOLD,
            }
    except Exception as exc:
        logger.warning("Prediction error for %s: %s", repo_id, exc)

    return {"label": default_label, "confidence": 0.5, "needs_human_review": True}


def classify_ticket(subject: str, body: str) -> dict:
    raw_text = f"{subject}. {body}" if subject else body
    redacted = redact_pii(raw_text)

    category_result = _predict(redacted.text, DEPT_REPO, id_to_dept, default_label="Customer Experience")
    priority_result = _predict(redacted.text, PRIORITY_REPO, id_to_priority, default_label="medium")
    sentiment_result = _predict(redacted.text, SENTIMENT_REPO, id_to_sentiment, default_label="neutral")

    return {
        "body_redacted": redacted.text,
        "category": category_result,
        "priority": priority_result,
        "sentiment": sentiment_result,
    }
