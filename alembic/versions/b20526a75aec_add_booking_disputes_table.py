"""add booking disputes table

Revision ID: b20526a75aec
Revises: a691702e2f6b
Create Date: 2026-05-04 09:03:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b20526a75aec'
down_revision: Union[str, Sequence[str], None] = 'a691702e2f6b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Create Enum for DisputeStatus if it doesn't exist
    # Note: postgresql enums can be tricky with alembic autogenerate
    op.create_table(
        'booking_disputes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('booking_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('contact_info', sa.String(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'RESOLVED', 'REJECTED', name='disputestatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_booking_disputes_id'), 'booking_disputes', ['id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_booking_disputes_id'), table_name='booking_disputes')
    op.drop_table('booking_disputes')
    # Optional: drop the enum type if needed, but often enums are shared
