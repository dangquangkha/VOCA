import sys
import os
# Add project root to path
sys.path.append("/home/hat_n/projects/CareerPath_AI_Project")

try:
    from backend.app.core.security import get_password_hash, verify_password
    print("Hashing 'password123'...")
    hashed = get_password_hash("password123")
    print(f"Hash: {hashed}")
    
    print("Verifying...")
    valid = verify_password("password123", hashed)
    print(f"Valid: {valid}")
    
    # Test long password
    long_pwd = "a" * 73
    print(f"Hashing long password ({len(long_pwd)} chars)...")
    get_password_hash(long_pwd)
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
