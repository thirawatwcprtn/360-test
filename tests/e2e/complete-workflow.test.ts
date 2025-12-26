import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";
import { UIHelper } from "../utils/ui-helper";

test.describe("Complete Survey Workflow Tests @e2e", () => {
  let apiHelper: ApiHelper;
  let uiHelper: UIHelper;
  let authToken: string;
  let testCompanyId: string;
  let testSurveyId: number;
  let testEmployeeIds: string[];

  test.beforeAll(async () => {
    apiHelper = new ApiHelper({ baseURL: "http://localhost:3001" });

    // Login to get authentication token
    authToken = await apiHelper.login("admin", "admin1235");
    apiHelper = new ApiHelper({
      baseURL: "http://localhost:3001",
      token: authToken,
    });
  });

  test.beforeEach(async ({ page }) => {
    uiHelper = new UIHelper(page);
    await uiHelper.login("admin", "admin1235");
  });

  test("Complete survey workflow from company creation to survey completion @regression", async ({
    page,
  }) => {
    // Step 1: Create Company via API
    const company = await apiHelper.createCompany({
      code: "E2E_TEST",
      slug: "e2e-test-company",
      name: "E2E Test Company",
      description: "Company for end-to-end testing",
      phone: "+1234567890",
      email: "e2e@test.com",
      website: "https://e2etest.com",
    });
    testCompanyId = company.id;
    expect(company).toBeDefined();

    // Step 2: Create Employees via API
    const employees = await apiHelper.bulkCreateEmployees(testCompanyId, 5);
    testEmployeeIds = employees.map((emp) => emp.id);
    expect(employees).toHaveLength(5);

    // Step 3: Create Survey via API
    const survey = await apiHelper.createSurvey({
      code: "E2E_SURVEY",
      name: "E2E Test Survey",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      requestEmail: true,
      requestMobile: false,
      internetQuota: 100,
    });
    testSurveyId = survey.id;
    expect(survey).toBeDefined();

    // Step 4: Add Questions to Survey via API
    const question1 = await apiHelper.addQuestionToSurvey(testSurveyId, {
      text: "What is your favorite color?",
      type: "SINGLE_CHOICE",
      isOptional: false,
      choices: [
        { code: "RED", text: "Red" },
        { code: "BLUE", text: "Blue" },
        { code: "GREEN", text: "Green" },
      ],
    });
    expect(question1).toBeDefined();

    const question2 = await apiHelper.addQuestionToSurvey(testSurveyId, {
      text: "Why do you like this color?",
      type: "FREE_TEXT",
      isOptional: true,
      parentQuestionId: question1.id,
      condition: {
        choiceCode: "RED",
        operator: "EQUALS",
      },
    });
    expect(question2).toBeDefined();

    // Step 5: Assign Reviewers via API
    const assignments = [
      {
        employeeId: testEmployeeIds[0],
        reviewerIds: [testEmployeeIds[1], testEmployeeIds[2]],
        reviewType: "PEER",
      },
      {
        employeeId: testEmployeeIds[1],
        reviewerIds: [testEmployeeIds[0], testEmployeeIds[2]],
        reviewType: "PEER",
      },
    ];
    const assignmentResult = await apiHelper.assignReviewers(
      testSurveyId,
      assignments
    );
    expect(assignmentResult).toBeDefined();

    // Step 6: Activate Survey via API
    const activatedSurvey = await apiHelper.activateSurvey(testSurveyId);
    expect(activatedSurvey.status).toBe("ACTIVE");

    // Step 7: Verify Company in UI
    await page.goto("/company");
    await uiHelper.expectTextVisible("E2E Test Company");

    // Click on company to view details
    await uiHelper.clickTableRow('[data-testid="company-table"]', 0);
    await uiHelper.expectElementVisible('[data-testid="company-details"]');

    // Step 8: Verify Employees in UI
    await page.click('[data-testid="employees-tab"]');
    await uiHelper.expectElementVisible('[data-testid="employees-list"]');

    // Verify employee count
    const employeeRows = await uiHelper.getTableRowCount(
      '[data-testid="employees-table"]'
    );
    expect(employeeRows).toBe(5);

    // Step 9: Verify Survey in UI
    await page.goto("/survey");
    await uiHelper.expectTextVisible("E2E Test Survey");

    // Click on survey to view details
    await uiHelper.clickTableRow('[data-testid="survey-table"]', 0);
    await uiHelper.expectElementVisible('[data-testid="survey-details"]');

    // Step 10: Take Survey as Visitor (API)
    const surveyData = await apiHelper.getSurvey(testSurveyId, "EN");
    expect(surveyData.questions).toHaveLength(2);

    // Submit survey answers
    const answers = [
      {
        questionId: question1.id,
        choiceId: question1.choices[0].id, // Red
        freeText: null,
      },
      {
        questionId: question2.id,
        choiceId: null,
        freeText: "I like red because it is vibrant and energetic",
      },
    ];
    const submissionResult = await apiHelper.submitSurvey(
      testSurveyId,
      answers
    );
    expect(submissionResult).toBeDefined();

    // Step 11: Create Export Job via API
    const exportJob = await apiHelper.createExportJob(testSurveyId);
    expect(exportJob.type).toBe("SURVEY_DATA");
    expect(exportJob.status).toBe("PENDING");

    // Step 12: Verify Export in UI
    await page.goto("/survey");
    await uiHelper.clickTableRow('[data-testid="survey-table"]', 0);
    await page.click('[data-testid="export-tab"]');
    await uiHelper.expectElementVisible('[data-testid="export-jobs-list"]');

    // Step 13: Download Export File
    const download = await uiHelper.downloadExport(
      '[data-testid="download-export"]'
    );
    expect(download).toBeDefined();
    expect(download.suggestedFilename()).toContain(".xlsx");

    // Step 14: Verify Survey Results
    await page.click('[data-testid="results-tab"]');
    await uiHelper.expectElementVisible('[data-testid="survey-results"]');

    // Verify answer count
    await uiHelper.expectTextVisible("1 response");
  });

  test("Bulk operations workflow @regression", async ({ page }) => {
    // Step 1: Bulk Create Companies via API
    const companies = await apiHelper.bulkCreateCompanies(10);
    expect(companies).toHaveLength(10);

    // Step 2: Verify Companies in UI
    await page.goto("/company");
    const companyRows = await uiHelper.getTableRowCount(
      '[data-testid="company-table"]'
    );
    expect(companyRows).toBeGreaterThanOrEqual(10);

    // Step 3: Bulk Update Companies via API
    const updateData = companies.map((company) => ({
      id: company.id,
      name: `Updated ${company.name}`,
      description: "Bulk updated via API",
    }));
    const updatedCompanies = await apiHelper.bulkUpdateCompanies(updateData);
    expect(updatedCompanies).toHaveLength(10);

    // Step 4: Verify Updates in UI
    await page.reload();
    const tableData = await uiHelper.getTableData(
      '[data-testid="company-table"]'
    );
    tableData.forEach((row) => {
      expect(row.some((cell) => cell.includes("Updated"))).toBe(true);
    });

    // Step 5: Bulk Delete Companies via API
    const companyIds = companies.map((c) => c.id);
    const deleteResult = await apiHelper.bulkDeleteCompanies(companyIds);
    expect(deleteResult).toBeDefined();

    // Step 6: Verify Deletion in UI
    await page.reload();
    const remainingRows = await uiHelper.getTableRowCount(
      '[data-testid="company-table"]'
    );
    expect(remainingRows).toBeLessThan(companyRows);
  });

  test("Survey localization workflow @regression", async ({ page }) => {
    // Step 1: Create Multi-locale Survey via API
    const survey = await apiHelper.createSurvey({
      code: "MULTI_LOCALE_E2E",
      name: "Multi Locale E2E Survey",
      requestEmail: true,
      localizations: [
        {
          locale: "EN",
          title: "English Survey Title",
          description: "English survey description",
        },
        {
          locale: "TH",
          title: "Thai Survey Title",
          description: "Thai survey description",
        },
      ],
    });
    expect(survey.localizations).toHaveLength(2);

    // Step 2: Add Questions in Multiple Locales
    const question = await apiHelper.addQuestionToSurvey(survey.id, {
      text: "What is your favorite color?",
      type: "SINGLE_CHOICE",
      isOptional: false,
      choices: [
        { code: "RED", text: "Red" },
        { code: "BLUE", text: "Blue" },
      ],
      localizations: [
        {
          locale: "EN",
          text: "What is your favorite color?",
          choices: [
            { code: "RED", text: "Red" },
            { code: "BLUE", text: "Blue" },
          ],
        },
        {
          locale: "TH",
          text: "สีที่คุณชอบคืออะไร?",
          choices: [
            { code: "RED", text: "แดง" },
            { code: "BLUE", text: "น้ำเงิน" },
          ],
        },
      ],
    });
    expect(question.localizations).toHaveLength(2);

    // Step 3: Test Survey in English
    const englishSurvey = await apiHelper.getSurvey(survey.id, "EN");
    expect(englishSurvey.title).toBe("English Survey Title");
    expect(englishSurvey.questions[0].text).toBe(
      "What is your favorite color?"
    );

    // Step 4: Test Survey in Thai
    const thaiSurvey = await apiHelper.getSurvey(survey.id, "TH");
    expect(thaiSurvey.title).toBe("Thai Survey Title");
    expect(thaiSurvey.questions[0].text).toBe("สีที่คุณชอบคืออะไร?");

    // Step 5: Submit Answers in Different Locales
    const englishAnswers = [
      {
        questionId: question.id,
        choiceId: question.choices[0].id,
        freeText: null,
      },
    ];
    await apiHelper.submitSurvey(survey.id, englishAnswers);

    const thaiAnswers = [
      {
        questionId: question.id,
        choiceId: question.choices[1].id,
        freeText: null,
      },
    ];
    await apiHelper.submitSurvey(survey.id, thaiAnswers);

    // Step 6: Verify Results in UI
    await page.goto("/survey");
    await uiHelper.clickTableRow('[data-testid="survey-table"]', 0);
    await page.click('[data-testid="results-tab"]');
    await uiHelper.expectTextVisible("2 responses");
  });

  test("Error handling and validation workflow @regression", async ({
    page,
  }) => {
    // Step 1: Test Invalid Company Creation
    try {
      await apiHelper.createCompany({
        code: "", // Invalid empty code
        name: "", // Invalid empty name
        email: "invalid-email", // Invalid email format
      });
      expect.fail("Should have thrown validation errors");
    } catch (error) {
      expect(error.response.status).toBe(400);
    }

    // Step 2: Test Invalid Survey Creation
    try {
      await apiHelper.createSurvey({
        code: "INVALID_SURVEY",
        name: "Invalid Survey",
        startDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // Future start
        endDate: new Date().toISOString(), // Past end
        requestEmail: true,
      });
      expect.fail("Should have thrown date validation error");
    } catch (error) {
      expect(error.response.status).toBe(400);
    }

    // Step 3: Test UI Validation
    await page.goto("/company");
    await uiHelper.clickButton('[data-testid="create-company-button"]');
    await uiHelper.submitForm('[data-testid="submit-company-form"]');

    // Verify UI validation errors
    await uiHelper.expectTextVisible("Code is required");
    await uiHelper.expectTextVisible("Name is required");
    await uiHelper.expectTextVisible("Email is required");
  });

  test.afterAll(async () => {
    // Clean up test data
    if (testSurveyId) {
      try {
        await apiHelper.deleteSurvey(testSurveyId);
      } catch (error) {
        // Survey might already be deleted
      }
    }

    if (testCompanyId) {
      try {
        await apiHelper.deleteCompany(testCompanyId);
      } catch (error) {
        // Company might already be deleted
      }
    }

    apiHelper.clearTestData();
  });

  test.afterEach(async ({ page }) => {
    // Clean up by logging out
    await uiHelper.logout();
  });
});
