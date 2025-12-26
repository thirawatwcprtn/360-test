# API Endpoints Reference for Postman Testing

## Base URL
```
http://localhost:3000
```
หรือ URL ของ production server

## Authentication
- **Admin Endpoints** (`/admin/*`): ต้องใช้ Bearer Token Authentication
- **Public Survey Endpoints** (`/api/survey/*`): ไม่ต้อง authentication
- **General API Endpoints** (`/api/*`): บางส่วนต้อง authentication

### การใช้ Bearer Token ใน Postman
1. เลือกแท็บ "Authorization"
2. เลือก Type: "Bearer Token"
3. ใส่ token ที่ได้จาก `/api/auth/login`

---

## 📋 Table of Contents
1. [App & Health Check](#1-app--health-check)
2. [Authentication](#2-authentication)
3. [Site Management](#3-site-management)
4. [Admin - User Management](#4-admin-user-management)
5. [Admin - Company Management](#5-admin-company-management)
6. [Admin - Department Management](#6-admin-department-management)
7. [Admin - Position Management](#7-admin-position-management)
8. [Admin - Employee Management](#8-admin-employee-management)
9. [Admin - Media Management](#9-admin-media-management)
10. [Admin - Survey Management](#10-admin-survey-management)
11. [Admin - Email Templates](#11-admin-email-templates)
12. [Public Survey](#12-public-survey)
13. [Survey Token](#13-survey-token)
14. [Survey Reports](#14-survey-reports)
15. [Admin - Settings](#15-admin-settings)
16. [Admin - Site Settings](#16-admin-site-settings)
17. [Admin - Auditing](#17-admin-auditing)
18. [Employee Feedback (360 Review)](#18-employee-feedback-360-review)
19. [Review Assignment](#19-review-assignment)
20. [Analytic/Report Config](#20-analyticreport-config)

---

## 1. App & Health Check

### 🟢 Ping (Health Check)
```
ALL /api/ping
```
- รับ HTTP method ใดก็ได้
- ใช้ตรวจสอบว่า API ทำงานอยู่

### 🔵 Get Version
```
GET /api/version
```
- ดูข้อมูล version และ build info

### 🔵 Debug Environment Check
```
GET /api/debug/env-check
```
- ตรวจสอบ environment variables (mail credentials)

---

## 2. Authentication

### 🟡 Login
```
POST /api/auth/login
```
**Body (JSON):**
```json
{
  "username": "admin@example.com",
  "password": "your_password"
}
```
**Response:** จะได้ token สำหรับใช้กับ admin endpoints อื่นๆ

---

## 3. Site Management

### 🔵 Get All Sites
```
GET /api/sites/
```

### 🔵 Get Site by Code
```
GET /api/sites/:siteCode
```

### 🔵 Get Site Settings
```
GET /api/sites/:siteCode/settings
```

---

## 4. Admin User Management
🔐 **ต้องใช้ Bearer Token**

### 🔵 List Users
```
GET /admin/users
```
Query Parameters: pagination, search

### 🔵 Get User by ID
```
GET /admin/users/:id
```

### 🟡 Create User
```
POST /admin/users/
```

### 🟠 Update User
```
PATCH /admin/users/:id
```

### 🟠 Activate User
```
PATCH /admin/users/:id/activate
```

### 🟠 Delist User
```
PATCH /admin/users/:id/delist
```

### 🟠 Suspend User
```
PATCH /admin/users/:id/suspend
```

---

## 5. Admin Company Management
🔐 **ต้องใช้ Bearer Token**

### 🟡 Create Company
```
POST /admin/company
```

### 🔵 List Companies
```
GET /admin/company
```
Query Parameters: filters

### 🔵 Count Status
```
GET /admin/company/count-status
```

### 🔵 Get Company by ID
```
GET /admin/company/:id
```

### 🟣 Update Company
```
PUT /admin/company/:id
```

### 🟠 Activate Company
```
PATCH /admin/company/:id/activate
```

### 🔴 Suspend Company
```
DELETE /admin/company/:id
```

### 🟡 Bulk Create Companies
```
POST /admin/company/bulk/create
```

### 🟣 Bulk Update Companies
```
PUT /admin/company/bulk/update
```

### 🔴 Bulk Delete Companies
```
DELETE /admin/company/bulk/delete
```

---

## 6. Admin Department Management
🔐 **ต้องใช้ Bearer Token**

### 🟡 Create Department
```
POST /admin/department
```

### 🔵 List Departments
```
GET /admin/department
```

### 🔵 Get Department by ID
```
GET /admin/department/:id
```

### 🟣 Update Department
```
PUT /admin/department/:id
```

### 🟡 Bulk Create Departments
```
POST /admin/department/bulk/create
```

### 🟣 Bulk Update Departments
```
PUT /admin/department/bulk/update
```

---

## 7. Admin Position Management
🔐 **ต้องใช้ Bearer Token**

### 🟡 Create Position
```
POST /admin/position
```

### 🔵 List Positions
```
GET /admin/position
```

### 🔵 Get Position by ID
```
GET /admin/position/:id
```

### 🟣 Update Position
```
PUT /admin/position/:id
```

### 🟡 Bulk Create Positions
```
POST /admin/position/bulk/create
```

### 🟣 Bulk Update Positions
```
PUT /admin/position/bulk/update
```

---

## 8. Admin Employee Management
🔐 **ต้องใช้ Bearer Token**

### 🟡 Create Employee
```
POST /admin/employee
```

### 🔵 List Employees
```
GET /admin/employee
```
Query Parameters: pagination, search

### 🔵 Get Employee by ID
```
GET /admin/employee/:id
```

### 🟣 Update Employee
```
PUT /admin/employee/:id
```

### 🔴 Delete Employee
```
DELETE /admin/employee/:id
```

### 🟡 Bulk Create Employees
```
POST /admin/employee/bulk/create
```

### 🟣 Bulk Update Employees
```
PUT /admin/employee/bulk/update
```

### 🔴 Bulk Delete Employees
```
DELETE /admin/employee/bulk/delete
```

### 🔵 Get Evaluatee List
```
GET /admin/employee/evaluatees/list
```

---

## 9. Admin Media Management
🔐 **ต้องใช้ Bearer Token**

### 🟡 Upload Image
```
POST /admin/media/image
```
Content-Type: `multipart/form-data`

### 🟡 Upload Video
```
POST /admin/media/video
```
Content-Type: `multipart/form-data`

### 🔵 Search Storage Files
```
GET /admin/media/storage/search
```

---

## 10. Admin Survey Management
🔐 **ต้องใช้ Bearer Token**

### Survey CRUD

#### 🟡 Create Survey
```
POST /admin/survey
```

#### 🔵 List Surveys
```
GET /admin/survey
```

#### 🔵 Count Survey Status
```
GET /admin/survey/count-status
```

#### 🔵 Get Predefined Questions
```
GET /admin/survey/predefined-questions
```

#### 🔵 Get Survey by ID
```
GET /admin/survey/:id
```

#### 🟠 Update Survey
```
PATCH /admin/survey/:id
```

#### 🔵 Get Reviewees
```
GET /admin/survey/:id/reviewees
```

### Survey Status Management

#### 🟢 Check if Can Activate
```
HEAD /admin/survey/:id/has-template
```

#### 🟢 Check Has Assignment
```
HEAD /admin/survey/:id/has-assignment
```

#### 🟡 Activate Survey
```
POST /admin/survey/:id/activate
```

#### 🟡 Delist Survey
```
POST /admin/survey/:id/delist
```

#### 🟡 Suspend Survey
```
POST /admin/survey/:id/suspend
```

#### 🟡 Expire Surveys
```
POST /admin/survey/expires
```

### Survey Sections

#### 🟡 Create Section
```
POST /admin/survey/:id/section
```

#### 🟠 Update Section
```
PATCH /admin/survey/:id/section/:sectionId
```

#### 🟡 Delete Section
```
POST /admin/survey/:id/sections/:sectionId/delete
```

#### 🟠 Move Section
```
PATCH /admin/survey/:id/sections/:sectionId/move
```

### Survey Questions

#### 🟡 Bulk Add Questions
```
POST /admin/survey/:id/bulk-questions
```

#### 🟡 Create Question
```
POST /admin/survey/:surveyId/questions
```

#### 🟠 Update Question
```
PATCH /admin/survey/:surveyId/questions/:questionId
```

#### 🔴 Delete Question
```
DELETE /admin/survey/:surveyId/questions/:questionId
```

#### 🟠 Reorder Questions
```
PATCH /admin/survey/:surveyId/questions/reorder
```

#### 🟠 Move Question
```
PATCH /admin/survey/:surveyId/questions/:questionId/move
```

### Option Pages (Intro/Confirm/Finish)

#### 🔵 Get Option Page
```
GET /admin/survey/:surveyId/option-page/:type
```
Types: `intro`, `confirm`, `finish`

#### 🟡 Create Option Page
```
POST /admin/survey/:surveyId/option-page/:type
```

#### 🟠 Update Option Page
```
PATCH /admin/survey/:surveyId/option-page/:type
```

#### 🔴 Delete Option Page
```
DELETE /admin/survey/:surveyId/option-page/:type
```

### Intro Page

#### 🔵 Get Intro Page
```
GET /admin/survey/:surveyId/intro-page
```

#### 🟡 Create Intro Page
```
POST /admin/survey/:surveyId/intro-page
```

#### 🟠 Update Intro Page
```
PATCH /admin/survey/:surveyId/intro-page
```

#### 🔴 Delete Intro Page
```
DELETE /admin/survey/:surveyId/intro-page
```

### Email Settings

#### 🟠 Update Email Settings
```
PATCH /admin/survey/:id/email-settings
```

### Templates Download

#### 🔵 Single-Choice Template
```
GET /admin/survey/templates/questions/single-choice
```

#### 🔵 Multiple-Choice Template
```
GET /admin/survey/templates/questions/multiple-choice
```

#### 🔵 Free-Text Template
```
GET /admin/survey/templates/questions/free-text
```

#### 🔵 Dropdown Template
```
GET /admin/survey/templates/questions/dropdown
```

#### 🔵 Date Template
```
GET /admin/survey/templates/questions/date
```

#### 🔵 Rating Template
```
GET /admin/survey/templates/questions/rating
```

#### 🔵 Basic Survey Template
```
GET /admin/survey/templates/survey/basic
```

#### 🔵 Advanced Survey Template
```
GET /admin/survey/templates/survey/advanced
```

### Export & Reports

#### 🔵 Export Survey Data (deprecated)
```
GET /admin/survey/:id/export
```

#### 🔵 Export Raw Data
```
GET /admin/survey/:id/export/raw
```

#### 🔵 Export Status Tracking
```
GET /admin/survey/:id/export/status-tracking
```

---

## 11. Admin Email Templates
🔐 **ต้องใช้ Bearer Token**

### 🔵 Get Email Variables
```
GET /admin/survey/email-templates/variables
```

### 🔵 Get All Templates
```
GET /admin/survey/:id/email-templates
```

### 🔵 Get Template by ID
```
GET /admin/survey/:id/email-templates/:templateId
```

### 🟡 Create Template
```
POST /admin/survey/:id/email-templates
```

### 🟠 Update Template
```
PATCH /admin/survey/:id/email-templates/:templateId
```

### 🟡 Delete Template
```
POST /admin/survey/:id/email-templates/:templateId/delete
```

### 🟡 Duplicate Template
```
POST /admin/survey/:id/email-templates/:templateId/duplicate
```

### 🟡 Send Preview Email
```
POST /admin/survey/:id/email-templates/send-template-preview
```

### 🟡 Test Email
```
POST /admin/survey/:id/email-templates/test-email
```

### 🟡 Force Send Email
```
POST /admin/survey/:id/email-templates/force-send
```

---

## 12. Public Survey
✅ **ไม่ต้อง authentication**

### 🔵 Get Survey Details
```
GET /api/survey/:id
```

### 🔵 Get Welcome Page
```
GET /api/survey/:id/welcomepage
```

### 🔵 Get Welcome Page Data
```
GET /api/survey/:id/welcomepagedata
```

### 🔵 Get Intro Page
```
GET /api/survey/:id/intropage
```

### 🔵 Get Confirm Page
```
GET /api/survey/:id/confirmpage
```

### 🔵 Get Finish Page
```
GET /api/survey/:id/finishpage
```

### 🟡 Submit Answers
```
POST /api/survey/:id/answer
```

---

## 13. Survey Token
✅ **ไม่ต้อง authentication (ใช้ token ใน URL)**

### 🔵 Get Survey by Token
```
GET /api/survey/:surveyId/token/:token
```

### 🔵 Get Reviewer Info
```
GET /api/survey/:surveyId/token/:token/reviewer-info
```

### 🔵 Get Reviewee Context
```
GET /api/survey/:surveyId/token/:token/reviewee/:revieweeId
```

### 🟠 Submit Answer via Token
```
PATCH /api/survey/:surveyId/token/:token/answer
```

### 🟠 Mark as Completed
```
PATCH /api/survey/:surveyId/token/:token/reviewee/:revieweeId/complete
```

### 🟠 Mark as In Progress
```
PATCH /api/survey/:surveyId/token/:token/reviewee/:revieweeId/inprogress
```

---

## 14. Survey Reports

### 🔵 Get Report (JSON/PDF)
```
GET /survey-report/:surveyId/report/:reportCode
```

### 🔵 Get Reviewee Report
```
GET /survey-report/:surveyId/report/:reportCode/reviewee/:revieweeId
```

### 🔵 Get Comments for Reviewee
```
GET /admin/survey/:surveyId/360-review/reports/reviewees/:revieweeId/comments
```

### 🟣 Update Comment Override
```
PUT /admin/survey/:surveyId/360-review/reports/comments/:answerId
```

---

## 15. Admin Settings
🔐 **ต้องใช้ Bearer Token**

### 🔵 Get Global Settings
```
GET /admin/settings
```

### 🟠 Update Global Settings
```
PATCH /admin/settings
```

### 🔵 Get Report Sections
```
GET /admin/settings/report-sections
```

### 🟠 Update Report Sections
```
PATCH /admin/settings/report-sections
```

### 🔵 Get Email Templates
```
GET /admin/settings/email-templates
```

### 🟠 Update Email Templates
```
PATCH /admin/settings/email-templates
```

### 🔵 Get Email Variables
```
GET /admin/settings/email-templates/variables
```

### Rating Templates

#### 🔵 List Ratings
```
GET /admin/settings/employee-feedback-ratings
```

#### 🔵 Search Ratings
```
GET /admin/settings/employee-feedback-ratings/search
```

#### 🔵 Get Rating by ID
```
GET /admin/settings/employee-feedback-ratings/:id
```

#### 🟡 Create Rating
```
POST /admin/settings/employee-feedback-ratings
```

#### 🟠 Update Ratings
```
PATCH /admin/settings/employee-feedback-ratings
```

#### 🔴 Delete Rating
```
DELETE /admin/settings/employee-feedback-ratings/:id
```

---

## 16. Admin Site Settings
🔐 **ต้องใช้ Bearer Token**

### 🟠 Update Site Settings
```
PATCH /admin/site/:siteCode/settings
```

---

## 17. Admin Auditing
🔐 **ต้องใช้ Bearer Token**

### 🔵 List Audit Logs
```
GET /admin/auditing
```
Query Parameters: pagination, search

---

## 18. Employee Feedback (360 Review)
🔐 **ต้องใช้ Bearer Token**

### Review Types

#### 🔵 Get Review Types
```
GET /admin/employee-feedback/review-types
```

### Email Operations

#### 🟡 Send Invitations
```
POST /admin/employee-feedback/invitations/send
```

#### 🟡 Send Reminders
```
POST /admin/employee-feedback/reminders/send
```

#### 🟡 Send Deadline Warnings
```
POST /admin/employee-feedback/deadline-warnings/send
```

### Token Management

#### 🟡 Generate Tokens
```
POST /admin/employee-feedback/tokens/generate
```

#### 🔵 Get Expired Tokens
```
GET /admin/employee-feedback/tokens/expired
```

#### 🟡 Cleanup Expired Tokens
```
POST /admin/employee-feedback/tokens/cleanup
```

### Survey Status

#### 🔵 Get Pending Reminders
```
GET /admin/employee-feedback/surveys/pending-reminders
```

#### 🔵 Get Deadline Warnings
```
GET /admin/employee-feedback/surveys/deadline-warnings
```

#### 🔵 Get New Reviewers
```
GET /admin/employee-feedback/surveys/:surveyId/reviewers/new
```

#### 🔵 Get Overdue Reviewers
```
GET /admin/employee-feedback/surveys/:surveyId/reviewers/overdue
```

#### 🔵 Get Near Deadline
```
GET /admin/employee-feedback/surveys/:surveyId/reviewers/near-deadline
```

### Email History

#### 🔵 Get Email History
```
GET /admin/employee-feedback/email-history/:reviewAssignmentId
```

---

## 19. Review Assignment
🔐 **ต้องใช้ Bearer Token**

### 🟡 Create Reviewer
```
POST /admin/employee-reviews/reviewers
```

### 🔵 List Reviewers
```
GET /admin/employee-reviews/reviewers
```

### 🔵 Get Survey Assignments
```
GET /admin/employee-reviews/survey/:surveyId/assignments
```

### 🔵 Get Review Tokens
```
GET /admin/employee-reviews/reviewers/tokens
```

### 🔵 Get Reviewer by ID
```
GET /admin/employee-reviews/reviewers/:id
```

### 🟣 Update Reviewer
```
PUT /admin/employee-reviews/reviewers/:id
```

### 🔴 Remove Reviewer
```
DELETE /admin/employee-reviews/reviewers/:id
```

### 🟡 Bulk Create Assignments
```
POST /admin/employee-reviews/assignments/bulk/create
```

### 🟡 Bulk Assign Reviewers
```
POST /admin/employee-reviews/reviewers/bulk/assign
```

### 🟡 Generate Tokens
```
POST /admin/employee-reviews/reviewers/tokens/generate
```

### 🔵 Get Reviews to Give
```
GET /admin/employee-reviews/:employeeId/reviews/to-give
```

### 🔵 Get Reviews to Receive
```
GET /admin/employee-reviews/:employeeId/reviews/to-receive
```

---

## 20. Analytic/Report Config
🔐 **ต้องใช้ Bearer Token**

### 🔵 Get Distinct Review Types
```
GET /admin/analytic/surveys/:surveyId/review-type-configs/distinct
```

### 🔵 Get Review Type Configs
```
GET /admin/analytic/surveys/:surveyId/review-type-configs
```

### 🟣 Update Review Type Configs
```
PUT /admin/analytic/surveys/:surveyId/review-type-configs
```

### 🔵 Get Report Section Localizes
```
GET /admin/analytic/surveys/:surveyId/report-section-localizes
```

### 🟣 Update Report Section Localizes
```
PUT /admin/analytic/surveys/:surveyId/report-section-localizes
```

### 🟣 Update Feedback 360 Config
```
PUT /admin/analytic/surveys/:surveyId/feedback-360-report/config
```

### 🟡 Bulk Update Performance Rating
```
POST /admin/analytic/surveys/:surveyId/feedback-360-report/9-grid/performance-rating
```

---

## สัญลักษณ์ HTTP Methods

- 🔵 **GET** - ดึงข้อมูล
- 🟡 **POST** - สร้างข้อมูลใหม่
- 🟠 **PATCH** - แก้ไขบางส่วน
- 🟣 **PUT** - แก้ไขทั้งหมด
- 🔴 **DELETE** - ลบข้อมูล
- 🟢 **HEAD** - ตรวจสอบ (ไม่ส่ง body กลับมา)

---

## Quick Start Guide for Postman

### 1. Login และเก็บ Token
1. สร้าง request ใหม่: `POST /api/auth/login`
2. ใส่ body:
```json
{
  "username": "your_email",
  "password": "your_password"
}
```
3. Copy token จาก response
4. ตั้งค่า Environment Variable ชื่อ `auth_token` ใน Postman

### 2. ใช้ Token กับ Admin Endpoints
1. เลือก Authorization tab
2. Type: Bearer Token
3. Token: `{{auth_token}}`

### 3. Test Health Check
```
GET /api/ping
```

### 4. Import Collection
- สามารถ copy endpoints เหล่านี้ไปสร้าง Postman Collection ได้
- แนะนำให้สร้าง folder แยกตาม category (Auth, Survey, Employee, etc.)

---

## Notes
- 🔐 = ต้อง authentication
- ✅ = ไม่ต้อง authentication
- Base URL ในตัวอย่างคือ `http://localhost:3000`
- สำหรับ production ให้เปลี่ยนเป็น URL จริง
- Response format: JSON
- Request Content-Type: `application/json` (ยกเว้น media upload ที่ใช้ `multipart/form-data`)

---

**Total Endpoints: 200+**

เอกสารนี้รวบรวม API endpoints ทั้งหมดจากโปรเจค Employee Survey Platform สำหรับใช้ในการทดสอบด้วย Postman
