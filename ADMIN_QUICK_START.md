# 🚀 Admin Dashboard - Quick Start

## Đăng Nhập

**URL:** `http://localhost:8083/admin/login`

```
Email: (tài khoản admin)
Password: (mật khẩu)
```

## Các Trang Chính

| Trang | URL | Chức Năng |
|-------|-----|---------|
| Dashboard | `/admin` | Thống kê tổng quan KPI |
| Users | `/admin/users` | Quản lý người dùng, roles, status |
| Courses | `/admin/courses` | Quản lý khóa học, giáo viên |
| Statistics | `/admin/statistics` | Báo cáo chi tiết, charts |
| Reports | `/admin/reports` | Báo cáo theo danh mục |
| Settings | `/admin/settings` | Cấu hình hệ thống |

## 🎯 Các Tính Năng Nhanh

### Dashboard
- ✅ KPI cards (Users, Courses, Completion, Revenue)
- ✅ 6-month trend charts
- ✅ Course distribution pie chart
- ✅ Top 4 instructors
- ✅ Recent activities log

### Users Management
- ✅ Search by name/email/username
- ✅ Filter by role (Admin/Teacher/Student)
- ✅ Pagination (10/25/50 per page)
- ✅ View profile, Edit, Activate/Deactivate, Delete
- ✅ Last login tracking

### Courses Management
- ✅ Search courses
- ✅ Filter by status (Published/Draft/Archived)
- ✅ Quick stats card
- ✅ View analytics, Edit, Delete
- ✅ Category badges

### Statistics & Reports
- ✅ Time range selector (7d/30d/90d/1y)
- ✅ Enrollment & Completion area chart
- ✅ Revenue bar chart
- ✅ 3 report tabs: By Category, Top Performers, Demographics

### Settings
- **General:** Platform name, URL, email, timezone
- **Email:** SMTP configuration
- **Notifications:** Email preferences
- **Security:** 2FA, session timeout, password policy
- **Maintenance:** Database backup, cache clear, optimization

## 🔐 Permissions

Chỉ users với `role = "ADMIN"` mới có thể truy cập.

Nếu role không phải ADMIN → Error message → Redirect to home

## 🛠️ Sidebar Navigation

```
┌─ Dashboard
├─ Users
├─ Courses
├─ Statistics
├─ Reports
├─ Settings
└─ [Logout]
```

Sidebar có thể collapse để tiết kiệm không gian.

## 💡 Tips

1. **Search & Filter:** Dùng để tìm nhanh users/courses
2. **Pagination:** Thay đổi "per page" cho tải nhanh hơn
3. **Time Range:** Thay đổi range cho khác nhau analytics
4. **Export:** PDF/CSV buttons for reports
5. **Settings:** Lưu ngay sau khi thay đổi

## ⚠️ Notes

- Tất cả data hiện tại là mock data (hardcoded)
- Cần connect API endpoints thực tế
- Settings changes cần API call để lưu

## 📝 TODO Backend

1. Create admin auth endpoints
2. Create user management APIs
3. Create course management APIs
4. Create analytics APIs
5. Create settings storage
6. Add audit logging
7. Add email service
8. Add backup functionality

---

**Last Updated:** December 22, 2025  
**Version:** 1.0
