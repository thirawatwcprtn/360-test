# 🎯 Employee Survey Platform - Automated Testing

## ภาพรวม (Overview)

ระบบทดสอบอัตโนมัติที่ครบครันสำหรับ Employee Survey Platform โดยใช้ **Playwright Testing Framework**

ระบบนี้ครอบคลุมการทดสอบทุกส่วนของแพลตฟอร์ม ตั้งแต่ API, UI, E2E ไปจนถึง Integration Testing

---

## 🌟 จุดเด่น (Features)

### ✅ การทดสอบครอบคลุม 217+ Tests
- **Authentication & Authorization** - การเข้าสู่ระบบและความปลอดภัย
- **Employee Management** - การจัดการพนักงาน CRUD, Bulk Operations
- **Survey Response** - การตอบแบบสอบถาม, Multi-locale (EN/TH)
- **Reporting & Analytics** - รายงานและการวิเคราะห์ข้อมูล
- **Integration Testing** - การทดสอบระบบทั้งหมดแบบบูรณาการ

### 🚀 ความสามารถพิเศษ
- **Multi-browser Support** - Chrome, Firefox, Safari, Mobile
- **Multi-locale Testing** - รองรับภาษาไทยและอังกฤษ
- **Automatic Screenshots** - จับภาพหน้าจอเมื่อ test ล้มเหลว
- **Video Recording** - บันทึกวิดีโอการทำงาน
- **Parallel Execution** - รันพร้อมกันเพื่อความเร็ว
- **CI/CD Ready** - พร้อมใช้งานใน Pipeline

---

## 📋 ข้อกำหนดเบื้องต้น (Prerequisites)

### 1. ซอฟต์แวร์ที่ต้องมี
- **Node.js** >= 18.x
- **pnpm** >= 8.x
- **Git**

### 2. Services ที่ต้องรันก่อน
- **Backend API** - รันที่ `http://localhost:3001`
- **Web Backoffice** - รันที่ `http://localhost:8000`
- **Database** - PostgreSQL หรือ database ที่ใช้

---

## 🔧 การติดตั้ง (Installation)

### ขั้นตอนที่ 1: เข้าไปที่โฟลเดอร์ test
```bash
cd employee-survey-platform/test
```

### ขั้นตอนที่ 2: ติดตั้ง Dependencies
```bash
pnpm install
```

### ขั้นตอนที่ 3: ติดตั้ง Browsers สำหรับ Playwright
```bash
pnpm install:browsers
```

### ขั้นตอนที่ 4: ตั้งค่า Environment Variables
```bash
# คัดลอกไฟล์ .env ตัวอย่าง
cp env.example .env

# แก้ไขไฟล์ .env ให้ตรงกับสภาพแวดล้อมของคุณ
nano .env  # หรือใช้ text editor ที่ชอบ
```

### ตัวอย่าง `.env` File
```bash
NODE_ENV=development
API_BASE_URL=http://localhost:3001
WEB_BASE_URL=http://localhost:8000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin1235
```

### ขั้นตอนที่ 5: ตรวจสอบการตั้งค่า
```bash
pnpm validate:env
```

---

## 🎮 วิธีการรัน Tests

### 🏃 การรัน Test พื้นฐาน

#### รัน Test ทั้งหมด
```bash
pnpm test
```

#### รัน Test ที่เพิ่มใหม่ทั้งหมด
```bash
pnpm test:all-new
```

#### รันแบบเห็นหน้า Browser (Headed Mode)
```bash
pnpm test:headed
```

#### รันแบบ Debug
```bash
pnpm test:debug
```

---

### 📦 การรันตามประเภท Test

#### API Tests - ทดสอบ Backend API
```bash
pnpm test:api
```

#### UI Tests - ทดสอบหน้า User Interface
```bash
pnpm test:ui
```

#### E2E Tests - ทดสอบระบบจากต้นจนจบ
```bash
pnpm test:e2e
```

#### Integration Tests - ทดสอบการทำงานร่วมกันของระบบ
```bash
pnpm test:integration
```

---

### 🎯 การรันตามฟีเจอร์

#### 🔐 Authentication Tests
```bash
# ทดสอบการ Login, Logout, Security
pnpm test:auth

# เฉพาะ API
pnpm test:api:auth

# เฉพาะ UI
pnpm test:ui:auth
```

#### 👥 Employee Management Tests
```bash
# ทดสอบการจัดการพนักงาน
pnpm test:employee

# เฉพาะ API (CRUD, Bulk operations)
pnpm test:api:employee

# เฉพาะ UI (Forms, Lists, Search)
pnpm test:ui:employee

# E2E Workflows
pnpm test:e2e:employee
```

