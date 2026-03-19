"""
seed_experts.py — Comprehensive seed data for CareerPath AI

Creates:
  - 15 diverse expert accounts (APPROVED, varied ratings/rates/experience)
  - Availability slots for every expert (multiple days + time ranges)
  - 1 student account with 50,000 credits for testing

Run from project root (with venv activated):
  python backend/seed_experts.py

All passwords: 123456
Student email:  test_student@careerpath.com
"""

import asyncio
import sys
import os

sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

from backend.app.db.base import Base
from backend.app.models.user import User, UserRole, UserStatus
from backend.app.models.expert import ExpertProfile, KYCStatus, ExpertAvailability
from backend.app.core.security import get_password_hash
from backend.app.core.config import settings

# ---------------------------------------------------------------------------
# Expert data (15 entries, sorted by descending rating for easy verification)
# ---------------------------------------------------------------------------

EXPERT_DATA = [
    # ── Tier S (5.0 – 4.9) ───────────────────────────────────────────────
    {
        "email": "sarah.ml@careerpath.com",
        "full_name": "Sarah Nguyễn",
        "phone": "0901234501",
        "avatar_url": "https://ui-avatars.com/api/?name=Sarah+Nguyen&background=1d4ed8&color=fff&size=128",
        "expert": {
            "bio": (
                "Senior AI Research Scientist tại Google DeepMind với 12 năm kinh nghiệm trong Machine Learning và Deep Learning. "
                "Đã publish 30+ bài báo tại NeurIPS, ICML, ICLR. Từng là keynote speaker tại VietAI Summit 2023.\n\n"
                "Chuyên sâu: PyTorch, TensorFlow, Computer Vision, NLP, Reinforcement Learning.\n"
                "Giúp bạn: thiết kế kiến trúc model, debug training, career path trong AI/ML, chuẩn bị PhD applications."
            ),
            "linkedin_url": "https://linkedin.com/in/sarah-nguyen-ml",
            "experience_years": 12,
            "hourly_rate": 250,
            "rating": 5.0,
            "total_reviews": 312,
            "tags": "Machine Learning, Deep Learning, Computer Vision, NLP, Python, PyTorch, Research",
            "kyc_status": KYCStatus.APPROVED,
            # day_of_week: 0=Mon … 6=Sun
            "availability": [
                {"day": 1, "start": "09:00", "end": "17:00"},  # Tue
                {"day": 3, "start": "09:00", "end": "17:00"},  # Thu
                {"day": 6, "start": "08:00", "end": "12:00"},  # Sun
            ],
        },
    },
    {
        "email": "marcus.frontend@careerpath.com",
        "full_name": "Marcus Trần",
        "phone": "0901234502",
        "avatar_url": "https://ui-avatars.com/api/?name=Marcus+Tran&background=7c3aed&color=fff&size=128",
        "expert": {
            "bio": (
                "Lead Frontend Architect tại Shopee với 10 năm xây dựng UI hàng triệu DAU. "
                "Core contributor của React ecosystem. Chuyên gia về Web Performance & Accessibility.\n\n"
                "Stack: React 19, Next.js 15, TypeScript, GraphQL, Micro-frontends.\n"
                "Giúp bạn: code review, system design frontend, phỏng vấn kỹ thuật, tối ưu Core Web Vitals."
            ),
            "linkedin_url": "https://linkedin.com/in/marcus-tran-frontend",
            "experience_years": 10,
            "hourly_rate": 200,
            "rating": 4.9,
            "total_reviews": 278,
            "tags": "React, Next.js, TypeScript, UI/UX, Web Performance, GraphQL, Frontend Architecture",
            "kyc_status": KYCStatus.APPROVED,
            "availability": [
                {"day": 0, "start": "19:00", "end": "22:00"},  # Mon
                {"day": 2, "start": "19:00", "end": "22:00"},  # Wed
                {"day": 4, "start": "19:00", "end": "22:00"},  # Fri
                {"day": 6, "start": "09:00", "end": "17:00"},  # Sat
            ],
        },
    },
    {
        "email": "elena.startup@careerpath.com",
        "full_name": "Elena Phạm",
        "phone": "0901234503",
        "avatar_url": "https://ui-avatars.com/api/?name=Elena+Pham&background=0891b2&color=fff&size=128",
        "expert": {
            "bio": (
                "Ex-CTO tại 3 startup unicorn (fintech, edtech, logistics). Angel investor với 15 deal portfolio. "
                "Forbes Vietnam 30 Under 30 (2021).\n\n"
                "Chuyên gia: Product roadmap, Fundraising Series A-C, Team building, OKR framework, Go-to-market strategy.\n"
                "Giúp bạn: pitch deck review, co-founder conflicts, scaling engineering team, Vietnam market entry."
            ),
            "linkedin_url": "https://linkedin.com/in/elena-pham-cto",
            "experience_years": 9,
            "hourly_rate": 300,
            "rating": 4.9,
            "total_reviews": 195,
            "tags": "Startup, CTO, Strategy, Fundraising, Product Management, Leadership, SaaS, Fintech",
            "kyc_status": KYCStatus.APPROVED,
            "availability": [
                {"day": 1, "start": "07:00", "end": "09:00"},  # Tue
                {"day": 3, "start": "07:00", "end": "09:00"},  # Thu
                {"day": 5, "start": "07:00", "end": "09:00"},  # Sat
            ],
        },
    },
    # ── Tier A (4.8 – 4.7) ───────────────────────────────────────────────
    {
        "email": "david.devops@careerpath.com",
        "full_name": "David Lê",
        "phone": "0901234504",
        "avatar_url": "https://ui-avatars.com/api/?name=David+Le&background=059669&color=fff&size=128",
        "expert": {
            "bio": (
                "Principal DevOps Engineer tại AWS Vietnam. AWS Solutions Architect Professional & CKA certified. "
                "8 năm xây hệ thống cloud-native cho 200+ enterprise clients.\n\n"
                "Stack: Kubernetes, Terraform, GitOps, Observability (Grafana/Prometheus), Multi-cloud.\n"
                "Giúp bạn: thiết kế CI/CD pipeline, Kubernetes troubleshooting, cost optimization AWS/GCP, SRE practices."
            ),
            "linkedin_url": "https://linkedin.com/in/david-le-devops",
            "experience_years": 8,
            "hourly_rate": 180,
            "rating": 4.8,
            "total_reviews": 234,
            "tags": "DevOps, Kubernetes, AWS, Terraform, CI/CD, Docker, Cloud Architecture, SRE",
            "kyc_status": KYCStatus.APPROVED,
            "availability": [
                {"day": 0, "start": "08:00", "end": "12:00"},  # Mon
                {"day": 2, "start": "08:00", "end": "12:00"},  # Wed
                {"day": 4, "start": "08:00", "end": "12:00"},  # Fri
                {"day": 6, "start": "14:00", "end": "18:00"},  # Sat
            ],
        },
    },
    {
        "email": "angela.pmgr@careerpath.com",
        "full_name": "Angela Hoàng",
        "phone": "0901234505",
        "avatar_url": "https://ui-avatars.com/api/?name=Angela+Hoang&background=db2777&color=fff&size=128",
        "expert": {
            "bio": (
                "Senior Product Manager tại Meta với 8 năm kinh nghiệm. "
                "Từng PM cho Instagram Reels (200M+ users). MBA từ INSEAD.\n\n"
                "Framework: RICE scoring, Jobs-to-be-done, Growth loops, A/B testing at scale.\n"
                "Giúp bạn: chuyển sang PM từ engineering/design, PRD writing, stakeholder management, PM interview prep (FAANG level)."
            ),
            "linkedin_url": "https://linkedin.com/in/angela-hoang-pm",
            "experience_years": 8,
            "hourly_rate": 220,
            "rating": 4.8,
            "total_reviews": 167,
            "tags": "Product Management, Growth, A/B Testing, FAANG, User Research, Roadmap, Analytics",
            "kyc_status": KYCStatus.APPROVED,
            "availability": [
                {"day": 1, "start": "12:00", "end": "18:00"},  # Tue
                {"day": 4, "start": "12:00", "end": "18:00"},  # Fri
                {"day": 6, "start": "09:00", "end": "13:00"},  # Sat
            ],
        },
    },
    {
        "email": "kevin.blockchain@careerpath.com",
        "full_name": "Kevin Võ",
        "phone": "0901234506",
        "avatar_url": "https://ui-avatars.com/api/?name=Kevin+Vo&background=d97706&color=fff&size=128",
        "expert": {
            "bio": (
                "Blockchain Engineer & DeFi Researcher với 7 năm. Từng là Lead Smart Contract dev tại Kyber Network. "
                "Audit 50+ protocol on Ethereum, Solana, Sei.\n\n"
                "Chuyên môn: Solidity, Rust, Gas optimization, MEV, Security audit, Tokenomics design.\n"
                "Giúp bạn: smart contract review, DeFi protocol design, Web3 career path, audit readiness."
            ),
            "linkedin_url": "https://linkedin.com/in/kevin-vo-blockchain",
            "experience_years": 7,
            "hourly_rate": 200,
            "rating": 4.7,
            "total_reviews": 143,
            "tags": "Blockchain, Solidity, DeFi, Web3, Smart Contracts, Ethereum, Security Audit, Rust",
            "kyc_status": KYCStatus.APPROVED,
            "availability": [
                {"day": 0, "start": "20:00", "end": "23:00"},  # Mon
                {"day": 3, "start": "20:00", "end": "23:00"},  # Thu
                {"day": 5, "start": "10:00", "end": "16:00"},  # Sat
            ],
        },
    },
    # ── Tier B (4.6 – 4.5) ───────────────────────────────────────────────
    {
        "email": "lisa.data@careerpath.com",
        "full_name": "Lisa Bùi",
        "phone": "0901234507",
        "avatar_url": "https://ui-avatars.com/api/?name=Lisa+Bui&background=7c3aed&color=fff&size=128",
        "expert": {
            "bio": (
                "Data Science Lead tại MoMo fintech platform. 7 năm làm việc với dữ liệu thực tế ở production scale.\n\n"
                "Tools: Python, SQL, Spark, dbt, Airflow, Tableau, Looker.\n"
                "Giúp bạn: xây data pipeline, fraud detection models, SQL interview, chuyển từ BI sang Data Science, "
                "portfolio cho DS job applications."
            ),
            "linkedin_url": "https://linkedin.com/in/lisa-bui-data",
            "experience_years": 7,
            "hourly_rate": 150,
            "rating": 4.6,
            "total_reviews": 189,
            "tags": "Data Science, Python, SQL, Machine Learning, Spark, Analytics, dbt, Fintech",
            "kyc_status": KYCStatus.APPROVED,
            "availability": [
                {"day": 1, "start": "18:00", "end": "21:00"},  # Tue
                {"day": 3, "start": "18:00", "end": "21:00"},  # Thu
                {"day": 6, "start": "08:00", "end": "14:00"},  # Sat
            ],
        },
    },
    {
        "email": "ryan.backend@careerpath.com",
        "full_name": "Ryan Đinh",
        "phone": "0901234508",
        "avatar_url": "https://ui-avatars.com/api/?name=Ryan+Dinh&background=0891b2&color=fff&size=128",
        "expert": {
            "bio": (
                "Staff Backend Engineer tại Tiki với 8 năm. Architect của hệ thống order management chịu tải 100K req/s.\n\n"
                "Tech: Go, Rust, Java/Spring, gRPC, Kafka, PostgreSQL, Redis, Domain-driven Design.\n"
                "Giúp bạn: system design interview (Google/Amazon level), microservices patterns, database optimization, "
                "tech lead roadmap."
            ),
            "linkedin_url": "https://linkedin.com/in/ryan-dinh-backend",
            "experience_years": 8,
            "hourly_rate": 160,
            "rating": 4.6,
            "total_reviews": 211,
            "tags": "Backend, Go, Java, System Design, Microservices, Kafka, PostgreSQL, High Performance",
            "kyc_status": KYCStatus.APPROVED,
            "availability": [
                {"day": 0, "start": "07:00", "end": "09:00"},  # Mon
                {"day": 2, "start": "07:00", "end": "09:00"},  # Wed
                {"day": 4, "start": "07:00", "end": "09:00"},  # Fri
                {"day": 5, "start": "09:00", "end": "17:00"},  # Sat
            ],
        },
    },
    {
        "email": "maya.ux@careerpath.com",
        "full_name": "Maya Ngô",
        "phone": "0901234509",
        "avatar_url": "https://ui-avatars.com/api/?name=Maya+Ngo&background=be185d&color=fff&size=128",
        "expert": {
            "bio": (
                "Principal UX Designer tại Grab Design. Từng lead redesign siêu app Grab Việt Nam (2022). "
                "Certified Google UX Design Professional.\n\n"
                "Expertise: Design Systems, Figma, UX Research, Accessibility, Motion Design.\n"
                "Giúp bạn: portfolio critique, design system setup, UX case study cho internship/fresher, "
                "chuyển từ graphic design sang UX."
            ),
            "linkedin_url": "https://linkedin.com/in/maya-ngo-ux",
            "experience_years": 6,
            "hourly_rate": 140,
            "rating": 4.6,
            "total_reviews": 156,
            "tags": "UX Design, UI Design, Figma, Design System, User Research, Prototyping, Accessibility",
            "kyc_status": KYCStatus.APPROVED,
            "availability": [
                {"day": 1, "start": "09:00", "end": "17:00"},  # Tue
                {"day": 4, "start": "09:00", "end": "17:00"},  # Fri
            ],
        },
    },
    # ── Tier C (4.4 – 4.2) ───────────────────────────────────────────────
    {
        "email": "james.security@careerpath.com",
        "full_name": "James Lý",
        "phone": "0901234510",
        "avatar_url": "https://ui-avatars.com/api/?name=James+Ly&background=991b1b&color=fff&size=128",
        "expert": {
            "bio": (
                "Penetration Tester & Red Team Lead tại một MSSP top 3 SEA. OSCP, CEH, CISSP certified. "
                "5 năm kinh nghiệm tấn công và phòng thủ hệ thống ngân hàng & chính phủ.\n\n"
                "Giúp bạn: CTF coaching, bug bounty methodology, lộ trình CyberSec career, "
                "web/app pentesting basics, OSCP preparation."
            ),
            "linkedin_url": "https://linkedin.com/in/james-ly-security",
            "experience_years": 5,
            "hourly_rate": 180,
            "rating": 4.4,
            "total_reviews": 98,
            "tags": "Cybersecurity, Penetration Testing, OSCP, Bug Bounty, Red Team, CTF, Network Security",
            "kyc_status": KYCStatus.APPROVED,
            "availability": [
                {"day": 0, "start": "20:00", "end": "23:00"},  # Mon
                {"day": 2, "start": "20:00", "end": "23:00"},  # Wed
                {"day": 6, "start": "10:00", "end": "18:00"},  # Sat
            ],
        },
    },
    {
        "email": "nina.marketing@careerpath.com",
        "full_name": "Nina Trương",
        "phone": "0901234511",
        "avatar_url": "https://ui-avatars.com/api/?name=Nina+Truong&background=9333ea&color=fff&size=128",
        "expert": {
            "bio": (
                "Growth Marketing Director tại một startup Series B edtech. 6 năm tăng trưởng user base từ 0 → 2 triệu. "
                "Chuyên gia Performance Marketing & SEO.\n\n"
                "Kỹ năng: Facebook/Google Ads, SEO onpage, Content strategy, Email marketing automation, CRO.\n"
                "Giúp bạn: xây marketing funnel, tối ưu ROAS, lập kế hoạch content, early-stage growth hacking."
            ),
            "linkedin_url": "https://linkedin.com/in/nina-truong-growth",
            "experience_years": 6,
            "hourly_rate": 120,
            "rating": 4.4,
            "total_reviews": 134,
            "tags": "Growth Marketing, SEO, Performance Marketing, Content Strategy, Digital Marketing, CRO",
            "kyc_status": KYCStatus.APPROVED,
            "availability": [
                {"day": 1, "start": "08:00", "end": "17:00"},  # Tue
                {"day": 3, "start": "08:00", "end": "17:00"},  # Thu
                {"day": 5, "start": "09:00", "end": "12:00"},  # Sat
            ],
        },
    },
    {
        "email": "alex.mobile@careerpath.com",
        "full_name": "Alex Phùng",
        "phone": "0901234512",
        "avatar_url": "https://ui-avatars.com/api/?name=Alex+Phung&background=0369a1&color=fff&size=128",
        "expert": {
            "bio": (
                "Mobile Engineering Lead tại VNG với 6 năm. Architect Zalo Mini App platform (servicing 70M+ users). "
                "Google Developer Expert (GDE) ngành Mobile.\n\n"
                "Stack: Flutter, Kotlin, Swift, React Native, Performance optimization.\n"
                "Giúp bạn: Flutter/RN architecture review, App Store Optimization, phỏng vấn mobile engineer."
            ),
            "linkedin_url": "https://linkedin.com/in/alex-phung-mobile",
            "experience_years": 6,
            "hourly_rate": 130,
            "rating": 4.3,
            "total_reviews": 112,
            "tags": "Mobile, Flutter, React Native, Android, iOS, Kotlin, Swift, GDE",
            "kyc_status": KYCStatus.APPROVED,
            "availability": [
                {"day": 0, "start": "18:00", "end": "21:00"},  # Mon
                {"day": 3, "start": "18:00", "end": "21:00"},  # Thu
                {"day": 6, "start": "09:00", "end": "15:00"},  # Sat
            ],
        },
    },
    # ── Tier D (affordable, good for beginners) ───────────────────────────
    {
        "email": "helen.hr@careerpath.com",
        "full_name": "Helen Vũ",
        "phone": "0901234513",
        "avatar_url": "https://ui-avatars.com/api/?name=Helen+Vu&background=15803d&color=fff&size=128",
        "expert": {
            "bio": (
                "Senior HR Business Partner tại một tập đoàn Fortune 500. 7 năm tuyển dụng kỹ sư phần mềm & quản lý cấp cao. "
                "Đã review 5,000+ CV IT và phỏng vấn 1,000+ ứng viên.\n\n"
                "Giúp bạn: CV review chi tiết (IT/non-IT), LinkedIn optimization, chuẩn bị phỏng vấn behavioral, "
                "thương lượng lương, career transition planning."
            ),
            "linkedin_url": "https://linkedin.com/in/helen-vu-hr",
            "experience_years": 7,
            "hourly_rate": 80,
            "rating": 4.2,
            "total_reviews": 276,
            "tags": "HR, Career Coaching, CV Review, Interview Prep, Recruitment, Salary Negotiation, LinkedIn",
            "kyc_status": KYCStatus.APPROVED,
            "availability": [
                {"day": 1, "start": "09:00", "end": "18:00"},  # Tue
                {"day": 2, "start": "09:00", "end": "18:00"},  # Wed
                {"day": 4, "start": "09:00", "end": "18:00"},  # Fri
            ],
        },
    },
    {
        "email": "tom.finance@careerpath.com",
        "full_name": "Tom Đặng",
        "phone": "0901234514",
        "avatar_url": "https://ui-avatars.com/api/?name=Tom+Dang&background=78350f&color=fff&size=128",
        "expert": {
            "bio": (
                "Financial Analyst CFA tại Dragon Capital. 5 năm phân tích đầu tư chứng khoán VN và quốc tế. "
                "Từng là giảng viên CFA Level 1 & 2 tại Kaplan.\n\n"
                "Giúp bạn: xây portfolio đầu tư cá nhân, phân tích báo cáo tài chính, lộ trình CFA, "
                "cơ bản về startup valuation, financial modeling Excel."
            ),
            "linkedin_url": "https://linkedin.com/in/tom-dang-finance",
            "experience_years": 5,
            "hourly_rate": 100,
            "rating": 4.2,
            "total_reviews": 87,
            "tags": "Finance, Investment, CFA, Stock Market, Financial Modeling, Excel, Valuation",
            "kyc_status": KYCStatus.APPROVED,
            "availability": [
                {"day": 0, "start": "18:00", "end": "21:00"},  # Mon
                {"day": 2, "start": "18:00", "end": "21:00"},  # Wed
                {"day": 5, "start": "09:00", "end": "15:00"},  # Sat
            ],
        },
    },
    {
        "email": "chris.english@careerpath.com",
        "full_name": "Chris Hà",
        "phone": "0901234515",
        "avatar_url": "https://ui-avatars.com/api/?name=Chris+Ha&background=0f766e&color=fff&size=128",
        "expert": {
            "bio": (
                "Cambridge CELTA certified English coach chuyên luyện Business English & Technical English cho dân IT. "
                "4 năm coaching, giúp 400+ engineers tự tin giao tiếp trong môi trường quốc tế.\n\n"
                "Chương trình: Presentation skills, Email/Slack writing, Meeting facilitation, IELTS Speaking 7+, "
                "Job interview English, Tech vocabulary deep dives."
            ),
            "linkedin_url": "https://linkedin.com/in/chris-ha-english",
            "experience_years": 4,
            "hourly_rate": 60,
            "rating": 4.1,
            "total_reviews": 203,
            "tags": "English, Business English, IELTS, Communication, Presentation, Writing, Coaching",
            "kyc_status": KYCStatus.APPROVED,
            "availability": [
                {"day": 0, "start": "17:00", "end": "21:00"},  # Mon
                {"day": 1, "start": "17:00", "end": "21:00"},  # Tue
                {"day": 2, "start": "17:00", "end": "21:00"},  # Wed
                {"day": 3, "start": "17:00", "end": "21:00"},  # Thu
                {"day": 4, "start": "17:00", "end": "21:00"},  # Fri
            ],
        },
    },
]

