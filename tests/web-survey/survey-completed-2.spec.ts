import { test, expect } from '@playwright/test';

test.setTimeout(90000);

test.beforeEach(async ({ page }) => {
  await page.goto('https://web-survey-staging-4c6vqhmawq-as.a.run.app/reviewer/d8309069-12f2-4e02-bf93-b4964c46d1c7/wdi5d2qefw9883l7pan05n/welcome');
  await page.waitForLoadState('networkidle');
});

test('Survey Completed 14/14', async ({ page }) => {
  // Step 1: Start Survey
  await expect(page.getByRole('button', { name: 'Start Survey' }))
    .toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Start Survey' }).click();
  
  // รอให้ page พร้อม
  await page.waitForLoadState('domcontentloaded');
  
  // Step 2: Handle modal/dialog
  const divLocator = page.locator('div').nth(2);
  if (await divLocator.isVisible().catch(() => false)) {
    await divLocator.click();
  }
  
  // Step 3: Start Review (คลิกครั้งเดียว)
  await page.waitForTimeout(1000); // รอ animation/transition
  const startReviewButton = page.getByRole('button', { name: 'Start Review' });
  await expect(startReviewButton).toBeVisible({ timeout: 30000 });
  await startReviewButton.click();
  
  // รอให้เปลี่ยนหน้าจริงๆ
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // รอ animation/loading
  
  // Debug: ดูว่าอยู่หน้าไหน
  await page.screenshot({ path: 'debug-after-start-review.png', fullPage: true });
  console.log('Current URL:', page.url());
  const allInputs = await page.locator('input, textarea').count();
  console.log('Number of input fields:', allInputs);
  
  // Step 4: Verify welcome heading (optional - อาจจะไม่มี)
  const welcomeHeading = page.getByRole('heading').filter({ hasText: /Welcome to Survey/i });
  const hasWelcomeHeading = await welcomeHeading.count() > 0;
  if (hasWelcomeHeading) {
    await expect(welcomeHeading.first()).toBeVisible({ timeout: 5000 });
  }
  
  // Question 1 หรือ 2: Text input - ปรับการรอ
  console.log('Waiting for textbox...');
  
  // ลองหาหลายวิธี
  let textbox;
  
  // วิธีที่ 1: รอ input/textarea ที่มองเห็นได้
  try {
    await page.waitForSelector('input:visible, textarea:visible', { 
      timeout: 20000,
      state: 'visible'
    });
    
    // หา textbox ที่ใช้งานได้
    textbox = page.locator('input[type="text"]:visible, textarea:visible').first();
    
    // ถ้าไม่เจอ ลองใช้ role
    if (await textbox.count() === 0) {
      textbox = page.getByRole('textbox').first();
    }
    
  } catch (error) {
    console.error('Textbox not found, checking page state...');
    
    // Debug: ดูว่ามี element อะไรบ้าง
    const pageText = await page.textContent('body');
    console.log('Page content preview:', pageText?.substring(0, 500));
    
    const allButtons = await page.locator('button').allTextContents();
    console.log('Available buttons:', allButtons);
    
    await page.screenshot({ path: 'debug-no-textbox.png', fullPage: true });
    throw error;
  }
  
  // กรอก textbox
  await expect(textbox).toBeVisible({ timeout: 10000 });
  await textbox.click();
  await textbox.fill('test-a2');
  await expect(textbox).toHaveValue('test-a2');
  
  // คลิก Next
  const nextButton = page.getByRole('button', { name: 'Next' });
  await expect(nextButton).toBeVisible({ timeout: 5000 });
  await nextButton.click();
  
  // รอให้ไปหน้าถัดไป
  await page.waitForTimeout(1000);
  
  // Question 3
  await expect(page.locator('form'))
    .toContainText('question 3/14', { timeout: 15000 });
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 4
  await expect(page.locator('form'))
    .toContainText('question 4/14', { timeout: 15000 });
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 5
  await expect(page.locator('form'))
    .toContainText('question 5/14', { timeout: 15000 });
  await page.getByRole('button', { name: '4' }).click();
  
  const specialElement = page.locator('.css-17xejub');
  if (await specialElement.isVisible().catch(() => false)) {
    await specialElement.click();
  }
  
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 6
  await expect(page.locator('form'))
    .toContainText('question 6/14', { timeout: 15000 });
  await page.getByRole('button', { name: 'Next' }).click();
  
  await page.getByRole('button', { name: '4' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 7
  await expect(page.locator('form'))
    .toContainText('question 7/14', { timeout: 15000 });
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 8
  await expect(page.locator('form'))
    .toContainText('question 8/14', { timeout: 15000 });
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 9
  await expect(page.locator('form'))
    .toContainText('question 9/14', { timeout: 15000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 10
  await page.waitForTimeout(500);
  await expect(page.locator('form'))
    .toContainText('question 10/14', { timeout: 15000 });
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 11
  await expect(page.locator('form'))
    .toContainText('question 11/14', { timeout: 15000 });
  await page.getByRole('button', { name: '4' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 12
  await expect(page.locator('form'))
    .toContainText('question 12/14', { timeout: 15000 });
  await page.getByRole('button', { name: '4' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 13
  await expect(page.locator('form'))
    .toContainText('question 13/14', { timeout: 15000 });
  await page.getByRole('button', { name: '4' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Question 14
  await expect(page.locator('form'))
    .toContainText('question 14/14', { timeout: 15000 });
  await page.getByRole('button', { name: '4' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Confirmation page
  await expect(
    page.getByRole('heading', { name: /Confirm survey submission/i })
  ).toBeVisible({ timeout: 15000 });
  
  await expect(page.locator('[id="__next"]'))
    .toContainText('Confirm answered', { timeout: 10000 });
  
  const confirmButton = page.getByRole('button', { name: 'Confirm answered' });
  await expect(confirmButton).toBeVisible({ timeout: 10000 });
  await confirmButton.click();
  
  // Thank you page
  await expect(
    page.getByRole('heading', { name: /Thank you/i })
  ).toBeVisible({ timeout: 15000 });
  
  await expect(
    page.getByRole('button', { name: 'Go to evaluatee list' })
  ).toBeVisible({ timeout: 10000 });
  
  const goToListButton = page.getByRole('button', { name: 'Go to evaluatee list' });
  await goToListButton.click();
  
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'survey-completed-final.png' });
});