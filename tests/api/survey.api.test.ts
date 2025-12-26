import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";

test.describe("Survey API Tests @api", () => {
  let apiHelper: ApiHelper;
  let authToken: string;
  let testCompanyId: string;

  test.beforeAll(async () => {
    apiHelper = new ApiHelper({ baseURL: "http://localhost:3001" });

    // Login to get authentication token
    authToken = await apiHelper.login("admin", "admin1235");
    apiHelper = new ApiHelper({
      baseURL: "http://localhost:3001",
      token: authToken,
    });

    // Create a test company for survey tests
    const company = await apiHelper.createCompany({
      code: "SURVEY_TEST",
      slug: "survey-test-company",
      name: "Survey Test Company",
      email: "survey@test.com",
    });
    testCompanyId = company.id;
  });

  test.describe("Survey CRUD Operations", () => {
    test("should create a new survey", async () => {
      const surveyData = {
        code: "SURVEY001",
        name: "Test Survey",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        requestEmail: true,
        requestMobile: false,
        internetQuota: 100,
      };

      const survey = await apiHelper.createSurvey(surveyData);

      expect(survey).toBeDefined();
      expect(survey.code).toBe(surveyData.code);
      expect(survey.name).toBe(surveyData.name);
      expect(survey.requestEmail).toBe(surveyData.requestEmail);
    });

    test("should get survey by ID", async () => {
      const testData = apiHelper.getTestData();
      expect(testData.surveyId).toBeDefined();

      const survey = await apiHelper.getSurvey(testData.surveyId!);

      expect(survey).toBeDefined();
      expect(survey.id).toBe(testData.surveyId);
    });

    test("should update survey", async () => {
      const testData = apiHelper.getTestData();
      expect(testData.surveyId).toBeDefined();

      const updateData = {
        name: "Updated Test Survey",
        description: "Updated survey description",
        internetQuota: 200,
      };

      const updatedSurvey = await apiHelper.updateSurvey(
        testData.surveyId!,
        updateData
      );

      expect(updatedSurvey.name).toBe(updateData.name);
      expect(updatedSurvey.description).toBe(updateData.description);
      expect(updatedSurvey.internetQuota).toBe(updateData.internetQuota);
    });

    test("should activate survey", async () => {
      const testData = apiHelper.getTestData();
      expect(testData.surveyId).toBeDefined();

      const result = await apiHelper.activateSurvey(testData.surveyId!);

      expect(result.status).toBe("ACTIVE");
    });

    test("should delist survey", async () => {
      const testData = apiHelper.getTestData();
      expect(testData.surveyId).toBeDefined();

      const result = await apiHelper.delistSurvey(testData.surveyId!);

      expect(result.status).toBe("DELIST");
    });
  });

  test.describe("Survey Questions and Choices", () => {
    test("should add questions to survey", async () => {
      const testData = apiHelper.getTestData();
      expect(testData.surveyId).toBeDefined();

      const questionData = {
        text: "What is your favorite color?",
        type: "SINGLE_CHOICE",
        isOptional: false,
        choices: [
          { code: "RED", text: "Red" },
          { code: "BLUE", text: "Blue" },
          { code: "GREEN", text: "Green" },
        ],
      };

      const question = await apiHelper.addQuestionToSurvey(
        testData.surveyId!,
        questionData
      );

      expect(question).toBeDefined();
      expect(question.text).toBe(questionData.text);
      expect(question.choices).toHaveLength(3);
    });

    test("should add conditional questions", async () => {
      const testData = apiHelper.getTestData();
      expect(testData.surveyId).toBeDefined();

      const conditionalQuestionData = {
        text: "Why do you like this color?",
        type: "FREE_TEXT",
        isOptional: true,
        parentQuestionId: 1, // Assuming first question exists
        condition: {
          choiceCode: "RED",
          operator: "EQUALS",
        },
      };

      const question = await apiHelper.addConditionalQuestion(
        testData.surveyId!,
        conditionalQuestionData
      );

      expect(question).toBeDefined();
      expect(question.isNested).toBe(true);
    });
  });

  test.describe("Employee Management for Surveys", () => {
    test("should create employees for company", async () => {
      const employees = await apiHelper.bulkCreateEmployees(testCompanyId, 5);

      expect(employees).toHaveLength(5);
      expect(employees[0]).toHaveProperty("id");
      expect(employees[0]).toHaveProperty("email");
      expect(employees[0]).toHaveProperty("firstname");
    });

    test("should assign reviewers to employees", async () => {
      const testData = apiHelper.getTestData();
      expect(testData.surveyId).toBeDefined();
      expect(testData.employeeIds).toBeDefined();
      expect(testData.employeeIds!.length).toBeGreaterThan(1);

      const assignments = [
        {
          employeeId: testData.employeeIds![0],
          reviewerIds: [testData.employeeIds![1], testData.employeeIds![2]],
          reviewType: "PEER",
        },
        {
          employeeId: testData.employeeIds![1],
          reviewerIds: [testData.employeeIds![0], testData.employeeIds![2]],
          reviewType: "PEER",
        },
      ];

      const result = await apiHelper.assignReviewers(
        testData.surveyId!,
        assignments
      );

      expect(result).toBeDefined();
      expect(result.message).toContain("assigned successfully");
    });
  });

  test.describe("Survey Taking (Visitor API)", () => {
    test("should get survey for visitor", async () => {
      const testData = apiHelper.getTestData();
      expect(testData.surveyId).toBeDefined();

      const survey = await apiHelper.getSurvey(testData.surveyId!, "EN");

      expect(survey).toBeDefined();
      expect(survey.id).toBe(testData.surveyId);
      expect(survey.questions).toBeDefined();
    });

    test("should submit survey answers", async () => {
      const testData = apiHelper.getTestData();
      expect(testData.surveyId).toBeDefined();

      const answers = [
        {
          questionId: 1,
          choiceId: 1,
          freeText: null,
        },
        {
          questionId: 2,
          choiceId: null,
          freeText: "I like this color because it is vibrant",
        },
      ];

      const result = await apiHelper.submitSurvey(testData.surveyId!, answers);

      expect(result).toBeDefined();
      expect(result.message).toContain("submitted successfully");
    });
  });

  test.describe("Survey Export", () => {
    test("should create export job", async () => {
      const testData = apiHelper.getTestData();
      expect(testData.surveyId).toBeDefined();

      const job = await apiHelper.createExportJob(testData.surveyId!);

      expect(job).toBeDefined();
      expect(job.type).toBe("SURVEY_DATA");
      expect(job.status).toBe("PENDING");
    });

    test("should get export job status", async () => {
      const testData = apiHelper.getTestData();
      expect(testData.surveyId).toBeDefined();

      // Create export job first
      const job = await apiHelper.createExportJob(testData.surveyId!);

      // Check job status
      const jobStatus = await apiHelper.getExportJob(job.id);

      expect(jobStatus).toBeDefined();
      expect(jobStatus.id).toBe(job.id);
    });
  });

  test.describe("Survey Validation", () => {
    test("should reject survey with invalid dates", async () => {
      const surveyData = {
        code: "INVALID",
        name: "Invalid Survey",
        startDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // Future start
        endDate: new Date().toISOString(), // Past end
        requestEmail: true,
      };

      try {
        await apiHelper.createSurvey(surveyData);
        expect.fail("Should have thrown an error for invalid dates");
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    test("should reject survey with duplicate code", async () => {
      const surveyData = {
        code: "DUPLICATE_SURVEY",
        name: "Duplicate Survey",
        requestEmail: true,
      };

      // Create first survey
      await apiHelper.createSurvey(surveyData);

      // Try to create second survey with same code
      try {
        await apiHelper.createSurvey(surveyData);
        expect.fail("Should have thrown an error for duplicate code");
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  test.describe("Survey Localization", () => {
    test("should create survey with multiple locales", async () => {
      const surveyData = {
        code: "MULTI_LOCALE",
        name: "Multi Locale Survey",
        requestEmail: true,
        localizations: [
          {
            locale: "EN",
            title: "English Title",
            description: "English Description",
          },
          {
            locale: "TH",
            title: "Thai Title",
            description: "Thai Description",
          },
        ],
      };

      const survey = await apiHelper.createSurvey(surveyData);

      expect(survey).toBeDefined();
      expect(survey.localizations).toHaveLength(2);
    });
  });

  test.afterAll(async () => {
    // Clean up test data
    const testData = apiHelper.getTestData();

    // Delete survey if exists
    if (testData.surveyId) {
      try {
        await apiHelper.deleteSurvey(testData.surveyId);
      } catch (error) {
        // Survey might already be deleted
      }
    }

    // Delete test company
    if (testCompanyId) {
      try {
        await apiHelper.deleteCompany(testCompanyId);
      } catch (error) {
        // Company might already be deleted
      }
    }

    apiHelper.clearTestData();
  });
});
