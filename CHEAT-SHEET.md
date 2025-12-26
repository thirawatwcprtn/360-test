# 📝 Playwright Tests - Cheat Sheet

## 🎯 คำสั่งพื้นฐาน

| คำสั่ง | ความหมาย |
|--------|----------|
| `pnpm test` | รัน test ทั้งหมด |
| `pnpm test:headed` | รันแบบเห็น browser |
| `pnpm test:debug` | รันแบบ debug mode |
| `pnpm test:report` | เปิด HTML report |
| `pnpm install:browsers` | ติดตั้ง browsers |

---

## 🏷️ รันตามประเภท

| คำสั่ง | Tests | เวลา |
|--------|-------|------|
| `pnpm test:api` | API tests (125+) | 1-2 นาที |
| `pnpm test:ui` | UI tests (80+) | 3-5 นาที |
| `pnpm test:e2e` | E2E tests (5+) | 2-3 นาที |
| `pnpm test:integration` | Integration (7+) | 5-10 นาที |

---

## 🎨 รันตามฟีเจอร์

### Authentication 🔐
```bash
pnpm test:auth          # ทั้งหมด
pnpm test:api:auth      # API only
pnpm test:ui:auth       # UI only
```

### Employee Management 👥
```bash
pnpm test:employee          # ทั้งหมด
pnpm test:api:employee      # API only
pnpm test:ui:employee       # UI only
pnpm test:e2e:employee      # E2E only
```

### Survey Response 📝
```bash
pnpm test:survey-response       # ทั้งหมด
pnpm test:api:survey-response   # API only
pnpm test:ui:survey-response    # UI only
```

### Reporting 📊
```bash
pnpm test:reporting         # ทั้งหมด
pnpm test:api:reporting     # API only
pnpm test:ui:reporting      # UI only
```

---

## ⚡ รันแบบเร็ว

| คำสั่ง | ความหมาย |
|--------|----------|
| `pnpm test:quick` | API tests แบบขนาน |
| `pnpm test:parallel` | รันทั้งหมดแบบขนาน |
| `pnpm test:all-new` | รัน test ใหม่ทั้งหมด |

---

## 🌍 รันตาม Environment

```bash
pnpm test:dev       # Development
pnpm test:staging   # Staging
pnpm test:prod      # Production
```

---

## 🔧 Advanced Commands

### รันเฉพาะไฟล์
```bash
pnpm test tests/api/auth.api.test.ts
pnpm test tests/ui/employee.ui.test.ts
```

### รัน test ที่มีชื่อตรงกัน
```bash
pnpm test -- -g "login"
pnpm test -- -g "create employee"
```

### รันบน Browser เฉพาะตัว
```bash
pnpm test -- --project=chromium    # Chrome
pnpm test -- --project=firefox     # Firefox
pnpm test -- --project=webkit      # Safari
```

### รัน test ที่ล้มเหลว
```bash
pnpm test -- --last-failed
```

### Update Snapshots
```bash
pnpm test -- --update-snapshots
```

---

## 🐛 Debugging Commands

### Debug Mode
```bash
pnpm test:debug                           # Debug ทั้งหมด
pnpm test:debug tests/api/auth.api.test.ts  # Debug ไฟล์เดียว
```

### Headed Mode (เห็น Browser)
```bash
pnpm test:headed
pnpm test:headed -- --project=chromium
```

### Slow Motion
```bash
pnpm test:headed -- --slow-mo=1000  # ชะลอ 1 วินาที
```

---

## 📊 Reports & Logs

### เปิด Reports
```bash
pnpm test:report                    # เปิด HTML report
```

### ตำแหน่งไฟล์
```
test/
├── playwright-report/     # HTML Report
│   └── index.html
├── test-results/         # Test Results
│   ├── results.json     # JSON
│   ├── results.xml      # JUnit (CI/CD)
│   └── screenshots/     # Screenshots
```

---

## ⚙️ Configuration

### Environment Variables
```bash
# ไฟล์ .env
API_BASE_URL=http://localhost:3001
WEB_BASE_URL=http://localhost:8000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin1235
```

### Validate Environment
```bash
pnpm validate:env
```

---

## 🆘 Troubleshooting

### ปัญหา: Connection refused
```bash
# ตรวจสอบ services
curl http://localhost:3001/_docs
curl http://localhost:8000

# เปิด services
cd ../backend-api && pnpm start:dev:app
cd ../web-backoffice && pnpm start:dev
```

### ปัญหา: Browser not found
```bash
pnpm install:browsers
```

### ปัญหา: Authentication failed
```bash
cat .env | grep ADMIN
nano .env  # แก้ไข credentials
```

### ปัญหา: Port ถูกใช้
```bash
# macOS/Linux
lsof -i :3001
kill -9 <PID>

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## 📈 Test Tags

| Tag | ความหมาย |
|-----|----------|
| `@api` | API tests |
| `@ui` | UI tests |
| `@e2e` | E2E tests |
| `@integration` | Integration tests |
| `@auth` | Authentication tests |
| `@employee` | Employee tests |
| `@survey-response` | Survey response tests |
| `@reporting` | Reporting tests |
| `@regression` | Regression tests |

---

## 💡 Tips & Tricks

### ติดตั้งครั้งแรก
```bash
cd test
pnpm install
pnpm install:browsers
cp env.example .env
```

### รัน test ขณะพัฒนา
```bash
pnpm test:headed                # เห็น browser
pnpm test -- --project=chromium # Chrome only
pnpm test -- -g "login"         # เฉพาะ login
```

### รัน test แบบ CI/CD
```bash
pnpm validate:env
pnpm test
pnpm test:report
```

---

## 📋 Checklist

### ก่อนรัน Test ✅
- [ ] Backend API รันอยู่ (port 3001)
- [ ] Web Backoffice รันอยู่ (port 8000)
- [ ] Database รันอยู่
- [ ] ไฟล์ .env ตั้งค่าแล้ว
- [ ] ติดตั้ง dependencies แล้ว

### หลังรัน Test ✅
- [ ] ดูผลลัพธ์ใน terminal
- [ ] เปิด HTML report
- [ ] ตรวจสอบ screenshots
- [ ] แก้ไข code ถ้าจำเป็น

---

## 🎓 Learning Path

### Day 1 - เริ่มต้น
```bash
pnpm install
pnpm install:browsers
pnpm test:auth
pnpm test:report
```

### Day 2 - ทดลอง
```bash
pnpm test:api
pnpm test:ui
pnpm test:e2e
```

### Day 3 - Debug
```bash
pnpm test:headed
pnpm test:debug
```

### Day 4 - รัน All
```bash
pnpm test
pnpm test:report
```

---

## 📚 Documentation

- **[QUICK-START.md](./QUICK-START.md)** - เริ่มต้นใน 5 นาที
- **[INTRODUCTION.md](./INTRODUCTION.md)** - คู่มือฉบับสมบูรณ์
- **[วิธีการรัน-TESTS.md](./วิธีการรัน-TESTS.md)** - คู่มือละเอียดภาษาไทย
- **[NEW_TESTS_GUIDE.md](./NEW_TESTS_GUIDE.md)** - รายละเอียด tests

---

## 📊 Stats

```
Total Tests: 217+
├── API: 125+
├── UI: 80+
├── E2E: 5+
└── Integration: 7+

Features Covered:
├── Authentication (35+ tests)
├── Employee Management (55+ tests)
├── Survey Response (60+ tests)
├── Reporting (60+ tests)
└── Integration (7+ tests)
```

---

**Happy Testing! 🧪**

*พิมพ์หน้านี้ไว้ใช้ประจำ!*
