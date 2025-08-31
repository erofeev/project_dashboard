# Руководство по развертыванию

## Обзор

Документ содержит подробные инструкции по развертыванию PWA приложения управления проектами в различных средах: разработка, тестирование, staging и продакшен.

## Требования к инфраструктуре

### Минимальные требования

#### Сервер приложения
- **CPU**: 2 ядра
- **RAM**: 4 GB
- **Диск**: 20 GB SSD
- **ОС**: Ubuntu 20.04 LTS или выше

#### База данных
- **CPU**: 2 ядра
- **RAM**: 8 GB
- **Диск**: 100 GB SSD
- **ОС**: Ubuntu 20.04 LTS или выше

#### Load Balancer (опционально)
- **CPU**: 1 ядро
- **RAM**: 2 GB
- **Диск**: 10 GB SSD

### Рекомендуемые требования

#### Сервер приложения
- **CPU**: 4 ядра
- **RAM**: 8 GB
- **Диск**: 50 GB SSD
- **ОС**: Ubuntu 22.04 LTS

#### База данных
- **CPU**: 4 ядра
- **RAM**: 16 GB
- **Диск**: 200 GB SSD
- **ОС**: Ubuntu 22.04 LTS

#### Load Balancer
- **CPU**: 2 ядра
- **RAM**: 4 GB
- **Диск**: 20 GB SSD

## Подготовка к развертыванию

### Создание production build

```bash
# Установка зависимостей
npm ci

# Создание production build
npm run build:prod

# Создание PWA build
npm run build:pwa

# Проверка build
npm run build:analyze
```

### Переменные окружения

Создайте файл `.env.production`:

```bash
# База данных
COUCHDB_URL=https://your-couchdb-domain.com
COUCHDB_USERNAME=your_production_user
COUCHDB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=3600

# Интеграции
OPENPROJECT_API_URL=https://your-openproject.com/api/v3
OPENPROJECT_API_KEY=your_production_api_key

ERM_API_URL=https://your-erm-system.com/api
ERM_API_KEY=your_production_api_key

# PWA
PWA_MANIFEST_URL=https://your-domain.com/manifest.json
SERVICE_WORKER_URL=https://your-domain.com/ngsw-worker.js

# Мониторинг
SENTRY_DSN=your_sentry_dsn
ANALYTICS_ID=your_analytics_id

# Безопасность
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### Docker образы

#### Dockerfile для приложения
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Копирование package файлов
COPY package*.json ./
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Создание production build
RUN npm run build:prod
RUN npm run build:pwa

# Production образ
FROM nginx:alpine

# Копирование build файлов
COPY --from=builder /app/dist/project-management-pwa /usr/share/nginx/html

# Копирование nginx конфигурации
COPY nginx.conf /etc/nginx/nginx.conf

# Копирование PWA файлов
COPY --from=builder /app/dist/project-management-pwa/ngsw-worker.js /usr/share/nginx/html/
COPY --from=builder /app/dist/project-management-pwa/manifest.json /usr/share/nginx/html/

# Создание пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Установка прав
RUN chown -R nextjs:nodejs /usr/share/nginx/html
USER nextjs

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Dockerfile для базы данных
```dockerfile
FROM couchdb:3.3.2

# Копирование конфигурации
COPY couchdb-config.ini /opt/couchdb/etc/local.ini

# Создание пользователя
RUN echo "couchdb:couchdb" | chpasswd

EXPOSE 5984

