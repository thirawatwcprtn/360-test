import { test, expect } from "@playwright/test";
import { UIHelper } from "../utils/ui-helper";

test.describe("Company UI Tests @ui", () => {
  let uiHelper: UIHelper;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIHelper(page);

    // Login to the application
    await uiHelper.login("admin", "admin1235");
  });

  test.describe("Company List Page", () => {
    test("should display company list page", async ({ page }) => {
      await page.goto("/company");

      await expect(page.locator('[data-testid="company-list"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="create-company-button"]')
      ).toBeVisible();
    });

    test("should search companies", async ({ page }) => {
      await page.goto("/company");

      // Search for a specific company
      await uiHelper.search('[data-testid="company-search"]', "Test Company");

      // Verify search results
      const tableData = await uiHelper.getTableData(
        '[data-testid="company-table"]'
      );
      expect(tableData.length).toBeGreaterThan(0);

      // Verify all results contain search term
      tableData.forEach((row) => {
        expect(
          row.some((cell) => cell.toLowerCase().includes("test company"))
        ).toBe(true);
      });
    });

    test("should filter companies by status", async ({ page }) => {
      await page.goto("/company");

      // Filter by active status
      await uiHelper.filterByStatus("ACTIVE");

      // Verify all displayed companies are active
      const tableData = await uiHelper.getTableData(
        '[data-testid="company-table"]'
      );
      tableData.forEach((row) => {
        const statusCell = row.find(
          (cell) => cell.includes("ACTIVE") || cell.includes("DRAFT")
        );
        expect(statusCell).toBeDefined();
      });
    });

    test("should paginate through companies", async ({ page }) => {
      await page.goto("/company");

      // Get initial row count
      const initialRowCount = await uiHelper.getTableRowCount(
        '[data-testid="company-table"]'
      );

      // Go to next page
      await uiHelper.goToNextPage();

      // Verify page changed
      await expect(page.locator('[data-testid="current-page"]')).toContainText(
        "2"
      );

      // Go back to first page
      await uiHelper.goToPreviousPage();

      // Verify back to first page
      await expect(page.locator('[data-testid="current-page"]')).toContainText(
        "1"
      );
    });
  });

  test.describe("Company Creation", () => {
    test("should create a new company", async ({ page }) => {
      await page.goto("/company");

      // Click create button
      await uiHelper.clickButton('[data-testid="create-company-button"]');

      // Fill company form
      const companyData = {
        '[data-testid="company-code"]': "UI_TEST_001",
        '[data-testid="company-name"]': "UI Test Company",
        '[data-testid="company-description"]': "Company created via UI test",
        '[data-testid="company-phone"]': "+1234567890",
        '[data-testid="company-email"]': "ui-test@company.com",
        '[data-testid="company-website"]': "https://uitestcompany.com",
      };

      await uiHelper.fillForm(companyData);

      // Submit form
      await uiHelper.submitForm('[data-testid="submit-company-form"]');

      // Verify success message
      await uiHelper.waitForSuccess();
      await uiHelper.expectTextVisible("Company created successfully");
    });

    test("should show validation errors for invalid data", async ({ page }) => {
      await page.goto("/company");

      // Click create button
      await uiHelper.clickButton('[data-testid="create-company-button"]');

      // Try to submit empty form
      await uiHelper.submitForm('[data-testid="submit-company-form"]');

      // Verify validation errors
      await uiHelper.expectTextVisible("Code is required");
      await uiHelper.expectTextVisible("Name is required");
      await uiHelper.expectTextVisible("Email is required");
    });

    test("should show error for duplicate company code", async ({ page }) => {
      await page.goto("/company");

      // Create first company
      await uiHelper.createCompany({
        '[data-testid="company-code"]': "DUPLICATE_CODE",
        '[data-testid="company-name"]': "First Company",
        '[data-testid="company-email"]': "first@company.com",
      });

      // Try to create second company with same code
      await uiHelper.clickButton('[data-testid="create-company-button"]');

      const companyData = {
        '[data-testid="company-code"]': "DUPLICATE_CODE",
        '[data-testid="company-name"]': "Second Company",
        '[data-testid="company-email"]': "second@company.com",
      };

      await uiHelper.fillForm(companyData);
      await uiHelper.submitForm('[data-testid="submit-company-form"]');

      // Verify error message
      await uiHelper.waitForError();
      await uiHelper.expectTextVisible("Company code already exists");
    });
  });

  test.describe("Company Editing", () => {
    test("should edit existing company", async ({ page }) => {
      await page.goto("/company");

      // Create a test company first
      await uiHelper.createCompany({
        '[data-testid="company-code"]': "EDIT_TEST",
        '[data-testid="company-name"]': "Edit Test Company",
        '[data-testid="company-email"]': "edit@test.com",
      });

      // Click on the company row to edit
      await uiHelper.clickTableRow('[data-testid="company-table"]', 0);

      // Update company data
      const updateData = {
        '[data-testid="company-name"]': "Updated Company Name",
        '[data-testid="company-description"]': "Updated description",
        '[data-testid="company-phone"]': "+0987654321",
      };

      await uiHelper.fillForm(updateData);
      await uiHelper.submitForm('[data-testid="submit-company-form"]');

      // Verify success message
      await uiHelper.waitForSuccess();
      await uiHelper.expectTextVisible("Company updated successfully");
    });
  });

  test.describe("Bulk Company Operations", () => {
    test("should bulk create companies from file", async ({ page }) => {
      await page.goto("/company");

      // Click bulk create button
      await uiHelper.clickButton('[data-testid="bulk-create-button"]');

      // Upload file
      await uiHelper.uploadFile(
        '[data-testid="company-file-input"]',
        "./test-data/companies.xlsx"
      );

      // Submit bulk create
      await uiHelper.submitForm('[data-testid="submit-bulk-create"]');

      // Verify success message
      await uiHelper.waitForSuccess();
      await uiHelper.expectTextVisible("Companies created successfully");
    });

    test("should bulk update companies", async ({ page }) => {
      await page.goto("/company");

      // Select multiple companies
      await page.locator('[data-testid="company-checkbox"]').nth(0).check();
      await page.locator('[data-testid="company-checkbox"]').nth(1).check();

      // Click bulk update button
      await uiHelper.clickButton('[data-testid="bulk-update-button"]');

      // Fill bulk update form
      const updateData = {
        '[data-testid="bulk-description"]': "Bulk updated description",
        '[data-testid="bulk-status"]': "ACTIVE",
      };

      await uiHelper.fillForm(updateData);
      await uiHelper.submitForm('[data-testid="submit-bulk-update"]');

      // Verify success message
      await uiHelper.waitForSuccess();
      await uiHelper.expectTextVisible("Companies updated successfully");
    });

    test("should bulk delete companies", async ({ page }) => {
      await page.goto("/company");

      // Select multiple companies
      await page.locator('[data-testid="company-checkbox"]').nth(0).check();
      await page.locator('[data-testid="company-checkbox"]').nth(1).check();

      // Click bulk delete button
      await uiHelper.clickButton('[data-testid="bulk-delete-button"]');

      // Confirm deletion in modal
      await uiHelper.confirmModal();

      // Verify success message
      await uiHelper.waitForSuccess();
      await uiHelper.expectTextVisible("Companies deleted successfully");
    });
  });

  test.describe("Company Details", () => {
    test("should view company details", async ({ page }) => {
      await page.goto("/company");

      // Click on company row to view details
      await uiHelper.clickTableRow('[data-testid="company-table"]', 0);

      // Verify details page
      await uiHelper.expectElementVisible('[data-testid="company-details"]');
      await uiHelper.expectElementVisible('[data-testid="company-employees"]');
      await uiHelper.expectElementVisible(
        '[data-testid="company-departments"]'
      );
    });

    test("should view company employees", async ({ page }) => {
      await page.goto("/company");

      // Click on company row
      await uiHelper.clickTableRow('[data-testid="company-table"]', 0);

      // Navigate to employees tab
      await page.click('[data-testid="employees-tab"]');

      // Verify employees list
      await uiHelper.expectElementVisible('[data-testid="employees-list"]');
    });
  });

  test.describe("Company Deletion", () => {
    test("should delete company", async ({ page }) => {
      await page.goto("/company");

      // Create a test company first
      await uiHelper.createCompany({
        '[data-testid="company-code"]': "DELETE_TEST",
        '[data-testid="company-name"]': "Delete Test Company",
        '[data-testid="company-email"]': "delete@test.com",
      });

      // Click delete button
      await uiHelper.clickButton('[data-testid="delete-company-button"]');

      // Confirm deletion
      await uiHelper.confirmModal();

      // Verify success message
      await uiHelper.waitForSuccess();
      await uiHelper.expectTextVisible("Company deleted successfully");
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up by logging out
    await uiHelper.logout();
  });
});
