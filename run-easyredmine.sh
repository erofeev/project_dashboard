#!/bin/bash

# Отключаем проверку SSL сертификата
export NODE_TLS_REJECT_UNAUTHORIZED=0

echo "🔒 SSL verification disabled"
echo "🚀 Starting EasyRedmine MCP server..."

# Запускаем MCP сервер
cd infrastructure/mcp-server/easyredmine-mcp-server
node dist/easyredmine-index.js
