"""drop_categories_table

Revision ID: 06787f1427cf
Revises: 0217e2a5ae75
Create Date: 2026-09-24 09:00:25.789712

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '06787f1427cf'
down_revision: Union[str, None] = '0217e2a5ae75'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Drop foreign key constraint on tickets first
    op.drop_constraint('tickets_category_id_fkey', 'tickets', type_='foreignkey')
    # 2. Drop the category_id column from tickets
    op.drop_column('tickets', 'category_id')
    # 3. Drop categories table now that nothing references it
    op.drop_table('categories')


def downgrade() -> None:
    # 1. Re-create categories table first
    op.create_table(
        'categories',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), autoincrement=False, nullable=False),
        sa.Column('name', sa.VARCHAR(), autoincrement=False, nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('categories_pkey')),
        sa.UniqueConstraint('name', name=op.f('categories_name_key'))
    )
    # 2. Re-add category_id column to tickets
    op.add_column('tickets', sa.Column('category_id', sa.UUID(), autoincrement=False, nullable=True))
    # 3. Re-create foreign key constraint pointing to categories
    op.create_foreign_key(
        'tickets_category_id_fkey',
        'tickets',
        'categories',
        ['category_id'],
        ['id'],
        ondelete='SET NULL'
    )