# test_create_ticket.py
import asyncio
from backend.app.database import AsyncSessionLocal
from backend.app.ai.classify_ticket import classify_ticket
from backend.app.models.category import Category
from backend.app.models.routing_rule import RoutingRule
from backend.app.models.ticket import Ticket
from sqlalchemy import select
import uuid

async def main():
    async with AsyncSessionLocal() as db:
        subject = "Server down"
        body = "Our production server has been down for an hour, urgent!"
        ai_result = classify_ticket(subject, body)

        category_row = (await db.execute(
            select(Category).where(Category.name == ai_result["category"]["label"])
        )).scalar_one_or_none()
        routing = (await db.execute(
            select(RoutingRule).where(RoutingRule.category_id == category_row.id)
        )).scalar_one_or_none() if category_row else None

        print("Category:", category_row.name if category_row else None)
        print("Department ID:", routing.department_id if routing else None)
        print("Priority:", ai_result["priority"]["label"])

asyncio.run(main())