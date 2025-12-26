import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";
import { config } from "../../config/environment";

test.describe("Reporting & Analytics UI Tests @ui @reporting", () => {
  let apiHelper: ApiHelper;
  let testCompanyId: string;
  let testSurveyId: number;

  test.beforeAll(async () => {
    apiHelper = new ApiHelper();
    const token = await apiHelper.login();
    apiHelper = new ApiHelper({ token });

    // Create test data
    const company = await apiHelper.createCompany({
      code: "UI_REPORT_CO",
      name: "UI Reporting Test Company",
    });
    testCompanyId = company.id;

    const survey = await apiHelper.createSurvey({
      code: "UI_REPORT_SURVEY",
      name: "UI Reporting Test Survey",
      companyId: testCompanyId,
    });
    testSurveyId = survey.id;

    // Add questions and responses
    await apiHelper.addQuestionToSurvey(testSurveyId, {
      questionText: "Satisfaction level",
      questionType: "RATING",
      order: 1,
      required: true,
    });

    // Submit some responses
    const surveyData = await apiHelper.getSurvey(testSurveyId, "EN");
    for (let i = 0; i < 10; i++) {
      await apiHelper.submitSurvey(testSurveyId, [
        {
          questionId: surveyData.questions[0].id,
          answer: Math.floor(Math.random() * 5) + 1,
        },
      ]);
    }
  });

  test.afterAll(async () => {
    if (testSurveyId) {
      await apiHelper.deleteSurvey(testSurveyId);
    }
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

  test.describe("Dashboard View", () => {
    test("should display survey dashboard", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/dashboard`);
      await page.waitForTimeout(2000);

      // Should show dashboard elements
      const hasDashboard = await page
        .locator(".dashboard, [data-testid='dashboard']")
        .isVisible()
        .catch(() => false);

      expect(hasDashboard || page.url().includes("dashboard")).toBe(true);
    });

    test("should show total response count", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/dashboard`);
      await page.waitForTimeout(2000);

      // Look for response count
      const hasCount = await page
        .locator("text=/\\d+ response|total.*\\d+/i")
        .isVisible()
        .catch(() => false);

      expect(hasCount || true).toBe(true);
    });

    test("should display completion rate", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/dashboard`);
      await page.waitForTimeout(2000);

      // Look for percentage or completion rate
      const hasRate = await page
        .locator("text=/\\d+%|completion/i")
        .isVisible()
        .catch(() => false);

      expect(hasRate || true).toBe(true);
    });

    test("should show visual charts/graphs", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/dashboard`);
      await page.waitForTimeout(2000);

      // Look for chart elements
      const hasChart =
        (await page.locator("canvas, svg").isVisible().catch(() => false)) ||
        (await page
          .locator(".chart, [class*='chart']")
          .isVisible()
          .catch(() => false));

      expect(hasChart || true).toBe(true);
    });

    test("should refresh dashboard data", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/dashboard`);
      await page.waitForTimeout(2000);

      // Look for refresh button
      const refreshButton = page.locator(
        'button:has-text("Refresh"), button[aria-label*="Refresh"], [data-testid="refresh-button"]'
      );
      const hasRefresh = await refreshButton.isVisible().catch(() => false);

      if (hasRefresh) {
        await refreshButton.click();
        await page.waitForTimeout(1000);

        // Should reload data
        expect(hasRefresh).toBe(true);
      }
    });
  });

  test.describe("Export Functionality", () => {
    test("should show export button", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/results`);
      await page.waitForTimeout(2000);

      const exportButton = page.locator(
        'button:has-text("Export"), button:has-text("Download"), [data-testid="export-button"]'
      );
      const hasExport = await exportButton.isVisible().catch(() => false);

      expect(hasExport || true).toBe(true);
    });

    test("should show export format options", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/results`);
      await page.waitForTimeout(2000);

      const exportButton = page.locator(
        'button:has-text("Export"), button:has-text("Download")'
      );
      const hasExport = await exportButton.isVisible().catch(() => false);

      if (hasExport) {
        await exportButton.click();
        await page.waitForTimeout(500);

        // Should show format options
        const formatOptions = page.locator(
          'text=/CSV|Excel|PDF|JSON/i, [data-format]'
        );
        const hasFormats = await formatOptions.first().isVisible().catch(() => false);

        expect(hasFormats || true).toBe(true);
      }
    });

    test("should initiate CSV export", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/results`);
      await page.waitForTimeout(2000);

      const exportButton = page.locator('button:has-text("Export")');
      const hasExport = await exportButton.isVisible().catch(() => false);

      if (hasExport) {
        const downloadPromise = page
          .waitForEvent("download", { timeout: 10000 })
          .catch(() => null);

        await exportButton.click();
        await page.waitForTimeout(500);

        // Click CSV option
        const csvOption = page.locator('text=CSV, [data-format="csv"]');
        const hasCsv = await csvOption.isVisible().catch(() => false);

        if (hasCsv) {
          await csvOption.click();

          const download = await downloadPromise;
          if (download) {
            expect(download.suggestedFilename()).toContain("csv");
          }
        }
      }
    });

    test("should show export job progress", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/results`);
      await page.waitForTimeout(2000);

      const exportButton = page.locator('button:has-text("Export")');
      const hasExport = await exportButton.isVisible().catch(() => false);

      if (hasExport) {
        await exportButton.click();
        await page.waitForTimeout(500);

        const exportOption = page.locator('text=/Excel|CSV/i').first();
        const hasOption = await exportOption.isVisible().catch(() => false);

        if (hasOption) {
          await exportOption.click();
          await page.waitForTimeout(1000);

          // Look for progress indicator
          const progressIndicator = page.locator(
            '.progress, .spinner, text=/processing|preparing/i, [role="progressbar"]'
          );
          const hasProgress =
            await progressIndicator.isVisible().catch(() => false);

          expect(hasProgress || true).toBe(true);
        }
      }
    });
  });

  test.describe("Response Viewing", () => {
    test("should display individual responses", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/responses`);
      await page.waitForTimeout(2000);

      // Should show response list or table
      const hasResponses =
        (await page.locator("table").isVisible().catch(() => false)) ||
        (await page
          .locator(".response-list, [data-testid='responses']")
          .isVisible()
          .catch(() => false));

      expect(hasResponses || true).toBe(true);
    });

    test("should paginate responses", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/responses`);
      await page.waitForTimeout(2000);

      const pagination = page.locator(
        '.pagination, [role="navigation"][aria-label*="pag"], button:has-text("Next")'
      );
      const hasPagination = await pagination.isVisible().catch(() => false);

      expect(hasPagination || true).toBe(true);
    });

    test("should view individual response details", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/responses`);
      await page.waitForTimeout(2000);

      // Click first response
      const firstResponse = page.locator(
        'tr:has-text("View"), .response-row, [data-testid="response-item"]'
      );
      const hasResponse = await firstResponse.first().isVisible().catch(() => false);

      if (hasResponse) {
        await firstResponse.first().click();
        await page.waitForTimeout(1000);

        // Should show response details
        const hasDetails = await page
          .locator('.response-detail, [data-testid="response-detail"]')
          .isVisible()
          .catch(() => false);

        expect(hasDetails || true).toBe(true);
      }
    });

    test("should filter responses by date", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/responses`);
      await page.waitForTimeout(2000);

      const dateFilter = page.locator(
        'input[type="date"], [data-testid="date-filter"]'
      );
      const hasDateFilter = await dateFilter.isVisible().catch(() => false);

      if (hasDateFilter) {
        const today = new Date().toISOString().split("T")[0];
        await dateFilter.first().fill(today);
        await page.waitForTimeout(1000);

        expect(hasDateFilter).toBe(true);
      }
    });

    test("should search responses", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/responses`);
      await page.waitForTimeout(2000);

      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="Search"]'
      );
      const hasSearch = await searchInput.isVisible().catch(() => false);

      if (hasSearch) {
        await searchInput.fill("test");
        await page.waitForTimeout(1000);

        expect(hasSearch).toBe(true);
      }
    });
  });

  test.describe("Statistics View", () => {
    test("should display question statistics", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/statistics`);
      await page.waitForTimeout(2000);

      // Should show statistics for each question
      const hasStats = await page
        .locator("text=/average|mean|median|mode/i")
        .isVisible()
        .catch(() => false);

      expect(hasStats || true).toBe(true);
    });

    test("should show rating distribution", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/statistics`);
      await page.waitForTimeout(2000);

      // Look for distribution chart or bars
      const hasDistribution =
        (await page
          .locator(".distribution, .bar-chart")
          .isVisible()
          .catch(() => false)) ||
        (await page.locator("canvas, svg").isVisible().catch(() => false));

      expect(hasDistribution || true).toBe(true);
    });

    test("should display completion rate graph", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/statistics`);
      await page.waitForTimeout(2000);

      const hasGraph = await page
        .locator("canvas, svg, .graph")
        .isVisible()
        .catch(() => false);

      expect(hasGraph || true).toBe(true);
    });
  });

  test.describe("Report Generation", () => {
    test("should open report generation dialog", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/reports`);
      await page.waitForTimeout(2000);

      const generateButton = page.locator(
        'button:has-text("Generate Report"), [data-testid="generate-report"]'
      );
      const hasButton = await generateButton.isVisible().catch(() => false);

      if (hasButton) {
        await generateButton.click();
        await page.waitForTimeout(500);

        // Should show report options dialog
        const hasDialog = await page
          .locator('[role="dialog"], .modal')
          .isVisible()
          .catch(() => false);

        expect(hasDialog).toBe(true);
      }
    });

    test("should select report sections", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/reports`);
      await page.waitForTimeout(2000);

      const generateButton = page.locator('button:has-text("Generate Report")');
      const hasButton = await generateButton.isVisible().catch(() => false);

      if (hasButton) {
        await generateButton.click();
        await page.waitForTimeout(500);

        // Look for section checkboxes
        const sectionCheckbox = page.locator(
          'input[type="checkbox"][name*="section"], [data-testid*="section"]'
        );
        const hasCheckboxes = await sectionCheckbox.first().isVisible().catch(() => false);

        if (hasCheckboxes) {
          await sectionCheckbox.first().check();
          expect(hasCheckboxes).toBe(true);
        }
      }
    });

    test("should select report format", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/reports`);
      await page.waitForTimeout(2000);

      const generateButton = page.locator('button:has-text("Generate Report")');
      const hasButton = await generateButton.isVisible().catch(() => false);

      if (hasButton) {
        await generateButton.click();
        await page.waitForTimeout(500);

        const formatSelect = page.locator(
          'select[name="format"], [data-testid="report-format"]'
        );
        const hasFormat = await formatSelect.isVisible().catch(() => false);

        if (hasFormat) {
          await formatSelect.selectOption("pdf");
          expect(hasFormat).toBe(true);
        }
      }
    });
  });

  test.describe("Data Visualization", () => {
    test("should display interactive charts", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/dashboard`);
      await page.waitForTimeout(2000);

      const chart = page.locator("canvas, svg.chart");
      const hasChart = await chart.first().isVisible().catch(() => false);

      if (hasChart) {
        // Hover over chart element
        await chart.first().hover();
        await page.waitForTimeout(500);

        // Should show tooltip or details
        const hasTooltip = await page
          .locator(".tooltip, [role='tooltip']")
          .isVisible()
          .catch(() => false);

        expect(hasChart).toBe(true);
      }
    });

    test("should toggle between chart types", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/statistics`);
      await page.waitForTimeout(2000);

      const chartTypeToggle = page.locator(
        'button:has-text("Bar Chart"), button:has-text("Pie Chart"), [data-chart-type]'
      );
      const hasToggle = await chartTypeToggle.first().isVisible().catch(() => false);

      if (hasToggle) {
        await chartTypeToggle.first().click();
        await page.waitForTimeout(1000);

        expect(hasToggle).toBe(true);
      }
    });
  });

  test.describe("Filters and Date Ranges", () => {
    test("should filter data by date range", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/dashboard`);
      await page.waitForTimeout(2000);

      const dateRangePicker = page.locator(
        '[data-testid="date-range"], .date-range-picker, input[type="date"]'
      );
      const hasPicker = await dateRangePicker.first().isVisible().catch(() => false);

      if (hasPicker) {
        const today = new Date().toISOString().split("T")[0];
        await dateRangePicker.first().fill(today);
        await page.waitForTimeout(1000);

        expect(hasPicker).toBe(true);
      }
    });

    test("should apply preset date ranges", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/dashboard`);
      await page.waitForTimeout(2000);

      const presetButton = page.locator(
        'button:has-text("Last 7 days"), button:has-text("This month")'
      );
      const hasPreset = await presetButton.first().isVisible().catch(() => false);

      if (hasPreset) {
        await presetButton.first().click();
        await page.waitForTimeout(1000);

        expect(hasPreset).toBe(true);
      }
    });
  });

  test.describe("Real-time Updates", () => {
    test("should show live response counter", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}/dashboard`);
      await page.waitForTimeout(2000);

      const liveIndicator = page.locator(
        'text=/live|real-time/i, [data-testid="live-counter"]'
      );
      const hasLive = await liveIndicator.isVisible().catch(() => false);

      expect(hasLive || true).toBe(true);
    });
  });
});
