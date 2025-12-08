# MFMCF Visitation Unit - API Endpoints Documentation

## 📋 Overview

This document outlines all API endpoints required for the MFMCF Visitation Unit backend migration from Supabase to Node.js + MongoDB.

---

## 🔐 Authentication & Authorization

### Auth Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe"
}

Response: 201 Created
{
  "success": true,
  "message": "Registration successful. Awaiting approval.",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe",
    "isApproved": false
  }
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response: 200 OK
Set-Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=2592000

{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "level_coordinator",
      "isApproved": true
    }
  }
}
```

**Cookie Attributes:**
- `HttpOnly`: Prevents JavaScript access (XSS protection)
- `Secure`: Only sent over HTTPS
- `SameSite=Strict`: CSRF protection
- `Max-Age`: 7 days (accessToken), 30 days (refreshToken)

#### Refresh Token
```http
POST /api/v1/auth/refresh
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response: 200 OK
Set-Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800

{
  "success": true,
  "message": "Token refreshed successfully"
}
```

#### Logout
```http
POST /api/v1/auth/logout
Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response: 200 OK
Set-Cookie: accessToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=0

{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "level_coordinator",
    "isApproved": true,
    "departmentId": "507f1f77bcf86cd799439012",
    "levelId": "507f1f77bcf86cd799439013"
  }
}
```

---

## 👥 User Management

### List All Users (Admin Only)
```http
GET /api/v1/users?page=1&limit=20&status=approved
Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response: 200 OK
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### Get User by ID
```http
GET /api/v1/users/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "level_coordinator",
    "isApproved": true,
    "approvedAt": "2025-12-01T10:30:00Z",
    "approvedBy": "507f1f77bcf86cd799439010",
    "createdAt": "2025-11-28T08:15:00Z"
  }
}
```

### Update User Role
```http
PUT /api/v1/users/:id/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "assistant_coordinator"
}

Response: 200 OK
{
  "success": true,
  "message": "User role updated successfully"
}
```

### Approve User
```http
PUT /api/v1/users/:id/approve
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "User approved successfully"
}
```

### Update User Department
```http
PUT /api/v1/users/:id/department
Authorization: Bearer <token>
Content-Type: application/json

{
  "departmentId": "507f1f77bcf86cd799439012"
}

Response: 200 OK
{
  "success": true,
  "message": "User department updated"
}
```

### Update User Level
```http
PUT /api/v1/users/:id/level
Authorization: Bearer <token>
Content-Type: application/json

{
  "levelId": "507f1f77bcf86cd799439013"
}

Response: 200 OK
{
  "success": true,
  "message": "User level updated"
}
```

### Delete User
```http
DELETE /api/v1/users/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 👤 Member Management

### List Members
```http
GET /api/v1/members?page=1&limit=20&search=john&level=100&memberType=all
Authorization: Bearer <token>

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20, max: 100)
- search: Search term (name, phone)
- level: Filter by level ID
- memberType: all | first-timer | member
- department: Filter by department ID

Response: 200 OK
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "507f1f77bcf86cd799439014",
        "fullName": "John Smith",
        "phoneNumber": "+2348012345678",
        "email": "john@example.com",
        "address": "123 Main St, Lagos",
        "dateOfBirth": "1995-05-15",
        "gender": "male",
        "levelId": "507f1f77bcf86cd799439013",
        "level": {
          "id": "507f1f77bcf86cd799439013",
          "levelNumber": "100"
        },
        "departmentId": "507f1f77bcf86cd799439012",
        "department": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Ushering"
        },
        "isFirstTimer": false,
        "promotedToMemberAt": "2025-11-01T10:00:00Z",
        "registeredAt": "2025-10-28T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### Get Member by ID
```http
GET /api/v1/members/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439014",
    "fullName": "John Smith",
    "phoneNumber": "+2348012345678",
    "email": "john@example.com",
    "address": "123 Main St, Lagos",
    "dateOfBirth": "1995-05-15",
    "gender": "male",
    "levelId": "507f1f77bcf86cd799439013",
    "departmentId": "507f1f77bcf86cd799439012",
    "departmentOther": null,
    "howDidYouHear": "Friend referral",
    "isFirstTimer": false,
    "promotedToMemberAt": "2025-11-01T10:00:00Z",
    "registeredAt": "2025-10-28T14:30:00Z",
    "followUpNotes": []
  }
}
```

### Create Member
```http
POST /api/v1/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "phoneNumber": "+2348087654321",
  "email": "jane@example.com",
  "address": "456 Oak Ave, Abuja",
  "dateOfBirth": "1998-03-20",
  "gender": "female",
  "levelId": "507f1f77bcf86cd799439013",
  "departmentId": "507f1f77bcf86cd799439012",
  "howDidYouHear": "Social media",
  "isFirstTimer": true
}

Response: 201 Created
{
  "success": true,
  "message": "Member created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439015",
    ...memberData
  }
}
```

