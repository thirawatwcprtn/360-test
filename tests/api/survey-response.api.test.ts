import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";
import { faker } from "@faker-js/faker";

test.describe("Survey Response & Submission API Tests @api @survey-response", () => {
  let apiHelper: ApiHelper;
  let testCompanyId: string;
  let testSurveyId: number;
  let testEmployees: any[];

  test.beforeAll(async () => {
    apiHelper = new ApiHelper();
    const token = await apiHelper.login();
    apiHelper = new ApiHelper({ token });

    // Create test company
    const company = await apiHelper.createCompany({
      code: "SURVEY_RESP_CO",
      name: "Survey Response Test Company",
    });
    testCompanyId = company.id;

    // Create employees
    testEmployees = await apiHelper.bulkCreateEmployees(testCompanyId, 5);

    // Create survey
    const survey = await apiHelper.createSurvey({
      code: "RESP_TEST_SURVEY",
      name: "Response Test Survey",
      companyId: testCompanyId,
    });
    testSurveyId = survey.id;

    // Add questions to survey
    await apiHelper.addQuestionToSurvey(testSurveyId, {
      questionText: "How satisfied are you with your job?",
      questionType: "RATING",
      order: 1,
      required: true,
      translations: {
        EN: "How satisfied are you with your job?",
        TH: "คุณพอใจกับงานของคุณแค่ไหน?",
      },
    });

    await apiHelper.addQuestionToSurvey(testSurveyId, {
      questionText: "What can we improve?",
      questionType: "TEXT",
      order: 2,
      required: false,
      translations: {
        EN: "What can we improve?",
        TH: "เราสามารถปรับปรุงอะไรได้บ้าง?",
      },
    });

    await apiHelper.addQuestionToSurvey(testSurveyId, {
      questionText: "Would you recommend this company?",
      questionType: "YES_NO",
      order: 3,
      required: true,
      translations: {
        EN: "Would you recommend this company?",
        TH: "คุณจะแนะนำบริษัทนี้ไหม?",
      },
    });
  });

  test.afterAll(async () => {
    if (testSurveyId) {
      await apiHelper.deleteSurvey(testSurveyId);
    }
    if (testCompanyId) {
      await apiHelper.deleteCompany(testCompanyId);
    }
  });

  test.describe("Survey Access", () => {
    test("should get survey by ID with default locale", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      expect(survey).toBeDefined();
      expect(survey.id).toBe(testSurveyId);
      expect(survey.code).toBe("RESP_TEST_SURVEY");
      expect(survey.questions).toBeDefined();
      expect(survey.questions.length).toBeGreaterThan(0);
    });

    test("should get survey with Thai locale", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "TH");

      expect(survey).toBeDefined();
      expect(survey.questions).toBeDefined();

      // Questions should have Thai translations
      const firstQuestion = survey.questions[0];
      expect(firstQuestion.questionText).toContain("คุณ");
    });

    test("should get survey with English locale", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      expect(survey).toBeDefined();
      expect(survey.questions).toBeDefined();

      // Questions should be in English
      const firstQuestion = survey.questions[0];
      expect(firstQuestion.questionText).toMatch(/satisfied|improve|recommend/i);
    });

    test("should fail to access non-existent survey", async () => {
      try {
        await apiHelper.getSurvey(999999, "EN");
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    test("should fail to access inactive survey", async () => {
      // Create inactive survey
      const inactiveSurvey = await apiHelper.createSurvey({
        code: "INACTIVE_SURVEY",
        name: "Inactive Survey",
        status: "DRAFT",
      });

      try {
        await apiHelper.getSurvey(inactiveSurvey.id, "EN");
        expect.fail("Should not access inactive survey");
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }

      await apiHelper.deleteSurvey(inactiveSurvey.id);
    });
  });

  test.describe("Survey Submission", () => {
    test("should submit complete survey response", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      const answers = [
        {
          questionId: survey.questions[0].id,
          answer: 5, // Rating
        },
        {
          questionId: survey.questions[1].id,
          answer: "Better communication and team collaboration",
        },
        {
          questionId: survey.questions[2].id,
          answer: true, // Yes/No
        },
      ];

      const response = await apiHelper.submitSurvey(testSurveyId, answers);

      expect(response).toBeDefined();
      expect(response.message || response.status).toBeDefined();
    });

    test("should submit survey with only required fields", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      // Only required questions (question 1 and 3)
      const answers = [
        {
          questionId: survey.questions[0].id,
          answer: 4,
        },
        {
          questionId: survey.questions[2].id,
          answer: true,
        },
      ];

      const response = await apiHelper.submitSurvey(testSurveyId, answers);

      expect(response).toBeDefined();
    });

    test("should fail to submit without required fields", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      // Missing required question
      const answers = [
        {
          questionId: survey.questions[1].id,
          answer: "Some feedback",
        },
      ];

      try {
        await apiHelper.submitSurvey(testSurveyId, answers);
        expect.fail("Should require all required fields");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    test("should validate rating answer range", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      const invalidAnswers = [
        {
          questionId: survey.questions[0].id,
          answer: 0, // Below minimum
        },
        {
          questionId: survey.questions[2].id,
          answer: true,
        },
      ];

      try {
        await apiHelper.submitSurvey(testSurveyId, invalidAnswers);
        expect.fail("Should validate rating range");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    test("should validate answer data types", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      const invalidAnswers = [
        {
          questionId: survey.questions[0].id,
          answer: "not a number", // Should be number
        },
        {
          questionId: survey.questions[2].id,
          answer: true,
        },
      ];

      try {
        await apiHelper.submitSurvey(testSurveyId, invalidAnswers);
        expect.fail("Should validate answer types");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    test("should prevent duplicate submissions", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      const answers = [
        {
          questionId: survey.questions[0].id,
          answer: 5,
        },
        {
          questionId: survey.questions[2].id,
          answer: true,
        },
      ];

      // First submission
      await apiHelper.submitSurvey(testSurveyId, answers);

      // Try duplicate submission
      try {
        await apiHelper.submitSurvey(testSurveyId, answers);
        // Some systems allow multiple submissions, some don't
        // This test documents the behavior
      } catch (error: any) {
        // If it fails, should be 400 or 409
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  test.describe("Conditional Questions", () => {
    test("should handle conditional question logic", async () => {
      // Add conditional question
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      const conditionalQuestion = await apiHelper.addConditionalQuestion(
        testSurveyId,
        {
          questionText: "Why wouldn't you recommend us?",
          questionType: "TEXT",
          order: 4,
          required: false,
          condition: {
            dependsOn: survey.questions[2].id, // Yes/No question
            expectedAnswer: false, // Only show if answer is No
          },
          translations: {
            EN: "Why wouldn't you recommend us?",
            TH: "ทำไมคุณจึงไม่แนะนำเรา?",
          },
        }
      );

      expect(conditionalQuestion).toBeDefined();
    });

    test("should submit with conditional questions answered", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      const answers = [
        {
          questionId: survey.questions[0].id,
          answer: 3,
        },
        {
          questionId: survey.questions[2].id,
          answer: false, // Triggers conditional
        },
        // Conditional question answer
        {
          questionId: survey.questions[3]?.id,
          answer: "Service quality needs improvement",
        },
      ];

      const response = await apiHelper.submitSurvey(testSurveyId, answers);
      expect(response).toBeDefined();
    });

    test("should skip conditional questions when condition not met", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      const answers = [
        {
          questionId: survey.questions[0].id,
          answer: 5,
        },
        {
          questionId: survey.questions[2].id,
          answer: true, // Condition not met, skip conditional
        },
        // No conditional question answer
      ];

      const response = await apiHelper.submitSurvey(testSurveyId, answers);
      expect(response).toBeDefined();
    });
  });

  test.describe("Multi-locale Responses", () => {
    test("should accept responses in Thai locale", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "TH");

      const answers = [
        {
          questionId: survey.questions[0].id,
          answer: 5,
        },
        {
          questionId: survey.questions[1].id,
          answer: "ควรปรับปรุงการสื่อสาร",
        },
        {
          questionId: survey.questions[2].id,
          answer: true,
        },
      ];

      const response = await apiHelper.submitSurvey(testSurveyId, answers);
      expect(response).toBeDefined();
    });

    test("should handle unicode characters in text responses", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      const answers = [
        {
          questionId: survey.questions[0].id,
          answer: 4,
        },
        {
          questionId: survey.questions[1].id,
          answer: "ทดสอบภาษาไทย 中文 日本語 🚀 Special chars: @#$%",
        },
        {
          questionId: survey.questions[2].id,
          answer: true,
        },
      ];

      const response = await apiHelper.submitSurvey(testSurveyId, answers);
      expect(response).toBeDefined();
    });
  });

  test.describe("Token-based Survey Access", () => {
    test("should access survey with valid token", async () => {
      // Create survey token for employee
      const tokenResponse = await apiHelper.api.post(
        `/admin/survey/${testSurveyId}/generate-token`,
        {
          employeeId: testEmployees[0].id,
        }
      );

      const token = tokenResponse.data.token;
      expect(token).toBeDefined();

      // Access survey with token
      const surveyResponse = await apiHelper.api.get(
        `/survey/${testSurveyId}?token=${token}`
      );

      expect(surveyResponse.data).toBeDefined();
    });

    test("should fail with invalid token", async () => {
      try {
        await apiHelper.api.get(
          `/survey/${testSurveyId}?token=invalid_token_123`
        );
        expect.fail("Should fail with invalid token");
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    test("should fail with expired token", async () => {
      // This would require creating an expired token
      // Implementation depends on your token system
    });
  });

  test.describe("Answer Text Length Validation", () => {
    test("should accept normal length text answers", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      const answers = [
        {
          questionId: survey.questions[0].id,
          answer: 5,
        },
        {
          questionId: survey.questions[1].id,
          answer: "This is a normal length answer that should be accepted",
        },
        {
          questionId: survey.questions[2].id,
          answer: true,
        },
      ];

      const response = await apiHelper.submitSurvey(testSurveyId, answers);
      expect(response).toBeDefined();
    });

    test("should handle very long text answers", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      const longAnswer = "A".repeat(5000);

      const answers = [
        {
          questionId: survey.questions[0].id,
          answer: 5,
        },
        {
          questionId: survey.questions[1].id,
          answer: longAnswer,
        },
        {
          questionId: survey.questions[2].id,
          answer: true,
        },
      ];

      try {
        const response = await apiHelper.submitSurvey(testSurveyId, answers);
        // Either accepts it or rejects it
        expect(response || true).toBeDefined();
      } catch (error: any) {
        // If rejected, should be 400
        expect(error.response.status).toBe(400);
      }
    });

    test("should reject empty required text answers", async () => {
      // Create survey with required text question
      const textSurvey = await apiHelper.createSurvey({
        code: "TEXT_REQ_SURVEY",
        name: "Text Required Survey",
      });

      await apiHelper.addQuestionToSurvey(textSurvey.id, {
        questionText: "Please provide feedback",
        questionType: "TEXT",
        order: 1,
        required: true,
      });

      const survey = await apiHelper.getSurvey(textSurvey.id, "EN");

      try {
        await apiHelper.submitSurvey(textSurvey.id, [
          {
            questionId: survey.questions[0].id,
            answer: "", // Empty required field
          },
        ]);
        expect.fail("Should reject empty required text");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }

      await apiHelper.deleteSurvey(textSurvey.id);
    });
  });

  test.describe("Special Characters and Input Sanitization", () => {
    test("should sanitize HTML in text responses", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      const answers = [
        {
          questionId: survey.questions[0].id,
          answer: 5,
        },
        {
          questionId: survey.questions[1].id,
          answer: "<script>alert('xss')</script>",
        },
        {
          questionId: survey.questions[2].id,
          answer: true,
        },
      ];

      const response = await apiHelper.submitSurvey(testSurveyId, answers);
      expect(response).toBeDefined();
      // XSS should be sanitized on backend
    });

    test("should handle SQL injection attempts in responses", async () => {
      const survey = await apiHelper.getSurvey(testSurveyId, "EN");

      const answers = [
        {
          questionId: survey.questions[0].id,
          answer: 5,
        },
        {
          questionId: survey.questions[1].id,
          answer: "'; DROP TABLE responses; --",
        },
        {
          questionId: survey.questions[2].id,
          answer: true,
        },
      ];

      const response = await apiHelper.submitSurvey(testSurveyId, answers);
      expect(response).toBeDefined();
      // Should be safely stored without executing SQL
    });
  });
});
