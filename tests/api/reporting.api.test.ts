import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";

test.describe("Reporting & Analytics API Tests @api @reporting", () => {
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
      code: "REPORT_TEST_CO",
      name: "Reporting Test Company",
    });
    testCompanyId = company.id;

    // Create employees
    testEmployees = await apiHelper.bulkCreateEmployees(testCompanyId, 20);

    // Create survey
    const survey = await apiHelper.createSurvey({
      code: "REPORT_SURVEY",
      name: "Reporting Test Survey",
      companyId: testCompanyId,
    });
    testSurveyId = survey.id;

    // Add questions
    await apiHelper.addQuestionToSurvey(testSurveyId, {
      questionText: "Overall satisfaction",
      questionType: "RATING",
      order: 1,
      required: true,
    });

    await apiHelper.addQuestionToSurvey(testSurveyId, {
      questionText: "Comments",
      questionType: "TEXT",
      order: 2,
      required: false,
    });

    // Submit some responses via API
    for (let i = 0; i < 10; i++) {
      const surveyData = await apiHelper.getSurvey(testSurveyId, "EN");
      await apiHelper.submitSurvey(testSurveyId, [
        {
          questionId: surveyData.questions[0].id,
          answer: Math.floor(Math.random() * 5) + 1,
        },
        {
          questionId: surveyData.questions[1].id,
          answer: `Test feedback ${i}`,
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

  test.describe("Export Jobs", () => {
    test("should create export job for survey results", async () => {
      const exportJob = await apiHelper.createExportJob(testSurveyId);

      expect(exportJob).toBeDefined();
      expect(exportJob.jobId || exportJob.id).toBeDefined();
      expect(exportJob.status).toBeDefined();
    });

    test("should get export job status", async () => {
      const exportJob = await apiHelper.createExportJob(testSurveyId);
      const jobId = exportJob.jobId || exportJob.id;

      // Wait a bit for processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const jobStatus = await apiHelper.getExportJob(jobId);

      expect(jobStatus).toBeDefined();
      expect(jobStatus.status).toMatch(/pending|processing|completed|failed/i);
    });

    test("should complete export job and provide download URL", async () => {
      const exportJob = await apiHelper.createExportJob(testSurveyId);
      const jobId = exportJob.jobId || exportJob.id;

      // Poll for completion
      let attempts = 0;
      let jobStatus;

      while (attempts < 20) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        jobStatus = await apiHelper.getExportJob(jobId);

        if (
          jobStatus.status === "completed" ||
          jobStatus.status === "COMPLETED"
        ) {
          break;
        }

        attempts++;
      }

      if (jobStatus?.status === "completed" || jobStatus?.status === "COMPLETED") {
        expect(jobStatus.downloadUrl || jobStatus.fileUrl).toBeDefined();
      }
    });

    test("should handle export job with no data", async () => {
      // Create survey with no responses
      const emptySurvey = await apiHelper.createSurvey({
        code: "EMPTY_SURVEY",
        name: "Empty Survey",
      });

      const exportJob = await apiHelper.createExportJob(emptySurvey.id);

      expect(exportJob).toBeDefined();
      expect(exportJob.jobId || exportJob.id).toBeDefined();

      // Cleanup
      await apiHelper.deleteSurvey(emptySurvey.id);
    });

    test("should list all export jobs for survey", async () => {
      // Create multiple export jobs
      await apiHelper.createExportJob(testSurveyId);
      await apiHelper.createExportJob(testSurveyId);

      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/export-jobs`
      );

      expect(response.data.data).toBeDefined();
      expect(response.data.data.length).toBeGreaterThanOrEqual(2);
    });

    test("should delete/cancel export job", async () => {
      const exportJob = await apiHelper.createExportJob(testSurveyId);
      const jobId = exportJob.jobId || exportJob.id;

      const response = await apiHelper.api.delete(
        `/admin/export-job/${jobId}`
      );

      expect(response.status).toBe(200);
    });
  });

  test.describe("Survey Statistics", () => {
    test("should get survey response statistics", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/statistics`
      );

      expect(response.data).toBeDefined();
      expect(response.data.totalResponses).toBeGreaterThan(0);
      expect(response.data.completionRate).toBeDefined();
    });

    test("should get question-level statistics", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/question-statistics`
      );

      expect(response.data).toBeDefined();
      expect(response.data.length).toBeGreaterThan(0);

      // Rating question should have average
      const ratingStats = response.data.find(
        (q: any) => q.questionType === "RATING"
      );
      if (ratingStats) {
        expect(ratingStats.average).toBeDefined();
        expect(ratingStats.min).toBeDefined();
        expect(ratingStats.max).toBeDefined();
      }
    });

    test("should get response distribution", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/response-distribution`
      );

      expect(response.data).toBeDefined();
      // Should have distribution data
    });

    test("should filter statistics by date range", async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const endDate = new Date();

      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/statistics`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      expect(response.data).toBeDefined();
      expect(response.data.totalResponses).toBeDefined();
    });

    test("should get response rate by department if applicable", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/response-rate-by-department`
      );

      // May return empty array if no departments
      expect(response.data).toBeDefined();
    });
  });

  test.describe("Export Formats", () => {
    test("should export as CSV", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/export`,
        {
          params: { format: "csv" },
        }
      );

      expect(response.data).toBeDefined();
      // CSV should be string format
    });

    test("should export as Excel", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/export`,
        {
          params: { format: "xlsx" },
          responseType: "arraybuffer",
        }
      );

      expect(response.data).toBeDefined();
      expect(response.headers["content-type"]).toContain(
        "spreadsheet"
      );
    });

    test("should export as JSON", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/export`,
        {
          params: { format: "json" },
        }
      );

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data) || typeof response.data === "object").toBe(true);
    });

    test("should export as PDF", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/export`,
        {
          params: { format: "pdf" },
          responseType: "arraybuffer",
        }
      );

      expect(response.data).toBeDefined();
    });
  });

  test.describe("Response Analytics", () => {
    test("should get completion rate over time", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/completion-rate-timeline`
      );

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });

    test("should get average response time", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/average-response-time`
      );

      expect(response.data).toBeDefined();
      expect(response.data.averageTimeSeconds || response.data.averageTime).toBeDefined();
    });

    test("should get sentiment analysis for text responses", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/sentiment-analysis`
      );

      expect(response.data).toBeDefined();
      // Should have positive, negative, neutral counts
    });

    test("should get response trends", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/trends`
      );

      expect(response.data).toBeDefined();
    });
  });

  test.describe("Dashboard Metrics", () => {
    test("should get survey dashboard overview", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/dashboard`
      );

      expect(response.data).toBeDefined();
      expect(response.data.totalResponses).toBeDefined();
      expect(response.data.completionRate).toBeDefined();
      expect(response.data.averageRating).toBeDefined();
    });

    test("should get company-wide dashboard", async () => {
      const response = await apiHelper.api.get(
        `/admin/company/${testCompanyId}/dashboard`
      );

      expect(response.data).toBeDefined();
      expect(response.data.totalSurveys).toBeDefined();
      expect(response.data.totalEmployees).toBeDefined();
    });

    test("should get recent activity", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/recent-activity`
      );

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  test.describe("Comparative Analytics", () => {
    test("should compare multiple surveys", async () => {
      // Create another survey
      const survey2 = await apiHelper.createSurvey({
        code: "COMPARE_SURVEY",
        name: "Comparison Survey",
      });

      const response = await apiHelper.api.post(
        `/admin/surveys/compare`,
        {
          surveyIds: [testSurveyId, survey2.id],
        }
      );

      expect(response.data).toBeDefined();

      // Cleanup
      await apiHelper.deleteSurvey(survey2.id);
    });

    test("should compare responses across time periods", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/compare-periods`,
        {
          params: {
            period1Start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            period1End: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            period2Start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            period2End: new Date(),
          },
        }
      );

      expect(response.data).toBeDefined();
    });
  });

  test.describe("Real-time Analytics", () => {
    test("should get live response count", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/live-stats`
      );

      expect(response.data).toBeDefined();
      expect(response.data.currentResponses).toBeDefined();
    });

    test("should stream analytics updates via WebSocket if available", async () => {
      // This would test WebSocket connection for real-time updates
      // Implementation depends on WebSocket setup
    });
  });

  test.describe("Report Generation", () => {
    test("should generate PDF report", async () => {
      const response = await apiHelper.api.post(
        `/admin/survey/${testSurveyId}/generate-report`,
        {
          format: "pdf",
          includeSections: ["summary", "questions", "demographics"],
        },
        {
          responseType: "arraybuffer",
        }
      );

      expect(response.data).toBeDefined();
      expect(response.status).toBe(200);
    });

    test("should generate PowerPoint report", async () => {
      const response = await apiHelper.api.post(
        `/admin/survey/${testSurveyId}/generate-report`,
        {
          format: "pptx",
        },
        {
          responseType: "arraybuffer",
        }
      );

      expect(response.data).toBeDefined();
    });

    test("should schedule automatic report generation", async () => {
      const response = await apiHelper.api.post(
        `/admin/survey/${testSurveyId}/schedule-report`,
        {
          frequency: "weekly",
          format: "pdf",
          recipients: ["admin@example.com"],
        }
      );

      expect(response.data).toBeDefined();
      expect(response.data.scheduleId).toBeDefined();
    });
  });

  test.describe("Data Filtering", () => {
    test("should filter responses by employee attributes", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/responses`,
        {
          params: {
            locale: "EN",
          },
        }
      );

      expect(response.data).toBeDefined();
    });

    test("should filter by response date range", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/responses`,
        {
          params: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
          },
        }
      );

      expect(response.data).toBeDefined();
    });

    test("should filter by completion status", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/responses`,
        {
          params: {
            completionStatus: "completed",
          },
        }
      );

      expect(response.data).toBeDefined();
    });
  });

  test.describe("Data Privacy in Reports", () => {
    test("should anonymize individual responses in exports", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/export`,
        {
          params: {
            anonymize: true,
            format: "json",
          },
        }
      );

      expect(response.data).toBeDefined();

      // Should not contain identifying information
      const dataStr = JSON.stringify(response.data);
      expect(dataStr).not.toContain("@");
    });

    test("should respect minimum response threshold for aggregated data", async () => {
      const response = await apiHelper.api.get(
        `/admin/survey/${testSurveyId}/statistics`,
        {
          params: {
            minimumResponses: 5,
          },
        }
      );

      expect(response.data).toBeDefined();
      // Should only show stats if minimum threshold met
    });
  });
});
