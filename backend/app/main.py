# --- Sentry must be initialised first, before anything handles a request ---
from backend.app.core.observability import init_sentry
init_sentry()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers import (
    auth, departments, categories, users,
    routing_rules, sla_policies, tickets, sla_state, replies,
)

app = FastAPI(title="Ticketing System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["WWW-Authenticate"],
)

app.include_router(auth.router)
app.include_router(departments.router)
app.include_router(categories.router)
app.include_router(users.router)
app.include_router(routing_rules.router)
app.include_router(sla_policies.router)
app.include_router(tickets.router)
app.include_router(sla_state.router)
app.include_router(replies.router)

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}

@app.get("/debug-sentry")
async def debug_sentry():
    10/5  # deliberate ZeroDivisionError to prove Sentry works