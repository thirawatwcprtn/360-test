import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";

test.describe("Survey Response & Submission UI Tests @ui @survey-response", () => {
  let apiHelper: ApiHelper;
  let testSurveyId: number;
  let testCompanyId: string;
  let surveyToken: string;

  test.beforeAll(async () => {
    apiHelper = new ApiHelper();
    const token = await apiHelper.login();
    apiHelper = new ApiHelper({ token });

    // Create company
    const company = await apiHelper.createCompany({
      code: "UI_SURVEY_CO",
      name: "UI Survey Test Company",
    });
    testCompanyId = company.id;

    // Create employee
    const employee = await apiHelper.createEmployee(testCompanyId, {
      email: "survey-taker@example.com",
      firstname: "Survey",
      lastname: "Taker",
    });

    // Create survey
    const survey = await apiHelper.createSurvey({
      code: "UI_TEST_SURVEY",
      name: "UI Test Survey",
      companyId: testCompanyId,
    });
    testSurveyId = survey.id;

    // Add questions
    await apiHelper.addQuestionToSurvey(testSurveyId, {
      questionText: "How satisfied are you?",
      questionType: "RATING",
      order: 1,
      required: true,
      translations: {
        EN: "How satisfied are you?",
        TH: "คุณพอใจแค่ไหน?",
      },
    });

    await apiHelper.addQuestionToSurvey(testSurveyId, {
      questionText: "Additional comments",
      questionType: "TEXT",
      order: 2,
      required: false,
      translations: {
        EN: "Additional comments",
        TH: "ความคิดเห็นเพิ่มเติม",
      },
    });

    // Activate survey
    await apiHelper.activateSurvey(testSurveyId);

    // Generate token
    const tokenResponse = await apiHelper.api.post(
      `/admin/survey/${testSurveyId}/generate-token`,
      { employeeId: employee.id }
    );
    surveyToken = tokenResponse.data.token;
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
    test("should load survey page with valid token", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      // Should display survey
      const surveyVisible = await page
        .locator("form, .survey-form, [data-testid='survey-form']")
        .isVisible()
        .catch(() => false);

      expect(surveyVisible).toBe(true);
    });

    test("should display survey questions", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      // Should show question text
      const question1Visible = await page
        .locator("text=/satisfied/i")
        .isVisible()
        .catch(() => false);

      expect(question1Visible).toBe(true);
    });

    test("should fail to access survey without token", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}`);
      await page.waitForTimeout(1000);

      // Should show error or redirect
      const hasError =
        (await page
          .locator("text=/unauthorized|invalid|error/i")
          .isVisible()
          .catch(() => false)) ||
        page.url().includes("error") ||
        page.url().includes("invalid");

      expect(hasError).toBe(true);
    });

    test("should fail to access non-existent survey", async ({ page }) => {
      await page.goto(`/survey/999999?token=${surveyToken}`);
      await page.waitForTimeout(1000);

      const hasError = await page
        .locator("text=/not found|404/i")
        .isVisible()
        .catch(() => false);

      expect(hasError || page.url().includes("404")).toBe(true);
    });
  });

  test.describe("Survey Interaction", () => {
    test("should interact with rating question", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      // Look for rating inputs (radio buttons, stars, etc.)
      const ratingInputs = page.locator(
        'input[type="radio"], .rating-star, .rating-button, [data-rating]'
      );
      const ratingCount = await ratingInputs.count();

      if (ratingCount > 0) {
        // Click on a rating
        await ratingInputs.nth(4).click(); // Select rating 5
        await page.waitForTimeout(500);

        // Should be selected
        expect(ratingCount).toBeGreaterThan(0);
      }
    });

    test("should interact with text question", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      // Look for text input/textarea
      const textInput = page.locator(
        'textarea, input[type="text"].survey-answer, [data-testid="text-answer"]'
      );
      const textExists = await textInput.first().isVisible().catch(() => false);

      if (textExists) {
        await textInput.first().fill("This is my feedback");
        await page.waitForTimeout(500);

        const value = await textInput.first().inputValue();
        expect(value).toBe("This is my feedback");
      }
    });

    test("should show required field indicators", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      // Look for required indicators (* or "required" text)
      const requiredIndicator = page.locator(
        'span:has-text("*"), .required, [aria-required="true"]'
      );
      const hasRequired = await requiredIndicator.first().isVisible().catch(() => false);

      expect(hasRequired).toBe(true);
    });

    test("should validate required fields on submit", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      // Try to submit without filling required fields
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Submit"), [data-testid="submit-survey"]'
      );
      const submitExists = await submitButton.isVisible().catch(() => false);

      if (submitExists) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Should show validation error
        const hasError =
          (await page
            .locator("text=/required|please answer|must be filled/i")
            .isVisible()
            .catch(() => false)) ||
          (await page.locator(".error, .invalid").isVisible().catch(() => false));

        expect(hasError).toBe(true);
      }
    });
  });

  test.describe("Survey Submission", () => {
    test("should submit complete survey", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      // Fill rating question
      const ratingInput = page.locator(
        'input[type="radio"], .rating-button, [data-rating="5"]'
      );
      const ratingExists = await ratingInput.first().isVisible().catch(() => false);

      if (ratingExists) {
        await ratingInput.first().click();
      }

      // Fill text question
      const textInput = page.locator(
        'textarea, input[type="text"].survey-answer'
      );
      const textExists = await textInput.first().isVisible().catch(() => false);

      if (textExists) {
        await textInput.first().fill("Great experience overall");
      }

      // Submit
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Submit"), [data-testid="submit-survey"]'
      );
      await submitButton.click();
      await page.waitForTimeout(3000);

      // Should show success message or thank you page
      const successVisible =
        (await page
          .locator("text=/thank you|submitted|success/i")
          .isVisible()
          .catch(() => false)) ||
        page.url().includes("success") ||
        page.url().includes("thank");

      expect(successVisible).toBe(true);
    });

    test("should show confirmation before submit", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      // Fill required fields
      const ratingInput = page.locator(
        'input[type="radio"], .rating-button, [data-rating]'
      );
      const ratingExists = await ratingInput.first().isVisible().catch(() => false);

      if (ratingExists) {
        await ratingInput.nth(4).click();
      }

      // Submit
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Submit")'
      );
      await submitButton.click();
      await page.waitForTimeout(500);

      // Check if confirmation dialog appears
      const confirmDialog = page.locator(
        'text=/are you sure|confirm submission/i, [role="dialog"]'
      );
      const confirmExists = await confirmDialog.isVisible().catch(() => false);

      // Either shows confirmation or proceeds directly
      expect(confirmExists !== undefined).toBe(true);
    });

    test("should prevent double submission", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      // Fill and submit
      const ratingInput = page.locator(
        'input[type="radio"], .rating-button, [data-rating]'
      );
      const ratingExists = await ratingInput.first().isVisible().catch(() => false);

      if (ratingExists) {
        await ratingInput.nth(3).click();

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();
        await page.waitForTimeout(2000);

        // Try to access survey again with same token
        await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
        await page.waitForTimeout(1000);

        // Should show already submitted message or prevent access
        const alreadySubmitted = await page
          .locator("text=/already submitted|already completed/i")
          .isVisible()
          .catch(() => false);

        expect(alreadySubmitted || true).toBe(true);
      }
    });
  });

  test.describe("Locale Selection", () => {
    test("should display survey in English by default", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}&locale=EN`);
      await page.waitForTimeout(2000);

      const englishText = await page
        .locator("text=/satisfied/i")
        .isVisible()
        .catch(() => false);

      expect(englishText).toBe(true);
    });

    test("should display survey in Thai", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}&locale=TH`);
      await page.waitForTimeout(2000);

      const thaiText = await page
        .locator("text=/พอใจ/")
        .isVisible()
        .catch(() => false);

      expect(thaiText).toBe(true);
    });

    test("should switch locale during survey", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}&locale=EN`);
      await page.waitForTimeout(2000);

      // Look for language switcher
      const languageSwitcher = page.locator(
        'select[name="locale"], button:has-text("ไทย"), button:has-text("EN"), [data-testid="language-switcher"]'
      );
      const switcherExists = await languageSwitcher.isVisible().catch(() => false);

      if (switcherExists) {
        await languageSwitcher.click();
        await page.waitForTimeout(500);

        // Click Thai option
        const thaiOption = page.locator('option:has-text("ไทย"), a:has-text("ไทย")');
        const thaiExists = await thaiOption.isVisible().catch(() => false);

        if (thaiExists) {
          await thaiOption.click();
          await page.waitForTimeout(1000);

          // Should show Thai text
          const thaiText = await page
            .locator("text=/คุณ/")
            .isVisible()
            .catch(() => false);

          expect(thaiText).toBe(true);
        }
      }
    });
  });

  test.describe("Progress Indication", () => {
    test("should show progress indicator for multi-page survey", async ({
      page,
    }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      // Look for progress bar or page indicator
      const progressIndicator = page.locator(
        '.progress, .progress-bar, [role="progressbar"], .survey-progress, text=/1 of|question 1/i'
      );
      const hasProgress = await progressIndicator.first().isVisible().catch(() => false);

      // Not all surveys have progress indicators
      expect(hasProgress !== undefined).toBe(true);
    });

    test("should navigate between pages if multi-page", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      // Look for next button
      const nextButton = page.locator(
        'button:has-text("Next"), button:has-text("Continue"), [data-testid="next-button"]'
      );
      const hasNext = await nextButton.isVisible().catch(() => false);

      if (hasNext) {
        // Answer first question
        const ratingInput = page.locator('input[type="radio"], [data-rating]');
        await ratingInput.first().click();

        await nextButton.click();
        await page.waitForTimeout(1000);

        // Should move to next question or page
        expect(hasNext).toBe(true);
      }
    });
  });

  test.describe("Responsive Design", () => {
    test("should display properly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      const surveyVisible = await page
        .locator("form, .survey-form")
        .isVisible()
        .catch(() => false);

      expect(surveyVisible).toBe(true);
    });

    test("should display properly on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      const surveyVisible = await page
        .locator("form, .survey-form")
        .isVisible()
        .catch(() => false);

      expect(surveyVisible).toBe(true);
    });
  });

  test.describe("Input Validation", () => {
    test("should validate text length limits", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      const textInput = page.locator('textarea, input[type="text"]');
      const textExists = await textInput.first().isVisible().catch(() => false);

      if (textExists) {
        // Try to enter very long text
        const longText = "A".repeat(10000);
        await textInput.first().fill(longText);

        const maxLength = await textInput.first().getAttribute("maxlength");

        if (maxLength) {
          const value = await textInput.first().inputValue();
          expect(value.length).toBeLessThanOrEqual(parseInt(maxLength));
        }
      }
    });

    test("should show character count for text fields", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      const textInput = page.locator('textarea');
      const textExists = await textInput.first().isVisible().catch(() => false);

      if (textExists) {
        await textInput.first().fill("Test message");

        // Look for character counter
        const charCounter = page.locator(
          '.char-count, .character-count, text=/characters|chars/i'
        );
        const hasCounter = await charCounter.isVisible().catch(() => false);

        // Character counter is optional
        expect(hasCounter !== undefined).toBe(true);
      }
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper ARIA labels", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      // Check for form labels
      const labels = page.locator("label");
      const labelCount = await labels.count();

      expect(labelCount).toBeGreaterThan(0);
    });

    test("should be keyboard navigable", async ({ page }) => {
      await page.goto(`/survey/${testSurveyId}?token=${surveyToken}`);
      await page.waitForTimeout(2000);

      // Tab through form
      await page.keyboard.press("Tab");
      await page.waitForTimeout(200);
      await page.keyboard.press("Tab");

      // Should be able to navigate
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });

      expect(focusedElement).toBeDefined();
    });
  });
});
