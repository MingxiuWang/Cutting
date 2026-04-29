import { Page } from '@playwright/test';

export async function signupAndLogin(page: Page, email: string, password = 'abcd1234') {
  await page.goto('/signup');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
}

export const uniqueEmail = (label: string) => `e2e-${label}-${Date.now()}@example.com`;
