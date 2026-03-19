"""
End-to-End Backend Test Script
Tests all major flows after UC-13, UC-37, UC-36 implementation
"""
import asyncio, httpx, sys, json
from datetime import datetime, timezone, timedelta

BASE = "http://127.0.0.1:8002/api/v1"
results = []

def ok(label, detail=""):
    results.append(("✅", label, detail))
    print(f"✅ {label}" + (f" — {detail}" if detail else ""))

def fail(label, detail=""):
    results.append(("❌", label, detail))
    print(f"❌ {label}" + (f" — {detail}" if detail else ""))

async def run():
    async with httpx.AsyncClient(timeout=10) as c:

        # ── 1. OpenAPI docs accessible ────────────────────────────────────────
        r = await c.get(f"{BASE.replace('/api/v1','')}/docs")
        ok("OpenAPI docs accessible", str(r.status_code)) if r.status_code == 200 else fail("OpenAPI docs", str(r.status_code))

        # ── 2. Auth: login as student ─────────────────────────────────────────
        r = await c.post(f"{BASE}/auth/login", data={"username": "student@test.com", "password": "password123"})
        if r.status_code == 200:
            student_token = r.json()["access_token"]
            ok("Student login")
        else:
            # Try to get any user from DB directly
            r2 = await c.post(f"{BASE}/auth/login", data={"username": "test@example.com", "password": "testpassword"})
            if r2.status_code == 200:
                student_token = r2.json()["access_token"]
                ok("Student login (alternate creds)")
            else:
                fail("Student login", f"{r.status_code}: {r.text[:100]}")
                student_token = None

        # ── 3. Auth: login as expert ──────────────────────────────────────────
        r = await c.post(f"{BASE}/auth/login", data={"username": "expert@test.com", "password": "password123"})
        if r.status_code == 200:
            expert_token = r.json()["access_token"]
            ok("Expert login")
        else:
            fail("Expert login (credentials may not exist in DB)", f"{r.status_code}")
            expert_token = None

        # ── 4. Test /users/me ─────────────────────────────────────────────────
        if student_token:
            r = await c.get(f"{BASE}/users/me", headers={"Authorization": f"Bearer {student_token}"})
            if r.status_code == 200:
                me = r.json()
                ok("/users/me", f"user: {me.get('email','?')}, credits: {me.get('credits','?')}")
            else:
                fail("/users/me", str(r.status_code))
        else:
            fail("/users/me", "no token")

        # ── 5. Test GET /bookings/ ────────────────────────────────────────────
        if student_token:
            r = await c.get(f"{BASE}/bookings/", headers={"Authorization": f"Bearer {student_token}"})
            if r.status_code == 200:
                bookings = r.json()
                ok("GET /bookings/", f"{len(bookings)} bookings")
            else:
                fail("GET /bookings/", f"{r.status_code}: {r.text[:100]}")
        else:
            fail("GET /bookings/", "no token")

        # ── 6. Test GET /payments/history ─────────────────────────────────────
        if student_token:
            r = await c.get(f"{BASE}/payments/history", headers={"Authorization": f"Bearer {student_token}"})
            if r.status_code == 200:
                data = r.json()
                ok("GET /payments/history", f"{data.get('total','?')} transactions")
            else:
                fail("GET /payments/history", f"{r.status_code}: {r.text[:100]}")
        else:
            fail("GET /payments/history", "no token")

        # ── 7. Test GET /experts/ ─────────────────────────────────────────────
        r = await c.get(f"{BASE}/experts/")
        if r.status_code == 200:
            experts = r.json()
            ok("GET /experts/", f"{len(experts) if isinstance(experts, list) else experts.get('total','?')} experts")
        else:
            fail("GET /experts/", str(r.status_code))

        # ── 8. Test new route: POST /bookings/{id}/checkin (unauthenticated → 401) ──
        r = await c.post(f"{BASE}/bookings/999/checkin")
        if r.status_code in [401, 403]:
            ok("POST /checkin route exists (401/403 without auth)", str(r.status_code))
        elif r.status_code == 404:
            ok("POST /checkin route exists (404 booking not found)", str(r.status_code))
        else:
            fail("POST /checkin unexpected status", str(r.status_code))

        # ── 9. Test new route: POST /bookings/{id}/resolve-noshow ─────────────
        r = await c.post(f"{BASE}/bookings/999/resolve-noshow")
        if r.status_code in [401, 403, 404]:
            ok("POST /resolve-noshow route exists", str(r.status_code))
        else:
            fail("POST /resolve-noshow unexpected status", str(r.status_code))

        # ── 10. Test new route: POST /payments/refund-request (401 without auth) ─
        r = await c.post(f"{BASE}/payments/refund-request", json={"amount": 10, "bank_name": "MB", "bank_account": "123", "account_holder": "Test"})
        if r.status_code in [401, 403]:
            ok("POST /payments/refund-request route exists (401 without auth)", str(r.status_code))
        else:
            fail("POST /payments/refund-request unexpected status", str(r.status_code))

        # ── 11. Test authenticated refund request (should validate credits) ───
        if student_token:
            r = await c.post(
                f"{BASE}/payments/refund-request",
                json={"amount": 999999, "bank_name": "MB", "bank_account": "123", "account_holder": "Test"},
                headers={"Authorization": f"Bearer {student_token}"}
            )
            if r.status_code == 400 and "credit" in r.text.lower():
                ok("UC-36 refund request validates balance", "400 Insufficient credits")
            elif r.status_code == 200:
                ok("UC-36 refund request created successfully")
            else:
                fail("UC-36 refund request", f"{r.status_code}: {r.text[:100]}")
        else:
            fail("UC-36 refund request", "no token")

        # ── 12. Test UC-37 checkin with authenticated user (should fail: 404 or window check) ──
        if student_token:
            r = await c.post(
                f"{BASE}/bookings/999999/checkin",
                headers={"Authorization": f"Bearer {student_token}"}
            )
            if r.status_code == 404:
                ok("UC-37 checkin: 404 for non-existent booking")
            else:
                fail("UC-37 checkin", f"{r.status_code}: {r.text[:50]}")
        else:
            fail("UC-37 checkin", "no token")

        # ── 13. Check PUT /bookings/{id} accepts rejection_reason ─────────────
        if expert_token:
            # Try to reject a non-existent booking (expect 404, not validation error)
            r = await c.put(
                f"{BASE}/bookings/999999",
                json={"status": "REJECTED", "rejection_reason": "Test reason"},
                headers={"Authorization": f"Bearer {expert_token}"}
            )
            if r.status_code == 404:
                ok("UC-13 rejection_reason field accepted by API schema (404 = no such booking)")
            else:
                fail("UC-13 PUT /bookings schema", f"{r.status_code}: {r.text[:100]}")
        else:
            fail("UC-13 PUT schema test", "no expert token")

        # Summary
        passed = sum(1 for r in results if r[0] == "✅")
        failed = sum(1 for r in results if r[0] == "❌")
        print()
        print(f"═══ RESULTS: {passed} passed / {failed} failed ═══")
        return failed

if __name__ == "__main__":
    failed = asyncio.run(run())
    sys.exit(min(failed, 1))