CMD ["/tini", "--", "/docker-entrypoint.sh", "/opt/couchdb/bin/couchdb"]
```

#### Docker Compose для production
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./logs:/var/log/nginx
    depends_on:
      - couchdb
    networks:
      - app-network

  couchdb:
    build: ./database
    ports:
      - "5984:5984"
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=secure_password
    volumes:
      - couchdb_data:/opt/couchdb/data
      - couchdb_logs:/opt/couchdb/var/log
    networks:
      - app-network

  fauxton:
    image: couchdb/fauxton:latest
    ports:
      - "8080:8080"
    environment:
      - COUCHDB_SINGLE_NODE=true
      - COUCHDB_URL=http://couchdb:5984
    depends_on:
      - couchdb
    networks:
      - app-network

  mcp-server:
    build: ./mcp-server
    ports:
      - "3000:3000"
    environment:
      - COUCHDB_URL=http://couchdb:5984
      - COUCHDB_USERNAME=admin
      - COUCHDB_PASSWORD=secure_password
    depends_on:
      - couchdb
    networks:
      - app-network

volumes:
  couchdb_data:
  couchdb_logs:

networks:
  app-network:
    driver: bridge
```

## Развертывание в различных средах

### 1. Разработка (Development)

#### Локальное развертывание
```bash
# Запуск всей системы
npm run system:start

# Проверка статуса
npm run system:status

# Остановка системы
npm run system:stop
```

#### Docker Compose для разработки
```yaml
version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "4200:4200"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run start:dev

  couchdb:
    image: couchdb:3.3.2
    ports:
      - "5984:5984"
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=admin123
    volumes:
      - couchdb_dev_data:/opt/couchdb/data

  fauxton:
    image: couchdb/fauxton:latest
    ports:
      - "8080:8080"
    environment:
      - COUCHDB_SINGLE_NODE=true
      - COUCHDB_URL=http://couchdb:5984

volumes:
  couchdb_dev_data:
```

### 2. Тестирование (Testing)

#### Автоматизированное развертывание
```bash
#!/bin/bash
# deploy-test.sh

echo "Deploying to testing environment..."

# Остановка существующих контейнеров
docker-compose -f docker-compose.test.yml down

# Удаление старых образов
docker system prune -f

# Создание новых образов
docker-compose -f docker-compose.test.yml build

# Запуск тестов
docker-compose -f docker-compose.test.yml run --rm app npm run test:e2e

# Если тесты прошли, запускаем приложение
if [ $? -eq 0 ]; then
    echo "Tests passed, starting application..."
    docker-compose -f docker-compose.test.yml up -d
    
    # Проверка здоровья
    echo "Checking application health..."
    sleep 30
    curl -f http://localhost:8080/health || exit 1
    
    echo "Deployment to testing completed successfully!"
else
    echo "Tests failed, deployment aborted!"
    exit 1
fi
```

#### Docker Compose для тестирования
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=testing
      - COUCHDB_URL=http://couchdb:5984
    depends_on:
      - couchdb

  couchdb:
    image: couchdb:3.3.2
    ports:
      - "5984:5984"
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=test_password
    volumes:
      - couchdb_test_data:/opt/couchdb/data

volumes:
  couchdb_test_data:
```

### 3. Staging

#### Развертывание в staging
```bash
#!/bin/bash
# deploy-staging.sh

STAGING_HOST="staging.your-domain.com"
STAGING_PATH="/var/www/staging"

echo "Deploying to staging environment..."

# Создание production build
npm run build:prod
npm run build:pwa

# Синхронизация с staging сервером
rsync -avz --delete dist/project-management-pwa/ $STAGING_HOST:$STAGING_PATH/

# Перезапуск сервисов на staging
ssh $STAGING_HOST "cd $STAGING_PATH && docker-compose restart app"

# Проверка здоровья
echo "Checking staging health..."
sleep 30
curl -f https://$STAGING_HOST/health || exit 1

