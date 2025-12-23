# 🔐 Admin Dashboard Documentation

Đây là hệ thống quản lý toàn diện dành cho các quản trị viên của nền tảng EduPlatform.

## 📋 Mục Lục
1. [Đăng Nhập](#đăng-nhập)
2. [Giao Diện Chính](#giao-diện-chính)
3. [Các Tính Năng](#các-tính-năng)
4. [API Integration](#api-integration)

---

## 🔐 Đăng Nhập

### URL
```
http://localhost:8083/admin/login
```

### Yêu Cầu
- Email tài khoản có role **ADMIN**
- Mật khẩu hợp lệ

### Quá Trình Đăng Nhập
1. Nhập email Admin và mật khẩu
2. Hệ thống kiểm tra role ADMIN
3. Nếu role không phải ADMIN → hiển thị lỗi
4. Nếu đúng → lưu token vào localStorage
5. Redirect tới `/admin` (Dashboard chính)

### Kiểm Tra Quyền
Hệ thống sử dụng:
- **AuthContext** để lưu thông tin user
- **AdminRoute** component để bảo vệ routes
- Headers gửi token JWT cho API calls

---

## 🎨 Giao Diện Chính

### Layout Cấu Trúc

```
┌─────────────────────────────────────────┐
│        Navigation Bar (Top)             │
├──────────────┬──────────────────────────┤
│              │                          │
│  Sidebar     │    Main Content Area     │
│  (Collapsible)│                         │
│              │                          │
└──────────────┴──────────────────────────┘
```

### Sidebar Navigation
- **Dashboard** - Trang chính với KPI
- **Users** - Quản lý người dùng
- **Courses** - Quản lý khóa học
- **Statistics** - Thống kê và báo cáo
- **Reports** - Báo cáo chi tiết
- **Settings** - Cấu hình hệ thống
- **Logout** - Đăng xuất

### Top Bar
- Hiển thị tên trang hiện tại
- Hiển thị thông tin Admin (tên, hình đại diện)

---

## 🎯 Các Tính Năng

### 1. 📊 Dashboard (Trang Chính)

**URL:** `/admin`

**Hiển Thị:**
- 4 KPI cards chính:
  - Tổng Người Dùng
  - Khóa Học Đang Hoạt
  - Tỷ Lệ Hoàn Thành
  - Doanh Thu Tháng

- **Charts:**
  - Line chart: Xu hướng khóa học (6 tháng)
  - Bar chart: Tăng trưởng người dùng (6 tháng)
  - Pie chart: Phân phối khóa học theo danh mục
  - Progress bars: Các chỉ số chính

- **Top Instructors:** 4 giáo viên hàng đầu
  - Tên, số khóa học, số học viên
  - Rating sao

- **Recent Activities:** 5 sự kiện gần đây
  - Enrollment, Course publish, Assignment, Users, Completion

---

### 2. 👥 Users Management

**URL:** `/admin/users`

**Tính Năng:**
- ✅ Danh sách tất cả users (Students, Teachers, Admins)
- 🔍 Tìm kiếm theo tên, email, username
- 🏷️ Lọc theo role (Admin, Teacher, Student)
- 📄 Phân trang (10/25/50 users per page)

**Bảng Hiển Thị:**
| Cột | Thông Tin |
|-----|----------|
| Name | Avatar + Full Name + Username |
| Email | Email address |
| Role | ADMIN / TEACHER / STUDENT (badge) |
| Status | ACTIVE / INACTIVE (badge) |
| Joined | Ngày đăng ký |
| Last Login | Lần đăng nhập cuối |
| Actions | View, Edit, Activate/Deactivate, Delete |

**Actions (Dropdown Menu):**
- 👁️ View Profile
- ✏️ Edit User
- 🔒 Deactivate / 🔓 Activate
- 🗑️ Delete

---

### 3. 📚 Courses Management

**URL:** `/admin/courses`

**Tính Năng:**
- ✅ Danh sách khóa học
- 🔍 Tìm kiếm theo tên khóa học hoặc giáo viên
- 🏷️ Lọc theo status (Published, Draft, Archived)
- 📊 Quick stats:
  - Tổng khóa học
  - Tổng học viên
  - Average rating

**Bảng Hiển Thị:**
| Cột | Thông Tin |
|-----|----------|
| Course Title | Tên khóa học + ID |
| Instructor | Tên giáo viên |
| Category | Danh mục |
| Students | Số học viên |
| Rating | Sao đánh giá |
| Price | Giá tiền |
| Status | PUBLISHED / DRAFT / ARCHIVED |
| Actions | View, Edit, Analytics, Delete |

---

### 4. 📈 Statistics & Reports

**URL:** `/admin/statistics`

**Tính Năng:**
- 📊 4 Key Metrics Cards:
  - Daily Active Users
  - Courses Completed
  - Total Revenue
  - System Uptime

- **Charts:**
  - Area chart: Enrollment & Completion
  - Bar chart: Revenue Trend
  
- **3 Tabs:**

#### a) By Category
Bảng thống kê theo danh mục:
- Số khóa học
- Số học viên
- Tổng doanh thu
- Average revenue per course

#### b) Top Performers
Khóa học có hiệu suất tốt nhất:
- Tên khóa học
- Views
- Enrollments
- Revenue
- Conversion Rate

#### c) Demographics
- User distribution (Students 65%, Teachers 30%, Admins 5%)
- Engagement metrics (Daily/Weekly/Monthly Active)

---

### 5. ⚙️ Settings

**URL:** `/admin/settings`

**Tabs:**

#### a) General Settings
- Platform Name
- Platform URL
- Support Email
- Timezone

#### b) Email Configuration
- SMTP Host
- SMTP Port
- Sender Email
- Sender Password (masked)

#### c) Notifications Preferences
- Email on Enrollment ✓
- Email on Completion ✓
- Email on Assignment ✓
- Daily Summary

#### d) Security Settings
- Enable Two-Factor ✓
- Session Timeout (minutes)
- Max Login Attempts
- Enforce Strong Passwords ✓

#### e) Maintenance
- Database Backup
- Clear Cache
- Database Optimization

---

## 🔌 API Integration

### Endpoints Cần Triển Khai

#### 1. Authentication
```
POST /auth/login
Body: { email, password }
Response: { token, user: { id, username, email, role } }
```

#### 2. Users Management
```
GET /admin/users?page=1&limit=10&role=STUDENT&search=john
GET /admin/users/:userId
PUT /admin/users/:userId
DELETE /admin/users/:userId
PUT /admin/users/:userId/status (activate/deactivate)
```

#### 3. Courses Management
```
GET /admin/courses?page=1&limit=10&status=PUBLISHED
GET /admin/courses/:courseId
PUT /admin/courses/:courseId
DELETE /admin/courses/:courseId
GET /admin/courses/:courseId/analytics
```

#### 4. Statistics
```
GET /admin/statistics/overview
GET /admin/statistics/trends?range=7d
GET /admin/statistics/courses-by-category
GET /admin/statistics/top-performers
GET /admin/statistics/user-demographics
```

#### 5. Settings
```
GET /admin/settings
PUT /admin/settings/general
PUT /admin/settings/email
PUT /admin/settings/notifications
PUT /admin/settings/security

POST /admin/maintenance/backup
POST /admin/maintenance/clear-cache
POST /admin/maintenance/optimize-db
```

---

## 🔧 Hướng Dẫn Sử Dụng

### Tạo Admin User
1. Vào UserService backend
2. Tạo user với role = "ADMIN"
3. Ghi nhớ email và password
4. Truy cập `/admin/login`

### First Login
1. Go to `http://localhost:8083/admin/login`
2. Enter admin email và password
3. Click "Đăng Nhập"
4. Redirect to `/admin` dashboard

### Logout
Sidebar → Click "Logout" button
→ Redirect to home page

---

## 📁 File Structure

```
client/src/
├── pages/
│   ├── AdminLogin.tsx              # Login page
│   ├── AdminDashboardHome.tsx       # Main dashboard
│   ├── AdminUsers.tsx               # User management
│   ├── AdminCourses.tsx             # Course management
│   ├── AdminStatistics.tsx          # Statistics & Reports
│   └── AdminSettings.tsx            # Settings
├── components/
│   └── AdminLayout.tsx              # Sidebar + Layout
└── App.tsx                          # Routes setup
```

---

## 🎨 Styling

- **Color Scheme:** Dark theme (slate-900, slate-800)
- **Components:** shadcn/ui components
- **Charts:** Recharts library
- **Icons:** lucide-react

---

## 🚀 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced filtering & sorting
- [ ] Bulk operations (delete, activate users)
- [ ] Export reports (PDF, CSV, Excel)
- [ ] User activity audit logs
- [ ] Advanced analytics dashboards
- [ ] Email templates management
- [ ] Role-based permission management
- [ ] API rate limiting settings
- [ ] Backup scheduling

---

## 📞 Support

Nếu có vấn đề, vui lòng liên hệ team development hoặc check logs trong browser console.
