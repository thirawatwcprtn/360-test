# New Playwright Tests Guide

This document describes the newly added comprehensive test suite for the Employee Survey Platform.

## Overview

A complete suite of automated tests has been added covering:
- **Authentication & Authorization**
- **Employee Management**
- **Survey Response & Submission**
- **Reporting & Analytics**
- **Cross-feature Integration Tests**

## Test Structure

```
test/tests/
├── api/
│   ├── auth.api.test.ts                    # Authentication API tests
│   ├── employee.api.test.ts                # Employee management API tests
│   ├── survey-response.api.test.ts         # Survey response API tests
│   └── reporting.api.test.ts               # Reporting & analytics API tests
├── ui/
│   ├── auth.ui.test.ts                     # Authentication UI tests
│   ├── employee.ui.test.ts                 # Employee management UI tests
│   ├── survey-response.ui.test.ts          # Survey response UI tests
│   └── reporting.ui.test.ts                # Reporting & analytics UI tests
├── e2e/
│   └── employee-workflow.e2e.test.ts       # Employee lifecycle E2E tests
└── integration/
    └── complete-platform.integration.test.ts # Full platform integration tests
```

## Test Tags

All tests are tagged for easy filtering:

- `@api` - API tests
- `@ui` - UI tests
- `@e2e` - End-to-end tests
- `@integration` - Integration tests
- `@auth` - Authentication tests
- `@employee` - Employee management tests
- `@survey-response` - Survey response tests
- `@reporting` - Reporting tests
- `@regression` - Regression tests

## Running Tests

### Run All Tests
```bash
cd test
pnpm test
```

### Run by Feature Area

**Authentication Tests**
```bash
pnpm test:auth              # All auth tests
pnpm test:api:auth          # Auth API tests only
pnpm test:ui:auth           # Auth UI tests only
```

**Employee Management Tests**
```bash
pnpm test:employee          # All employee tests
pnpm test:api:employee      # Employee API tests
pnpm test:ui:employee       # Employee UI tests
pnpm test:e2e:employee      # Employee E2E tests
```

**Survey Response Tests**
```bash
pnpm test:survey-response       # All survey response tests
pnpm test:api:survey-response   # Survey response API tests
pnpm test:ui:survey-response    # Survey response UI tests
```

**Reporting Tests**
```bash
pnpm test:reporting         # All reporting tests
pnpm test:api:reporting     # Reporting API tests
pnpm test:ui:reporting      # Reporting UI tests
```

**Integration Tests**
```bash
pnpm test:integration       # All integration tests
```

### Run by Test Type

```bash
pnpm test:api               # All API tests
pnpm test:ui                # All UI tests
pnpm test:e2e               # All E2E tests
```

### Run All New Tests
```bash
pnpm test:all-new           # Run all newly added tests
```

### Performance-Optimized Runs

```bash
pnpm test:quick             # Fast API tests with parallel execution
pnpm test:parallel          # All tests with parallel workers
```

### Environment-Specific Runs

```bash
pnpm test:dev               # Run against development environment
pnpm test:staging           # Run against staging environment
pnpm test:prod              # Run against production environment
```

### Debug Mode

```bash
pnpm test:debug             # Run in debug mode with Playwright Inspector
pnpm test:headed            # Run with browser visible
```

## Test Coverage

### Authentication & Authorization Tests

**API Tests** (`tests/api/auth.api.test.ts`)
- Login with valid/invalid credentials
- Token validation
- Session management
- Security testing (SQL injection, XSS prevention)
- Rate limiting
- Password security

**UI Tests** (`tests/ui/auth.ui.test.ts`)
- Login page display and accessibility
- Form validation
- Successful login flow
- Error handling
- Password masking
- Session persistence
- Logout functionality
- Protected route access

### Employee Management Tests

**API Tests** (`tests/api/employee.api.test.ts`)
- CRUD operations
- Bulk create/update/delete
- Employee search and filtering
- Data validation (email, phone, locale)
- Pagination
- Security (cross-company access prevention)

**UI Tests** (`tests/ui/employee.ui.test.ts`)
- Employee list view
- Create employee form
- Edit employee
- Delete with confirmation
- Bulk operations
- CSV import/export
- Locale selection

**E2E Tests** (`tests/e2e/employee-workflow.e2e.test.ts`)
- Complete lifecycle: Create → View → Edit → Delete
- Bulk creation and survey assignment
- Search and filter workflow
- Export workflow
- Multi-company isolation
- Performance with large datasets

### Survey Response & Submission Tests

**API Tests** (`tests/api/survey-response.api.test.ts`)
- Survey access (multi-locale)
- Complete survey submission
- Required field validation
- Conditional question logic
- Multi-locale responses
- Token-based access
- Input sanitization (XSS, SQL injection prevention)
- Answer validation (type, length, range)

