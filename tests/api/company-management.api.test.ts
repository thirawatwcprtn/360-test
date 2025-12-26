import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";
import { faker } from "@faker-js/faker";

test.describe("Company Management API Tests @api", () => {
  let apiHelper: ApiHelper;
  let authToken: string;
  let testCompanyId: string;

  test.beforeAll(async () => {
    apiHelper = new ApiHelper();
    authToken = await apiHelper.login();
    apiHelper = new ApiHelper({ token: authToken });
  });

  test("should create a new company with valid data", async () => {
    const companyData = {
      name: `Test Company ${faker.company.name()}`,
      code: `COMP${faker.string.alphanumeric(6).toUpperCase()}`,
      slug: faker.helpers.slugify(faker.company.name()),
      description: faker.lorem.sentence(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      website: faker.internet.url(),
    };

    const response = await apiHelper.createCompany(companyData);

    expect(response).toBeDefined();
    expect(response.name).toBe(companyData.name);
    expect(response.code).toBe(companyData.code);
    expect(response.slug).toBe(companyData.slug);
    expect(response.description).toBe(companyData.description);
    expect(response.phone).toBe(companyData.phone);
    expect(response.email).toBe(companyData.email);
    expect(response.website).toBe(companyData.website);
    expect(response.status).toBe("active");

    testCompanyId = response.id;
  });

  test("should retrieve company by ID", async () => {
    expect(testCompanyId).toBeDefined();

    const company = await apiHelper.getCompany(testCompanyId);

    expect(company).toBeDefined();
    expect(company.id).toBe(testCompanyId);
    expect(company.name).toBeDefined();
    expect(company.code).toBeDefined();
  });

  test("should list all companies", async () => {
    const companies = await apiHelper.listCompanies();

    expect(Array.isArray(companies)).toBe(true);
    expect(companies.length).toBeGreaterThan(0);

    // Verify our test company is in the list
    const testCompany = companies.find((c) => c.id === testCompanyId);
    expect(testCompany).toBeDefined();
  });

  test("should update company information", async () => {
    const updateData = {
      name: `Updated Company ${faker.company.name()}`,
      description: faker.lorem.sentence(),
      phone: faker.phone.number(),
    };

    const updatedCompany = await apiHelper.updateCompany(
      testCompanyId,
      updateData
    );

    expect(updatedCompany.name).toBe(updateData.name);
    expect(updatedCompany.description).toBe(updateData.description);
    expect(updatedCompany.phone).toBe(updateData.phone);
  });

  test("should suspend and reactivate company", async () => {
    // Suspend company
    await apiHelper.suspendCompany(testCompanyId);
    let company = await apiHelper.getCompany(testCompanyId);
    expect(company.status).toBe("suspended");

    // Reactivate company
    await apiHelper.activateCompany(testCompanyId);
    company = await apiHelper.getCompany(testCompanyId);
    expect(company.status).toBe("active");
  });

  test("should create company with departments and positions", async () => {
    const companyData = {
      name: `Company with Departments ${faker.company.name()}`,
      code: `DEPT${faker.string.alphanumeric(6).toUpperCase()}`,
      slug: faker.helpers.slugify(faker.company.name()),
      description: faker.lorem.sentence(),
    };

    const company = await apiHelper.createCompany(companyData);

    // Add departments
    const departments = [
      { name: "Engineering", code: "ENG" },
      { name: "Sales", code: "SALES" },
      { name: "Marketing", code: "MKT" },
    ];

    for (const dept of departments) {
      await apiHelper.createDepartment(company.id, dept);
    }

    // Add positions
    const positions = [
      { name: "Software Engineer", code: "SE" },
      { name: "Sales Manager", code: "SM" },
      { name: "Marketing Specialist", code: "MS" },
    ];

    for (const pos of positions) {
      await apiHelper.createPosition(company.id, pos);
    }

    // Verify departments and positions were created
    const companyDetails = await apiHelper.getCompany(company.id);
    expect(companyDetails.departments).toHaveLength(3);
    expect(companyDetails.positions).toHaveLength(3);
  });

  test("should handle bulk company operations", async () => {
    const companies = [];

    // Create multiple companies
    for (let i = 0; i < 3; i++) {
      const companyData = {
        name: `Bulk Company ${i + 1} ${faker.company.name()}`,
        code: `BULK${i + 1}${faker.string.alphanumeric(4).toUpperCase()}`,
        slug: faker.helpers.slugify(faker.company.name()),
        description: faker.lorem.sentence(),
      };

      const company = await apiHelper.createCompany(companyData);
      companies.push(company);
    }

    // Verify all companies were created
    const allCompanies = await apiHelper.listCompanies();
    for (const company of companies) {
      const found = allCompanies.find((c) => c.id === company.id);
      expect(found).toBeDefined();
    }
  });

  test("should validate required fields", async () => {
    const invalidData = {
      // Missing required fields
      description: faker.lorem.sentence(),
    };

    await expect(apiHelper.createCompany(invalidData)).rejects.toThrow();
  });

  test("should handle duplicate company codes", async () => {
    const existingCompany = await apiHelper.createCompany({
      name: faker.company.name(),
      code: "DUPLICATE001",
      slug: faker.helpers.slugify(faker.company.name()),
    });

    const duplicateData = {
      name: faker.company.name(),
      code: "DUPLICATE001", // Same code
      slug: faker.helpers.slugify(faker.company.name()),
    };

    await expect(apiHelper.createCompany(duplicateData)).rejects.toThrow();
  });

  test.afterAll(async () => {
    // Cleanup test data
    if (testCompanyId) {
      try {
        await apiHelper.deleteCompany(testCompanyId);
      } catch (error) {
        console.log("Cleanup error:", error.message);
      }
    }
  });
});
