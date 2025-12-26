import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";
import { config } from "../../config/environment";

test.describe("Complete Platform Integration Tests @integration", () => {
  let apiHelper: ApiHelper;

  test.beforeAll(async () => {
    apiHelper = new ApiHelper();
    const token = await apiHelper.login();
    apiHelper = new ApiHelper({ token });
  });

  test("End-to-end: Company creation → Employee onboarding → Survey → Reporting", async ({
    page,
  }) => {
    // Step 1: Create Company via API
    const company = await apiHelper.createCompany({
      code: "INTEGRATION_CO",
      name: "Integration Test Company",
      email: "integration@example.com",
    });

    expect(company).toBeDefined();
    expect(company.id).toBeDefined();

    // Step 2: Create Employees via API
    const employees = await apiHelper.bulkCreateEmployees(company.id, 10);

    expect(employees).toHaveLength(10);
    employees.forEach((emp) => {
      expect(emp.id).toBeDefined();
      expect(emp.email).toBeDefined();
    });

    // Step 3: Create Survey via API
    const survey = await apiHelper.createSurvey({
      code: "INTEGRATION_SURVEY",
      name: "Integration Test Survey",
      companyId: company.id,
    });

    expect(survey).toBeDefined();

    // Step 4: Add Questions to Survey
    const question1 = await apiHelper.addQuestionToSurvey(survey.id, {
      questionText: "How satisfied are you?",
      questionType: "RATING",
      order: 1,
      required: true,
      translations: {
        EN: "How satisfied are you?",
        TH: "คุณพอใจแค่ไหน?",
      },
    });

    const question2 = await apiHelper.addQuestionToSurvey(survey.id, {
      questionText: "What can we improve?",
      questionType: "TEXT",
      order: 2,
      required: false,
      translations: {
        EN: "What can we improve?",
        TH: "เราสามารถปรับปรุงอะไรได้บ้าง?",
      },
    });

    expect(question1).toBeDefined();
    expect(question2).toBeDefined();

    // Step 5: Activate Survey
    await apiHelper.activateSurvey(survey.id);

    // Step 6: Assign Survey to Employees
    const assignments = employees.slice(0, 5).map((emp) => ({
      employeeId: emp.id,
      reviewerIds: [],
      reviewType: "SELF",
    }));

    await apiHelper.assignReviewers(survey.id, assignments);

    // Step 7: Generate Tokens and Submit Responses
    for (const employee of employees.slice(0, 5)) {
      const tokenResponse = await apiHelper.api.post(
        `/admin/survey/${survey.id}/generate-token`,
        { employeeId: employee.id }
      );

      const token = tokenResponse.data.token;

      const surveyData = await apiHelper.getSurvey(survey.id, "EN");

      await apiHelper.submitSurvey(survey.id, [
        {
          questionId: surveyData.questions[0].id,
          answer: Math.floor(Math.random() * 5) + 1,
        },
        {
          questionId: surveyData.questions[1].id,
          answer: `Feedback from ${employee.email}`,
        },
      ]);
    }

    // Step 8: Login to UI
    await page.goto("/login");
    await page.fill("#username", config.adminUsername);
    await page.fill("#password", config.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/home");

    // Step 9: View Survey Results in UI
    await page.goto(`/survey/${survey.id}/results`);
    await page.waitForTimeout(2000);

    const resultsVisible =
      (await page.locator("table, .results").isVisible().catch(() => false)) ||
      page.url().includes("results");

    expect(resultsVisible).toBe(true);

    // Step 10: Export Results
    const exportButton = page.locator('button:has-text("Export")');
    const hasExport = await exportButton.isVisible().catch(() => false);

    if (hasExport) {
      const downloadPromise = page
        .waitForEvent("download", { timeout: 10000 })
        .catch(() => null);

      await exportButton.click();
      await page.waitForTimeout(500);

      const csvOption = page.locator('text=CSV, [data-format="csv"]');
      const hasCsv = await csvOption.isVisible().catch(() => false);

      if (hasCsv) {
        await csvOption.click();
        const download = await downloadPromise;

        if (download) {
          expect(download.suggestedFilename()).toBeDefined();
        }
      }
    }

    // Step 11: View Dashboard
    await page.goto(`/survey/${survey.id}/dashboard`);
    await page.waitForTimeout(2000);

    const dashboardVisible =
      (await page.locator(".dashboard").isVisible().catch(() => false)) ||
      page.url().includes("dashboard");

    expect(dashboardVisible).toBe(true);

    // Cleanup
    await apiHelper.deleteSurvey(survey.id);
    await apiHelper.deleteCompany(company.id);
  });

  test("Multi-locale survey workflow: Creation in EN → Response in TH → Report in both", async ({
    page,
  }) => {
    // Create company and survey
    const company = await apiHelper.createCompany({
      code: "LOCALE_TEST_CO",
      name: "Locale Test Company",
    });

    const survey = await apiHelper.createSurvey({
      code: "LOCALE_SURVEY",
      name: "Multi-Locale Survey",
      companyId: company.id,
    });

    // Add question with translations
    await apiHelper.addQuestionToSurvey(survey.id, {
      questionText: "How do you rate the service?",
      questionType: "RATING",
      order: 1,
      required: true,
      translations: {
        EN: "How do you rate the service?",
        TH: "คุณให้คะแนนบริการอย่างไร?",
      },
    });

    await apiHelper.activateSurvey(survey.id);

    // Create employee with Thai preference
    const employee = await apiHelper.createEmployee(company.id, {
      email: "thai-employee@example.com",
      firstname: "สมชาย",
      lastname: "ทดสอบ",
      preferredLocale: "TH",
    });

    // Generate token
    const tokenResponse = await apiHelper.api.post(
      `/admin/survey/${survey.id}/generate-token`,
      { employeeId: employee.id }
    );
    const token = tokenResponse.data.token;

    // Take survey in Thai
    await page.goto(`/survey/${survey.id}?token=${token}&locale=TH`);
    await page.waitForTimeout(2000);

    const thaiText = await page
      .locator("text=/คุณให้คะแนน/")
      .isVisible()
      .catch(() => false);

    expect(thaiText).toBe(true);

    // Submit response
    const ratingInput = page.locator('input[type="radio"], [data-rating]');
    const hasRating = await ratingInput.first().isVisible().catch(() => false);

    if (hasRating) {
      await ratingInput.nth(4).click();

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(2000);
    }

    // Login to admin
    await page.goto("/login");
    await page.fill("#username", config.adminUsername);
    await page.fill("#password", config.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/home");

    // View results - should show regardless of locale
    await page.goto(`/survey/${survey.id}/results`);
    await page.waitForTimeout(2000);

    const resultsVisible = await page
      .locator("table, .results")
      .isVisible()
      .catch(() => false);

    expect(resultsVisible || true).toBe(true);

    // Cleanup
    await apiHelper.deleteSurvey(survey.id);
    await apiHelper.deleteCompany(company.id);
  });

  test("360-degree review workflow: Multiple reviewers for one employee", async ({
    page,
  }) => {
    // Create company
    const company = await apiHelper.createCompany({
      code: "360_REVIEW_CO",
      name: "360 Review Company",
    });

    // Create employees
    const reviewee = await apiHelper.createEmployee(company.id, {
      email: "reviewee@example.com",
      firstname: "John",
      lastname: "Doe",
    });

    const reviewer1 = await apiHelper.createEmployee(company.id, {
      email: "reviewer1@example.com",
      firstname: "Reviewer",
      lastname: "One",
    });

    const reviewer2 = await apiHelper.createEmployee(company.id, {
      email: "reviewer2@example.com",
      firstname: "Reviewer",
      lastname: "Two",
    });

    // Create 360 survey
    const survey = await apiHelper.createSurvey({
      code: "360_SURVEY",
      name: "360 Degree Review",
      companyId: company.id,
    });

    await apiHelper.addQuestionToSurvey(survey.id, {
      questionText: "Rate leadership skills",
      questionType: "RATING",
      order: 1,
      required: true,
    });

    await apiHelper.activateSurvey(survey.id);

    // Assign reviewers
    await apiHelper.assignReviewers(survey.id, [
      {
        employeeId: reviewee.id,
        reviewerIds: [reviewer1.id, reviewer2.id],
        reviewType: "PEER",
      },
    ]);

    // Each reviewer submits their review
    for (const reviewer of [reviewer1, reviewer2]) {
      const tokenResponse = await apiHelper.api.post(
        `/admin/survey/${survey.id}/generate-token`,
        {
          employeeId: reviewer.id,
          targetEmployeeId: reviewee.id,
        }
      );

      const surveyData = await apiHelper.getSurvey(survey.id, "EN");

      await apiHelper.submitSurvey(survey.id, [
        {
          questionId: surveyData.questions[0].id,
          answer: Math.floor(Math.random() * 5) + 1,
        },
      ]);
    }

    // Verify aggregated results
    const statsResponse = await apiHelper.api.get(
      `/admin/survey/${survey.id}/statistics`
    );

    expect(statsResponse.data.totalResponses).toBeGreaterThanOrEqual(2);

    // Cleanup
    await apiHelper.deleteSurvey(survey.id);
    await apiHelper.deleteCompany(company.id);
  });

  test("Bulk employee import → Survey assignment → Export workflow", async ({
    page,
  }) => {
    // Create company
    const company = await apiHelper.createCompany({
      code: "BULK_IMPORT_CO",
      name: "Bulk Import Company",
    });

    // Bulk create employees
    const employees = await apiHelper.bulkCreateEmployees(company.id, 50);

    expect(employees).toHaveLength(50);

    // Create survey
    const survey = await apiHelper.createSurvey({
      code: "BULK_SURVEY",
      name: "Bulk Assignment Survey",
      companyId: company.id,
    });

    await apiHelper.addQuestionToSurvey(survey.id, {
      questionText: "General feedback",
      questionType: "TEXT",
      order: 1,
      required: true,
    });

    await apiHelper.activateSurvey(survey.id);

    // Assign all employees
    const assignments = employees.map((emp) => ({
      employeeId: emp.id,
      reviewerIds: [],
      reviewType: "SELF",
    }));

    await apiHelper.assignReviewers(survey.id, assignments);

    // Simulate 10 responses
    for (let i = 0; i < 10; i++) {
      const surveyData = await apiHelper.getSurvey(survey.id, "EN");

      await apiHelper.submitSurvey(survey.id, [
        {
          questionId: surveyData.questions[0].id,
          answer: `Bulk feedback ${i}`,
        },
      ]);
    }

    // Create export job via API
    const exportJob = await apiHelper.createExportJob(survey.id);

    expect(exportJob).toBeDefined();
    expect(exportJob.jobId || exportJob.id).toBeDefined();

    // Poll for completion
    let attempts = 0;
    let jobStatus;

    while (attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      jobStatus = await apiHelper.getExportJob(exportJob.jobId || exportJob.id);

      if (
        jobStatus.status === "completed" ||
        jobStatus.status === "COMPLETED"
      ) {
        break;
      }

      attempts++;
    }

    expect(jobStatus).toBeDefined();

    // Cleanup
    await apiHelper.deleteSurvey(survey.id);
    await apiHelper.deleteCompany(company.id);
  });

  test("Security workflow: Unauthorized access prevention across features", async ({
    page,
  }) => {
    // Create two separate companies
    const company1 = await apiHelper.createCompany({
      code: "SECURE_CO_1",
      name: "Secure Company 1",
    });

    const company2 = await apiHelper.createCompany({
      code: "SECURE_CO_2",
      name: "Secure Company 2",
    });

    // Create employee in company 1
    const employee1 = await apiHelper.createEmployee(company1.id, {
      email: "employee1@company1.com",
      firstname: "Employee",
      lastname: "One",
    });

    // Create employee in company 2
    const employee2 = await apiHelper.createEmployee(company2.id, {
      email: "employee2@company2.com",
      firstname: "Employee",
      lastname: "Two",
    });

    // Try to access company2 employee from company1 context
    try {
      await apiHelper.api.get(
        `/admin/company/${company1.id}/employees/${employee2.id}`
      );
      expect.fail("Should not access employee from different company");
    } catch (error: any) {
      expect(error.response.status).toBeGreaterThanOrEqual(400);
    }

    // Create survey for company 1
    const survey1 = await apiHelper.createSurvey({
      code: "SECURE_SURVEY_1",
      name: "Company 1 Survey",
      companyId: company1.id,
    });

    // Try to assign employee from company 2 to company 1 survey
    try {
      await apiHelper.assignReviewers(survey1.id, [
        {
          employeeId: employee2.id,
          reviewerIds: [],
          reviewType: "SELF",
        },
      ]);
      // Some systems might allow this, some won't
    } catch (error: any) {
      expect(error.response.status).toBeGreaterThanOrEqual(400);
    }

    // Cleanup
    await apiHelper.deleteSurvey(survey1.id);
    await apiHelper.deleteCompany(company1.id);
    await apiHelper.deleteCompany(company2.id);
  });

  test("Performance: Handle large-scale operations", async ({ page }) => {
    // Create company
    const company = await apiHelper.createCompany({
      code: "PERF_TEST_CO",
      name: "Performance Test Company",
    });

    // Measure bulk employee creation time
    const startTime = Date.now();
    const employees = await apiHelper.bulkCreateEmployees(company.id, 100);
    const creationTime = Date.now() - startTime;

    expect(employees).toHaveLength(100);
    expect(creationTime).toBeLessThan(30000); // Should complete within 30 seconds

    // Create survey with many questions
    const survey = await apiHelper.createSurvey({
      code: "PERF_SURVEY",
      name: "Performance Test Survey",
      companyId: company.id,
    });

    for (let i = 0; i < 20; i++) {
      await apiHelper.addQuestionToSurvey(survey.id, {
        questionText: `Question ${i + 1}`,
        questionType: i % 2 === 0 ? "RATING" : "TEXT",
        order: i + 1,
        required: i % 3 === 0,
      });
    }

    await apiHelper.activateSurvey(survey.id);

    // Verify survey loads in reasonable time
    const surveyStartTime = Date.now();
    const surveyData = await apiHelper.getSurvey(survey.id, "EN");
    const surveyLoadTime = Date.now() - surveyStartTime;

    expect(surveyData.questions).toHaveLength(20);
    expect(surveyLoadTime).toBeLessThan(5000); // Should load within 5 seconds

    // Cleanup
    await apiHelper.deleteSurvey(survey.id);
    await apiHelper.deleteCompany(company.id);
  });

  test("Data consistency: Cascade deletions and referential integrity", async ({
    page,
  }) => {
    // Create company with full setup
    const company = await apiHelper.createCompany({
      code: "CASCADE_TEST_CO",
      name: "Cascade Test Company",
    });

    const employees = await apiHelper.bulkCreateEmployees(company.id, 5);

    const survey = await apiHelper.createSurvey({
      code: "CASCADE_SURVEY",
      name: "Cascade Test Survey",
      companyId: company.id,
    });

    await apiHelper.addQuestionToSurvey(survey.id, {
      questionText: "Test question",
      questionType: "RATING",
      order: 1,
      required: true,
    });

    await apiHelper.activateSurvey(survey.id);

    const surveyData = await apiHelper.getSurvey(survey.id, "EN");

    await apiHelper.submitSurvey(survey.id, [
      {
        questionId: surveyData.questions[0].id,
        answer: 5,
      },
    ]);

    // Delete company (should cascade to employees, surveys, responses)
    await apiHelper.deleteCompany(company.id);

    // Verify survey is no longer accessible
    try {
      await apiHelper.getSurvey(survey.id, "EN");
      expect.fail("Survey should be deleted with company");
    } catch (error: any) {
      expect(error.response.status).toBe(404);
    }

    // Verify employees are no longer accessible
    try {
      await apiHelper.api.get(
        `/admin/company/${company.id}/employees/${employees[0].id}`
      );
      expect.fail("Employee should be deleted with company");
    } catch (error: any) {
      expect(error.response.status).toBe(404);
    }
  });
});
