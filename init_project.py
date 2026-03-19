import os

def create_structure():
    # Cấu trúc folder dựa trên file bạn gửi
    structure = [
        "backend/app/api/v1/endpoints",
        "backend/app/core",
        "backend/app/db",
        "backend/app/models",
        "backend/app/repositories",
        "backend/app/schemas",
        "backend/app/services/business",
        "backend/app/services/infrastructure",
        "backend/app/ai_core/prompts",
        "backend/app/ai_core/chains",
        "backend/tests"
    ]

    files = [
        "requirements.txt",
        "backend/.env",
        "backend/app/main.py",
        "backend/app/__init__.py",
        "backend/app/core/config.py",
        "backend/app/db/session.py",
        "backend/app/db/base.py",
    ]

    # Tạo folders
    for folder in structure:
        os.makedirs(folder, exist_ok=True)
        # Tạo file __init__.py trong mỗi folder để Python hiểu là package
        with open(os.path.join(folder, "__init__.py"), 'w') as f:
            pass

    # Tạo files rỗng
    for file in files:
        if not os.path.exists(file):
            with open(file, 'w') as f:
                pass
    
    print("✅ Đã tạo xong cấu trúc dự án chuẩn DDD!")

if __name__ == "__main__":
    create_structure()