### Update Member
```http
PUT /api/v1/members/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Jane Doe Updated",
  "phoneNumber": "+2348087654321",
  "departmentId": "507f1f77bcf86cd799439016"
}

Response: 200 OK
{
  "success": true,
  "message": "Member updated successfully"
}
```

### Promote First-Timer to Member
```http
POST /api/v1/members/:id/promote
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "First-timer promoted to member successfully"
}
```

### Update Follow-up Notes
```http
PUT /api/v1/members/:id/follow-up
Authorization: Bearer <token>
Content-Type: application/json

{
  "note": "Called member, very interested in joining choir",
  "followUpDate": "2025-12-10"
}

Response: 200 OK
{
  "success": true,
  "message": "Follow-up note added successfully"
}
```

### Delete Member
```http
DELETE /api/v1/members/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Member deleted successfully"
}
```

---

## 📅 Attendance Management

### List Attendance Records
```http
GET /api/v1/attendance?page=1&limit=20&startDate=2025-12-01&endDate=2025-12-31
Authorization: Bearer <token>

Query Parameters:
- page, limit: Pagination
- startDate, endDate: Date range filter
- memberId: Filter by member
- serviceType: Filter by service type

Response: 200 OK
{
  "success": true,
  "data": {
    "attendance": [
      {
        "id": "507f1f77bcf86cd799439016",
        "memberId": "507f1f77bcf86cd799439014",
        "member": {
          "id": "507f1f77bcf86cd799439014",
          "fullName": "John Smith"
        },
        "serviceDate": "2025-12-01",
        "serviceType": "Sunday Service",
        "isPresent": true,
        "markedBy": "507f1f77bcf86cd799439011",
        "notes": "On time",
        "createdAt": "2025-12-01T09:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

### Mark Attendance
```http
POST /api/v1/attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "memberId": "507f1f77bcf86cd799439014",
  "serviceDate": "2025-12-06",
  "serviceType": "Sunday Service",
  "isPresent": true,
  "notes": "Present and active"
}

Response: 201 Created
{
  "success": true,
  "message": "Attendance marked successfully"
}
```

### Bulk Mark Attendance
```http
POST /api/v1/attendance/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceDate": "2025-12-06",
  "serviceType": "Sunday Service",
  "attendees": [
    { "memberId": "507f1f77bcf86cd799439014", "isPresent": true },
    { "memberId": "507f1f77bcf86cd799439015", "isPresent": true },
    { "memberId": "507f1f77bcf86cd799439016", "isPresent": false, "notes": "Sick" }
  ]
}

Response: 201 Created
{
  "success": true,
  "message": "Bulk attendance marked successfully",
  "data": {
    "marked": 3,
    "failed": 0
  }
}
```

### Get Attendance Statistics
```http
GET /api/v1/attendance/stats?startDate=2025-11-01&endDate=2025-11-30
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "totalAttendance": 450,
    "averageAttendance": 90,
    "attendanceRate": 85.5,
    "byServiceType": {
      "Sunday Service": 200,
      "Wednesday Service": 150,
      "Friday Service": 100
    }
  }
}
```

### Get Attendance Trends
```http
GET /api/v1/attendance/trends?days=7
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    { "date": "2025-11-30", "count": 95 },
    { "date": "2025-12-01", "count": 88 },
    { "date": "2025-12-02", "count": 92 }
  ]
}
```

---

## 🏢 Department Management

### List Departments
```http
GET /api/v1/departments
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Ushering",
      "description": "Ushering department",
      "memberCount": 25,
      "createdAt": "2025-10-28T10:00:00Z"
    }
  ]
}
```

### Create Department
```http
POST /api/v1/departments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Media",
  "description": "Media and technical department"
}

Response: 201 Created
{
  "success": true,
  "message": "Department created successfully",
  "data": {...}
}
```

### Update Department
```http
PUT /api/v1/departments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Media & Tech",
  "description": "Updated description"
}

Response: 200 OK
{
  "success": true,
  "message": "Department updated successfully"
}
```

### Delete Department
```http
DELETE /api/v1/departments/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Department deleted successfully"
}
```

---

## 📊 Level Management

### List Levels
```http
GET /api/v1/levels
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439013",
      "levelNumber": "100",
      "memberCount": 45,
      "createdAt": "2025-10-28T10:00:00Z"
    }
  ]
}
```

### Create Level
```http
POST /api/v1/levels
Authorization: Bearer <token>
Content-Type: application/json

{
  "levelNumber": "500"
}

