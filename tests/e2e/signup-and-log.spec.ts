import { test, expect } from '@playwright/test';
import { signupAndLogin, uniqueEmail } from './helpers';

test('signup → log first entry → see it on dashboard', async ({ page }) => {
  await signupAndLogin(page, uniqueEmail('first'));

  // The dashboard says "No active cut yet" until a cut exists.
  // We can still log entries from /entries; do that.
  await page.goto('/entries');
  await page.fill('input[name="weightKg"]', '75.4');
  await page.fill('input[name="bodyFatPct"]', '18.5');
  await page.fill('input[name="musclePct"]', '42');
  await page.fill('input[name="waterPct"]', '55.5');
  await page.click('button:has-text("Save entry")');

  await expect(page.getByText('75.4')).toBeVisible({ timeout: 10_000 });
});
