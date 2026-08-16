# AI-Based Customer Support Ticket System — Folder Structure

```
ai-support-ticket-system/
├── frontend/                           # React + Tailwind
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/                # Button, Modal, Toast, etc
│   │   │   ├── customer/              # TicketForm, TicketStatus
│   │   │   ├── agent/                 # TicketQueue, ReplyBox, SLAWatcher
│   │   │   └── admin/                 # UserMgmt, CategoryMgmt, SLAConfig
│   │   ├── pages/
│   │   │   ├── customer/              # NewTicket.jsx, MyTickets.jsx
│   │   │   ├── agent/                 # Dashboard.jsx, TicketDetail.jsx
│   │   │   └── admin/                 # Analytics.jsx, Settings.jsx
│   │   ├── hooks/                     # useAuth, useTickets, useSLA
│   │   ├── context/                   # AuthContext, RoleContext
│   │   ├── services/                  # api.js (axios/fetch wrapper → FastAPI)
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env
│
├── backend/                            # FastAPI — biz logic + AI, ONE service
│   ├── app/
│   │   ├── main.py                     # FastAPI entrypoint
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── tickets.py          # POST /tickets, GET /tickets/:id
│   │   │   │   ├── auth.py             # login/register, JWT
│   │   │   │   ├── agents.py           # dashboard queue endpoints
│   │   │   │   └── admin.py            # users/categories/SLA config
│   │   │   └── deps.py                 # auth deps, role guards
│   │   ├── core/
│   │   │   ├── config.py               # env/settings
│   │   │   ├── security.py             # JWT, bcrypt/argon2
│   │   │   └── logging.py              # Sentry init
│   │   ├── ai/                         # internal fn calls, NOT separate service
│   │   │   ├── redact_pii.py           # Presidio / regex fallback
│   │   │   ├── classify_ticket.py      # DistilBERT inference
│   │   │   ├── suggest_reply.py        # sentence-transformers similarity
│   │   │   └── model_artifacts/        # fine-tuned DistilBERT weights
│   │   ├── services/                   # deterministic biz logic, no AI
│   │   │   ├── routing_engine.py       # category → dept SQL lookup
│   │   │   ├── sla_engine.py           # deadline calc, escalation
│   │   │   └── ticket_lifecycle.py     # state machine transitions
│   │   ├── db/
│   │   │   ├── supabase_client.py
│   │   │   ├── models.py               # pydantic schemas
│   │   │   └── migrations/             # SQL migration files
│   │   └── jobs/
│   │       └── sla_cron.py             # pg_cron trigger / GH Actions fallback logic
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── ai_eval/                    # classification accuracy, Macro-F1 etc
│   ├── requirements.txt
│   └── .env
│
├── supabase/
│   ├── migrations/                     # versioned SQL
│   ├── seed.sql
│   └── functions/                      # pg_cron job defs
│
├── docs/
│   ├── architecture.md
│   ├── er-diagram.png
│   └── api-spec.md
│
├── .gitignore
├── .githooks
└── README.md
```