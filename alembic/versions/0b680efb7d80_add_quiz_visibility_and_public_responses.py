"""add_quiz_visibility_and_public_responses

Revision ID: 0b680efb7d80
Revises: adfefd4e28df
Create Date: 2026-04-28 19:17:08.400810

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0b680efb7d80'
down_revision: Union[str, Sequence[str], None] = 'adfefd4e28df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Add new columns to expert_quizzes
    op.add_column('expert_quizzes', sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('expert_quizzes', sa.Column('is_required_for_booking', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('expert_quizzes', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('expert_quizzes', sa.Column('total_attempts', sa.Integer(), nullable=False, server_default='0'))

    # 2. Create public_quiz_responses table
    op.create_table('public_quiz_responses',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('quiz_id', sa.Integer(), nullable=False),
    sa.Column('responses', sa.JSON(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['quiz_id'], ['expert_quizzes.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_public_quiz_responses_id'), 'public_quiz_responses', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_public_quiz_responses_id'), table_name='public_quiz_responses')
    op.drop_table('public_quiz_responses')
    
    op.drop_column('expert_quizzes', 'total_attempts')
    op.drop_column('expert_quizzes', 'is_active')
    op.drop_column('expert_quizzes', 'is_required_for_booking')
    op.drop_column('expert_quizzes', 'is_public')
