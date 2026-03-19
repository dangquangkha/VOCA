# 🔑 TEST ACCOUNTS - LOCALHOST

## Login URL: http://localhost:3000

---

### 👨‍🎓 1. STUDENT ACCOUNT
```
Email:    student@careerpath.com
Password: 123456
Role:     STUDENT
```
**Quyền hạn:**
- Tìm kiếm experts
- Book consultations
- Manage credits
- View roadmaps

---

### 👨‍💼 2. EXPERT ACCOUNT
```
Email:    expert@careerpath.com
Password: 123456
Role:     EXPERT
```
**Quyền hạn:**
- Create expert profile
- Accept/reject bookings
- Provide consultations
- Earn credits

---

### 👨‍💻 3. ADMIN ACCOUNT
```
Email:    admin@careerpath.com
Password: 123456
Role:     ADMIN
Superuser: Yes
```
**Quyền hạn:**
- Access admin dashboard
- Moderate accounts (suspend/ban/unban)
- View all users
- Manage platform settings
- Full system access

---

## 🚀 Quick Test:
```bash
# Backend API
curl -X POST "http://localhost:8000/api/v1/auth/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@careerpath.com&password=password123"

# Frontend
Open: http://localhost:3000
```

---

## 📍 Admin Features:
- **Moderation Dashboard**: http://localhost:3000/dashboard/admin/moderation
- **Account History**: http://localhost:3000/dashboard/admin/account-actions
- **User Management**: http://localhost:3000/dashboard/admin/users
