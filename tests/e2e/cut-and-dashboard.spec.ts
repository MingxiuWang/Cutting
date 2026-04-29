import { test, expect } from '@playwright/test';
import { signupAndLogin, uniqueEmail } from './helpers';

test('create cut, log entry, dashboard shows stats and progress bar', async ({ page }) => {
  await signupAndLogin(page, uniqueEmail('cut'));

  await page.goto('/cuts');
  await page.fill('input[name="name"]', 'E2E cut');
  // The targetWeightKg input has defaultValue 70; clear and re-enter to be deterministic
  await page.fill('input[name="targetWeightKg"]', '70');
  await page.click('button:has-text("Start cut")');
  // Scope to the page main content (avoid Next.js dev error-overlay text matches)
  const main = page.locator('main');
  await expect(main.getByText('E2E cut').first()).toBeVisible({ timeout: 10_000 });

  await page.goto('/entries');
  await page.fill('input[name="weightKg"]', '78');
  await page.fill('input[name="bodyFatPct"]', '20');
  await page.fill('input[name="musclePct"]', '40');
  await page.fill('input[name="waterPct"]', '55');
  await page.click('button:has-text("Save entry")');
  await expect(main.getByText('78.0').first()).toBeVisible({ timeout: 10_000 });

  await page.goto('/dashboard');
  await expect(main.getByText('E2E cut').first()).toBeVisible({ timeout: 10_000 });
  await expect(main.getByText(/Start \(AM\)/i)).toBeVisible();
  await expect(main.getByText(/Progress/i).first()).toBeVisible();
});
