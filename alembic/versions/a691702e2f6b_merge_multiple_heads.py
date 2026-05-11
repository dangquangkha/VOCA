"""merge multiple heads

Revision ID: a691702e2f6b
Revises: 0b680efb7d80, c9f1e2a3b4d5
Create Date: 2026-05-02 07:35:31.959944

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a691702e2f6b'
down_revision: Union[str, Sequence[str], None] = ('0b680efb7d80', 'c9f1e2a3b4d5')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
