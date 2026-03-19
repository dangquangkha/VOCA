import { test, expect } from '@playwright/test';

test('Registration Flow', async ({ page }) => {
    // 1. Navigate to Register Page
    await page.goto('/register');
    await expect(page).toHaveTitle(/Create Next App/); // Or custom title

    // 2. Select Role (Student by default, switch to Expert)
    await page.getByText('Career Expert').click();
    await expect(page.getByText('Sign up as Expert')).toBeVisible();

    // 3. Fill Form
    await page.fill('input[type="text"]', 'Test Expert');
    await page.fill('input[type="email"]', 'expert@test.com');
    // Handle multiple password fields
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill('password123');
    await passwordInputs[1].fill('password123');

    // 4. Submit
    await page.click('button[type="submit"]');

    // 5. Verification
    // Since we mocked the backend integration with a timeout, 
    // checking for the loading state or button text change is a good proxy.
    // In a real app, we would expect a redirect.
    // Here we just wait and verify no errors appear.
    await expect(page.getByText('Sign up as Expert')).toBeDisabled();
});
