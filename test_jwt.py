import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from backend.app.core.config import settings
print(f"DEBUG: SECRET_KEY='{settings.SECRET_KEY}'")
print(f"DEBUG: ALGORITHM='{settings.ALGORITHM}'")

from jose import jwt
to_encode = {"sub": "test@test.com"}
token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
print(f"DEBUG: Encoded token: {token}")

decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
print(f"DEBUG: Decoded payload: {decoded}")
