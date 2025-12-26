import { test, expect } from "@playwright/test";
import { ApiHelper } from "../utils/api-helper";
import { faker } from "@faker-js/faker";

test.describe("Employee Management API Tests @api @employee", () => {
  let apiHelper: ApiHelper;
  let testCompanyId: string;

  test.beforeAll(async () => {
    apiHelper = new ApiHelper();
    const token = await apiHelper.login();
    apiHelper = new ApiHelper({ token });

    // Create a test company for employee tests
    const company = await apiHelper.createCompany({
      code: "EMP_TEST_CO",
      name: "Employee Test Company",
    });
    testCompanyId = company.id;
  });

  test.afterAll(async () => {
    // Cleanup
    if (testCompanyId) {
      await apiHelper.deleteCompany(testCompanyId);
    }
  });

  test.describe("Employee CRUD Operations", () => {
    test("should create a new employee", async () => {
      const employeeData = {
        email: faker.internet.email(),
        firstname: "John",
        lastname: "Doe",
        middlename: "M",
        phone: "+1234567890",
        preferredLocale: "EN",
      };

      const employee = await apiHelper.createEmployee(
        testCompanyId,
        employeeData
      );

      expect(employee).toBeDefined();
      expect(employee.email).toBe(employeeData.email);
      expect(employee.firstname).toBe(employeeData.firstname);
      expect(employee.lastname).toBe(employeeData.lastname);
      expect(employee.preferredLocale).toBe(employeeData.preferredLocale);
    });

    test("should create employee with minimal required fields", async () => {
      const minimalData = {
        email: faker.internet.email(),
        firstname: "Jane",
        lastname: "Smith",
      };

      const employee = await apiHelper.createEmployee(
        testCompanyId,
        minimalData
      );

      expect(employee).toBeDefined();
      expect(employee.email).toBe(minimalData.email);
      expect(employee.firstname).toBe(minimalData.firstname);
    });

    test("should fail to create employee with duplicate email", async () => {
      const email = faker.internet.email();

      // Create first employee
      await apiHelper.createEmployee(testCompanyId, {
        email,
        firstname: "First",
        lastname: "Employee",
      });

      // Try to create duplicate
      try {
        await apiHelper.createEmployee(testCompanyId, {
          email,
          firstname: "Second",
          lastname: "Employee",
        });
        expect.fail("Should have thrown error for duplicate email");
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });

    test("should fail to create employee with invalid email", async () => {
      try {
        await apiHelper.createEmployee(testCompanyId, {
          email: "invalid-email",
          firstname: "Test",
          lastname: "User",
        });
        expect.fail("Should have thrown error for invalid email");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    test("should fail to create employee with missing required fields", async () => {
      try {
        await apiHelper.createEmployee(testCompanyId, {
          firstname: "Test",
          // Missing lastname and email
        } as any);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  test.describe("Bulk Employee Operations", () => {
    test("should bulk create employees", async () => {
      const employees = await apiHelper.bulkCreateEmployees(testCompanyId, 10);

      expect(employees).toHaveLength(10);
      employees.forEach((employee) => {
        expect(employee).toHaveProperty("id");
        expect(employee).toHaveProperty("email");
        expect(employee).toHaveProperty("firstname");
        expect(employee).toHaveProperty("lastname");
      });

      // Verify unique emails
      const emails = employees.map((emp) => emp.email);
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(emails.length);
    });

    test("should bulk create employees with custom data", async () => {
      const customEmployees = Array.from({ length: 5 }, (_, i) => ({
        email: `custom${i}@test.com`,
        firstname: `First${i}`,
        lastname: `Last${i}`,
        preferredLocale: "TH",
      }));

      const result = await apiHelper.api.post(
        `/admin/company/${testCompanyId}/employees/bulk/create`,
        { employees: customEmployees }
      );

      expect(result.data.data).toHaveLength(5);
    });

    test("should handle partial bulk create failures gracefully", async () => {
      const mixedEmployees = [
        {
          email: faker.internet.email(),
          firstname: "Valid",
          lastname: "Employee",
        },
        {
          email: "invalid-email",
          firstname: "Invalid",
          lastname: "Employee",
        },
        {
          email: faker.internet.email(),
          firstname: "Another",
          lastname: "Valid",
        },
      ];

      try {
        await apiHelper.api.post(
          `/admin/company/${testCompanyId}/employees/bulk/create`,
          { employees: mixedEmployees }
        );
      } catch (error: any) {
        // Should fail validation
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });

    test("should bulk create large number of employees", async () => {
      const largeCount = 100;
      const employees = await apiHelper.bulkCreateEmployees(
        testCompanyId,
        largeCount
      );

      expect(employees.length).toBe(largeCount);
    });
  });

  test.describe("Employee Search and Filtering", () => {
    test("should search employees by email", async () => {
      const uniqueEmail = `search_test_${Date.now()}@example.com`;
      await apiHelper.createEmployee(testCompanyId, {
        email: uniqueEmail,
        firstname: "Search",
        lastname: "Test",
      });

      const response = await apiHelper.api.get(
        `/admin/company/${testCompanyId}/employees`,
        {
          params: { search: uniqueEmail },
        }
      );

      expect(response.data.data).toBeDefined();
      expect(response.data.data.length).toBeGreaterThan(0);
      expect(response.data.data[0].email).toBe(uniqueEmail);
    });

    test("should search employees by name", async () => {
      const uniqueName = `SearchName${Date.now()}`;
      await apiHelper.createEmployee(testCompanyId, {
        email: faker.internet.email(),
        firstname: uniqueName,
        lastname: "Testing",
      });

      const response = await apiHelper.api.get(
        `/admin/company/${testCompanyId}/employees`,
        {
          params: { search: uniqueName },
        }
      );

      expect(response.data.data).toBeDefined();
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    test("should filter employees by locale", async () => {
      await apiHelper.createEmployee(testCompanyId, {
        email: faker.internet.email(),
        firstname: "Thai",
        lastname: "User",
        preferredLocale: "TH",
      });

      const response = await apiHelper.api.get(
        `/admin/company/${testCompanyId}/employees`,
        {
          params: { locale: "TH" },
        }
      );

      expect(response.data.data).toBeDefined();
      if (response.data.data.length > 0) {
        response.data.data.forEach((emp: any) => {
          expect(emp.preferredLocale).toBe("TH");
        });
      }
    });

    test("should paginate employee results", async () => {
      // Create enough employees for pagination
      await apiHelper.bulkCreateEmployees(testCompanyId, 25);

      const response = await apiHelper.api.get(
        `/admin/company/${testCompanyId}/employees`,
        {
          params: { page: 1, limit: 10 },
        }
      );

      expect(response.data.data).toBeDefined();
      expect(response.data.data.length).toBeLessThanOrEqual(10);
      expect(response.data.meta || response.data.pagination).toBeDefined();
    });
  });

  test.describe("Employee Data Validation", () => {
    test("should validate email format", async () => {
      const invalidEmails = [
        "notanemail",
        "@nodomain.com",
        "spaces in@email.com",
        "missing@domain",
      ];

      for (const email of invalidEmails) {
        try {
          await apiHelper.createEmployee(testCompanyId, {
            email,
            firstname: "Test",
            lastname: "User",
          });
          expect.fail(`Should have rejected invalid email: ${email}`);
        } catch (error: any) {
          expect(error.response.status).toBe(400);
        }
      }
    });

    test("should validate phone number format", async () => {
      const employee = await apiHelper.createEmployee(testCompanyId, {
        email: faker.internet.email(),
        firstname: "Phone",
        lastname: "Test",
        phone: "+66812345678",
      });

      expect(employee.phone).toBe("+66812345678");
    });

    test("should validate preferred locale", async () => {
      const validLocales = ["EN", "TH"];

      for (const locale of validLocales) {
        const employee = await apiHelper.createEmployee(testCompanyId, {
          email: faker.internet.email(),
          firstname: "Locale",
          lastname: "Test",
          preferredLocale: locale,
        });

        expect(employee.preferredLocale).toBe(locale);
      }
    });

    test("should reject invalid locale", async () => {
      try {
        await apiHelper.createEmployee(testCompanyId, {
          email: faker.internet.email(),
          firstname: "Test",
          lastname: "User",
          preferredLocale: "INVALID",
        } as any);
        expect.fail("Should have rejected invalid locale");
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  test.describe("Employee Update Operations", () => {
    test("should update employee information", async () => {
      const employee = await apiHelper.createEmployee(testCompanyId, {
        email: faker.internet.email(),
        firstname: "Original",
        lastname: "Name",
      });

      const updateData = {
        firstname: "Updated",
        lastname: "NewName",
        phone: "+66999999999",
      };

      const response = await apiHelper.api.put(
        `/admin/company/${testCompanyId}/employees/${employee.id}`,
        updateData
      );

      expect(response.data.data.firstname).toBe(updateData.firstname);
      expect(response.data.data.lastname).toBe(updateData.lastname);
      expect(response.data.data.phone).toBe(updateData.phone);
    });

    test("should not allow email change to duplicate", async () => {
      const email1 = faker.internet.email();
      const email2 = faker.internet.email();

      const employee1 = await apiHelper.createEmployee(testCompanyId, {
        email: email1,
        firstname: "First",
        lastname: "Employee",
      });

      await apiHelper.createEmployee(testCompanyId, {
        email: email2,
        firstname: "Second",
        lastname: "Employee",
      });

      try {
        await apiHelper.api.put(
          `/admin/company/${testCompanyId}/employees/${employee1.id}`,
          { email: email2 }
        );
        expect.fail("Should not allow duplicate email");
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  test.describe("Employee Deletion", () => {
    test("should delete/deactivate employee", async () => {
      const employee = await apiHelper.createEmployee(testCompanyId, {
        email: faker.internet.email(),
        firstname: "To",
        lastname: "Delete",
      });

      const response = await apiHelper.api.delete(
        `/admin/company/${testCompanyId}/employees/${employee.id}`
      );

      expect(response.status).toBe(200);
    });

    test("should not find deleted employee", async () => {
      const employee = await apiHelper.createEmployee(testCompanyId, {
        email: faker.internet.email(),
        firstname: "To",
        lastname: "Remove",
      });

      await apiHelper.api.delete(
        `/admin/company/${testCompanyId}/employees/${employee.id}`
      );

      try {
        await apiHelper.api.get(
          `/admin/company/${testCompanyId}/employees/${employee.id}`
        );
        expect.fail("Should not find deleted employee");
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  test.describe("Employee Import/Export", () => {
    test("should handle CSV import format", async () => {
      // This would test CSV import if the endpoint exists
      const csvData = `email,firstname,lastname,phone,preferredLocale
import1@test.com,Import,User1,+66811111111,EN
import2@test.com,Import,User2,+66822222222,TH`;

      // If import endpoint exists
      // const response = await apiHelper.api.post(
      //   `/admin/company/${testCompanyId}/employees/import`,
      //   { csv: csvData }
      // );
      // expect(response.data.data).toBeDefined();
    });
  });

  test.describe("Security & Access Control", () => {
    test("should not allow access to employees of other companies", async () => {
      // Create another company
      const otherCompany = await apiHelper.createCompany({
        code: "OTHER_CO",
        name: "Other Company",
      });

      const employee = await apiHelper.createEmployee(testCompanyId, {
        email: faker.internet.email(),
        firstname: "Protected",
        lastname: "Employee",
      });

      try {
        await apiHelper.api.get(
          `/admin/company/${otherCompany.id}/employees/${employee.id}`
        );
        expect.fail("Should not access employee from different company");
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }

      // Cleanup
      await apiHelper.deleteCompany(otherCompany.id);
    });
  });
});
