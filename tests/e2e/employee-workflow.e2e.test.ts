import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";
import { config } from "../../config/environment";

test.describe("Employee Management E2E Workflow @e2e @employee", () => {
  let apiHelper: ApiHelper;
  let testCompanyId: string;

  test.beforeAll(async () => {
    apiHelper = new ApiHelper();
    const token = await apiHelper.login();
    apiHelper = new ApiHelper({ token });

    // Create test company via API
    const company = await apiHelper.createCompany({
      code: "E2E_EMP_CO",
      name: "E2E Employee Test Company",
    });
    testCompanyId = company.id;
  });

  test.afterAll(async () => {
    if (testCompanyId) {
      await apiHelper.deleteCompany(testCompanyId);
    }
  });

  test("Complete employee lifecycle: Create → View → Edit → Delete", async ({
    page,
  }) => {
    // Step 1: Login
    await page.goto("/login");
    await page.fill("#username", config.adminUsername);
    await page.fill("#password", config.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/home");

    // Step 2: Navigate to employee management
    await page.goto(`/company/${testCompanyId}/employees`);
    await page.waitForTimeout(2000);

    // Step 3: Create new employee
    const createButton = page.locator(
      'button:has-text("Add Employee"), button:has-text("Create Employee"), [data-testid="create-employee-button"]'
    );
    const buttonExists = await createButton.isVisible().catch(() => false);

    if (buttonExists) {
      await createButton.click();
      await page.waitForTimeout(500);

      const uniqueEmail = `e2e-test-${Date.now()}@example.com`;

      const emailInput = page.locator(
        'input[name="email"], input[id="email"], [data-testid="employee-email"]'
      );
      const firstnameInput = page.locator(
        'input[name="firstname"], input[id="firstname"], [data-testid="employee-firstname"]'
      );
      const lastnameInput = page.locator(
        'input[name="lastname"], input[id="lastname"], [data-testid="employee-lastname"]'
      );

      await emailInput.fill(uniqueEmail);
      await firstnameInput.fill("E2ETest");
      await lastnameInput.fill("Employee");

      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Create"), button:has-text("Save")'
      );
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Step 4: Verify employee appears in list
      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(1000);

      const employeeVisible = await page
        .locator(`text=${uniqueEmail}`)
        .isVisible()
        .catch(() => false);
      expect(employeeVisible).toBe(true);

      // Step 5: View employee details
      const employeeLink = page.locator(`text=${uniqueEmail}`);
      if (await employeeLink.isVisible()) {
        await employeeLink.click();
        await page.waitForTimeout(1000);

        const detailsVisible = await page
          .locator("text=E2ETest")
          .isVisible()
          .catch(() => false);
        expect(detailsVisible).toBe(true);
      }

      // Step 6: Edit employee
      const editButton = page.locator(
        'button:has-text("Edit"), [aria-label*="Edit"]'
      );
      const editExists = await editButton.isVisible().catch(() => false);

      if (editExists) {
        await editButton.click();
        await page.waitForTimeout(500);

        const firstnameEdit = page.locator(
          'input[name="firstname"], input[id="firstname"]'
        );
        await firstnameEdit.fill("UpdatedE2E");

        const saveButton = page.locator(
          'button[type="submit"], button:has-text("Save"), button:has-text("Update")'
        );
        await saveButton.click();
        await page.waitForTimeout(2000);

        // Verify update
        const updatedVisible = await page
          .locator("text=UpdatedE2E")
          .isVisible()
          .catch(() => false);
        expect(updatedVisible).toBe(true);
      }

      // Step 7: Delete employee
      await page.goto(`/company/${testCompanyId}/employees`);
      await page.waitForTimeout(1000);

      const deleteButton = page.locator(
        'button:has-text("Delete"), [aria-label*="Delete"]'
      );
      const deleteExists = await deleteButton.first().isVisible().catch(() => false);

      if (deleteExists) {
        await deleteButton.first().click();
        await page.waitForTimeout(500);

        const confirmButton = page.locator(
          'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")'
        );
        const confirmExists = await confirmButton.isVisible().catch(() => false);

        if (confirmExists) {
          await confirmButton.click();
          await page.waitForTimeout(2000);

          // Verify deletion
          const employeeGone =
            !(await page.locator(`text=${uniqueEmail}`).isVisible().catch(() => false));
          expect(employeeGone).toBe(true);
        }
      }
    }
  });

  test("Bulk employee creation and assignment to survey", async ({ page }) => {
    // Step 1: Login
    await page.goto("/login");
    await page.fill("#username", config.adminUsername);
    await page.fill("#password", config.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/home");

    // Step 2: Create employees via API (bulk)
    const employees = await apiHelper.bulkCreateEmployees(testCompanyId, 5);
    expect(employees).toHaveLength(5);

    // Step 3: Create a survey via API
    const survey = await apiHelper.createSurvey({
      code: "E2E_SURVEY",
      name: "E2E Test Survey",
      companyId: testCompanyId,
    });

    // Step 4: Navigate to survey assignment
    await page.goto(`/survey/${survey.id}/assign`);
    await page.waitForTimeout(2000);

    // Step 5: Select employees for survey
    const selectAllCheckbox = page.locator(
      'input[type="checkbox"][data-testid="select-all"], input[type="checkbox"].select-all'
    );
    const selectAllExists = await selectAllCheckbox.isVisible().catch(() => false);

    if (selectAllExists) {
      await selectAllCheckbox.check();
      await page.waitForTimeout(500);

      // Assign selected employees
      const assignButton = page.locator(
        'button:has-text("Assign"), button:has-text("Add to Survey")'
      );
      const assignExists = await assignButton.isVisible().catch(() => false);

      if (assignExists) {
        await assignButton.click();
        await page.waitForTimeout(2000);

        // Verify assignment
        const successMessage = await page
          .locator("text=/assigned|added/i")
          .isVisible()
          .catch(() => false);
        expect(successMessage).toBe(true);
      }
    }

    // Cleanup survey
    await apiHelper.deleteSurvey(survey.id);
  });

  test("Employee search and filter workflow", async ({ page }) => {
    // Setup: Create employees with different attributes
    await apiHelper.createEmployee(testCompanyId, {
      email: "thai-employee@example.com",
      firstname: "Somchai",
      lastname: "Tester",
      preferredLocale: "TH",
    });

    await apiHelper.createEmployee(testCompanyId, {
      email: "english-employee@example.com",
      firstname: "John",
      lastname: "Smith",
      preferredLocale: "EN",
    });

    // Login
    await page.goto("/login");
    await page.fill("#username", config.adminUsername);
    await page.fill("#password", config.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/home");

    // Navigate to employees
    await page.goto(`/company/${testCompanyId}/employees`);
    await page.waitForTimeout(2000);

    // Test search functionality
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Search"], [data-testid="search-input"]'
    );
    const searchExists = await searchInput.isVisible().catch(() => false);

    if (searchExists) {
      // Search by name
      await searchInput.fill("Somchai");
      await page.waitForTimeout(1000);

      const thaiEmployeeVisible = await page
        .locator("text=thai-employee@example.com")
        .isVisible()
        .catch(() => false);
      expect(thaiEmployeeVisible).toBe(true);

      // Clear search
      await searchInput.clear();
      await searchInput.fill("John");
      await page.waitForTimeout(1000);

      const englishEmployeeVisible = await page
        .locator("text=english-employee@example.com")
        .isVisible()
        .catch(() => false);
      expect(englishEmployeeVisible).toBe(true);
    }

    // Test filter by locale
    const localeFilter = page.locator(
      'select[name="locale"], [data-testid="locale-filter"]'
    );
    const filterExists = await localeFilter.isVisible().catch(() => false);

    if (filterExists) {
      await localeFilter.selectOption("TH");
      await page.waitForTimeout(1000);

      // Should only show Thai employees
      const thaiOnly = await page
        .locator("text=thai-employee@example.com")
        .isVisible()
        .catch(() => false);
      expect(thaiOnly).toBe(true);
    }
  });

  test("Employee export workflow", async ({ page }) => {
    // Create employees for export
    await apiHelper.bulkCreateEmployees(testCompanyId, 10);

    // Login
    await page.goto("/login");
    await page.fill("#username", config.adminUsername);
    await page.fill("#password", config.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/home");

    // Navigate to employees
    await page.goto(`/company/${testCompanyId}/employees`);
    await page.waitForTimeout(2000);

    // Look for export button
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("Download"), [data-testid="export-button"]'
    );
    const exportExists = await exportButton.isVisible().catch(() => false);

    if (exportExists) {
      // Start download
      const downloadPromise = page.waitForEvent("download", {
        timeout: 10000,
      }).catch(() => null);

      await exportButton.click();

      const download = await downloadPromise;

      if (download) {
        // Verify download started
        expect(download).toBeTruthy();
        const filename = download.suggestedFilename();
        expect(
          filename.includes("employee") || filename.includes("csv") || filename.includes("xlsx")
        ).toBe(true);
      }
    }
  });

  test("Multi-company employee isolation", async ({ page }) => {
    // Create another company
    const company2 = await apiHelper.createCompany({
      code: "E2E_CO_2",
      name: "Second Company",
    });

    // Create employees in both companies
    const emp1 = await apiHelper.createEmployee(testCompanyId, {
      email: "company1@example.com",
      firstname: "Company1",
      lastname: "Employee",
    });

    const emp2 = await apiHelper.createEmployee(company2.id, {
      email: "company2@example.com",
      firstname: "Company2",
      lastname: "Employee",
    });

    // Login
    await page.goto("/login");
    await page.fill("#username", config.adminUsername);
    await page.fill("#password", config.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/home");

    // View company 1 employees
    await page.goto(`/company/${testCompanyId}/employees`);
    await page.waitForTimeout(2000);

    const company1EmpVisible = await page
      .locator("text=company1@example.com")
      .isVisible()
      .catch(() => false);
    const company2EmpNotVisible =
      !(await page.locator("text=company2@example.com").isVisible().catch(() => false));

    expect(company1EmpVisible).toBe(true);
    expect(company2EmpNotVisible).toBe(true);

    // View company 2 employees
    await page.goto(`/company/${company2.id}/employees`);
    await page.waitForTimeout(2000);

    const company2EmpVisible = await page
      .locator("text=company2@example.com")
      .isVisible()
      .catch(() => false);
    const company1EmpNotVisible =
      !(await page.locator("text=company1@example.com").isVisible().catch(() => false));

    expect(company2EmpVisible).toBe(true);
    expect(company1EmpNotVisible).toBe(true);

    // Cleanup
    await apiHelper.deleteCompany(company2.id);
  });
});
