"""add admin note to disputes

Revision ID: c1d2e3f4g5h6
Revises: b20526a75aec
Create Date: 2026-05-04 09:07:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4g5h6'
down_revision: Union[str, Sequence[str], None] = 'b20526a75aec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('booking_disputes', sa.Column('admin_note', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('booking_disputes', 'admin_note')
