#!/bin/bash
# ============================================================
#  RUN ALL TESTS — Group Session Feature
#  Bao gồm: Unit Tests, DB Smoke, TypeScript Check
# ============================================================
# Chạy: chmod +x run_all_tests.sh && ./run_all_tests.sh
# ============================================================

set -e  # Dừng nếu có lỗi nghiêm trọng

RESET="\033[0m"
GREEN="\033[92m"
RED="\033[91m"
YELLOW="\033[93m"
BOLD="\033[1m"
CYAN="\033[96m"

PASS=0
FAIL=0

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║     GROUP SESSION FEATURE — FULL TEST SUITE          ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# ─── Activate venv ───────────────────────────────────────────
echo -e "${CYAN}━━━ Kích hoạt Python venv ━━━${RESET}"
if [ -f "$BACKEND_DIR/venv/bin/activate" ]; then
    source "$BACKEND_DIR/venv/bin/activate"
    echo -e "${GREEN}✅ venv activated: $(python --version)${RESET}"
else
    echo -e "${RED}❌ Không tìm thấy venv tại $BACKEND_DIR/venv${RESET}"
    echo -e "${YELLOW}   Tạo venv: cd backend && python -m venv venv && pip install -r requirements.txt${RESET}"
    exit 1
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# BƯỚC 1: Unit Tests (pytest)
# ═══════════════════════════════════════════════════════════════
echo -e "${BOLD}${CYAN}[STEP 1/4] Backend Unit Tests (pytest)${RESET}"
echo -e "─────────────────────────────────────────"

cd "$BACKEND_DIR"

if python -m pytest tests/test_group_session.py -v --tb=short --no-header 2>&1; then
    echo -e "\n${GREEN}✅ Unit Tests: PASSED${RESET}"
    PASS=$((PASS + 1))
else
    echo -e "\n${RED}❌ Unit Tests: FAILED${RESET}"
    FAIL=$((FAIL + 1))
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# BƯỚC 2: DB Smoke Test
# ═══════════════════════════════════════════════════════════════
echo -e "${BOLD}${CYAN}[STEP 2/4] Database Smoke Test${RESET}"
echo -e "─────────────────────────────────────────"

cd "$BACKEND_DIR"

if python tests/smoke_test_db.py 2>&1; then
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ DB Smoke Test: FAILED${RESET}"
    FAIL=$((FAIL + 1))
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# BƯỚC 3: Backend Import Check (đảm bảo không có syntax error)
# ═══════════════════════════════════════════════════════════════
echo -e "${BOLD}${CYAN}[STEP 3/4] Backend Import Check${RESET}"
echo -e "─────────────────────────────────────────"

cd "$BACKEND_DIR"

cat > /tmp/check_gs.py << 'PYEOF'
import sys
import os
# Thêm project root
sys.path.insert(0, os.path.dirname(os.path.abspath('.')))
# Thêm backend root (nếu cần)
sys.path.insert(0, '.')

from dotenv import load_dotenv
load_dotenv('.env')

errors = []

modules = {
    "group_session_models": "backend.app.domains.booking.group_session_models",
    "schemas.group_session": "backend.app.schemas.group_session",
    "group_session_service": "backend.app.services.business.group_session_service",
    "endpoints.group_sessions": "backend.app.api.v1.endpoints.group_sessions",
    "api_router": "backend.app.api.v1.api",
}

for name, module in modules.items():
    try:
        __import__(module)
        print(f"  \033[92m✅ {name}\033[0m")
    except Exception as e:
        print(f"  \033[91m❌ {name}: {e}\033[0m")
        errors.append(name)

if errors:
    print(f"\n\033[91m❌ Import check FAILED: {errors}\033[0m")
    sys.exit(1)
else:
    print(f"\n\033[92m✅ Tất cả imports OK!\033[0m")
PYEOF

if python /tmp/check_gs.py 2>&1; then
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ Import Check: FAILED${RESET}"
    FAIL=$((FAIL + 1))
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# BƯỚC 4: Frontend TypeScript Check
# ═══════════════════════════════════════════════════════════════
echo -e "${BOLD}${CYAN}[STEP 4/4] Frontend TypeScript Type Check${RESET}"
echo -e "─────────────────────────────────────────"

cd "$FRONTEND_DIR"

if npx tsc --noEmit --skipLibCheck 2>&1; then
    echo -e "${GREEN}✅ TypeScript: No errors${RESET}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ TypeScript: Type errors found${RESET}"
    FAIL=$((FAIL + 1))
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║                    KẾT QUẢ                          ║${RESET}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}║${RESET}  ${GREEN}✅ Passed: $PASS/4${RESET}"
echo -e "${BOLD}║${RESET}  ${RED}❌ Failed: $FAIL/4${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${RESET}"

if [ "$FAIL" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}${BOLD}🎉 TẤT CẢ TEST PASSED! Feature Group Session hoạt động tốt.${RESET}"
    echo ""
    echo -e "${YELLOW}💡 Để test API thực tế (cần server đang chạy):${RESET}"
    echo -e "   cd backend && python tests/integration_test_api.py"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}${BOLD}⛔ CÓ $FAIL TEST THẤT BẠI. Kiểm tra output ở trên.${RESET}"
    echo ""
    exit 1
fi
