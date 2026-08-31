from __future__ import annotations

import os
from pathlib import Path
from time import perf_counter

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from .ai.classify_ticket import classify_ticket, get_predictor

MODEL_DIR = Path(os.getenv("MODEL_DIR", "backend/app/ai/model_artifacts"))
MAX_REQUEST_BYTES = int(os.getenv("MAX_REQUEST_BYTES", "200000"))
app = FastAPI(title="AI Support Ticket System", version="2.0.0")


class TicketInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    subject: str = Field(..., min_length=1, max_length=500)
    body: str = Field(..., min_length=1, max_length=50_000)

    @field_validator("subject", "body")
    @classmethod
    def non_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_BYTES:
        return JSONResponse(status_code=413, content={"detail": "request body too large"})
    started = perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time-Ms"] = f"{(perf_counter() - started) * 1000:.2f}"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-support-ticket", "version": app.version}


@app.get("/ready")
def ready():
    try:
        predictor = get_predictor()
        return {"status": "ready", "device": str(predictor.device), "model_dir": str(MODEL_DIR)}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="model is not ready") from exc


@app.post("/api/tickets/classify")
def classify(ticket: TicketInput):
    try:
        result = classify_ticket(ticket.subject, ticket.body)
        result["model_version"] = os.getenv("MODEL_VERSION", "unversioned")
        return result
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="classification failed") from exc
