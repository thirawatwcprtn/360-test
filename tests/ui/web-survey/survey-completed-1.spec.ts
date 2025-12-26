import { test, expect } from '@playwright/test';

test.setTimeout(90000);

test.beforeEach(async ({ page }) => {
  await page.goto('https://web-survey-sandbox01-4c6vqhmawq-as.a.run.app/reviewer/a17cc6fa-bfa3-486c-84f3-4a859c27ab56/xgwr4efgnesuipgt8yqtd/welcome');
  await page.waitForLoadState('networkidle');
});

test('Survey Completed 14/14', async ({ page }) => {
  // Start Survey
  await page.getByRole('button', { name: 'Start Survey' }).click();
  
  // Verify survey info
  await expect(page.locator('[id="__next"]')).toContainText('Survey 6812252 on sandbox01');
  await expect(page.locator('[id="__next"]')).toContainText('0/14 questions');
  
  // First Start Review button
  await page.getByRole('button', { name: 'Start Review' }).click();
  
  // Verify Welcome heading
  await expect(page.getByRole('heading', { name: /Welcome to Survey/i })).toContainText('Welcome to Survey');
  await expect(page.getByRole('button', { name: 'Start Review' })).toContainText('Start Review');
  
  // Second Start Review button - รอ 5 วินาที
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'Start Review' }).click();
  
  // รอให้ redirect ไปหน้า survey
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Question 1: Text input
  await expect(page.locator('form')).toContainText('question 1/14', { timeout: 15000 });
  const textbox1 = page.getByRole('textbox');
  await expect(textbox1).toBeVisible({ timeout: 10000 });
  await textbox1.click();
  await textbox1.fill('test-a1');
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 2: Text input
  await expect(page.locator('form')).toContainText('question 2/14', { timeout: 15000 });
  const textbox2 = page.getByRole('textbox');
  await textbox2.click();
  await textbox2.fill('test-a2');
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 3
  await expect(page.locator('form')).toContainText('question 3/14', { timeout: 15000 });
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 4
  await expect(page.locator('form')).toContainText('question 4/14', { timeout: 15000 });
  await page.getByRole('button', { name: '4' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 5
  await expect(page.locator('form')).toContainText('question 5/14', { timeout: 15000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 6
  await expect(page.locator('form')).toContainText('question 6/14', { timeout: 15000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: '4' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 7
  await expect(page.locator('form')).toContainText('question 7/14', { timeout: 15000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: '4' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 8
  await expect(page.locator('form')).toContainText('question 8/14', { timeout: 15000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: '4' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 9
  await expect(page.locator('form')).toContainText('question 9/14', { timeout: 15000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 10
  await expect(page.locator('form')).toContainText('question 10/14', { timeout: 15000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 11
  await expect(page.locator('form')).toContainText('question 11/14', { timeout: 15000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 12
  await expect(page.locator('form')).toContainText('question 12/14', { timeout: 15000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 13
  await expect(page.locator('form')).toContainText('question 13/14', { timeout: 15000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 14
  await expect(page.locator('form')).toContainText('question 14/14', { timeout: 15000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: '4' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Confirmation page
  await expect(page.getByRole('heading', { name: /Confirm survey submission/i }))
    .toContainText('Confirm survey submission', { timeout: 15000 });
  await page.getByRole('button', { name: 'Confirm answered' }).click();
  
  // Thank you page
  await expect(page.getByRole('heading', { name: /Thank you/i }))
    .toContainText('Thank you', { timeout: 15000 });
  await page.getByRole('button', { name: 'Go to evaluatee list' }).click();
  
  // Verify navigation
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'survey-completed-final.png' });
});