echo "Staging deployment completed successfully!"
```

#### Nginx конфигурация для staging
```nginx
server {
    listen 80;
    server_name staging.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name staging.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/staging.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.your-domain.com/privkey.pem;

    root /var/www/staging;
    index index.html;

    # PWA поддержка
    location /manifest.json {
        add_header Cache-Control "no-cache";
    }

    location /ngsw-worker.js {
        add_header Cache-Control "no-cache";
    }

    # API проксирование
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 4. Продакшен (Production)

#### Автоматизированное развертывание
```bash
#!/bin/bash
# deploy-production.sh

PROD_HOST="your-domain.com"
PROD_PATH="/var/www/production"
BACKUP_PATH="/var/www/backups"

echo "Starting production deployment..."

# Создание backup
echo "Creating backup..."
ssh $PROD_HOST "cp -r $PROD_PATH $BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S)"

# Создание production build
echo "Building production application..."
npm run build:prod
npm run build:pwa

# Синхронизация с production сервером
echo "Deploying to production..."
rsync -avz --delete dist/project-management-pwa/ $PROD_HOST:$PROD_PATH/

# Обновление базы данных
echo "Updating database schema..."
ssh $PROD_HOST "cd $PROD_PATH && docker-compose exec couchdb curl -X PUT http://admin:password@localhost:5984/_users"
ssh $PROD_HOST "cd $PROD_PATH && docker-compose exec couchdb curl -X PUT http://admin:password@localhost:5984/projects"
ssh $PROD_HOST "cd $PROD_PATH && docker-compose exec couchdb curl -X PUT http://admin:password@localhost:5984/time_entries"

# Перезапуск сервисов
echo "Restarting services..."
ssh $PROD_HOST "cd $PROD_PATH && docker-compose restart"

# Проверка здоровья
echo "Checking production health..."
sleep 60
curl -f https://$PROD_HOST/health || {
    echo "Production deployment failed! Rolling back..."
    ssh $PROD_HOST "cd $PROD_PATH && docker-compose down && cp -r $BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S) $PROD_PATH && docker-compose up -d"
    exit 1
}

echo "Production deployment completed successfully!"
```

#### Nginx конфигурация для production
```nginx
# Основной сервер
upstream app_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# HTTP -> HTTPS редирект
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS сервер
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL конфигурация
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;";

    root /var/www/production;
    index index.html;

    # PWA файлы
    location /manifest.json {
        add_header Cache-Control "public, max-age=3600";
        add_header Service-Worker-Allowed "/";
    }

    location /ngsw-worker.js {
        add_header Cache-Control "public, max-age=3600";
        add_header Service-Worker-Allowed "/";
    }

    # Статические ресурсы
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }

    # API проксирование
    location /api/ {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket поддержка
    location /ws {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        # ... остальные настройки
    }
}
```

## SSL сертификаты

### Let's Encrypt автоматизация

#### Установка Certbot
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### Автоматическое обновление сертификатов
```bash
#!/bin/bash
# renew-ssl.sh

echo "Renewing SSL certificates..."

# Обновление сертификатов
certbot renew --quiet

# Перезагрузка Nginx
systemctl reload nginx

echo "SSL certificates renewed successfully!"
```

#### Cron задача для автоматического обновления
```bash
# Добавить в crontab
0 12 * * * /usr/local/bin/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1
```

## Мониторинг и логирование

### Логирование

#### Nginx логи
```nginx
# В nginx.conf
http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
}
```

#### Ротация логов
```bash
# /etc/logrotate.d/nginx
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 640 nginx adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

### Мониторинг

#### Health check endpoint
```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private couchdbService: CouchdbService,
    private integrationService: IntegrationService
  ) {}

  @Get()
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkIntegrations(),
      this.checkSystemResources()
    ]);

    const isHealthy = checks.every(check => check.status === 'healthy');

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    try {
      await this.couchdbService.ping();
      return { name: 'database', status: 'healthy', responseTime: Date.now() };
    } catch (error) {
      return { name: 'database', status: 'unhealthy', error: error.message };
    }
  }
}
```

#### Prometheus метрики
```typescript
// metrics.service.ts
@Injectable()
export class MetricsService {
  private requestCounter = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status']
  });

  private responseTimeHistogram = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route']
  });

  recordRequest(method: string, route: string, status: number, duration: number): void {
    this.requestCounter.inc({ method, route, status });
    this.responseTimeHistogram.observe({ method, route }, duration);
  }
}
```

## Резервное копирование

### Автоматическое резервное копирование

#### Скрипт резервного копирования
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/project-management"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

echo "Starting backup at $DATE..."

# Создание директории для backup
mkdir -p $BACKUP_DIR

# Backup базы данных
echo "Backing up CouchDB..."
curl -X GET "http://admin:password@localhost:5984/_all_dbs" | jq -r '.[]' | while read db; do
    if [ "$db" != "_replicator" ] && [ "$db" != "_users" ]; then
        echo "Backing up database: $db"
        curl -X GET "http://admin:password@localhost:5984/$db" > "$BACKUP_DIR/$db-$DATE.json"
    fi
done

# Backup конфигурации
echo "Backing up configuration..."
cp -r /etc/nginx/sites-available/* $BACKUP_DIR/
cp -r /etc/letsencrypt/live/* $BACKUP_DIR/ssl/

# Backup приложения
echo "Backing up application..."
tar -czf "$BACKUP_DIR/app-$DATE.tar.gz" /var/www/production

# Очистка старых backup
echo "Cleaning old backups..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully!"
```

