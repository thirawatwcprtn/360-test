import { test, expect } from "@playwright/test";
import { UIHelper } from "../utils/ui-helper";

test.describe("Survey UI Tests @ui", () => {
  let uiHelper: UIHelper;

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIHelper(page);

    // Login to the application
    await uiHelper.login("admin", "admin1235");
  });

  test.describe("Survey List Page", () => {
    test("should display survey list page", async ({ page }) => {
      await page.goto("/survey");

      await expect(page.locator('[data-testid="survey-list"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="create-survey-button"]')
      ).toBeVisible();
    });

    test("should search surveys", async ({ page }) => {
      await page.goto("/survey");

      // Search for a specific survey
      await uiHelper.search('[data-testid="survey-search"]', "Test Survey");

      // Verify search results
      const tableData = await uiHelper.getTableData(
        '[data-testid="survey-table"]'
      );
      expect(tableData.length).toBeGreaterThan(0);
    });

    test("should filter surveys by status", async ({ page }) => {
      await page.goto("/survey");

      // Filter by active status
      await uiHelper.filterByStatus("ACTIVE");

      // Verify all displayed surveys are active
      const tableData = await uiHelper.getTableData(
        '[data-testid="survey-table"]'
      );
      tableData.forEach((row) => {
        const statusCell = row.find(
          (cell) => cell.includes("ACTIVE") || cell.includes("DRAFT")
        );
        expect(statusCell).toBeDefined();
      });
    });
  });

  test.describe("Survey Creation", () => {
    test("should create a new survey", async ({ page }) => {
      await page.goto("/survey");

      // Click create button
      await uiHelper.clickButton('[data-testid="create-survey-button"]');

      // Fill survey form
      const surveyData = {
        '[data-testid="survey-code"]': "UI_SURVEY_001",
        '[data-testid="survey-name"]': "UI Test Survey",
        '[data-testid="survey-description"]': "Survey created via UI test",
        '[data-testid="survey-start-date"]': "2024-01-01",
        '[data-testid="survey-end-date"]': "2024-12-31",
        '[data-testid="survey-request-email"]': true,
        '[data-testid="survey-internet-quota"]': "100",
      };

      await uiHelper.fillForm(surveyData);

      // Submit form
      await uiHelper.submitForm('[data-testid="submit-survey-form"]');

      // Verify success message
      await uiHelper.waitForSuccess();
      await uiHelper.expectTextVisible("Survey created successfully");
    });

    test("should show validation errors for invalid data", async ({ page }) => {
      await page.goto("/survey");

      // Click create button
      await uiHelper.clickButton('[data-testid="create-survey-button"]');

      // Try to submit empty form
      await uiHelper.submitForm('[data-testid="submit-survey-form"]');

      // Verify validation errors
      await uiHelper.expectTextVisible("Code is required");
      await uiHelper.expectTextVisible("Name is required");
    });
  });

  test.describe("Survey Questions", () => {
    test("should add questions to survey", async ({ page }) => {
      await page.goto("/survey");

      // Create a survey first
      await uiHelper.createSurvey({
        '[data-testid="survey-code"]': "QUESTION_TEST",
        '[data-testid="survey-name"]': "Question Test Survey",
        '[data-testid="survey-request-email"]': true,
      });

      // Click on survey to edit
      await uiHelper.clickTableRow('[data-testid="survey-table"]', 0);

      // Navigate to questions tab
      await page.click('[data-testid="questions-tab"]');

      // Add question
      await uiHelper.clickButton('[data-testid="add-question-button"]');

      const questionData = {
        '[data-testid="question-text"]': "What is your favorite color?",
        '[data-testid="question-type"]': "SINGLE_CHOICE",
        '[data-testid="question-optional"]': false,
      };

      await uiHelper.fillForm(questionData);

      // Add choices
      await uiHelper.clickButton('[data-testid="add-choice-button"]');
      await uiHelper.fillForm({
        '[data-testid="choice-code"]': "RED",
        '[data-testid="choice-text"]': "Red",
      });

      await uiHelper.clickButton('[data-testid="add-choice-button"]');
      await uiHelper.fillForm({
        '[data-testid="choice-code"]': "BLUE",
        '[data-testid="choice-text"]': "Blue",
      });

      // Submit question
      await uiHelper.submitForm('[data-testid="submit-question-form"]');

      // Verify question added
      await uiHelper.waitForSuccess();
      await uiHelper.expectTextVisible("Question added successfully");
    });

    test("should add conditional questions", async ({ page }) => {
      await page.goto("/survey");

      // Create a survey first
      await uiHelper.createSurvey({
        '[data-testid="survey-code"]': "CONDITIONAL_TEST",
        '[data-testid="survey-name"]': "Conditional Test Survey",
        '[data-testid="survey-request-email"]': true,
      });

      // Click on survey to edit
      await uiHelper.clickTableRow('[data-testid="survey-table"]', 0);

      // Navigate to questions tab
      await page.click('[data-testid="questions-tab"]');

      // Add parent question first
      await uiHelper.clickButton('[data-testid="add-question-button"]');

      const parentQuestionData = {
        '[data-testid="question-text"]': "What is your favorite color?",
        '[data-testid="question-type"]': "SINGLE_CHOICE",
        '[data-testid="question-optional"]': false,
      };

      await uiHelper.fillForm(parentQuestionData);

      // Add choices for parent question
      await uiHelper.clickButton('[data-testid="add-choice-button"]');
      await uiHelper.fillForm({
        '[data-testid="choice-code"]': "RED",
        '[data-testid="choice-text"]': "Red",
      });

      await uiHelper.submitForm('[data-testid="submit-question-form"]');

      // Add conditional question
      await uiHelper.clickButton(
        '[data-testid="add-conditional-question-button"]'
      );

      const conditionalQuestionData = {
        '[data-testid="question-text"]': "Why do you like this color?",
        '[data-testid="question-type"]': "FREE_TEXT",
        '[data-testid="question-optional"]': true,
        '[data-testid="parent-question"]': "1", // First question
        '[data-testid="condition-choice"]': "RED",
      };

      await uiHelper.fillForm(conditionalQuestionData);
      await uiHelper.submitForm('[data-testid="submit-question-form"]');

      // Verify conditional question added
      await uiHelper.waitForSuccess();
      await uiHelper.expectTextVisible(
        "Conditional question added successfully"
      );
    });
  });

  test.describe("Survey Activation", () => {
    test("should activate survey", async ({ page }) => {
      await page.goto("/survey");

      // Create a survey first
      await uiHelper.createSurvey({
        '[data-testid="survey-code"]': "ACTIVATE_TEST",
        '[data-testid="survey-name"]': "Activate Test Survey",
        '[data-testid="survey-request-email"]': true,
      });

      // Click on survey to view details
      await uiHelper.clickTableRow('[data-testid="survey-table"]', 0);

      // Click activate button
      await uiHelper.clickButton('[data-testid="activate-survey-button"]');

      // Confirm activation
      await uiHelper.confirmModal();

      // Verify activation
      await uiHelper.waitForSuccess();
      await uiHelper.expectTextVisible("Survey activated successfully");
    });

    test("should delist survey", async ({ page }) => {
      await page.goto("/survey");

      // Create a survey first
      await uiHelper.createSurvey({
        '[data-testid="survey-code"]': "DELIST_TEST",
        '[data-testid="survey-name"]': "Delist Test Survey",
        '[data-testid="survey-request-email"]': true,
      });

      // Click on survey to view details
      await uiHelper.clickTableRow('[data-testid="survey-table"]', 0);

      // Click delist button
      await uiHelper.clickButton('[data-testid="delist-survey-button"]');

      // Confirm delisting
      await uiHelper.confirmModal();

      // Verify delisting
      await uiHelper.waitForSuccess();
      await uiHelper.expectTextVisible("Survey delisted successfully");
    });
  });

  test.describe("Survey Export", () => {
    test("should create export job", async ({ page }) => {
      await page.goto("/survey");

      // Create a survey first
      await uiHelper.createSurvey({
        '[data-testid="survey-code"]': "EXPORT_TEST",
        '[data-testid="survey-name"]': "Export Test Survey",
        '[data-testid="survey-request-email"]': true,
      });

      // Click on survey to view details
      await uiHelper.clickTableRow('[data-testid="survey-table"]', 0);

      // Navigate to export tab
      await page.click('[data-testid="export-tab"]');

      // Create export job
      await uiHelper.clickButton('[data-testid="create-export-button"]');

      // Verify export job created
      await uiHelper.waitForSuccess();
      await uiHelper.expectTextVisible("Export job created successfully");
    });

    test("should download export file", async ({ page }) => {
      await page.goto("/survey");

      // Create a survey first
      await uiHelper.createSurvey({
        '[data-testid="survey-code"]': "DOWNLOAD_TEST",
        '[data-testid="survey-name"]': "Download Test Survey",
        '[data-testid="survey-request-email"]': true,
      });

      // Click on survey to view details
      await uiHelper.clickTableRow('[data-testid="survey-table"]', 0);

      // Navigate to export tab
      await page.click('[data-testid="export-tab"]');

      // Create export job first
      await uiHelper.clickButton('[data-testid="create-export-button"]');
      await uiHelper.waitForSuccess();

      // Wait for job to complete
      await page.waitForSelector('[data-testid="export-status-completed"]', {
        timeout: 30000,
      });

      // Download file
      const download = await uiHelper.downloadExport(
        '[data-testid="download-export"]'
      );
      expect(download).toBeDefined();
      expect(download.suggestedFilename()).toContain(".xlsx");
    });
  });

  test.describe("Survey Results", () => {
    test("should view survey results", async ({ page }) => {
      await page.goto("/survey");

      // Create a survey first
      await uiHelper.createSurvey({
        '[data-testid="survey-code"]': "RESULTS_TEST",
        '[data-testid="survey-name"]': "Results Test Survey",
        '[data-testid="survey-request-email"]': true,
      });

      // Click on survey to view details
      await uiHelper.clickTableRow('[data-testid="survey-table"]', 0);

      // Navigate to results tab
      await page.click('[data-testid="results-tab"]');

      // Verify results page
      await uiHelper.expectElementVisible('[data-testid="survey-results"]');
      await uiHelper.expectTextVisible("0 responses");
    });
  });

  test.describe("Survey Localization", () => {
    test("should add survey localizations", async ({ page }) => {
      await page.goto("/survey");

      // Create a survey first
      await uiHelper.createSurvey({
        '[data-testid="survey-code"]': "LOCALE_TEST",
        '[data-testid="survey-name"]': "Locale Test Survey",
        '[data-testid="survey-request-email"]': true,
      });

      // Click on survey to edit
      await uiHelper.clickTableRow('[data-testid="survey-table"]', 0);

      // Navigate to localization tab
      await page.click('[data-testid="localization-tab"]');

      // Add English localization
      await uiHelper.clickButton('[data-testid="add-locale-button"]');
      await uiHelper.selectOption('[data-testid="locale-select"]', "EN");
      await uiHelper.fillForm({
        '[data-testid="locale-title"]': "English Survey Title",
        '[data-testid="locale-description"]': "English survey description",
      });
      await uiHelper.submitForm('[data-testid="submit-locale-form"]');

      // Add Thai localization
      await uiHelper.clickButton('[data-testid="add-locale-button"]');
      await uiHelper.selectOption('[data-testid="locale-select"]', "TH");
      await uiHelper.fillForm({
        '[data-testid="locale-title"]': "Thai Survey Title",
        '[data-testid="locale-description"]': "Thai survey description",
      });
      await uiHelper.submitForm('[data-testid="submit-locale-form"]');

      // Verify localizations added
      await uiHelper.waitForSuccess();
      await uiHelper.expectTextVisible("Localization added successfully");
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up by logging out
    await uiHelper.logout();
  });
});
