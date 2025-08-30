#!/bin/bash

echo "Установка PouchDB MCP Server..."

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "Ошибка: Node.js не установлен. Пожалуйста, установите Node.js 18+"
    exit 1
fi

# Проверяем версию Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Ошибка: Требуется Node.js версии 18 или выше"
    exit 1
fi

echo "Node.js версия: $(node -v)"

# Устанавливаем зависимости
echo "Установка зависимостей..."
npm install

if [ $? -ne 0 ]; then
    echo "Ошибка при установке зависимостей"
    exit 1
fi

# Собираем проект
echo "Сборка проекта..."
npm run build

if [ $? -ne 0 ]; then
    echo "Ошибка при сборке проекта"
    exit 1
fi

echo ""
echo "✅ PouchDB MCP Server успешно установлен!"
echo ""
echo "Для настройки в Cursor:"
echo "1. Откройте настройки Cursor (Ctrl/Cmd + ,)"
echo "2. Найдите раздел 'MCP Servers'"
echo "3. Добавьте новый сервер:"
echo "   - Name: PouchDB"
echo "   - Command: node"
echo "   - Args: [\"$(pwd)/dist/index.js\"]"
echo "   - Env: (оставьте пустым)"
echo ""
echo "После настройки перезапустите Cursor"
