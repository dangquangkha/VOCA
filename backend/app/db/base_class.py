from typing import Any
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, declared_attr

class Base(DeclarativeBase):
    id: Any
    __name__: str

    # Tự động lấy tên class làm tên bảng (Ví dụ class User -> bảng user)
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower()