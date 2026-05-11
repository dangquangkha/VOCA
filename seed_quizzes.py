import sqlite3
import json
from datetime import datetime

db_path = "backend/careerpath.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get the first quiz to use as a template
cursor.execute("SELECT expert_id, title, description, questions, is_public, is_required_for_booking, is_active, total_attempts FROM expert_quizzes LIMIT 1")
row = cursor.fetchone()

if row:
    expert_id, title, description, questions, is_public, is_required_for_booking, is_active, total_attempts = row
    
    # Insert 4 more quizzes
    for i in range(4, 8):
        new_title = f"Bài khảo sát chuyên sâu {i}"
        new_desc = f"Khám phá tiềm năng và định hướng chuyên môn (Bản {i})"
        
        cursor.execute("""
            INSERT INTO expert_quizzes (
                expert_id, title, description, questions, is_public, is_required_for_booking, is_active, total_attempts, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (expert_id, new_title, new_desc, questions, is_public, is_required_for_booking, is_active, total_attempts, datetime.utcnow().isoformat()))
        
    conn.commit()
    print("Successfully inserted 4 new quizzes.")
else:
    print("No existing quizzes found to duplicate.")

conn.close()