Response: 201 Created
{
  "success": true,
  "message": "Level created successfully"
}
```

---

## 📈 Dashboard

### Get Dashboard Stats
```http
GET /api/v1/dashboard/stats
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "totalMembers": 150,
    "totalFirstTimers": 25,
    "totalAttendanceThisMonth": 450,
    "attendanceRate": 85.5
  }
}
```

### Get Attendance Trends (Dashboard)
```http
GET /api/v1/dashboard/attendance-trends?days=7
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    { "date": "2025-11-30", "count": 95 },
    { "date": "2025-12-01", "count": 88 }
  ]
}
```

### Get Level Distribution
```http
GET /api/v1/dashboard/level-distribution
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    { "level": "100", "count": 45 },
    { "level": "200", "count": 38 }
  ]
}
```

### Get Recent Activity
```http
GET /api/v1/dashboard/recent-activity?limit=10
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439020",
      "type": "member_joined",
      "name": "John Smith",
      "timestamp": "2025-12-06T10:00:00Z"
    }
  ]
}
```

### Get Upcoming Birthdays
```http
GET /api/v1/dashboard/birthdays?days=7
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "memberId": "507f1f77bcf86cd799439014",
      "fullName": "John Smith",
      "dateOfBirth": "1995-12-10",
      "daysUntil": 4
    }
  ]
}
```

---

## 🎂 Birthday Management

### List Birthdays
```http
GET /api/v1/birthdays?month=12
Authorization: Bearer <token>

Query Parameters:
- month: Filter by month (1-12)
- days: Upcoming days (e.g., 7 for next 7 days)

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "memberId": "507f1f77bcf86cd799439014",
      "fullName": "John Smith",
      "phoneNumber": "+2348012345678",
      "dateOfBirth": "1995-12-10",
      "age": 30
    }
  ]
}
```

### Send Birthday SMS
```http
POST /api/v1/birthdays/send-sms
Authorization: Bearer <token>
Content-Type: application/json

{
  "memberIds": ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"],
  "message": "Happy Birthday! God bless you!"
}

Response: 200 OK
{
  "success": true,
  "message": "Birthday SMS sent successfully",
  "data": {
    "sent": 2,
    "failed": 0
  }
}
```

---

## 📊 Reports

### Member Report
```http
GET /api/v1/reports/members?format=json
Authorization: Bearer <token>

Query Parameters:
- format: json | csv | excel
- level: Filter by level
- department: Filter by department
- memberType: all | first-timer | member

Response: 200 OK (JSON format)
{
  "success": true,
  "data": {
    "report": [...],
    "summary": {
      "total": 150,
      "byLevel": {...},
      "byDepartment": {...}
    }
  }
}
```

### Attendance Report
```http
GET /api/v1/reports/attendance?startDate=2025-11-01&endDate=2025-11-30&format=json
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "report": [...],
    "summary": {
      "totalAttendance": 450,
      "averagePerService": 90,
      "attendanceRate": 85.5
    }
  }
}
```

### First-Timers Report
```http
GET /api/v1/reports/first-timers?startDate=2025-11-01&endDate=2025-11-30
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "report": [...],
    "summary": {
      "total": 25,
      "promoted": 10,
      "pending": 15
    }
  }
}
```

---

## ⚙️ Settings

### Get Settings
```http
GET /api/v1/settings
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "smsEnabled": true,
    "emailEnabled": false,
    "autoPromotionDays": 30,
    "birthdaySmsEnabled": true
  }
}
```

### Update Settings
```http
PUT /api/v1/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "smsEnabled": false,
  "autoPromotionDays": 45
}

Response: 200 OK
{
  "success": true,
  "message": "Settings updated successfully"
}
```

---

## 📞 SMS Service

### Send SMS
```http
POST /api/v1/sms/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipients": ["+2348012345678", "+2348087654321"],
  "message": "Reminder: Service tomorrow at 8 AM"
}

Response: 200 OK
{
  "success": true,
  "message": "SMS sent successfully",
  "data": {
    "sent": 2,
    "failed": 0
  }
}
```

---

## 🔒 Role-Based Access Control

### Roles
- **visitation_coordinator**: Super admin, full access
- **assistant_coordinator**: Most admin features
- **president**: View reports, dashboard
- **central**: View reports, dashboard
- **level_coordinator**: Manage level members, attendance
- **admin**: General admin access
- **user**: Limited access, pending approval

### Protected Routes by Role
- User Management: `visitation_coordinator`
- Member Management: `visitation_coordinator`, `assistant_coordinator`, `level_coordinator`
- Attendance: `visitation_coordinator`, `assistant_coordinator`, `level_coordinator`
- Reports: `visitation_coordinator`, `assistant_coordinator`, `president`, `central`, `admin`
- Dashboard: All authenticated users
- Settings: `visitation_coordinator`

---

## 📝 Common Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

---

## 🔄 Real-time Features (Future)

Consider implementing Socket.io for:
- Real-time attendance updates
- Live dashboard statistics
- Member registration notifications
- Birthday reminders

---

**Total Endpoints**: ~60+ endpoints across 10 modules

**Implementation Priority**:
1. ✅ Authentication & Authorization
2. ✅ User Management
3. ✅ Member Management
4. ✅ Attendance
5. ✅ Dashboard
6. ✅ Departments & Levels
7. ✅ Reports
8. ✅ Birthdays & SMS
9. ✅ Settings