# ---------------------------------------------------------------------------
# Student account
# ---------------------------------------------------------------------------

STUDENT = {
    "email": "test_student@careerpath.com",
    "password": "123456",
    "full_name": "Test Student",
    "phone": "0909999999",
    "credits": 50_000,
}

PASSWORD = "123456"


# ---------------------------------------------------------------------------
# Main seeder
# ---------------------------------------------------------------------------

async def seed():
    print("\n🌱 Starting expert seed…\n")
    url = settings.DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://")

    engine = create_async_engine(url, echo=False)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:

        # ── Student ──────────────────────────────────────────────────────
        res = await session.execute(select(User).where(User.email == STUDENT["email"]))
        student = res.scalars().first()

        if student:
            print(f"  Updating student  {STUDENT['email']}…")
            student.credits = STUDENT["credits"]
            student.full_name = STUDENT["full_name"]
            student.hashed_password = get_password_hash(PASSWORD)
            student.account_status = UserStatus.ACTIVE
        else:
            print(f"  Creating student  {STUDENT['email']}…")
            student = User(
                email=STUDENT["email"],
                hashed_password=get_password_hash(PASSWORD),
                full_name=STUDENT["full_name"],
                phone_number=STUDENT["phone"],
                role=UserRole.STUDENT,
                account_status=UserStatus.ACTIVE,
                is_active=True,
                is_superuser=False,
                credits=STUDENT["credits"],
            )
            session.add(student)

        await session.flush()

        # ── Experts ──────────────────────────────────────────────────────
        for ed in EXPERT_DATA:
            res = await session.execute(select(User).where(User.email == ed["email"]))
            user = res.scalars().first()

            if user:
                print(f"  Updating expert   {ed['email']}…")
                user.full_name = ed["full_name"]
                user.hashed_password = get_password_hash(PASSWORD)
                user.account_status = UserStatus.ACTIVE
                user.avatar_url = ed.get("avatar_url")
            else:
                print(f"  Creating expert   {ed['email']}…")
                user = User(
                    email=ed["email"],
                    hashed_password=get_password_hash(PASSWORD),
                    full_name=ed["full_name"],
                    phone_number=ed["phone"],
                    avatar_url=ed.get("avatar_url"),
                    role=UserRole.EXPERT,
                    account_status=UserStatus.ACTIVE,
                    is_active=True,
                    is_superuser=False,
                    credits=0,
                )
                session.add(user)

            await session.flush()  # get user.id

            # Expert profile
            ep_data = ed["expert"]
            res2 = await session.execute(
                select(ExpertProfile).where(ExpertProfile.user_id == user.id)
            )
            profile = res2.scalars().first()

            if profile:
                profile.bio = ep_data["bio"]
                profile.linkedin_url = ep_data["linkedin_url"]
                profile.experience_years = ep_data["experience_years"]
                profile.hourly_rate = ep_data["hourly_rate"]
                profile.rating = ep_data["rating"]
                profile.total_reviews = ep_data["total_reviews"]
                profile.tags = ep_data["tags"]
                profile.kyc_status = ep_data["kyc_status"]
            else:
                profile = ExpertProfile(
                    user_id=user.id,
                    bio=ep_data["bio"],
                    linkedin_url=ep_data["linkedin_url"],
                    experience_years=ep_data["experience_years"],
                    hourly_rate=ep_data["hourly_rate"],
                    rating=ep_data["rating"],
                    total_reviews=ep_data["total_reviews"],
                    tags=ep_data["tags"],
                    kyc_status=ep_data["kyc_status"],
                )
                session.add(profile)

            await session.flush()  # get profile.id

            # Availability — delete old, insert new
            from sqlalchemy import delete
            await session.execute(
                delete(ExpertAvailability).where(ExpertAvailability.expert_id == profile.id)
            )
            for slot in ep_data["availability"]:
                session.add(ExpertAvailability(
                    expert_id=profile.id,
                    day_of_week=slot["day"],
                    start_time=slot["start"],
                    end_time=slot["end"],
                ))

        await session.commit()
        print("\n✅  Seed completed!\n")
        print("=" * 52)
        print(f"  Student login : {STUDENT['email']}")
        print(f"  Password      : {PASSWORD}")
        print(f"  Credits       : {STUDENT['credits']:,}")
        print("=" * 52)
        print(f"\n  {len(EXPERT_DATA)} experts seeded (all password: {PASSWORD})\n")
        for i, ed in enumerate(EXPERT_DATA, 1):
            ep = ed["expert"]
            print(f"  {i:>2}. ⭐ {ep['rating']}  💰 {ep['hourly_rate']:>3} cr/hr  {ed['email']}")
        print()

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
