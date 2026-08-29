"""align priority enum

Revision ID: bab4706a222e
Revises: 4b6cb8930ec8
Create Date: 2026-08-29 10:47:14.969775

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bab4706a222e'
down_revision: Union[str, None] = '4b6cb8930ec8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    op.execute("DELETE FROM sla_policies WHERE priority = 'urgent'")
    op.execute("ALTER TYPE ticket_priority RENAME TO ticket_priority_old")
    op.execute("CREATE TYPE ticket_priority AS ENUM ('high', 'medium', 'low')")
    op.execute("ALTER TABLE tickets ALTER COLUMN priority TYPE ticket_priority USING priority::text::ticket_priority")
    op.execute("ALTER TABLE sla_policies ALTER COLUMN priority TYPE ticket_priority USING priority::text::ticket_priority")
    op.execute("DROP TYPE ticket_priority_old")

def downgrade() -> None:
    pass
