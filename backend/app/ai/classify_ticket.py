import json
import logging
import os
from pathlib import Path

from huggingface_hub import InferenceClient
from huggingface_hub.utils import HfHubHTTPError

from backend.app.ai.redact_pii import redact_pii

logger = logging.getLogger(__name__)

CONFIDENCE_THRESHOLD = 0.5
HF_TIMEOUT = 10

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

_client: InferenceClient | None = None


def _get_client() -> InferenceClient:
    global _client
    if _client is None:
        token = os.getenv("HF_TOKEN")
        if not token:
            logger.warning("HF_TOKEN not set; calls may hit rate limits or fail on private repos")
        _client = InferenceClient(provider="hf-inference", token=token, timeout=HF_TIMEOUT)
    return _client


def _predict(text: str, repo_id: str, label_map: dict[str, str], default_label: str) -> dict:
    """Call HF Inference API text-classification endpoint with label mapping and safe fallbacks."""
    try:
        client = _get_client()
        results = client.text_classification(text, model=repo_id)
        if results:
            top = results[0]
            raw_label = getattr(top, "label", "") or (top.get("label", "") if isinstance(top, dict) else "")
            score = getattr(top, "score", 0.0) or (top.get("score", 0.0) if isinstance(top, dict) else 0.0)
            
            # Map LABEL_X or index to actual string entity
            label = label_map.get(raw_label, raw_label).strip()
            confidence = round(float(score), 3)
            return {
                "label": label if label else default_label,
                "confidence": confidence,
                "needs_human_review": confidence < CONFIDENCE_THRESHOLD,
            }
    except HfHubHTTPError as exc:
        logger.warning("HF API error for %s: %s", repo_id, exc)
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
