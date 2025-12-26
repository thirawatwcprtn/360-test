import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";
import { faker } from "@faker-js/faker";

test.describe("Survey Management API Tests @api", () => {
  let apiHelper: ApiHelper;
  let authToken: string;
  let testCompanyId: string;
  let testSurveyId: number;
  let testEmployeeIds: string[] = [];

  test.beforeAll(async () => {
    apiHelper = new ApiHelper();
    authToken = await apiHelper.login();
    apiHelper = new ApiHelper({ token: authToken });

    // Create a test company first
    const companyData = {
      name: `Survey Test Company ${faker.company.name()}`,
      code: `SURV${faker.string.alphanumeric(6).toUpperCase()}`,
      slug: faker.helpers.slugify(faker.company.name()),
      description: faker.lorem.sentence(),
    };
    const company = await apiHelper.createCompany(companyData);
    testCompanyId = company.id;
  });

  test("should create a new survey with basic information", async () => {
    const surveyData = {
      name: `Employee 360 Review ${faker.company.name()}`,
      description: faker.lorem.sentence(),
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      locales: ["TH", "EN"],
      companyId: testCompanyId,
    };

    const survey = await apiHelper.createSurvey(surveyData);

    expect(survey).toBeDefined();
    expect(survey.name).toBe(surveyData.name);
    expect(survey.description).toBe(surveyData.description);
    expect(survey.status).toBe("draft");
    expect(survey.locales).toEqual(surveyData.locales);
    expect(survey.companyId).toBe(testCompanyId);

    testSurveyId = survey.id;
  });

  test("should add questions to survey", async () => {
    const questions = [
      {
        text: "How would you rate this person's communication skills?",
        type: "rating",
        required: true,
        options: [
          "1 - Poor",
          "2 - Fair",
          "3 - Good",
          "4 - Very Good",
          "5 - Excellent",
        ],
        order: 1,
      },
      {
        text: "What are this person's strengths?",
        type: "text",
        required: false,
        order: 2,
      },
      {
        text: "What areas could this person improve?",
        type: "text",
        required: false,
        order: 3,
      },
      {
        text: "How well does this person work in a team?",
        type: "rating",
        required: true,
        options: [
          "1 - Poor",
          "2 - Fair",
          "3 - Good",
          "4 - Very Good",
          "5 - Excellent",
        ],
        order: 4,
      },
    ];

    for (const question of questions) {
      const createdQuestion = await apiHelper.addQuestionToSurvey(
        testSurveyId,
        question
      );
      expect(createdQuestion).toBeDefined();
      expect(createdQuestion.text).toBe(question.text);
      expect(createdQuestion.type).toBe(question.type);
      expect(createdQuestion.required).toBe(question.required);
      expect(createdQuestion.order).toBe(question.order);
    }

    // Verify all questions were added
    const surveyQuestions = await apiHelper.getSurveyQuestions(testSurveyId);
    expect(surveyQuestions).toHaveLength(4);
  });

  test("should create employees for the survey", async () => {
    const employees = [
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@testcompany.com",
        employeeId: "EMP001",
        department: "Engineering",
        position: "Software Engineer",
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@testcompany.com",
        employeeId: "EMP002",
        department: "Sales",
        position: "Sales Manager",
      },
      {
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob.johnson@testcompany.com",
        employeeId: "EMP003",
        department: "Marketing",
        position: "Marketing Specialist",
      },
    ];

    for (const employee of employees) {
      const createdEmployee = await apiHelper.createEmployee(
        testCompanyId,
        employee
      );
      expect(createdEmployee).toBeDefined();
      expect(createdEmployee.firstName).toBe(employee.firstName);
      expect(createdEmployee.lastName).toBe(employee.lastName);
      expect(createdEmployee.email).toBe(employee.email);
      expect(createdEmployee.employeeId).toBe(employee.employeeId);

      testEmployeeIds.push(createdEmployee.id);
    }
  });

  test("should assign employees to survey", async () => {
    for (const employeeId of testEmployeeIds) {
      await apiHelper.assignEmployeeToSurvey(testSurveyId, employeeId);
    }

    // Verify assignments
    const surveyAssignments = await apiHelper.getSurveyAssignments(
      testSurveyId
    );
    expect(surveyAssignments.length).toBeGreaterThanOrEqual(
      testEmployeeIds.length
    );

    for (const employeeId of testEmployeeIds) {
      const assignment = surveyAssignments.find(
        (a) => a.employeeId === employeeId
      );
      expect(assignment).toBeDefined();
    }
  });

  test("should create reviewer assignments", async () => {
    const reviewers = [
      {
        firstName: "Manager",
        lastName: "One",
        email: "manager1@testcompany.com",
        token: "manager1-360-review-2024",
      },
      {
        firstName: "Manager",
        lastName: "Two",
        email: "manager2@testcompany.com",
        token: "manager2-360-review-2024",
      },
    ];

    for (const reviewer of reviewers) {
      const createdReviewer = await apiHelper.createReviewer(reviewer);
      expect(createdReviewer).toBeDefined();
      expect(createdReviewer.email).toBe(reviewer.email);
      expect(createdReviewer.token).toBe(reviewer.token);

      // Assign reviewer to multiple employees
      for (const employeeId of testEmployeeIds) {
        await apiHelper.assignReviewerToEmployee(
          createdReviewer.id,
          employeeId,
          testSurveyId
        );
      }
    }
  });

  test("should activate survey", async () => {
    await apiHelper.activateSurvey(testSurveyId);

    const survey = await apiHelper.getSurvey(testSurveyId);
    expect(survey.status).toBe("active");
  });

  test("should retrieve survey statistics", async () => {
    const stats = await apiHelper.getSurveyStatistics(testSurveyId);

    expect(stats).toBeDefined();
    expect(stats.totalEmployees).toBeGreaterThanOrEqual(testEmployeeIds.length);
    expect(stats.totalReviewers).toBeGreaterThanOrEqual(2);
    expect(stats.totalQuestions).toBe(4);
    expect(stats.completionRate).toBeDefined();
  });

  test("should handle survey deactivation", async () => {
    await apiHelper.deactivateSurvey(testSurveyId);

    const survey = await apiHelper.getSurvey(testSurveyId);
    expect(survey.status).toBe("inactive");
  });

  test("should list all surveys", async () => {
    const surveys = await apiHelper.listSurveys();

    expect(Array.isArray(surveys)).toBe(true);
    expect(surveys.length).toBeGreaterThan(0);

    // Verify our test survey is in the list
    const testSurvey = surveys.find((s) => s.id === testSurveyId);
    expect(testSurvey).toBeDefined();
  });

  test("should update survey information", async () => {
    const updateData = {
      name: `Updated Survey ${faker.company.name()}`,
      description: faker.lorem.sentence(),
    };

    const updatedSurvey = await apiHelper.updateSurvey(
      testSurveyId,
      updateData
    );

    expect(updatedSurvey.name).toBe(updateData.name);
    expect(updatedSurvey.description).toBe(updateData.description);
  });

  test("should handle bulk employee creation", async () => {
    const bulkEmployees = [];

    for (let i = 0; i < 5; i++) {
      bulkEmployees.push({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        employeeId: `BULK${i + 1}`,
        department: faker.helpers.arrayElement([
          "Engineering",
          "Sales",
          "Marketing",
        ]),
        position: faker.helpers.arrayElement([
          "Engineer",
          "Manager",
          "Specialist",
        ]),
      });
    }

    const createdEmployees = await apiHelper.bulkCreateEmployees(
      testCompanyId,
      bulkEmployees
    );
    expect(createdEmployees).toHaveLength(5);

    for (const employee of createdEmployees) {
      expect(employee.id).toBeDefined();
      expect(employee.firstName).toBeDefined();
      expect(employee.lastName).toBeDefined();
      expect(employee.email).toBeDefined();
    }
  });

  test("should validate survey creation requirements", async () => {
    const invalidData = {
      // Missing required fields
      description: faker.lorem.sentence(),
    };

    await expect(apiHelper.createSurvey(invalidData)).rejects.toThrow();
  });

  test("should handle survey with different locales", async () => {
    const multiLocaleSurvey = {
      name: `Multi-Locale Survey ${faker.company.name()}`,
      description: faker.lorem.sentence(),
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      locales: ["TH", "EN", "JP"],
      companyId: testCompanyId,
    };

    const survey = await apiHelper.createSurvey(multiLocaleSurvey);
    expect(survey.locales).toEqual(["TH", "EN", "JP"]);
  });

  test.afterAll(async () => {
    // Cleanup test data
    try {
      if (testSurveyId) {
        await apiHelper.deleteSurvey(testSurveyId);
      }
      if (testCompanyId) {
        await apiHelper.deleteCompany(testCompanyId);
      }
    } catch (error) {
      console.log("Cleanup error:", error.message);
    }
  });
});
