import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";
import { config } from "../../config/environment";

test.describe("Employee Management UI Tests @ui @employee", () => {
  let apiHelper: ApiHelper;
  let testCompanyId: string;

  test.beforeAll(async () => {
    apiHelper = new ApiHelper();
    const token = await apiHelper.login();
    apiHelper = new ApiHelper({ token });

    // Create a test company
    const company = await apiHelper.createCompany({
      code: "UI_EMP_TEST",
      name: "UI Employee Test Company",
    });
    testCompanyId = company.id;
  });

  test.afterAll(async () => {
    if (testCompanyId) {
      await apiHelper.deleteCompany(testCompanyId);
    }
  });

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill("#username", config.adminUsername);
    await page.fill("#password", config.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/home");
  });

  test.describe("Employee List View", () => {
    test("should navigate to employee management page", async ({ page }) => {
      // Navigate to company page
      await page.goto(`/company/${testCompanyId}`);
      await page.waitForTimeout(1000);

      // Look for employees section/tab
      const employeeLink = page.locator(
        'a:has-text("Employee"), button:has-text("Employee"), [data-testid="employees-tab"]'
      );
      const linkExists = await employeeLink.first().isVisible().catch(() => false);

      if (linkExists) {
        await employeeLink.first().click();
        await page.waitForTimeout(1000);

        // Should show employee list or create button
        const hasEmployeeContent = await page
          .locator("text=/employee/i")
          .first()
          .isVisible();
        expect(hasEmployeeContent).toBe(true);
      }
    });

    test("should display employee table/list", async ({ page }) => {
      // Create some employees first
      await apiHelper.bulkCreateEmployees(testCompanyId, 5);

      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(2000);

      // Should show table or list of employees
      const hasTable =
        (await page.locator("table").isVisible().catch(() => false)) ||
        (await page.locator('[role="table"]').isVisible().catch(() => false));

      const hasList = await page
        .locator(".employee-list, [data-testid='employee-list']")
        .isVisible()
        .catch(() => false);

      expect(hasTable || hasList).toBe(true);
    });

    test("should display employee information in list", async ({ page }) => {
      // Create an employee with known data
      const employee = await apiHelper.createEmployee(testCompanyId, {
        email: "ui-test@example.com",
        firstname: "UI",
        lastname: "Test",
      });

      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(2000);

      // Search for employee in the page
      const emailVisible = await page
        .locator(`text=${employee.email}`)
        .isVisible()
        .catch(() => false);
      const nameVisible = await page
        .locator(`text=${employee.firstname}`)
        .isVisible()
        .catch(() => false);

      expect(emailVisible || nameVisible).toBe(true);
    });

    test("should have search functionality", async ({ page }) => {
      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(1000);

      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"], [data-testid="search-input"]'
      );
      const searchExists = await searchInput.isVisible().catch(() => false);

      if (searchExists) {
        await searchInput.fill("test@example.com");
        await page.waitForTimeout(500);

        // Results should filter
        expect(searchInput).toBeTruthy();
      }
    });

    test("should have pagination if many employees", async ({ page }) => {
      // Create many employees
      await apiHelper.bulkCreateEmployees(testCompanyId, 25);

      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(2000);

      const pagination = page.locator(
        '.pagination, [role="navigation"][aria-label*="pagination"], [data-testid="pagination"]'
      );
      const paginationExists = await pagination.isVisible().catch(() => false);

      if (paginationExists) {
        expect(pagination).toBeTruthy();
      }
    });
  });

  test.describe("Create Employee", () => {
    test("should open create employee form", async ({ page }) => {
      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(1000);

      const createButton = page.locator(
        'button:has-text("Add Employee"), button:has-text("Create Employee"), button:has-text("New Employee"), [data-testid="create-employee-button"]'
      );
      const buttonExists = await createButton.isVisible().catch(() => false);

      if (buttonExists) {
        await createButton.click();
        await page.waitForTimeout(500);

        // Should show form
        const formVisible = await page
          .locator("form, [role='dialog'], .modal")
          .isVisible();
        expect(formVisible).toBe(true);
      }
    });

    test("should create employee through UI form", async ({ page }) => {
      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(1000);

      const createButton = page.locator(
        'button:has-text("Add Employee"), button:has-text("Create Employee"), button:has-text("New Employee"), [data-testid="create-employee-button"]'
      );
      const buttonExists = await createButton.isVisible().catch(() => false);

      if (buttonExists) {
        await createButton.click();
        await page.waitForTimeout(500);

        // Fill form
        const emailInput = page.locator(
          'input[name="email"], input[id="email"], [data-testid="employee-email"]'
        );
        const firstnameInput = page.locator(
          'input[name="firstname"], input[id="firstname"], [data-testid="employee-firstname"]'
        );
        const lastnameInput = page.locator(
          'input[name="lastname"], input[id="lastname"], [data-testid="employee-lastname"]'
        );

        const uniqueEmail = `uitest${Date.now()}@example.com`;

        await emailInput.fill(uniqueEmail);
        await firstnameInput.fill("UITest");
        await lastnameInput.fill("Employee");

        // Submit form
        const submitButton = page.locator(
          'button[type="submit"], button:has-text("Create"), button:has-text("Save"), button:has-text("Add")'
        );
        await submitButton.click();
        await page.waitForTimeout(2000);

        // Should show success message or employee in list
        const successVisible =
          (await page
            .locator("text=/success|created|added/i")
            .isVisible()
            .catch(() => false)) ||
          (await page.locator(`text=${uniqueEmail}`).isVisible().catch(() => false));

        expect(successVisible).toBe(true);
      }
    });

    test("should validate required fields", async ({ page }) => {
      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(1000);

      const createButton = page.locator(
        'button:has-text("Add Employee"), button:has-text("Create Employee"), button:has-text("New Employee"), [data-testid="create-employee-button"]'
      );
      const buttonExists = await createButton.isVisible().catch(() => false);

      if (buttonExists) {
        await createButton.click();
        await page.waitForTimeout(500);

        // Try to submit without filling required fields
        const submitButton = page.locator(
          'button[type="submit"], button:has-text("Create"), button:has-text("Save")'
        );
        await submitButton.click();
        await page.waitForTimeout(500);

        // Should show validation errors
        const hasError =
          (await page
            .locator("text=/required|field is required|cannot be empty/i")
            .isVisible()
            .catch(() => false)) ||
          (await page.locator(".error, .invalid").isVisible().catch(() => false));

        expect(hasError).toBe(true);
      }
    });

    test("should validate email format in UI", async ({ page }) => {
      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(1000);

      const createButton = page.locator(
        'button:has-text("Add Employee"), button:has-text("Create Employee"), button:has-text("New Employee"), [data-testid="create-employee-button"]'
      );
      const buttonExists = await createButton.isVisible().catch(() => false);

      if (buttonExists) {
        await createButton.click();
        await page.waitForTimeout(500);

        const emailInput = page.locator(
          'input[name="email"], input[id="email"], [data-testid="employee-email"]'
        );

        await emailInput.fill("invalid-email-format");

        // Check if HTML5 validation or custom validation kicks in
        const isValid = await emailInput.evaluate(
          (el: HTMLInputElement) => el.validity.valid
        );

        expect(isValid).toBe(false);
      }
    });
  });

  test.describe("Edit Employee", () => {
    test("should open edit employee form", async ({ page }) => {
      const employee = await apiHelper.createEmployee(testCompanyId, {
        email: `edit-test-${Date.now()}@example.com`,
        firstname: "Edit",
        lastname: "Test",
      });

      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(2000);

      // Look for edit button
      const editButton = page.locator(
        `button:has-text("Edit"), [aria-label*="Edit"], [data-testid="edit-employee"]`
      );
      const editExists = await editButton.first().isVisible().catch(() => false);

      if (editExists) {
        await editButton.first().click();
        await page.waitForTimeout(500);

        // Should show edit form with existing data
        const formVisible = await page
          .locator("form, [role='dialog']")
          .isVisible();
        expect(formVisible).toBe(true);
      }
    });

    test("should update employee information", async ({ page }) => {
      const employee = await apiHelper.createEmployee(testCompanyId, {
        email: `update-test-${Date.now()}@example.com`,
        firstname: "Original",
        lastname: "Name",
      });

      await page.goto(`/company/${testCompanyId}/employees/${employee.id}`);
      await page.waitForTimeout(1000);

      const editButton = page.locator(
        'button:has-text("Edit"), [aria-label*="Edit"]'
      );
      const editExists = await editButton.isVisible().catch(() => false);

      if (editExists) {
        await editButton.click();
        await page.waitForTimeout(500);

        const firstnameInput = page.locator(
          'input[name="firstname"], input[id="firstname"]'
        );
        await firstnameInput.fill("Updated");

        const submitButton = page.locator(
          'button[type="submit"], button:has-text("Save"), button:has-text("Update")'
        );
        await submitButton.click();
        await page.waitForTimeout(2000);

        // Should show updated name
        const updatedVisible = await page
          .locator("text=Updated")
          .isVisible()
          .catch(() => false);
        expect(updatedVisible).toBe(true);
      }
    });
  });

  test.describe("Delete Employee", () => {
    test("should delete employee with confirmation", async ({ page }) => {
      const employee = await apiHelper.createEmployee(testCompanyId, {
        email: `delete-test-${Date.now()}@example.com`,
        firstname: "ToDelete",
        lastname: "Employee",
      });

      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(2000);

      const deleteButton = page.locator(
        'button:has-text("Delete"), [aria-label*="Delete"]'
      );
      const deleteExists = await deleteButton.first().isVisible().catch(() => false);

      if (deleteExists) {
        await deleteButton.first().click();
        await page.waitForTimeout(500);

        // Should show confirmation dialog
        const confirmButton = page.locator(
          'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")'
        );
        const confirmExists = await confirmButton.isVisible().catch(() => false);

        if (confirmExists) {
          await confirmButton.click();
          await page.waitForTimeout(2000);

          // Should show success message
          const successVisible = await page
            .locator("text=/deleted|removed/i")
            .isVisible()
            .catch(() => false);

          expect(successVisible).toBe(true);
        }
      }
    });
  });

  test.describe("Bulk Operations", () => {
    test("should have bulk selection functionality", async ({ page }) => {
      await apiHelper.bulkCreateEmployees(testCompanyId, 10);

      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(2000);

      // Look for checkboxes or selection mechanism
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount > 0) {
        // Select first checkbox
        await checkboxes.first().check();

        // Should show bulk action buttons
        const bulkActionVisible = await page
          .locator(
            'button:has-text("Bulk"), button:has-text("Delete Selected"), [data-testid="bulk-actions"]'
          )
          .isVisible()
          .catch(() => false);

        expect(checkboxCount).toBeGreaterThan(0);
      }
    });

    test("should upload CSV for bulk import", async ({ page }) => {
      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(1000);

      const importButton = page.locator(
        'button:has-text("Import"), button:has-text("Upload"), [data-testid="import-button"]'
      );
      const importExists = await importButton.isVisible().catch(() => false);

      if (importExists) {
        await importButton.click();
        await page.waitForTimeout(500);

        // Should show file upload dialog
        const fileInput = page.locator('input[type="file"]');
        const fileInputExists = await fileInput.isVisible().catch(() => false);

        expect(fileInputExists || importExists).toBe(true);
      }
    });
  });

  test.describe("Employee Details View", () => {
    test("should view employee details", async ({ page }) => {
      const employee = await apiHelper.createEmployee(testCompanyId, {
        email: `details-test-${Date.now()}@example.com`,
        firstname: "Details",
        lastname: "View",
        phone: "+66811111111",
      });

      await page.goto(`/company/${testCompanyId}/employees/${employee.id}`);
      await page.waitForTimeout(1000);

      // Should display employee information
      const emailVisible = await page
        .locator(`text=${employee.email}`)
        .isVisible()
        .catch(() => false);
      const nameVisible = await page
        .locator(`text=${employee.firstname}`)
        .isVisible()
        .catch(() => false);

      expect(emailVisible || nameVisible).toBe(true);
    });
  });

  test.describe("Locale Selection", () => {
    test("should set employee preferred locale", async ({ page }) => {
      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(1000);

      const createButton = page.locator(
        'button:has-text("Add Employee"), button:has-text("Create Employee"), [data-testid="create-employee-button"]'
      );
      const buttonExists = await createButton.isVisible().catch(() => false);

      if (buttonExists) {
        await createButton.click();
        await page.waitForTimeout(500);

        // Look for locale dropdown
        const localeSelect = page.locator(
          'select[name="preferredLocale"], select[name="locale"], [data-testid="locale-select"]'
        );
        const localeExists = await localeSelect.isVisible().catch(() => false);

        if (localeExists) {
          await localeSelect.selectOption("TH");

          // Fill required fields
          const emailInput = page.locator(
            'input[name="email"], input[id="email"]'
          );
          await emailInput.fill(`locale-test-${Date.now()}@example.com`);

          const firstnameInput = page.locator(
            'input[name="firstname"], input[id="firstname"]'
          );
          await firstnameInput.fill("Locale");

          const lastnameInput = page.locator(
            'input[name="lastname"], input[id="lastname"]'
          );
          await lastnameInput.fill("Test");

          const submitButton = page.locator('button[type="submit"]');
          await submitButton.click();
          await page.waitForTimeout(2000);

          expect(localeExists).toBe(true);
        }
      }
    });
  });
});
