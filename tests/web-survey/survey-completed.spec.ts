import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('https://web-survey-staging-4c6vqhmawq-as.a.run.app/reviewer/d8309069-12f2-4e02-bf93-b4964c46d1c7/5z3w6e0uxet0206gcfeg/welcome?locale=EN');
});

test('Survey Completed 14/14 ', async ({ page }) => {
  await page.getByRole('button', { name: 'Start Survey' }).click();
  await page.getByRole('button', { name: 'Start Review' }).click();
  await page.getByRole('button', { name: 'Start Review' }).click();
  await page.getByRole('button', { name: 'Start Review' }).click();
  await page.getByRole('textbox').click();
  await page.getByRole('textbox').fill('test-a');
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'ต่อไป' }).click();

  await page.getByRole('textbox').click();
  await page.getByRole('textbox').fill('test-a2');
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'ต่อไป' }).click();
  
  await page.getByRole('button', { name: '4' }).click();
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'ต่อไป' }).click();
  
  await page.getByRole('button', { name: '3' }).click();
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'ต่อไป' }).click();
  await page.getByRole('button', { name: '4' }).click();
  await page.locator('.css-gz587u').click();
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'ต่อไป' }).click();
  await page.getByRole('button', { name: '3' }).click();
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'ต่อไป' }).click();
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: '4' }).click();
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'ต่อไป' }).click();
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: '3' }).click();
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'ต่อไป' }).click();
  
  await page.getByRole('button', { name: '2' }).click();
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'ต่อไป' }).click();
  await page.getByRole('button', { name: '3' }).click();
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.locator('.css-17xejub').click();
  await page.getByRole('button', { name: 'ต่อไป' }).click();

  await page.getByRole('button', { name: '4' }).click();
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'ต่อไป' }).click();

  await page.getByRole('button', { name: '4' }).click();
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'ต่อไป' }).click();

  await page.getByRole('button', { name: '3' }).click();
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'ต่อไป' }).click();
  await page.getByRole('button', { name: '4' }).click();
  await expect(page.getByRole('button', { name: 'ต่อไป' })).toBeEnabled();
  await page.waitForTimeout(5000);
  await page.locator('.css-17xejub').click();
  await page.getByRole('button', { name: 'ต่อไป' }).click();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'Confirm answered' }).click();
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'Go to evaluatee list' }).click();
});