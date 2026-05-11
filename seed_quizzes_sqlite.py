import sqlite3
import json
import os

db_path = "backend/careerpath.db"

if not os.path.exists(db_path):
    print("Database not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables:", tables)

if ('expert_quizzes',) in tables:
    print("Found expert_quizzes. Duplicating...")
    cursor.execute("SELECT expert_id, title, description, questions, is_public, is_required_for_booking, is_active, total_attempts FROM expert_quizzes LIMIT 1")
    row = cursor.fetchone()
    if row:
        expert_id, title, description, questions, is_public, is_required_for_booking, is_active, total_attempts = row
        # Ensure questions is a string or bytes
        if not isinstance(questions, (str, bytes)):
            # It's likely returned as a string by sqlite, but just in case
            pass
            
        for i in range(4, 8):
            new_title = f"{title} (Bản mở rộng {i})"
            cursor.execute("""
                INSERT INTO expert_quizzes (expert_id, title, description, questions, is_public, is_required_for_booking, is_active, total_attempts)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (expert_id, new_title, description, questions, is_public, is_required_for_booking, is_active, total_attempts))
        conn.commit()
        print("Successfully seeded 4 more quizzes!")
    else:
        print("Table expert_quizzes is empty.")
else:
    print("Table expert_quizzes not found.")

conn.close()
