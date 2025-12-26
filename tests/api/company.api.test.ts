import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";
import { config } from "../../config/environment";

test.describe("Company API Tests @api", () => {
  let apiHelper: ApiHelper;
  let authToken: string;

  test.beforeAll(async () => {
    // Initialize API helper with environment config
    apiHelper = new ApiHelper();

    // Login to get authentication token
    authToken = await apiHelper.login();

    // Reinitialize with token
    apiHelper = new ApiHelper({
      token: authToken,
    });

    // Validate environment configuration
    config.validate();
  });

  test.describe("Company CRUD Operations", () => {
    test("should create a new company", async () => {
      const companyData = {
        code: "TEST001",
        slug: "test-company",
        name: "Test Company",
        description: "A test company for API testing",
        phone: "+1234567890",
        email: "test@company.com",
        website: "https://testcompany.com",
      };

      const company = await apiHelper.createCompany(companyData);

      expect(company).toBeDefined();
      expect(company.code).toBe(companyData.code);
      expect(company.name).toBe(companyData.name);
      expect(company.email).toBe(companyData.email);
    });

    test("should get company by ID", async () => {
      const testData = apiHelper.getTestData();
      expect(testData.companyId).toBeDefined();

      const company = await apiHelper.getCompany(testData.companyId!);

      expect(company).toBeDefined();
      expect(company.id).toBe(testData.companyId);
    });

    test("should update company", async () => {
      const testData = apiHelper.getTestData();
      expect(testData.companyId).toBeDefined();

      const updateData = {
        name: "Updated Test Company",
        description: "Updated description",
        phone: "+0987654321",
      };

      const updatedCompany = await apiHelper.updateCompany(
        testData.companyId!,
        updateData
      );

      expect(updatedCompany.name).toBe(updateData.name);
      expect(updatedCompany.description).toBe(updateData.description);
      expect(updatedCompany.phone).toBe(updateData.phone);
    });

    test("should delete company", async () => {
      const testData = apiHelper.getTestData();
      expect(testData.companyId).toBeDefined();

      const result = await apiHelper.deleteCompany(testData.companyId!);

      expect(result.message).toContain("suspended successfully");
    });
  });

  test.describe("Bulk Company Operations", () => {
    test("should bulk create companies", async () => {
      const companies = await apiHelper.bulkCreateCompanies(5);

      expect(companies).toHaveLength(5);
      expect(companies[0]).toHaveProperty("id");
      expect(companies[0]).toHaveProperty("code");
      expect(companies[0]).toHaveProperty("name");
    });

    test("should bulk update companies", async () => {
      // First create some companies
      const companies = await apiHelper.bulkCreateCompanies(3);

      const updateData = companies.map((company) => ({
        id: company.id,
        name: `Updated ${company.name}`,
        description: "Bulk updated description",
      }));

      const updatedCompanies = await apiHelper.bulkUpdateCompanies(updateData);

      expect(updatedCompanies).toHaveLength(3);
      updatedCompanies.forEach((company) => {
        expect(company.name).toMatch(/^Updated /);
        expect(company.description).toBe("Bulk updated description");
      });
    });

    test("should bulk delete companies", async () => {
      // First create some companies
      const companies = await apiHelper.bulkCreateCompanies(3);
      const companyIds = companies.map((company) => company.id);

      const result = await apiHelper.bulkDeleteCompanies(companyIds);

      expect(result.message).toContain("suspended successfully");
    });
  });

  test.describe("Company Search and Filter", () => {
    test("should search companies", async () => {
      // Create a company with specific name
      const searchTerm = "SearchTest";
      await apiHelper.createCompany({
        name: `${searchTerm} Company`,
        code: "SEARCH001",
      });

      const searchResults = await apiHelper.searchCompanies(searchTerm);

      expect(searchResults.data).toBeDefined();
      expect(searchResults.data.length).toBeGreaterThan(0);
    });

    test("should filter companies by status", async () => {
      const activeCompanies = await apiHelper.getCompaniesByStatus("active");

      expect(activeCompanies.data).toBeDefined();
      // All returned companies should be active
      activeCompanies.data.forEach((company: any) => {
        expect(company.status).toBe("active");
      });
    });
  });

  test.describe("Error Handling", () => {
    test("should handle invalid company data", async () => {
      try {
        await apiHelper.createCompany({
          code: "", // Invalid empty code
          email: "invalid-email", // Invalid email format
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toBeDefined();
      }
    });

    test("should handle non-existent company", async () => {
      try {
        await apiHelper.getCompany("non-existent-id");
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  test.describe("API Configuration", () => {
    test("should have correct API configuration", async () => {
      const apiConfig = apiHelper.getApiConfig();

      expect(apiConfig.baseURL).toBe(config.apiBaseUrl);
      expect(apiConfig.timeout).toBe(config.apiTimeout);
    });

    test("should handle API health check", async () => {
      const isHealthy = await apiHelper.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });

  test.afterAll(async () => {
    // Cleanup test data
    const testData = apiHelper.getTestData();
    if (testData.companyId) {
      try {
        await apiHelper.deleteCompany(testData.companyId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    apiHelper.clearTestData();
  });
});