#### 📝 Survey Response Tests
```bash
# ทดสอบการตอบแบบสอบถาม
pnpm test:survey-response

# เฉพาะ API (Submission, Validation)
pnpm test:api:survey-response

# เฉพาะ UI (Forms, Multi-locale)
pnpm test:ui:survey-response
```

#### 📊 Reporting & Analytics Tests
```bash
# ทดสอบรายงานและสถิติ
pnpm test:reporting

# เฉพาะ API (Export, Statistics)
pnpm test:api:reporting

# เฉพาะ UI (Dashboard, Charts)
pnpm test:ui:reporting
```

---

### ⚡ การรันแบบเร็ว (Quick & Parallel)

#### รันแบบขนาน (Parallel)
```bash
# รัน test พร้อมกัน 4 workers
pnpm test:parallel
```

#### รัน API Tests เร็วที่สุด
```bash
# API tests with 4 parallel workers
pnpm test:quick
```

#### รันเฉพาะ Regression Tests
```bash
pnpm test:regression
```

---

### 🌍 การรันตาม Environment

#### Development Environment
```bash
pnpm test:dev
```

#### Staging Environment
```bash
pnpm test:staging
```

#### Production Environment
```bash
pnpm test:prod
```

---

## 📊 การดูผลลัพธ์ Test (Test Reports)

### เปิด HTML Report
```bash
pnpm test:report
```

Report จะแสดง:
- ✅ Test ที่ผ่าน / ❌ Test ที่ล้มเหลว
- ⏱️ เวลาที่ใช้ในการรัน
- 📸 Screenshots เมื่อ test ล้มเหลว
- 🎥 Video recordings
- 🔍 Trace files สำหรับ debug

### ตำแหน่งไฟล์ Report
```
test/
├── playwright-report/          # HTML Report
├── test-results/              # Screenshots, Videos, Traces
│   ├── results.json          # JSON Report
│   └── results.xml           # JUnit Report (สำหรับ CI/CD)
```

---

## 🔍 การ Debug Tests

### วิธีที่ 1: Debug Mode
```bash
pnpm test:debug
```
จะเปิด Playwright Inspector ให้สามารถ:
- Step through แต่ละคำสั่ง
- ดู DOM elements
- Execute code ใน console

### วิธีที่ 2: Headed Mode + Slow Motion
```bash
# แก้ไขใน playwright.config.ts
use: {
  headless: false,
  slowMo: 1000  // ชะลอ 1 วินาที
}
```

### วิธีที่ 3: Console Logs
```typescript
test('my test', async ({ page }) => {
  console.log('Current URL:', page.url());
  await page.screenshot({ path: 'debug.png' });
});
```

---

## 📝 ตัวอย่างการรัน Tests

### ตัวอย่างที่ 1: รัน Test แรก
```bash
# 1. เปิด Terminal
cd employee-survey-platform/test

# 2. รัน Authentication tests
pnpm test:auth

# 3. ดูผลลัพธ์
pnpm test:report
```

### ตัวอย่างที่ 2: รัน Test ทั้งหมดแบบ CI/CD
```bash
# 1. ตรวจสอบ environment
pnpm validate:env

# 2. รัน all tests
pnpm test

# 3. ดู reports
pnpm test:report
```

### ตัวอย่างที่ 3: Debug Test ที่ล้มเหลว
```bash
# 1. รันแบบ debug เฉพาะ test ที่ต้องการ
pnpm test:debug tests/api/auth.api.test.ts

# 2. ใช้ Playwright Inspector ดู error
# 3. แก้ไข code
# 4. รันใหม่
```

---

## 🏗️ โครงสร้างไฟล์ Tests

```
test/
├── tests/
│   ├── api/                          # API Tests
│   │   ├── auth.api.test.ts         # Authentication
│   │   ├── employee.api.test.ts     # Employee Management
│   │   ├── survey-response.api.test.ts
│   │   └── reporting.api.test.ts
│   │
│   ├── ui/                           # UI Tests
│   │   ├── auth.ui.test.ts
│   │   ├── employee.ui.test.ts
│   │   ├── survey-response.ui.test.ts
│   │   └── reporting.ui.test.ts
│   │
│   ├── e2e/                          # E2E Tests
│   │   └── employee-workflow.e2e.test.ts
│   │
│   ├── integration/                  # Integration Tests
│   │   └── complete-platform.integration.test.ts
│   │
│   └── utils/                        # Utilities
│       ├── api-helper.ts            # API Helper Class
│       └── ui-helper.ts             # UI Helper Functions
│
├── config/                           # Configuration
│   ├── environment.ts               # Environment Config
│   └── environments/                # Environment-specific settings
│
├── playwright.config.ts             # Playwright Configuration
├── package.json                     # Dependencies & Scripts
└── .env                            # Environment Variables
```

