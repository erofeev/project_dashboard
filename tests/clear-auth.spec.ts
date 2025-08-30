import { test, expect } from '@playwright/test';

test('Test clear authentication button', async ({ page }) => {
  // Сначала входим в систему
  await page.goto('http://localhost:4200/login');
  await page.fill('input[type="email"]', 'admin@admin.ru');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  
  // Ждем входа
  await page.waitForURL(/.*dashboard/);
  console.log('Successfully logged in, now on dashboard');
  
  // Возвращаемся на страницу логина
  await page.goto('http://localhost:4200/login');
  console.log('Returned to login page');
  
  // Ищем кнопку очистки аутентификации
  const clearButton = page.locator('text=Очистить аутентификацию (для тестирования)');
  const isVisible = await clearButton.isVisible();
  console.log('Clear auth button visible:', isVisible);
  
  if (isVisible) {
    // Нажимаем кнопку
    console.log('Clicking clear auth button...');
    await clearButton.click();
    
    // Ждем появления сообщения
    const successMessage = page.locator('.success-message');
    await successMessage.waitFor({ state: 'visible', timeout: 10000 });
    
    const messageVisible = await successMessage.isVisible();
    console.log('Success message visible:', messageVisible);
    
    if (messageVisible) {
      const messageText = await successMessage.textContent();
      console.log('Success message text:', messageText);
      
      // Ждем немного, чтобы сообщение осталось видимым
      await page.waitForTimeout(2000);
    }
    
    // Делаем скриншот
    await page.screenshot({ path: 'clear-auth-test.png' });
  } else {
    console.log('Clear auth button not found');
    // Делаем скриншот для отладки
    await page.screenshot({ path: 'clear-auth-button-not-found.png' });
  }
});