**UI Tests** (`tests/ui/survey-response.ui.test.ts`)
- Survey page loading
- Question interaction (rating, text, yes/no)
- Form validation
- Submission workflow
- Locale switching
- Progress indication
- Responsive design (mobile, tablet)
- Accessibility (ARIA labels, keyboard navigation)

### Reporting & Analytics Tests

**API Tests** (`tests/api/reporting.api.test.ts`)
- Export job creation and status tracking
- Multiple export formats (CSV, Excel, JSON, PDF)
- Survey statistics
- Question-level analytics
- Response distribution
- Date range filtering
- Dashboard metrics
- Comparative analytics
- Real-time analytics
- Report generation
- Data privacy (anonymization, thresholds)

**UI Tests** (`tests/ui/reporting.ui.test.ts`)
- Dashboard display
- Visual charts and graphs
- Export functionality
- Response viewing and pagination
- Statistics display
- Filters and date ranges
- Real-time updates

### Integration Tests

**Complete Platform Tests** (`tests/integration/complete-platform.integration.test.ts`)
- End-to-end workflow: Company → Employees → Survey → Reporting
- Multi-locale survey workflow
- 360-degree review workflow
- Bulk import and export
- Security and access control
- Performance testing with large datasets
- Data consistency and cascade deletions

## Test Data Management

All tests use the `ApiHelper` utility class which:
- Automatically generates test data using Faker.js
- Manages authentication tokens
- Provides cleanup methods
- Handles test data isolation

## Writing New Tests

### Example: Adding a New API Test

```typescript
import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";

test.describe("My Feature API Tests @api @my-feature", () => {
  let apiHelper: ApiHelper;

  test.beforeAll(async () => {
    apiHelper = new ApiHelper();
    const token = await apiHelper.login();
    apiHelper = new ApiHelper({ token });
  });

  test("should do something", async () => {
    // Your test code
    const result = await apiHelper.api.get("/my-endpoint");
    expect(result.data).toBeDefined();
  });

  test.afterAll(async () => {
    // Cleanup
  });
});
```

### Example: Adding a New UI Test

```typescript
import { test, expect } from "@playwright/test";
import { config } from "../../config/environment";

test.describe("My Feature UI Tests @ui @my-feature", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill("#username", config.adminUsername);
    await page.fill("#password", config.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/home");
  });

  test("should display my feature", async ({ page }) => {
    await page.goto("/my-feature");
    await expect(page.locator(".my-element")).toBeVisible();
  });
});
```

## Best Practices

1. **Always use tags** - Tag tests with `@api`, `@ui`, `@e2e`, and feature-specific tags
2. **Clean up test data** - Use `afterAll` or `afterEach` to delete created resources
3. **Use ApiHelper** - Leverage the helper class for API operations
4. **Test isolation** - Each test should be independent
5. **Descriptive names** - Use clear test descriptions
6. **Handle async properly** - Always await async operations
7. **Check for element existence** - Use `.catch(() => false)` for optional elements
8. **Multi-locale testing** - Test with both EN and TH locales where applicable

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    cd test
    pnpm install
    pnpm install:browsers
    pnpm test
```

## Test Reports

After running tests, view the HTML report:

```bash
pnpm test:report
```

This opens an interactive report showing:
- Pass/fail status
- Test duration
- Screenshots on failure
- Video recordings
- Trace files for debugging

## Troubleshooting

**Tests failing with 404 errors**
- Ensure backend API is running on port 3001
- Ensure web-backoffice is running on port 8000
- Check `.env` file configuration

**Authentication failures**
- Verify admin credentials in `.env`
- Check if authentication token is being generated correctly

**Timeout errors**
- Increase timeout in `playwright.config.ts`
- Check if services are responding slowly
- Verify network connectivity

**Element not found errors**
- UI may have changed - update selectors
- Add appropriate wait conditions
- Check if element is in a different viewport

## Coverage Summary

| Feature Area | API Tests | UI Tests | E2E Tests | Integration |
|--------------|-----------|----------|-----------|-------------|
| Authentication | ✅ 20+ tests | ✅ 15+ tests | - | ✅ Included |
| Employee Management | ✅ 30+ tests | ✅ 20+ tests | ✅ 5 workflows | ✅ Included |
| Survey Response | ✅ 35+ tests | ✅ 25+ tests | - | ✅ Included |
| Reporting & Analytics | ✅ 40+ tests | ✅ 20+ tests | - | ✅ Included |
| **Total** | **125+ tests** | **80+ tests** | **5+ workflows** | **7+ scenarios** |

## Next Steps

1. Run the test suite: `pnpm test:all-new`
2. Review test results and fix any failures
3. Integrate into CI/CD pipeline
4. Add new tests as features are developed
5. Monitor test execution time and optimize as needed

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Faker.js Documentation](https://fakerjs.dev)
- [Project README](./README.md)
- [Setup Guide](./SETUP_GUIDE.md)
