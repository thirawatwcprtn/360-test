# ⚡ Quick Start Guide - Playwright Tests

## 🚀 เริ่มใช้งานภายใน 5 นาที

### Step 1: ติดตั้ง (ครั้งแรกเท่านั้น)

```bash
cd employee-survey-platform/test
pnpm install
pnpm install:browsers
cp env.example .env
```

แก้ไข `.env`:
```bash
API_BASE_URL=http://localhost:3001
WEB_BASE_URL=http://localhost:8000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin1235
```

### Step 2: รัน Test

```bash
# รัน test ทั้งหมด
pnpm test

# หรือรัน test เฉพาะที่เพิ่มใหม่
pnpm test:all-new
```

### Step 3: ดูผลลัพธ์

```bash
pnpm test:report
```

---

## 📋 คำสั่งที่ใช้บ่อย

```bash
# รัน test แบบเห็น browser
pnpm test:headed

# รัน test แบบ debug
pnpm test:debug

# รัน API tests (เร็วที่สุด)
pnpm test:api

# รัน UI tests
pnpm test:ui

# รัน test เฉพาะ authentication
pnpm test:auth

# รัน test เฉพาะ employee management
pnpm test:employee

# รัน test เฉพาะ survey response
pnpm test:survey-response

# รัน test เฉพาะ reporting
pnpm test:reporting
```

---

## 🐛 แก้ปัญหาเบื้องต้น

### ❌ เชื่อมต่อ server ไม่ได้

```bash
# ตรวจสอบว่า services รันอยู่
curl http://localhost:3001/_docs
curl http://localhost:8000

# ถ้าไม่รัน ให้เปิด
cd ../backend-api && pnpm start:dev:app
cd ../web-backoffice && pnpm start:dev
```

### ❌ Browser not found

```bash
pnpm install:browsers
```

### ❌ Authentication failed

```bash
# ตรวจสอบ credentials ใน .env
cat .env | grep ADMIN
```

---

## 📊 โครงสร้าง Tests

```
217+ Tests ทั้งหมด แบ่งเป็น:
├── API Tests (125+)
│   ├── Authentication (20+)
│   ├── Employee Management (30+)
│   ├── Survey Response (35+)
│   └── Reporting (40+)
├── UI Tests (80+)
│   ├── Authentication (15+)
│   ├── Employee Management (20+)
│   ├── Survey Response (25+)
│   └── Reporting (20+)
├── E2E Tests (5+)
└── Integration Tests (7+)
```

---

## 💡 Tips

```bash
# รันเฉพาะไฟล์
pnpm test tests/api/auth.api.test.ts

# รัน test ที่มีคำว่า "login"
pnpm test -- -g "login"

# รันบน Chrome เท่านั้น
pnpm test -- --project=chromium

# รัน test ที่ล้มเหลวอีกครั้ง
pnpm test -- --last-failed
```

---

## 📚 เอกสารเพิ่มเติม

- **[INTRODUCTION.md](./INTRODUCTION.md)** - คู่มือฉบับสมบูรณ์
- **[วิธีการรัน-TESTS.md](./วิธีการรัน-TESTS.md)** - คู่มือละเอียดภาษาไทย
- **[NEW_TESTS_GUIDE.md](./NEW_TESTS_GUIDE.md)** - รายละเอียด tests ทั้งหมด

---

**Happy Testing! 🧪**
