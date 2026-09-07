"""add_on_delete_rules_to_foreign_keys

Revision ID: fc840719162e
Revises: 19cdd521801c
Create Date: 2026-09-04 11:58:54.339512

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fc840719162e'
down_revision: Union[str, None] = '19cdd521801c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # replies
    op.drop_constraint('replies_ticket_id_fkey', 'replies', type_='foreignkey')
    op.create_foreign_key(None, 'replies', 'tickets', ['ticket_id'], ['id'], ondelete='CASCADE')
    op.drop_constraint('replies_author_id_fkey', 'replies', type_='foreignkey')
    op.create_foreign_key(None, 'replies', 'users', ['author_id'], ['id'], ondelete='SET NULL')
    # sla_state
    op.drop_constraint('sla_state_ticket_id_fkey', 'sla_state', type_='foreignkey')
    op.create_foreign_key(None, 'sla_state', 'tickets', ['ticket_id'], ['id'], ondelete='CASCADE')
    op.drop_constraint('sla_state_sla_policy_id_fkey', 'sla_state', type_='foreignkey')
    op.create_foreign_key(None, 'sla_state', 'sla_policies', ['sla_policy_id'], ['id'], ondelete='CASCADE')
    # tickets
    op.drop_constraint('tickets_customer_id_fkey', 'tickets', type_='foreignkey')
    op.create_foreign_key(None, 'tickets', 'users', ['customer_id'], ['id'], ondelete='CASCADE')
    op.drop_constraint('tickets_category_id_fkey', 'tickets', type_='foreignkey')
    op.create_foreign_key(None, 'tickets', 'categories', ['category_id'], ['id'], ondelete='SET NULL')
    op.drop_constraint('tickets_assigned_agent_id_fkey', 'tickets', type_='foreignkey')
    op.create_foreign_key(None, 'tickets', 'users', ['assigned_agent_id'], ['id'], ondelete='SET NULL')
    # routing_rules
    op.drop_constraint('routing_rules_category_id_fkey', 'routing_rules', type_='foreignkey')
    op.create_foreign_key(None, 'routing_rules', 'categories', ['category_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    # replies
    op.drop_constraint('replies_ticket_id_fkey', 'replies', type_='foreignkey')
    op.create_foreign_key(None, 'replies', 'tickets', ['ticket_id'], ['id'])
    op.drop_constraint('replies_author_id_fkey', 'replies', type_='foreignkey')
    op.create_foreign_key(None, 'replies', 'users', ['author_id'], ['id'])
    # sla_state
    op.drop_constraint('sla_state_ticket_id_fkey', 'sla_state', type_='foreignkey')
    op.create_foreign_key(None, 'sla_state', 'tickets', ['ticket_id'], ['id'])
    op.drop_constraint('sla_state_sla_policy_id_fkey', 'sla_state', type_='foreignkey')
    op.create_foreign_key(None, 'sla_state', 'sla_policies', ['sla_policy_id'], ['id'])
    # tickets
    op.drop_constraint('tickets_customer_id_fkey', 'tickets', type_='foreignkey')
    op.create_foreign_key(None, 'tickets', 'users', ['customer_id'], ['id'])
    op.drop_constraint('tickets_category_id_fkey', 'tickets', type_='foreignkey')
    op.create_foreign_key(None, 'tickets', 'categories', ['category_id'], ['id'])
    op.drop_constraint('tickets_assigned_agent_id_fkey', 'tickets', type_='foreignkey')
    op.create_foreign_key(None, 'tickets', 'users', ['assigned_agent_id'], ['id'])
    # routing_rules
    op.drop_constraint('routing_rules_category_id_fkey', 'routing_rules', type_='foreignkey')
    op.create_foreign_key(None, 'routing_rules', 'categories', ['category_id'], ['id'])
