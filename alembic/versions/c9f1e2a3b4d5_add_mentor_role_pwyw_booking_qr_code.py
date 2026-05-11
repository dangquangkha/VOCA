"""add mentor role pwyw booking qr code

Revision ID: c9f1e2a3b4d5
Revises: a64e3e821b3f
Create Date: 2026-05-02 00:21:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c9f1e2a3b4d5'
down_revision = 'a64e3e821b3f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add MENTOR to UserRole enum
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'MENTOR'")

    # 2. Add is_pwyw and pwyw_amount to bookings table
    op.add_column('bookings', sa.Column('is_pwyw', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('bookings', sa.Column('pwyw_amount', sa.Integer(), nullable=False, server_default='0'))

    # 3. Add qr_code_url to expert_profiles table
    op.add_column('expert_profiles', sa.Column('qr_code_url', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove added columns (cannot remove enum value in PostgreSQL easily)
    op.drop_column('expert_profiles', 'qr_code_url')
    op.drop_column('bookings', 'pwyw_amount')
    op.drop_column('bookings', 'is_pwyw')