#### Cron задача для автоматического backup
```bash
# Добавить в crontab
0 2 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1
```

## Масштабирование

### Горизонтальное масштабирование

#### Load Balancer конфигурация
```nginx
# /etc/nginx/nginx.conf
upstream app_backend {
    least_conn;
    server 192.168.1.10:3000 max_fails=3 fail_timeout=30s;
    server 192.168.1.11:3000 max_fails=3 fail_timeout=30s;
    server 192.168.1.12:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

#### Docker Swarm для кластеризации
```yaml
# docker-stack.yml
version: '3.8'

services:
  app:
    image: your-app:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    networks:
      - app-network

  couchdb:
    image: your-couchdb:latest
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
    volumes:
      - couchdb_data:/opt/couchdb/data
    networks:
      - app-network

networks:
  app-network:
    driver: overlay

volumes:
  couchdb_data:
    driver: local
```

### Вертикальное масштабирование

#### Оптимизация Node.js
```bash
# /etc/systemd/system/nodejs.service
[Unit]
Description=Node.js Application
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/var/www/production
ExecStart=/usr/bin/node app.js
Restart=on-failure
RestartSec=10

# Оптимизация памяти
Environment=NODE_OPTIONS="--max-old-space-size=4096"

# Ограничения ресурсов
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
```

## Безопасность

### Firewall настройки
```bash
# UFW настройки
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5984/tcp
ufw enable
```

### Fail2ban настройки
```bash
# /etc/fail2ban/jail.local
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 7200
```

## Откат изменений

### Автоматический откат
```bash
#!/bin/bash
# rollback.sh

VERSION=$1
BACKUP_PATH="/var/www/backups/backup-$VERSION"

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <backup-version>"
    exit 1
fi

if [ ! -d "$BACKUP_PATH" ]; then
    echo "Backup version $VERSION not found!"
    exit 1
fi

echo "Rolling back to version $VERSION..."

# Остановка сервисов
docker-compose down

# Восстановление из backup
cp -r $BACKUP_PATH/* /var/www/production/

# Запуск сервисов
docker-compose up -d

# Проверка здоровья
sleep 30
curl -f http://localhost/health || {
    echo "Rollback failed!"
    exit 1
}

echo "Rollback completed successfully!"
```

## Заключение

Данное руководство обеспечивает:

1. **Надежное развертывание** в различных средах
2. **Автоматизацию** процессов развертывания
3. **Мониторинг** и логирование
4. **Безопасность** и масштабируемость
5. **Процедуры отката** при проблемах

Следуйте этим инструкциям для успешного развертывания PWA приложения управления проектами.
