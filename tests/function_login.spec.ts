import { test, expect } from '@playwright/test';

test.describe('Login Functionality', () => {
    test('TC-LOGIN-001: login success', async ({ page }) => {
        // Step 1: Open Login Page Demo_ENV //http://localhost:8000 , https://test-survey-backoffice.relearn-solution.com/login
        await page.goto('https://backoffice-survey.integration.relearnsolution.co.th/login');

        await page.getByRole('textbox', { name: 'Username' }).fill('admin-rl');
        await page.getByRole('textbox', { name: 'Password' }).fill('Blue@sky');
        await page.getByRole('button', { name: 'Submit' }).click();
        await expect(page.locator('#toast-1-title')).toContainText('Login Success');
        await expect(page.locator('#toast-1-description')).toContainText('You have signed in');
    });


    // test("login wrong password", async ({ page }) => {
    //     await page.getByRole('textbox', { name: 'Username' }).fill('admin-w');
    //     await page.getByRole('textbox', { name: 'Username' }).press('Tab');
    //     await page.getByRole('textbox', { name: 'Password' }).fill('1234');
    //     await page.getByRole('button', { name: 'Submit' }).click();
    //     await expect(page.locator('#toast-1-title')).toContainText('Login Failed');
    //     await expect(page.locator('#toast-1-description')).toContainText('Wrong username or password');
    // });

    test("TC-LOGIN-002:login wrong username", async ({ page }) => {
        await page.goto('https://backoffice-survey.integration.relearnsolution.co.th/login');
        await page.getByRole('textbox', { name: 'Username' }).fill('admin-wrong');
        await page.getByRole('textbox', { name: 'Password' }).fill('Blue@sky');
        await page.getByRole('button', { name: 'Submit' }).click();
        await expect(page.locator('#toast-1-title')).toContainText('Login Failed');
        await expect(page.locator('#toast-1-description')).toContainText('Wrong username or password');
    });
});