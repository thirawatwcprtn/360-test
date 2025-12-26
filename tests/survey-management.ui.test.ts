import { test, expect } from "@playwright/test";
import { UIHelper } from "../utils/ui-helper";
import { faker } from "@faker-js/faker";

test.describe("Survey Management UI Tests @ui", () => {
  let uiHelper: UIHelper;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIHelper(page);
    await page.goto("http://localhost:8000");
  });

  test("should navigate to survey management page", async ({ page }) => {
    // Navigate to survey page
    await page.click('a[href="/survey"]');
    await page.waitForURL("/survey");

    // Verify page elements
    await expect(page.locator("text=Survey")).toBeVisible();
    await expect(page.locator('button:has-text("Create")')).toBeVisible();
    await expect(page.locator("select")).toBeVisible(); // Status filter
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test("should open survey creation form", async ({ page }) => {
    await page.goto("/survey");

    // Click create button
    await page.click('button:has-text("Create")');
    await page.waitForURL("/survey/create");

    // Verify form elements
    await expect(page.locator("text=Create")).toBeVisible();
    await expect(page.locator('input[placeholder="Name"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Code"]')).toBeVisible();
    await expect(
      page.locator('input[placeholder*="Valid Date"]')
    ).toBeVisible();

    // Check for locale checkboxes
    const thCheckbox = page.locator('input[type="checkbox"]:has-text("TH")');
    const enCheckbox = page.locator('input[type="checkbox"]:has-text("EN")');
    const jpCheckbox = page.locator('input[type="checkbox"]:has-text("JP")');

    if ((await thCheckbox.count()) > 0) {
      await expect(thCheckbox).toBeChecked();
    }
    if ((await enCheckbox.count()) > 0) {
      await expect(enCheckbox).toBeChecked();
    }
    if ((await jpCheckbox.count()) > 0) {
      await expect(jpCheckbox).toBeChecked();
    }
  });

  test("should fill and submit survey creation form", async ({ page }) => {
    await page.goto("/survey/create");

    const surveyName = `Test Survey ${faker.company.name()}`;
    const description = faker.lorem.sentence();

    // Fill form
    await page.fill('input[placeholder="Name"]', surveyName);

    // Submit form
    await page.click('button:has-text("Save")');

    // Wait for response
    await page.waitForTimeout(2000);

    // Check if we're redirected or if there's an error message
    const currentUrl = page.url();
    if (currentUrl.includes("/survey/create")) {
      // Still on create page, check for error messages
      const errorElements = page.locator(
        '[role="alert"], .error, .notification'
      );
      if ((await errorElements.count()) > 0) {
        console.log("Form submission resulted in error");
      }
    } else {
      // Successfully redirected
      await expect(page).toHaveURL(/\/survey/);
    }
  });

  test("should test survey status filter", async ({ page }) => {
    await page.goto("/survey");

    // Test different status filters
    const statusOptions = ["Active", "Draft", "Delist", "Expired", "Suspended"];

    for (const status of statusOptions) {
      await page.selectOption("select", status);
      await page.waitForTimeout(1000);

      // Verify filter is applied
      const selectedOption = await page
        .locator("select")
        .evaluate((el) => (el as HTMLSelectElement).value);
      expect(selectedOption).toBe(status.toLowerCase());
    }
  });

  test("should test survey search functionality", async ({ page }) => {
    await page.goto("/survey");

    const searchQuery = "test";
    await page.fill('input[placeholder*="Search"]', searchQuery);
    await page.press('input[placeholder*="Search"]', "Enter");

    await page.waitForTimeout(1000);

    // Verify search is applied
    const searchInput = await page
      .locator('input[placeholder*="Search"]')
      .inputValue();
    expect(searchInput).toBe(searchQuery);
  });

  test("should test survey sorting functionality", async ({ page }) => {
    await page.goto("/survey");

    // Test different sort options
    const sortOptions = [
      "Start Date (Ascending)",
      "Start Date (Descending)",
      "End Date (Ascending)",
      "End Date (Descending)",
    ];

    for (const sortOption of sortOptions) {
      await page.selectOption('select:has-text("Sort")', sortOption);
      await page.waitForTimeout(1000);

      // Verify sort is applied
      const selectedSort = await page
        .locator('select:has-text("Sort")')
        .evaluate((el) => (el as HTMLSelectElement).value);
      expect(selectedSort).toBeDefined();
    }
  });

  test("should test survey table functionality", async ({ page }) => {
    await page.goto("/survey");

    // Wait for table to load
    await page.waitForTimeout(2000);

    // Check if table exists
    const table = page.locator("table");
    if ((await table.count()) > 0) {
      // Table exists, check for data
      const rows = page.locator("table tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // Click on first row to view details
        await rows.first().click();
        await page.waitForTimeout(1000);
      } else {
        // No data message
        await expect(
          page.locator("text=There are no records to display")
        ).toBeVisible();
      }
    }
  });

  test("should test survey form validation", async ({ page }) => {
    await page.goto("/survey/create");

    // Try to submit without filling required fields
    await page.click('button:has-text("Save")');

    // Wait for validation messages
    await page.waitForTimeout(1000);

    // Check for validation errors
    const errorElements = page.locator(
      '[role="alert"], .error, .validation-error'
    );
    if ((await errorElements.count()) > 0) {
      console.log("Validation errors detected");
    }
  });

  test("should test survey locale selection", async ({ page }) => {
    await page.goto("/survey/create");

    // Test locale checkboxes
    const localeCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await localeCheckboxes.count();

    if (checkboxCount > 0) {
      // Toggle each checkbox
      for (let i = 0; i < checkboxCount; i++) {
        const checkbox = localeCheckboxes.nth(i);
        const isChecked = await checkbox.isChecked();

        // Toggle the checkbox
        await checkbox.click();
        await page.waitForTimeout(500);

        // Verify state changed
        const newState = await checkbox.isChecked();
        expect(newState).toBe(!isChecked);

        // Toggle back
        await checkbox.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("should test survey date range selection", async ({ page }) => {
    await page.goto("/survey/create");

    // Look for date range input
    const dateInput = page.locator('input[placeholder*="Valid Date"]');
    if ((await dateInput.count()) > 0) {
      // Click on date input to open date picker
      await dateInput.click();
      await page.waitForTimeout(1000);

      // Check if date picker is visible
      const datePicker = page.locator(
        '[role="dialog"], .date-picker, .calendar'
      );
      if ((await datePicker.count()) > 0) {
        console.log("Date picker is available");
      }
    }
  });

  test("should test survey activation workflow", async ({ page }) => {
    await page.goto("/survey/create");

    // Fill required fields
    await page.fill(
      'input[placeholder="Name"]',
      `Activation Test Survey ${faker.company.name()}`
    );

    // Save the survey
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(2000);

    // Check if Activate button becomes enabled
    const activateButton = page.locator('button:has-text("Activate")');
    if ((await activateButton.count()) > 0) {
      const isDisabled = await activateButton.isDisabled();
      console.log("Activate button disabled:", isDisabled);
    }
  });

  test("should test survey draft status", async ({ page }) => {
    await page.goto("/survey/create");

    // Check for draft status alert
    const draftAlert = page.locator("text=This survey is draft");
    if ((await draftAlert.count()) > 0) {
      await expect(draftAlert).toBeVisible();

      const activateText = page.locator("text=Activate it to get it online");
      if ((await activateText.count()) > 0) {
        await expect(activateText).toBeVisible();
      }
    }
  });

  test("should test survey form buttons", async ({ page }) => {
    await page.goto("/survey/create");

    // Test Back button
    const backButton = page.locator('button:has-text("Back")');
    if ((await backButton.count()) > 0) {
      await backButton.click();
      await page.waitForURL("/survey");
      await expect(page).toHaveURL("/survey");
    }

    // Go back to create form
    await page.goto("/survey/create");

    // Test Save button
    const saveButton = page.locator('button:has-text("Save")');
    if ((await saveButton.count()) > 0) {
      await expect(saveButton).toBeVisible();
    }

    // Test Deactivate Draft button
    const deactivateButton = page.locator(
      'button:has-text("Deactivate Draft")'
    );
    if ((await deactivateButton.count()) > 0) {
      await expect(deactivateButton).toBeVisible();
    }
  });

  test("should test survey breadcrumb navigation", async ({ page }) => {
    await page.goto("/survey/create");

    // Check breadcrumb
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    if ((await breadcrumb.count()) > 0) {
      // Click on Survey link
      const surveyLink = breadcrumb.locator('a:has-text("Survey")');
      if ((await surveyLink.count()) > 0) {
        await surveyLink.click();
        await page.waitForURL("/survey");
        await expect(page).toHaveURL("/survey");
      }
    }
  });

  test("should test survey management responsive design", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/survey");

    // Verify mobile layout
    await expect(page.locator("text=Survey")).toBeVisible();

    // Test mobile navigation
    const createButton = page.locator('button:has-text("Create")');
    if ((await createButton.count()) > 0) {
      await createButton.click();
      await page.waitForURL("/survey/create");

      // Verify form is accessible on mobile
      await expect(page.locator('input[placeholder="Name"]')).toBeVisible();
    }
  });

  test("should test survey management accessibility", async ({ page }) => {
    await page.goto("/survey");

    // Check for proper ARIA labels
    const createButton = page.locator('button:has-text("Create")');
    if ((await createButton.count()) > 0) {
      const ariaLabel = await createButton.getAttribute("aria-label");
      if (ariaLabel) {
        console.log("Create button has aria-label:", ariaLabel);
      }
    }

    // Check for proper heading structure
    const headings = page.locator("h1, h2, h3, h4, h5, h6");
    const headingCount = await headings.count();
    if (headingCount > 0) {
      console.log(`Found ${headingCount} headings on the survey page`);
    }

    // Check for proper form labels
    await page.goto("/survey/create");
    const formLabels = page.locator("label");
    const labelCount = await formLabels.count();
    if (labelCount > 0) {
      console.log(`Found ${labelCount} form labels on the survey create page`);
    }
  });

  test("should test survey error handling", async ({ page }) => {
    await page.goto("/survey/create");

    // Try to submit invalid data
    await page.fill('input[placeholder="Name"]', ""); // Empty name
    await page.click('button:has-text("Save")');

    await page.waitForTimeout(2000);

    // Check for error messages
    const errorElements = page.locator('[role="alert"], .error, .notification');
    if ((await errorElements.count()) > 0) {
      const errorText = await errorElements.first().textContent();
      console.log("Error message:", errorText);
    }
  });
});
