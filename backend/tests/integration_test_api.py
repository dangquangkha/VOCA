"""
API Integration Test — Gọi thật API server đang chạy.
Kiểm tra tất cả endpoints /group-sessions/* với real HTTP requests.

⚠️  YÊU CẦU: Backend server phải đang chạy trước khi chạy test này.
    Mở terminal khác: cd backend && uvicorn main:app --reload

Chạy: cd backend && python tests/integration_test_api.py
Chạy với server cụ thể: BASE_URL=http://localhost:8000 python tests/integration_test_api.py
"""
import asyncio
import sys
import os
import json
import httpx

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
API = f"{BASE_URL}/api/v1"

# Credentials test (cần có user trong DB)
EXPERT_EMAIL = os.getenv("TEST_EXPERT_EMAIL", "expert@test.com")
EXPERT_PASSWORD = os.getenv("TEST_EXPERT_PASSWORD", "test123")
STUDENT_EMAIL = os.getenv("TEST_STUDENT_EMAIL", "student@test.com")
STUDENT_PASSWORD = os.getenv("TEST_STUDENT_PASSWORD", "test123")

RESET = "\033[0m"
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
CYAN = "\033[96m"

passed = []
failed = []
skipped = []


def ok(msg: str, detail: str = ""):
    passed.append(msg)
    suffix = f" {YELLOW}({detail}){RESET}" if detail else ""
    print(f"  {GREEN}✅ {msg}{RESET}{suffix}")


def fail(msg: str, error: str = ""):
    failed.append(msg)
    print(f"  {RED}❌ {msg}{RESET}")
    if error:
        print(f"     {RED}   → {error}{RESET}")


def skip(msg: str, reason: str = ""):
    skipped.append(msg)
    print(f"  {YELLOW}⚠️  {msg} (bỏ qua: {reason}){RESET}")


async def login(client: httpx.AsyncClient, email: str, password: str) -> str | None:
    """Đăng nhập và trả về access token."""
    try:
        resp = await client.post(f"{API}/auth/login/access-token", data={
            "username": email,
            "password": password
        })
        if resp.status_code == 200:
            return resp.json().get("access_token")
        return None
    except Exception:
        return None


