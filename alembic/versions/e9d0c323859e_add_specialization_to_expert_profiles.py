"""add_specialization_to_expert_profiles

Revision ID: e9d0c323859e
Revises: 686e8aa7174f
Create Date: 2026-05-27 00:23:24.689697

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e9d0c323859e'
down_revision: Union[str, Sequence[str], None] = '686e8aa7174f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add specialization column to expert_profiles."""
    op.add_column('expert_profiles',
        sa.Column('specialization', sa.String(), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema - Remove specialization column."""
    op.drop_column('expert_profiles', 'specialization')
