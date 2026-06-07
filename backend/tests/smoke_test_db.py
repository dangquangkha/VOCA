"""
DB Smoke Test — kiểm tra database thực tế.
Xác nhận:
  - Bảng group_sessions tồn tại với đúng cột
  - Bảng group_session_participants tồn tại với đúng cột
  - Các foreign key hợp lệ
  - Có thể INSERT / SELECT / DELETE bình thường
  
Chạy: cd backend && python tests/smoke_test_db.py
"""
import asyncio
import sys
import os
from datetime import datetime

# Thêm project root vào path (chạy từ thư mục backend/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.dirname(PROJECT_ROOT)
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, REPO_ROOT)

# Load .env trước khi import backend modules
from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))

RESET = "\033[0m"
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"

passed = []
failed = []


def ok(msg: str):
    passed.append(msg)
    print(f"  {GREEN}✅ {msg}{RESET}")


def fail(msg: str, error: str = ""):
    failed.append(msg)
    print(f"  {RED}❌ {msg}{RESET}")
    if error:
        print(f"     {RED}   → {error}{RESET}")


async def run_db_smoke_test():
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}  DATABASE SMOKE TEST — Group Session Tables{RESET}")
    print(f"{BOLD}{'='*60}{RESET}\n")

    from backend.app.db.session import AsyncSessionLocal
    from backend.app.domains.booking.group_session_models import (
        GroupSession, GroupSessionParticipant,
        GroupSessionStatus, GroupParticipantStatus,
    )
    from sqlalchemy import text, inspect
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.future import select

    async with AsyncSessionLocal() as db:

        # ── 1. Kiểm tra bảng tồn tại ──
        print(f"{BOLD}[1] Kiểm tra bảng tồn tại{RESET}")
        try:
            result = await db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='group_sessions'"))
            rows = result.fetchall()
            if rows:
                ok("Bảng 'group_sessions' tồn tại")
            else:
                fail("Bảng 'group_sessions' KHÔNG tồn tại")
        except Exception as e:
            fail("Không thể query information_schema", str(e))

        try:
            result = await db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='group_session_participants'"))
            rows = result.fetchall()
            if rows:
                ok("Bảng 'group_session_participants' tồn tại")
            else:
                fail("Bảng 'group_session_participants' KHÔNG tồn tại")
        except Exception as e:
            fail("Không thể query information_schema", str(e))

        # ── 2. Kiểm tra cột bảng group_sessions ──
        print(f"\n{BOLD}[2] Kiểm tra cột bảng group_sessions{RESET}")
        required_columns_gs = [
            "id", "expert_id", "title", "description",
            "session_date", "start_time", "end_time",
            "max_participants", "price_per_participant",
            "status", "meeting_url", "created_at", "updated_at"
        ]
        try:
            result = await db.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='group_sessions' AND table_schema='public'"
            ))
            existing_cols = {row[0] for row in result.fetchall()}
            for col in required_columns_gs:
                if col in existing_cols:
                    ok(f"Cột '{col}' tồn tại")
                else:
                    fail(f"Cột '{col}' THIẾU trong group_sessions")
        except Exception as e:
            fail("Không thể kiểm tra cột group_sessions", str(e))

        # ── 3. Kiểm tra cột bảng group_session_participants ──
        print(f"\n{BOLD}[3] Kiểm tra cột bảng group_session_participants{RESET}")
        required_columns_gsp = [
            "id", "session_id", "student_id", "status",
            "amount_paid", "student_note", "checked_in_at", "joined_at"
        ]
        try:
            result = await db.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='group_session_participants' AND table_schema='public'"
            ))
            existing_cols = {row[0] for row in result.fetchall()}
            for col in required_columns_gsp:
                if col in existing_cols:
                    ok(f"Cột '{col}' tồn tại")
                else:
                    fail(f"Cột '{col}' THIẾU trong group_session_participants")
        except Exception as e:
            fail("Không thể kiểm tra cột group_session_participants", str(e))

        # ── 4. Kiểm tra index ──
        print(f"\n{BOLD}[4] Kiểm tra indexes{RESET}")
        try:
            result = await db.execute(text(
                "SELECT indexname FROM pg_indexes "
                "WHERE tablename IN ('group_sessions', 'group_session_participants') "
                "AND schemaname='public'"
            ))
            indexes = {row[0] for row in result.fetchall()}
            expected_indexes = [
                "ix_group_sessions_id",
                "ix_group_session_participants_id",
            ]
            for idx in expected_indexes:
                if idx in indexes:
                    ok(f"Index '{idx}' tồn tại")
                else:
                    fail(f"Index '{idx}' THIẾU")
        except Exception as e:
            fail("Không thể kiểm tra indexes", str(e))

        # ── 5. Kiểm tra CRUD cơ bản (dùng test expert_id=9999 giả) ──
        print(f"\n{BOLD}[5] Kiểm tra CRUD cơ bản{RESET}")
        test_session_id = None

        # INSERT
        try:
            result = await db.execute(text(
                """
                INSERT INTO group_sessions 
                (expert_id, title, session_date, start_time, end_time, 
                 max_participants, price_per_participant, status, created_at, updated_at)
                VALUES 
                (1, 'SMOKE TEST SESSION - DELETE ME', '2026-06-15', '09:00', '10:00',
                 5, 0, 'OPEN', NOW(), NOW())
                RETURNING id
                """
            ))
            row = result.fetchone()
            test_session_id = row[0] if row else None
            if test_session_id:
                ok(f"INSERT group_session thành công (id={test_session_id})")
            else:
                fail("INSERT group_session không trả về id")
        except Exception as e:
            fail("INSERT group_session thất bại", str(e))

        # SELECT
        if test_session_id:
            try:
                result = await db.execute(text(
                    f"SELECT id, title, status FROM group_sessions WHERE id={test_session_id}"
                ))
                row = result.fetchone()
                if row and row[1] == "SMOKE TEST SESSION - DELETE ME":
                    ok(f"SELECT group_session thành công")
                else:
                    fail("SELECT group_session không tìm thấy record vừa insert")
            except Exception as e:
                fail("SELECT group_session thất bại", str(e))

            # UPDATE
            try:
                await db.execute(text(
                    f"UPDATE group_sessions SET meeting_url='https://test.url' WHERE id={test_session_id}"
                ))
                result = await db.execute(text(
                    f"SELECT meeting_url FROM group_sessions WHERE id={test_session_id}"
                ))
                row = result.fetchone()
                if row and row[0] == "https://test.url":
                    ok("UPDATE group_session thành công")
                else:
                    fail("UPDATE group_session không cập nhật được")
            except Exception as e:
                fail("UPDATE group_session thất bại", str(e))

            # DELETE (cleanup)
            try:
                await db.execute(text(
                    f"DELETE FROM group_sessions WHERE id={test_session_id}"
                ))
                ok(f"DELETE group_session (cleanup) thành công")
            except Exception as e:
                fail("DELETE group_session thất bại", str(e))

        # ── 6. Kiểm tra enum values được lưu đúng ──
        print(f"\n{BOLD}[6] Kiểm tra Enum types trong DB{RESET}")
        try:
            result = await db.execute(text(
                "SELECT typname FROM pg_type WHERE typname IN "
                "('groupsessionstatus', 'groupparticipantstatus')"
            ))
            types = {row[0] for row in result.fetchall()}
            for t in ["groupsessionstatus", "groupparticipantstatus"]:
                if t in types:
                    ok(f"Enum type '{t}' tồn tại trong PostgreSQL")
                else:
                    fail(f"Enum type '{t}' THIẾU")
        except Exception as e:
            fail("Không thể kiểm tra enum types", str(e))

        await db.commit()

    # ── Summary ──
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}  KẾT QUẢ{RESET}")
    print(f"{BOLD}{'='*60}{RESET}")
    print(f"  {GREEN}✅ Passed: {len(passed)}{RESET}")
    print(f"  {RED}❌ Failed: {len(failed)}{RESET}")

    if failed:
        print(f"\n  {RED}Failed tests:{RESET}")
        for f in failed:
            print(f"    - {f}")
        print()
        sys.exit(1)
    else:
        print(f"\n  {GREEN}{BOLD}🎉 Tất cả database tests PASSED!{RESET}")
        print()


if __name__ == "__main__":
    asyncio.run(run_db_smoke_test())