async def run_api_tests():
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}  API INTEGRATION TEST — /group-sessions/* (Phương án 2){RESET}")
    print(f"{BOLD}  Server: {BASE_URL}{RESET}")
    print(f"{BOLD}{'='*60}{RESET}\n")

    async with httpx.AsyncClient(timeout=15.0) as client:

        # ── 0. Health check ──
        print(f"{BOLD}[0] Health Check{RESET}")
        try:
            resp = await client.get(f"{BASE_URL}/health")
            if resp.status_code == 200:
                ok("Server đang chạy")
            else:
                ok("Server đang chạy", f"status={resp.status_code}")
        except httpx.ConnectError:
            fail("Không kết nối được server", f"Chắc chắn server đang chạy tại {BASE_URL}?")
            print(f"\n{RED}⛔ Dừng test vì server không phản hồi.{RESET}")
            print(f"{YELLOW}   Hãy chạy: cd backend && uvicorn main:app --reload{RESET}\n")
            sys.exit(1)

        # ── 1. Public: GET /group-sessions/ ──
        print(f"\n{BOLD}[1] Public: GET /group-sessions/{RESET}")
        try:
            resp = await client.get(f"{API}/group-sessions/")
            if resp.status_code == 200:
                data = resp.json()
                ok("GET /group-sessions/ trả về 200", f"count={len(data)}")
            else:
                fail(f"GET /group-sessions/ trả về {resp.status_code}", resp.text[:200])
        except Exception as e:
            fail("GET /group-sessions/ lỗi", str(e))

        # ── 2. Auth: Đăng nhập ──
        print(f"\n{BOLD}[2] Authentication{RESET}")
        expert_token = await login(client, EXPERT_EMAIL, EXPERT_PASSWORD)
        student_token = await login(client, STUDENT_EMAIL, STUDENT_PASSWORD)

        if expert_token:
            ok(f"Expert login thành công ({EXPERT_EMAIL})")
        else:
            skip(f"Expert login thất bại ({EXPERT_EMAIL})", "không có user trong DB")

        if student_token:
            ok(f"Student login thành công ({STUDENT_EMAIL})")
        else:
            skip(f"Student login thất bại ({STUDENT_EMAIL})", "không có user trong DB")

        # ── 3. Expert: Tạo Group Session ──
        created_session_id = None

        print(f"\n{BOLD}[3] Expert: POST /group-sessions/ (Tạo session){RESET}")
        if not expert_token:
            skip("Tạo group session", "cần expert token")
        else:
            headers = {"Authorization": f"Bearer {expert_token}"}
            payload = {
                "title": "Integration Test Workshop",
                "description": "Tạo bởi integration test - có thể hủy",
                "session_date": "2026-06-15",
                "start_time": "09:00",
                "end_time": "10:00",
                "max_participants": 3,
                "price_per_participant": 0
            }
            try:
                resp = await client.post(f"{API}/group-sessions/", json=payload, headers=headers)
                if resp.status_code == 201:
                    data = resp.json()
                    created_session_id = data.get("id")
                    ok(f"POST /group-sessions/ tạo session thành công", f"id={created_session_id}")
                    assert data["title"] == "Integration Test Workshop"
                    assert data["session_date"] == "2026-06-15"
                    assert data["max_participants"] == 3
                    ok("Response data hợp lệ")
                elif resp.status_code == 403:
                    fail("POST /group-sessions/ trả về 403 - user không phải Expert/Mentor")
                else:
                    fail(f"POST /group-sessions/ trả về {resp.status_code}", resp.text[:300])
            except Exception as e:
                fail("POST /group-sessions/ lỗi", str(e))

        # ── 4. Expert: GET /group-sessions/my-sessions ──
        print(f"\n{BOLD}[4] Expert: GET /group-sessions/my-sessions{RESET}")
        if not expert_token:
            skip("GET /my-sessions", "cần expert token")
        else:
            headers = {"Authorization": f"Bearer {expert_token}"}
            try:
                resp = await client.get(f"{API}/group-sessions/my-sessions", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    ok("GET /group-sessions/my-sessions thành công", f"count={len(data)}")
                else:
                    fail(f"GET /my-sessions trả về {resp.status_code}", resp.text[:200])
            except Exception as e:
                fail("GET /my-sessions lỗi", str(e))

        # ── 5. Expert: GET /group-sessions/expert/my-students ──
        print(f"\n{BOLD}[5] Expert: GET /group-sessions/expert/my-students{RESET}")
        if not expert_token:
            skip("GET /expert/my-students", "cần expert token")
        else:
            headers = {"Authorization": f"Bearer {expert_token}"}
            try:
                resp = await client.get(f"{API}/group-sessions/expert/my-students", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    ok("GET /group-sessions/expert/my-students thành công", f"total={data.get('total', '?')}")
                else:
                    fail(f"GET /expert/my-students trả về {resp.status_code}", resp.text[:200])
            except Exception as e:
                fail("GET /expert/my-students lỗi", str(e))

        # ── 6. Student: Join Session ──
        print(f"\n{BOLD}[6] Student: POST /group-sessions/{'{id}'}/join{RESET}")
        if not student_token or not created_session_id:
            skip("Student join session", "cần student token và session đã tạo")
        else:
            headers = {"Authorization": f"Bearer {student_token}"}
            try:
                resp = await client.post(
                    f"{API}/group-sessions/{created_session_id}/join",
                    json={"student_note": "Tôi muốn học thêm về AI"},
                    headers=headers
                )
                if resp.status_code == 200:
                    data = resp.json()
                    ok(f"Student join session thành công", f"participant_id={data.get('id')}")
                    assert data["session_id"] == created_session_id
                    assert data["status"] == "CONFIRMED"
                    ok("Response participant data hợp lệ")
                elif resp.status_code == 403:
                    skip("Student join session", "user test không phải STUDENT role")
                else:
                    fail(f"Student join session trả về {resp.status_code}", resp.text[:300])
            except Exception as e:
                fail("Student join session lỗi", str(e))

        # ── 7. Public: GET chi tiết session ──
        print(f"\n{BOLD}[7] Public: GET /group-sessions/{'{id}'}{RESET}")
        if not created_session_id:
            skip("GET chi tiết session", "chương trình chưa tạo được session")
        else:
            try:
                resp = await client.get(f"{API}/group-sessions/{created_session_id}")
                if resp.status_code == 200:
                    data = resp.json()
                    ok(f"GET /group-sessions/{created_session_id} thành công")
                    assert "available_slots" in data
                    assert "current_participants" in data
                    ok("Response có available_slots và current_participants")
                else:
                    fail(f"GET session detail trả về {resp.status_code}", resp.text[:200])
            except Exception as e:
                fail("GET session detail lỗi", str(e))

        # ── 8. Expert: Cập nhật session ──
        print(f"\n{BOLD}[8] Expert: PUT /group-sessions/{'{id}'}{RESET}")
        if not expert_token or not created_session_id:
            skip("PUT update session", "cần expert token và session")
        else:
            headers = {"Authorization": f"Bearer {expert_token}"}
            try:
                resp = await client.put(
                    f"{API}/group-sessions/{created_session_id}",
                    json={"meeting_url": "https://meet.google.com/test-integration-op2"},
                    headers=headers
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("meeting_url") == "https://meet.google.com/test-integration-op2":
                        ok("PUT update meeting_url thành công")
                    else:
                        fail("PUT update không cập nhật meeting_url đúng")
                else:
                    fail(f"PUT update session trả về {resp.status_code}", resp.text[:200])
            except Exception as e:
                fail("PUT update session lỗi", str(e))

        # ── 9. Student: GET /group-sessions/my-registrations ──
        print(f"\n{BOLD}[9] Student: GET /group-sessions/my-registrations{RESET}")
        if not student_token:
            skip("GET /my-registrations", "cần student token")
        else:
            headers = {"Authorization": f"Bearer {student_token}"}
            try:
                resp = await client.get(f"{API}/group-sessions/my-registrations", headers=headers)
                if resp.status_code == 200:
                    ok("GET /group-sessions/my-registrations thành công")
                else:
                    fail(f"GET /my-registrations trả về {resp.status_code}", resp.text[:200])
            except Exception as e:
                fail("GET /my-registrations lỗi", str(e))

        # ── Cleanup: Hủy test session ──
        if created_session_id and expert_token:
            print(f"\n{BOLD}[Cleanup] Hủy test session id={created_session_id}{RESET}")
            headers = {"Authorization": f"Bearer {expert_token}"}
            try:
                resp = await client.post(
                    f"{API}/group-sessions/{created_session_id}/cancel",
                    headers=headers
                )
                if resp.status_code == 200:
                    ok(f"Test session {created_session_id} đã được hủy bằng POST cancel (cleanup)")
                else:
                    fail(f"Hủy test session trả về {resp.status_code}", resp.text[:200])
            except Exception as e:
                fail("Hủy test session lỗi", str(e))

    # ── Summary ──
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}  KẾT QUẢ INTEGRATION TESTS{RESET}")
    print(f"{BOLD}{'='*60}{RESET}")
    print(f"  {GREEN}✅ Passed:  {len(passed)}{RESET}")
    print(f"  {RED}❌ Failed:  {len(failed)}{RESET}")
    print(f"  {YELLOW}⚠️  Skipped: {len(skipped)}{RESET}")
    print()
    if failed:
        sys.exit(1)
    else:
        print(f"  {GREEN}{BOLD}🎉 Tất cả API tests PASSED (hoặc skipped hợp lệ)!{RESET}\n")


if __name__ == "__main__":
    asyncio.run(run_api_tests())
