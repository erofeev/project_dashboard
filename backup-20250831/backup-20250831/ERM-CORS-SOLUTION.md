# Решение проблемы CORS для PWA приложения

## Проблема
Браузеры блокируют кросс-доменные запросы к API EasyRedmine из-за политики CORS (Cross-Origin Resource Sharing). Это происходит потому, что:
- Ваше PWA работает на `http://localhost:4200` (разработка) или другом домене
- API EasyRedmine находится на `https://easyredmine.awara.pro`
- Сервер EasyRedmine не отправляет заголовки CORS

## Решения (по приоритету)

### 1. Использование fetch API напрямую (Рекомендуется)
Создан новый сервис `ERMProxyService`, который использует нативный `fetch()` API вместо Angular HttpClient.

**Преимущества:**
- Обходит CORS ограничения в некоторых случаях
- Работает в PWA
- Не требует настройки сервера

**Использование:**
```typescript
// В компоненте настроек
this.ermProxyService.setCredentials(baseUrl, apiKey);
const isConnected = await firstValueFrom(this.ermProxyService.checkConnection());
```

### 2. Тестирование API напрямую
Созданы HTML страницы для тестирования:
- `test-erm-direct.html` - прямой тест API
- `test-erm-api.html` - базовый тест

**Как использовать:**
1. Откройте файл в браузере
2. Введите URL и API ключ
3. Нажмите "Проверить соединение"

### 3. Режим разработки Chrome с отключенной безопасностью
```bash
# Windows
chrome.exe --disable-web-security --user-data-dir="C:/temp/chrome_dev"

# macOS  
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev" --disable-web-security

# Linux
google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev"
```

**Внимание:** Используйте только для разработки!

### 4. Расширения браузера
- **CORS Unblock** - отключает CORS
- **Allow CORS** - разрешает кросс-доменные запросы

### 5. Альтернативные браузеры
- Firefox (менее строгие CORS политики)
- Edge (может иметь другие настройки)

## Структура решения

### Файлы
- `src/app/erm-proxy.service.ts` - новый прокси-сервис
- `src/app/services/erm.service.ts` - обновлен для использования прокси
- `src/app/components/settings/settings.component.ts` - обновлен компонент настроек
- `test-erm-direct.html` - тест API
- `test-erm-api.html` - базовый тест

### Основные изменения

1. **ERMProxyService** использует `fetch()` API вместо HttpClient
2. **ERMService** теперь использует прокси-сервис для проверки соединения
3. **SettingsComponent** использует прокси-сервис для тестирования

## Тестирование

### Шаг 1: Тест HTML страницы
1. Откройте `test-erm-direct.html` в браузере
2. Введите URL: `https://easyredmine.awara.pro`
3. Введите ваш API ключ
4. Нажмите "Проверить соединение"

### Шаг 2: Тест в Angular приложении
1. Перезапустите сервер разработки: `ng serve`
2. Перейдите в настройки
3. Введите URL и API ключ
4. Нажмите "Проверить соединение"

## Возможные проблемы

### 1. CORS все еще блокирует
- Попробуйте режим разработки Chrome
- Установите расширение для отключения CORS
- Используйте другой браузер

### 2. API ключ не работает
- Проверьте правильность ключа
- Убедитесь, что ключ активен
- Проверьте права доступа

### 3. URL недоступен
- Проверьте доступность сервера
- Убедитесь в правильности URL
- Проверьте SSL сертификат

## Альтернативные решения

### 1. Backend Proxy
Создать сервер-посредник на вашем бэкенде, который будет делать запросы к ERM API.

### 2. Service Worker
Настроить Service Worker для перехвата и перенаправления запросов.

### 3. Electron
Если возможно, перевести приложение в Electron для обхода CORS.

## Рекомендации

1. **Начните с HTML теста** - это поможет понять, работает ли API
2. **Используйте прокси-сервис** в Angular приложении
3. **Для разработки** используйте Chrome с отключенной безопасностью
4. **Для продакшена** рассмотрите backend proxy

## Контакты
Если проблема не решается, проверьте:
- Логи браузера (F12 → Console)
- Сетевые запросы (F12 → Network)
- Статус сервера EasyRedmine
