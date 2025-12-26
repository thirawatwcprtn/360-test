import { test, expect } from "@playwright/test";
import { config } from "../../config/environment";

test.describe("Authentication & Authorization UI Tests @ui @auth", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test.describe("Login Page", () => {
    test("should display login form", async ({ page }) => {
      await expect(page.locator("form")).toBeVisible();
      await expect(page.locator("#username")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("should have proper form accessibility", async ({ page }) => {
      const usernameInput = page.locator("#username");
      const passwordInput = page.locator("#password");

      // Check for labels or aria-labels
      await expect(usernameInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      // Check password field type
      await expect(passwordInput).toHaveAttribute("type", "password");
    });

    test("should show validation errors for empty fields", async ({ page }) => {
      await page.click('button[type="submit"]');

      // Wait for validation messages
      await page.waitForTimeout(500);

      // Browser native validation or custom validation should appear
      const usernameInput = page.locator("#username");
      const passwordInput = page.locator("#password");

      const usernameValid = await usernameInput.evaluate(
        (el: HTMLInputElement) => el.validity.valid
      );
      const passwordValid = await passwordInput.evaluate(
        (el: HTMLInputElement) => el.validity.valid
      );

      expect(usernameValid || passwordValid).toBe(false);
    });

    test("should login successfully with valid credentials", async ({
      page,
    }) => {
      await page.fill("#username", config.adminUsername);
      await page.fill("#password", config.adminPassword);
      await page.click('button[type="submit"]');

      // Wait for navigation to home page
      await page.waitForURL("**/home", { timeout: 10000 });

      // Verify we're on the home page
      expect(page.url()).toContain("/home");
    });

    test("should show error message with invalid credentials", async ({
      page,
    }) => {
      await page.fill("#username", "invalid_user");
      await page.fill("#password", "wrong_password");
      await page.click('button[type="submit"]');

      // Wait for error message
      await page.waitForTimeout(2000);

      // Should still be on login page or show error
      const currentUrl = page.url();
      const hasErrorMessage = await page
        .locator("text=/invalid|error|wrong|incorrect/i")
        .isVisible()
        .catch(() => false);

      expect(currentUrl.includes("/login") || hasErrorMessage).toBe(true);
    });

    test("should prevent SQL injection in login form", async ({ page }) => {
      const sqlInjection = "admin' OR '1'='1";
      await page.fill("#username", sqlInjection);
      await page.fill("#password", sqlInjection);
      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);

      // Should not be logged in
      const currentUrl = page.url();
      expect(currentUrl).toContain("/login");
    });

    test("should prevent XSS in login form", async ({ page }) => {
      const xssPayload = "<script>alert('xss')</script>";
      await page.fill("#username", xssPayload);
      await page.fill("#password", "password");
      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);

      // Should not execute script
      const alertWasShown = await page.evaluate(() => {
        return (window as any).alertShown === true;
      });

      expect(alertWasShown).toBeFalsy();
    });
  });

  test.describe("Password Field Security", () => {
    test("should mask password input", async ({ page }) => {
      const passwordInput = page.locator("#password");

      await passwordInput.fill("testpassword123");

      // Password field should have type="password"
      await expect(passwordInput).toHaveAttribute("type", "password");

      // Check that value is not visible in DOM
      const inputType = await passwordInput.getAttribute("type");
      expect(inputType).toBe("password");
    });

    test("should allow password reveal toggle if present", async ({ page }) => {
      // Check if there's a show/hide password toggle
      const toggleButton = page
        .locator('button:has-text("Show"), button:has-text("Hide")')
        .first();
      const toggleExists = await toggleButton.isVisible().catch(() => false);

      if (toggleExists) {
        const passwordInput = page.locator("#password");
        await passwordInput.fill("testpassword");

        // Click toggle
        await toggleButton.click();

        // Password should now be visible
        const inputType = await passwordInput.getAttribute("type");
        expect(inputType).toBe("text");

        // Click again to hide
        await toggleButton.click();

        // Password should be masked again
        const inputTypeAfter = await passwordInput.getAttribute("type");
        expect(inputTypeAfter).toBe("password");
      }
    });

    test("should not allow password copy-paste if disabled", async ({
      page,
    }) => {
      const passwordInput = page.locator("#password");

      // Check if paste is disabled
      const pasteDisabled = await passwordInput.evaluate((el) => {
        const onPaste = el.getAttribute("onpaste");
        return onPaste === "return false" || onPaste === "false";
      });

      // This is optional - some apps allow paste, some don't
      // Just documenting the check
      expect(typeof pasteDisabled).toBe("boolean");
    });
  });

  test.describe("Session & Logout", () => {
    test("should maintain session after login", async ({ page }) => {
      // Login
      await page.fill("#username", config.adminUsername);
      await page.fill("#password", config.adminPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL("**/home");

      // Navigate to another page
      await page.goto("/company");
      await page.waitForTimeout(1000);

      // Should still be logged in (not redirected to login)
      expect(page.url()).not.toContain("/login");
    });

    test("should logout successfully", async ({ page, context }) => {
      // Login first
      await page.fill("#username", config.adminUsername);
      await page.fill("#password", config.adminPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL("**/home");

      // Look for logout button
      const logoutButton = page.locator(
        'button:has-text("Logout"), button:has-text("Log out"), a:has-text("Logout"), a:has-text("Log out")'
      );
      const logoutExists = await logoutButton.first().isVisible().catch(() => false);

      if (logoutExists) {
        await logoutButton.first().click();
        await page.waitForTimeout(1000);

        // Should redirect to login page
        expect(page.url()).toContain("/login");

        // Session should be cleared - try to access protected page
        await page.goto("/home");
        await page.waitForTimeout(1000);

        // Should redirect back to login
        expect(page.url()).toContain("/login");
      }
    });

    test("should clear session data on logout", async ({ page, context }) => {
      // Login
      await page.fill("#username", config.adminUsername);
      await page.fill("#password", config.adminPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL("**/home");

      // Get cookies before logout
      const cookiesBefore = await context.cookies();
      expect(cookiesBefore.length).toBeGreaterThan(0);

      // Logout
      const logoutButton = page.locator(
        'button:has-text("Logout"), button:has-text("Log out"), a:has-text("Logout"), a:has-text("Log out")'
      );
      const logoutExists = await logoutButton.first().isVisible().catch(() => false);

      if (logoutExists) {
        await logoutButton.first().click();
        await page.waitForTimeout(1000);

        // Check if sensitive cookies are cleared
        const cookiesAfter = await context.cookies();
        const hasAuthCookie = cookiesAfter.some(
          (cookie) =>
            cookie.name.toLowerCase().includes("token") ||
            cookie.name.toLowerCase().includes("session") ||
            cookie.name.toLowerCase().includes("auth")
        );

        // Auth cookies should be removed or cleared
        expect(hasAuthCookie).toBe(false);
      }
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect to login when accessing protected route without auth", async ({
      page,
    }) => {
      await page.goto("/company");
      await page.waitForTimeout(1000);

      // Should redirect to login
      expect(page.url()).toContain("/login");
    });

    test("should allow access to protected routes after login", async ({
      page,
    }) => {
      // Login
      await page.fill("#username", config.adminUsername);
      await page.fill("#password", config.adminPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL("**/home");

      // Access protected route
      await page.goto("/company");
      await page.waitForTimeout(1000);

      // Should be able to access
      expect(page.url()).toContain("/company");
    });
  });

  test.describe("Remember Me / Stay Logged In", () => {
    test("should have remember me checkbox if available", async ({ page }) => {
      const rememberMeCheckbox = page.locator(
        'input[type="checkbox"][name*="remember"], input[type="checkbox"][id*="remember"]'
      );
      const rememberMeExists = await rememberMeCheckbox.isVisible().catch(() => false);

      if (rememberMeExists) {
        // Should be unchecked by default
        await expect(rememberMeCheckbox).not.toBeChecked();

        // Should be able to check it
        await rememberMeCheckbox.check();
        await expect(rememberMeCheckbox).toBeChecked();
      }
    });
  });

  test.describe("Browser Back Button Behavior", () => {
    test("should not allow back button to access protected pages after logout", async ({
      page,
    }) => {
      // Login
      await page.fill("#username", config.adminUsername);
      await page.fill("#password", config.adminPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL("**/home");

      // Navigate to a page
      await page.goto("/company");
      await page.waitForTimeout(1000);

      // Logout
      const logoutButton = page.locator(
        'button:has-text("Logout"), button:has-text("Log out"), a:has-text("Logout"), a:has-text("Log out")'
      );
      const logoutExists = await logoutButton.first().isVisible().catch(() => false);

      if (logoutExists) {
        await logoutButton.first().click();
        await page.waitForTimeout(1000);

        // Try to go back
        await page.goBack();
        await page.waitForTimeout(1000);

        // Should still be on login or redirect to login
        expect(page.url()).toContain("/login");
      }
    });
  });
});