---

## 🎓 คู่มือเพิ่มเติม

### เอกสารสำคัญ
- **[NEW_TESTS_GUIDE.md](./NEW_TESTS_GUIDE.md)** - คู่มือการใช้งาน tests แบบละเอียด
- **[README.md](./README.md)** - ข้อมูลทั่วไปของ test suite
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - คู่มือการติดตั้งแบบละเอียด

### เอกสารภายนอก
- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Faker.js Documentation](https://fakerjs.dev)

---

## ⚠️ การแก้ปัญหา (Troubleshooting)

### ปัญหา: Test ล้มเหลวด้วย "Connection refused"
**วิธีแก้:**
```bash
# ตรวจสอบว่า services รันอยู่หรือไม่
curl http://localhost:3001/_docs  # Backend API
curl http://localhost:8000        # Web Backoffice

# ถ้ายังไม่รัน ให้เปิด services ก่อน
cd ../backend-api && pnpm start:dev:app
cd ../web-backoffice && pnpm start:dev
```

### ปัญหา: "Browser not found"
**วิธีแก้:**
```bash
pnpm install:browsers
```

### ปัญหา: Authentication ล้มเหลว
**วิธีแก้:**
```bash
# ตรวจสอบ credentials ใน .env
cat .env | grep ADMIN

# ทดสอบ login ด้วย curl
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin1235"}'
```

### ปัญหา: Test timeout
**วิธีแก้:**
```bash
# เพิ่ม timeout ใน playwright.config.ts
timeout: 60000,  // 60 seconds
```

### ปัญหา: Port ถูกใช้งานอยู่
**วิธีแก้:**
```bash
# หา process ที่ใช้ port
lsof -i :3001
lsof -i :8000

# ปิด process
kill -9 <PID>
```

---

## 📈 สถิติ Test Coverage

| ฟีเจอร์ | API Tests | UI Tests | E2E Tests | Integration |
|--------|-----------|----------|-----------|-------------|
| Authentication | 20+ | 15+ | - | ✅ |
| Employee Management | 30+ | 20+ | 5+ | ✅ |
| Survey Response | 35+ | 25+ | - | ✅ |
| Reporting | 40+ | 20+ | - | ✅ |
| **รวมทั้งหมด** | **125+** | **80+** | **5+** | **7+** |

### Test Coverage: **217+ Tests**

---

## 🚀 เริ่มต้นใช้งาน (Quick Start)

### สำหรับผู้เริ่มต้น

```bash
# 1. ติดตั้ง
cd test
pnpm install
pnpm install:browsers

# 2. ตั้งค่า
cp env.example .env
# แก้ไข .env ให้ถูกต้อง

# 3. รัน test แรก
pnpm test:auth

# 4. ดูผลลัพธ์
pnpm test:report
```

### สำหรับผู้พัฒนา

```bash
# รัน test ขณะพัฒนา
pnpm test:headed

# รัน test เฉพาะไฟล์
pnpm test tests/api/auth.api.test.ts

# Debug test
pnpm test:debug tests/ui/employee.ui.test.ts

# รัน test แบบขนาน
pnpm test:parallel
```

### สำหรับ CI/CD

```bash
# รัน test ทั้งหมดใน CI
pnpm test

# รัน test ตาม environment
pnpm test:staging

# ดู report
pnpm test:report
```

---

## 💡 Tips & Tricks

### 1. รัน Test เฉพาะที่ต้องการ
```bash
# รันเฉพาะ test ที่มีคำว่า "login"
pnpm test -- -g "login"

# รันเฉพาะไฟล์
pnpm test tests/api/auth.api.test.ts
```

### 2. Update Snapshots
```bash
pnpm test -- --update-snapshots
```

### 3. รันบน Browser เฉพาะ
```bash
pnpm test -- --project=chromium
pnpm test -- --project=firefox
pnpm test -- --project=webkit
```

### 4. รัน Test ที่ล้มเหลวอีกครั้ง
```bash
pnpm test -- --last-failed
```

---

## 📞 ติดต่อ & สนับสนุน

หากมีปัญหาหรือข้อสงสัย:

1. อ่าน **[NEW_TESTS_GUIDE.md](./NEW_TESTS_GUIDE.md)** สำหรับรายละเอียดเพิ่มเติม
2. ตรวจสอบ [Playwright Documentation](https://playwright.dev)
3. เปิด Issue ใน GitHub repository
4. ติดต่อทีมพัฒนา

---

## 📜 License

MIT License - ดูรายละเอียดใน LICENSE file

---

**สร้างด้วย ❤️ โดย Claude Code**

*อัปเดตล่าสุด: December 2024*
