import { test, expect } from '@playwright/test';
import { signupAndLogin, uniqueEmail } from './helpers';

test('logging two AMs same day shows duplicate error; AM+PM same day works', async ({ page }) => {
  await signupAndLogin(page, uniqueEmail('dup'));
  await page.goto('/entries');

  // First AM
  await page.selectOption('select[name="period"]', 'AM');
  await page.fill('input[name="weightKg"]', '75');
  await page.fill('input[name="bodyFatPct"]', '18');
  await page.fill('input[name="musclePct"]', '42');
  await page.fill('input[name="waterPct"]', '55');
  await page.click('button:has-text("Save entry")');
  await expect(page.getByText('75.0')).toBeVisible({ timeout: 10_000 });

  // Second AM same day
  await page.selectOption('select[name="period"]', 'AM');
  await page.fill('input[name="weightKg"]', '75.2');
  await page.fill('input[name="bodyFatPct"]', '18');
  await page.fill('input[name="musclePct"]', '42');
  await page.fill('input[name="waterPct"]', '55');
  await page.click('button:has-text("Save entry")');
  await expect(page.getByText(/already logged this period today/i)).toBeVisible({ timeout: 10_000 });

  // PM same day succeeds
  await page.selectOption('select[name="period"]', 'PM');
  await page.fill('input[name="weightKg"]', '76.5');
  await page.fill('input[name="bodyFatPct"]', '18');
  await page.fill('input[name="musclePct"]', '42');
  await page.fill('input[name="waterPct"]', '55');
  await page.click('button:has-text("Save entry")');
  await expect(page.getByText('76.5')).toBeVisible({ timeout: 10_000 });
});
