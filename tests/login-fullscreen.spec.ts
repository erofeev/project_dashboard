import { test, expect } from '@playwright/test';

test('Login page should be displayed fullscreen for unauthenticated users', async ({ page }) => {
  // Очищаем localStorage
  await page.goto('http://localhost:4200');
  await page.evaluate(() => {
    localStorage.clear();
    console.log('localStorage cleared');
  });
  
  // Ждем немного
  await page.waitForTimeout(2000);
  
  // Переходим на защищенную страницу
  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:4200/dashboard');
  
  // Ждем немного
  await page.waitForTimeout(3000);
  
  // Проверяем текущий URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  // Проверяем, что страница логина отображается на весь экран
  const loginFullscreen = page.locator('.login-fullscreen');
  const isVisible = await loginFullscreen.isVisible();
  console.log('Login fullscreen container visible:', isVisible);
  
  // Проверяем, что основной интерфейс приложения не отображается
  const appContainer = page.locator('.app-container');
  const appContainerVisible = await appContainer.isVisible();
  console.log('App container visible:', appContainerVisible);
  
  // Проверяем, что форма логина отображается
  const loginForm = page.locator('.login-container');
  const loginFormVisible = await loginForm.isVisible();
  console.log('Login form visible:', loginFormVisible);
  
  // Делаем скриншот
  await page.screenshot({ path: 'login-fullscreen-test.png' });
  
  // Проверяем, что страница логина отображается на весь экран
  expect(isVisible).toBe(true);
  expect(appContainerVisible).toBe(false);
  expect(loginFormVisible).toBe(true);
});
