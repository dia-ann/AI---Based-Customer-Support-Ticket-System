"""empty message

Revision ID: 6ff93dd17941
Revises: 90c4ef8de2e0, bab4706a222e
Create Date: 2026-08-31 10:25:19.819492

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6ff93dd17941'
down_revision: Union[str, None] = ('90c4ef8de2e0', 'bab4706a222e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
