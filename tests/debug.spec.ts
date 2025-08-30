import { test, expect } from '@playwright/test';

test('Debug authentication flow', async ({ page }) => {
  // Очищаем localStorage
  await page.goto('http://localhost:4200');
  await page.evaluate(() => {
    localStorage.clear();
    console.log('localStorage cleared');
  });
  
  // Ждем немного
  await page.waitForTimeout(2000);
  
  // Проверяем состояние localStorage
  const authState = await page.evaluate(() => {
    const user = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');
    console.log('localStorage state:', { user, token });
    return { user, token };
  });
  
  console.log('Auth state after clearing:', authState);
  
  // Переходим на защищенную страницу
  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:4200/dashboard');
  
  // Ждем немного
  await page.waitForTimeout(3000);
  
  // Проверяем текущий URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  // Делаем скриншот
  await page.screenshot({ path: 'debug-dashboard.png' });
  
  // Проверяем содержимое страницы
  const pageContent = await page.content();
  console.log('Page contains login form:', pageContent.includes('login'));
  console.log('Page contains dashboard:', pageContent.includes('dashboard'));
  
  // Если мы на странице dashboard, проверяем, что отображается
  if (currentUrl.includes('dashboard')) {
    console.log('On dashboard page, checking content...');
    const hasAppContainer = await page.locator('.app-container').isVisible();
    const hasLoginForm = await page.locator('.login-container').isVisible();
    console.log('Has app container:', hasAppContainer);
    console.log('Has login form:', hasLoginForm);
  }
});
