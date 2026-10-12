"""add_users_table_and_scan_owner

Revision ID: 3021ac6030af
Revises: 148f2ef72654
Create Date: 2026-10-12 18:03:53.294624

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3021ac6030af'
down_revision: Union[str, None] = '148f2ef72654'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create users table if not exists
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    
    if 'users' not in tables:
        op.create_table(
            'users',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('full_name', sa.String(length=128), nullable=False),
            sa.Column('email', sa.String(length=256), nullable=False),
            sa.Column('password_hash', sa.String(length=256), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.Column('is_verified', sa.Boolean(), nullable=False),
            sa.Column('reset_token_hash', sa.String(length=256), nullable=True),
            sa.Column('reset_token_expires_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 2. Check if owner_id already exists in scans
    scans_cols = [c['name'] for c in inspector.get_columns('scans')]
    if 'owner_id' not in scans_cols:
        with op.batch_alter_table('scans', schema=None) as batch_op:
            batch_op.add_column(sa.Column('owner_id', sa.String(length=36), nullable=True))
            batch_op.create_index(batch_op.f('ix_scans_owner_id'), ['owner_id'], unique=False)
            batch_op.create_foreign_key('fk_scans_users_owner_id', 'users', ['owner_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    with op.batch_alter_table('scans', schema=None) as batch_op:
        batch_op.drop_constraint('fk_scans_users_owner_id', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_scans_owner_id'))
        batch_op.drop_column('owner_id')

    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
