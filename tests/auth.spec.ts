import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Очищаем localStorage перед каждым тестом
    await page.goto('http://localhost:4200');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should redirect to login page when not authenticated', async ({ page }) => {
    // Переходим на защищенную страницу
    await page.goto('http://localhost:4200/dashboard');
    
    // Должны быть перенаправлены на страницу логина
    await expect(page).toHaveURL(/.*login/);
    
    // Проверяем, что отображается форма логина
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show login form for unauthenticated users', async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    
    // Проверяем элементы формы логина
    await expect(page.locator('.login-title')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Проверяем демо-креды
    await expect(page.locator('.demo-credentials')).toBeVisible();
    await expect(page.locator('.demo-email')).toContainText('admin@admin.ru / admin');
  });

  test('should authenticate with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    
    // Заполняем форму логина
    await page.fill('input[type="email"]', 'admin@admin.ru');
    await page.fill('input[type="password"]', 'admin');
    
    // Нажимаем кнопку входа
    await page.click('button[type="submit"]');
    
    // Ждем успешного входа и перенаправления
    await page.waitForURL(/.*dashboard/);
    
    // Проверяем, что мы на странице dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Проверяем, что отображается основной интерфейс приложения
    await expect(page.locator('.app-container')).toBeVisible();
    await expect(page.locator('.glass-header')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    
    // Заполняем форму неверными данными
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Нажимаем кнопку входа
    await page.click('button[type="submit"]');
    
    // Проверяем, что появилось сообщение об ошибке
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Неверный email или пароль');
  });

  test('should clear authentication when logout', async ({ page }) => {
    // Сначала входим в систему
    await page.goto('http://localhost:4200/login');
    await page.fill('input[type="email"]', 'admin@admin.ru');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    
    // Ждем входа
    await page.waitForURL(/.*dashboard/);
    
    // Открываем пользовательское меню
    await page.click('.user-dropdown');
    
    // Нажимаем кнопку выхода
    await page.click('text=Выйти');
    
    // Должны быть перенаправлены на страницу логина
    await expect(page).toHaveURL(/.*login/);
    
    // Проверяем, что отображается форма логина
    await expect(page.locator('.login-title')).toBeVisible();
  });

  test('should clear authentication using test button', async ({ page }) => {
    // Сначала входим в систему
    await page.goto('http://localhost:4200/login');
    await page.fill('input[type="email"]', 'admin@admin.ru');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    
    // Ждем входа
    await page.waitForURL(/.*dashboard/);
    
    // Возвращаемся на страницу логина
    await page.goto('http://localhost:4200/login');
    
    // Нажимаем кнопку очистки аутентификации
    await page.click('text=Очистить аутентификацию (для тестирования)');
    
    // Проверяем сообщение об успешной очистке
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Аутентификация очищена');
  });
});
