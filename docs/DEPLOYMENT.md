# Documento de Despliegue — Sistema de Gestión de Expertos NAE

> **Dominio:** `expertos-nae.mes.gob.cu`  
> **Fecha:** Abril 2026  
> **Versión del documento:** 1.0.0  
> **Repositorio:** https://github.com/denysbuedo/nae-expertos.git (branch: `main`)

---

## Tabla de Contenidos

1. [Arquitectura](#1-arquitectura)
2. [Prerrequisitos](#2-prerrequisitos)
3. [Configuración de HAProxy (servidor remoto)](#3-configuración-de-haproxy-servidor-remoto)
4. [Configuración del Servidor de Aplicación (Ubuntu 24.04)](#4-configuración-del-servidor-de-aplicación-ubuntu-2404)
5. [Configuración de PM2](#5-configuración-de-pm2)
6. [Servicios Systemd (alternativa a PM2)](#6-servicios-systemd-alternativa-a-pm2)
7. [Configuración del Firewall](#7-configuración-del-firewall)
8. [Migración de Base de Datos](#8-migración-de-base-de-datos)
9. [Checklist Post-Despliegue](#9-checklist-post-despliegue)
10. [Procedimientos de Mantenimiento](#10-procedimientos-de-mantenimiento)
11. [Resolución de Problemas](#11-resolución-de-problemas)

---

## 1. Arquitectura

```
                    ┌─────────────────────────────────────┐
                    │       HAProxy (servidor remoto)      │
                    │   SSL/TLS Termination (Let's Encrypt) │
                    │   Bind: 80, 443                      │
                    └──────────┬──────────────┬────────────┘
                               │              │
                    HTTPS      │              │
                  expertos     │              │
                  -nae.mes     │              │
                  .gob.cu      │              │
                               │              │
              ┌────────────────┘              └────────────────┐
              │                                                │
              ▼                                                ▼
    ┌─────────────────┐                          ┌─────────────────┐
    │  Frontend       │                          │  Backend API    │
    │  Next.js        │                          │  Express.js     │
    │  Puerto 3000    │                          │  Puerto 3001    │
    └────────┬────────┘                          └────────┬────────┘
             │                                            │
             │              ┌─────────────────┐           │
             └─────────────►│   PostgreSQL 16 │◄──────────┘
                            │   (local)       │
                            │   Puerto 5432   │
                            └─────────────────┘
```

### Flujo de tráfico

1. El usuario accede a `https://expertos-nae.mes.gob.cu`
2. HAProxy termina SSL/TLS y enruta:
   - `/api/v1/*` → App Server puerto **3001** (Backend API)
   - `/*` → App Server puerto **3000** (Next.js Frontend)
3. El Backend consulta PostgreSQL local (puerto 5432)
4. El Frontend consume la API a través del mismo dominio (sin problemas de CORS en producción)

### Tabla de servidores

| Componente          | Ubicación        | SO              | Puertos internos |
|---------------------|------------------|-----------------|------------------|
| HAProxy             | Servidor remoto  | Linux           | 80, 443          |
| App Server          | Servidor app     | Ubuntu 24.04    | 3000, 3001       |
| PostgreSQL          | App Server       | Ubuntu 24.04    | 5432 (localhost) |

---

## 2. Prerrequisitos

### 2.1 Especificaciones mínimas del Servidor de Aplicación

| Recurso    | Mínimo        | Recomendado      |
|------------|---------------|------------------|
| CPU        | 2 cores       | 4 cores          |
| RAM        | 2 GB          | 4 GB             |
| Disco      | 20 GB SSD     | 40 GB SSD        |
| Red        | 10 Mbps       | 100 Mbps         |
| SO         | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |

> **Nota:** Los requisitos pueden ajustarse según el volumen de usuarios concurrentes y el tamaño de la base de datos.

### 2.2 Software requerido

| Software        | Versión    | Propósito                          |
|-----------------|------------|------------------------------------|
| Node.js         | 20+ LTS    | Runtime para API y Frontend        |
| npm             | 10+        | Gestor de paquetes                 |
| PostgreSQL      | 16         | Base de datos relacional           |
| PM2             | 5.x        | Gestor de procesos Node.js         |
| Git             | 2.43+      | Control de versiones               |
| build-essential | —          | Compilador nativo (node-gyp)       |
| Certbot         | —          | (solo en servidor HAProxy remoto)  |

### 2.3 Acceso requerido

- Acceso **SSH** al servidor de aplicación (Ubuntu 24.04) con privilegios `sudo`
- Acceso **SSH** al servidor HAProxy remoto
- Acceso al repositorio Git: https://github.com/denysbuedo/nae-expertos.git
- Dominio `expertos-nae.mes.gob.cu` apuntando al **IP del servidor HAProxy**
- Certificado SSL válido para `expertos-nae.mes.gob.cu` (Let's Encrypt o interno)

### 2.4 Variables y credenciales a preparar

| Variable                | Valor (ejemplo)                              | Ubicación        |
|-------------------------|----------------------------------------------|------------------|
| `APP_SERVER_IP`         | `10.0.0.50` (ajustar)                        | HAProxy config   |
| `DB_PASSWORD`           | `SegresadosOC*2026`                          | .env backend     |
| `JWT_SECRET`            | Generar con `openssl rand -hex 32`           | .env backend     |
| `NEXT_PUBLIC_API_URL`   | `https://expertos-nae.mes.gob.cu/api/v1`     | .env.local front |

---

## 3. Configuración de HAProxy (Servidor Remoto)

> **IMPORTANTE:** Esta sección se ejecuta en el **servidor HAProxy remoto**, NO en el servidor de aplicación.

### 3.1 Instalar HAProxy (si no está instalado)

```bash
# En el servidor HAProxy remoto
sudo apt update && sudo apt install -y haproxy openssl
```

### 3.2 Generar certificado SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot

# Obtener certificado (HAProxy debe estar detenido o el puerto 80 libre)
sudo systemctl stop haproxy
sudo certbot certonly --standalone -d expertos-nae.mes.gob.cu \
  --email admin@mes.gob.cu --agree-tos --non-interactive

# Convertir a formato PEM combinado para HAProxy
sudo bash -c 'cat /etc/letsencrypt/live/expertos-nae.mes.gob.cu/fullchain.pem \
  /etc/letsencrypt/live/expertos-nae.mes.gob.cu/privkey.pem \
  > /etc/haproxy/certs/expertos-nae.mes.gob.cu.pem'

sudo chmod 600 /etc/haproxy/certs/expertos-nae.mes.gob.cu.pem
```

### 3.3 Renovación automática de certificados

```bash
# Crear hook de renovación para HAProxy
sudo tee /etc/letsencrypt/renewal-hooks-post/haproxy.sh << 'EOF'
#!/bin/bash
DOMAIN="expertos-nae.mes.gob.cu"
cat /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
    /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
    > /etc/haproxy/certs/${DOMAIN}.pem
chmod 600 /etc/haproxy/certs/${DOMAIN}.pem
systemctl reload haproxy
EOF

sudo chmod +x /etc/letsencrypt/renewal-hooks-post/haproxy.sh
```

### 3.4 Configuración completa de HAProxy

```bash
# Respaldar configuración actual
sudo cp /etc/haproxy/haproxy.cfg /etc/haproxy/haproxy.cfg.bak.$(date +%Y%m%d)
```

Editar `/etc/haproxy/haproxy.cfg`:

```haproxy
#---------------------------------------------------------------------
# HAProxy Configuration — NAE Experts Management System
# Dominio: expertos-nae.mes.gob.cu
#---------------------------------------------------------------------

global
    log /dev/log local0
    log /dev/log local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

    # SSL tuning
    ssl-default-bind-ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    ssl-default-bind-ciphersuites TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256
    ssl-default-bind-options ssl-min-ver TLSv1.2 no-tls-tickets

    # DH parameters (opcional, generar con: openssl dhparam -out /etc/haproxy/dhparam.pem 2048)
    # ssl-dh-param-file /etc/haproxy/dhparam.pem

defaults
    log     global
    mode    http
    option  httplog
    option  dontlognull
    option  forwardfor
    option  http-server-close
    timeout connect 5000ms
    timeout client  50000ms
    timeout server  50000ms
    timeout http-request 10000ms
    timeout http-keep-alive 10000ms
    errorfile 400 /etc/haproxy/errors/400.http
    errorfile 403 /etc/haproxy/errors/403.http
    errorfile 408 /etc/haproxy/errors/408.http
    errorfile 500 /etc/haproxy/errors/500.http
    errorfile 502 /etc/haproxy/errors/502.http
    errorfile 503 /etc/haproxy/errors/503.http
    errorfile 504 /etc/haproxy/errors/504.http

#---------------------------------------------------------------------
# Frontend HTTP — Redirección a HTTPS
#---------------------------------------------------------------------
frontend fe_http
    bind *:80
    mode http

    # Redirección permanente HTTP → HTTPS
    http-request redirect scheme https unless { ssl_fc }

    # Health check endpoint para monitoreo externo
    acl is_health_check path_beg /haproxy-health
    monitor-uri /haproxy-health

#---------------------------------------------------------------------
# Frontend HTTPS — Terminación SSL
#---------------------------------------------------------------------
frontend fe_https
    bind *:443 ssl crt /etc/haproxy/certs/expertos-nae.mes.gob.cu.pem
    mode http

    # Security headers
    http-response set-header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    http-response set-header X-Frame-Options SAMEORIGIN
    http-response set-header X-Content-Type-Options nosniff
    http-response set-header X-XSS-Protection "1; mode=block"
    http-response set-header Referrer-Policy strict-origin-when-cross-origin

    # Logging mejorado
    option httplog

    # ACLs para enrutamiento
    acl is_api path_beg /api/

    # Enrutamiento según ACL
    use_backend be_api if is_api
    default_backend be_frontend

#---------------------------------------------------------------------
# Backend — API (puerto 3001 en App Server)
#---------------------------------------------------------------------
backend be_api
    mode http
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200

    # Headers para que el backend conozca el esquema original
    http-request set-header X-Forwarded-Proto https
    http-request set-header X-Forwarded-Port 443

    # Servidor de aplicación — AJUSTAR IP
    server app-api 10.0.0.50:3001 check inter 10s fall 3 rise 2 maxconn 256

#---------------------------------------------------------------------
# Backend — Frontend Next.js (puerto 3000 en App Server)
#---------------------------------------------------------------------
backend be_frontend
    mode http
    balance roundrobin
    option httpchk GET /
    http-check expect status 200

    http-request set-header X-Forwarded-Proto https
    http-request set-header X-Forwarded-Port 443

    # Servidor de aplicación — AJUSTAR IP
    server app-web 10.0.0.50:3000 check inter 10s fall 3 rise 2 maxconn 256

#---------------------------------------------------------------------
# Estadísticas de HAProxy (acceso restringido)
#---------------------------------------------------------------------
listen stats
    bind *:8404
    mode http
    stats enable
    stats uri /stats
    stats refresh 10s
    stats admin if LOCALHOST
    # stats auth admin:password_seguro  # Descomentar y cambiar credenciales
```

> **⚠️ ADVERTENCIA:** Reemplazar `10.0.0.50` con la **IP real del servidor de aplicación**.

### 3.5 Validar y reiniciar HAProxy

```bash
# Validar configuración
sudo haproxy -c -f /etc/haproxy/haproxy.cfg

# Si la validación es exitosa, reiniciar
sudo systemctl restart haproxy
sudo systemctl enable haproxy

# Verificar estado
sudo systemctl status haproxy

# Verificar que escucha en los puertos correctos
sudo ss -tlnp | grep -E ':(80|443|8404)\b'
```

### 3.6 Verificar enrutamiento

```bash
# Desde el servidor HAProxy, probar conectividad al App Server
curl -s http://10.0.0.50:3000/ -o /dev/null -w "%{http_code}\n"   # Debe devolver 200
curl -s http://10.0.0.50:3001/health -o /dev/null -w "%{http_code}\n"  # Debe devolver 200

# Desde cualquier máquina, probar el dominio
curl -I https://expertos-nae.mes.gob.cu
curl -I https://expertos-nae.mes.gob.cu/api/v1
```

---

## 4. Configuración del Servidor de Aplicación (Ubuntu 24.04)

> **TODOS los comandos siguientes se ejecutan en el servidor de aplicación Ubuntu 24.04.**

### 4.1 Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y software-properties-common curl git build-essential
```

### 4.2 Instalar Node.js 20 LTS

```bash
# Usar NodeSource para Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version   # Debe mostrar v20.x.x
npm --version    # Debe mostrar 10.x.x
```

### 4.3 Instalar PM2

```bash
sudo npm install -g pm2

# Verificar
pm2 --version
```

### 4.4 Instalar PostgreSQL 16

```bash
# Instalar PostgreSQL desde repositorio oficial
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt update
sudo apt install -y postgresql-16 postgresql-client-16

# Iniciar y habilitar servicio
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### 4.5 Configurar PostgreSQL

```bash
# Cambiar al usuario postgres
sudo -i -u postgres
```

```sql
-- Entrar a la consola de PostgreSQL
psql

-- Crear usuario de aplicación
CREATE USER app_expertos WITH PASSWORD 'SegresadosOC*2026';

-- Crear base de datos
CREATE DATABASE db_expertos_nae OWNER app_expertos;

-- Conectar a la base de datos y otorgar permisos
\c db_expertos_nae

-- Otorgar permisos en el esquema public
GRANT ALL ON SCHEMA public TO app_expertos;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_expertos;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_expertos;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO app_expertos;

-- Configurar permisos por defecto para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_expertos;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_expertos;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO app_expertos;

-- Verificar
\du app_expertos
\l db_expertos_nae

-- Salir
\q
```

```bash
# Salir del usuario postgres
exit
```

### 4.6 Configurar autenticación PostgreSQL (pg_hba.conf)

```bash
# Editar pg_hba.conf (la ruta puede variar)
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Asegurar que exista esta línea para conexiones locales:

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   db_expertos_nae app_expertos                            md5
host    db_expertos_nae app_expertos    127.0.0.1/32            md5
host    db_expertos_nae app_expertos    ::1/128                 md5
```

```bash
# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### 4.7 Clonar el repositorio

```bash
# Crear directorio de aplicación
sudo mkdir -p /opt/nae-expertos
sudo chown $USER:$USER /opt/nae-expertos

# Clonar repositorio
cd /opt/nae-expertos
git clone https://github.com/denysbuedo/nae-expertos.git .
git checkout main
git pull origin main
```

### 4.8 Configurar Backend API

```bash
cd /opt/nae-expertos/api-backend

# Instalar dependencias
npm install --omit=dev

# Generar Prisma Client
npx prisma generate
```

Crear archivo `.env`:

```bash
cat > /opt/nae-expertos/api-backend/.env << 'EOF'
# Server
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL="postgresql://app_expertos:SegresadosOC*2026@localhost:5432/db_expertos_nae"

# JWT — IMPORTANTE: generar uno nuevo con: openssl rand -hex 32
JWT_SECRET="GENERAR_CON_OPENSSL_RAND_HEX_32"
JWT_EXPIRATION="7d"

# Redis (opcional — deshabilitar si no se usa)
REDIS_URL="redis://localhost:6379"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
```

> **⚠️ SEGURIDAD:** Generar un `JWT_SECRET` único y seguro:
> ```bash
> openssl rand -hex 32
> ```
> Reemplazar `GENERAR_CON_OPENSSL_RAND_HEX_32` con el valor generado.

### 4.9 Configurar Frontend Next.js

```bash
cd /opt/nae-expertos/web-app

# Instalar dependencias (incluye devDependencies para el build)
npm install
```

Crear archivo `.env.local`:

```bash
cat > /opt/nae-expertos/web-app/.env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=https://expertos-nae.mes.gob.cu/api/v1
NEXT_PUBLIC_APP_NAME=Sistema de Gestión de Expertos NAE

# Authentication
NEXT_PUBLIC_AUTH_STRATEGY=jwt

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=false
EOF
```

### 4.10 Construir Backend

```bash
cd /opt/nae-expertos/api-backend

# Compilar TypeScript
npm run build

# Verificar que se generó el dist
ls -la dist/
```

### 4.11 Construir Frontend

```bash
cd /opt/nae-expertos/web-app

# Build de producción
npm run build

# Verificar que se generó .next
ls -la .next/
```

---

## 5. Configuración de PM2

PM2 gestiona los procesos Node.js, garantiza reinicio automático en caso de crash y permite monitorización.

### 5.1 Crear archivo `ecosystem.config.js`

```bash
cat > /opt/nae-expertos/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'api-backend',
      cwd: '/opt/nae-expertos/api-backend',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/api-backend-error.log',
      out_file: '/var/log/pm2/api-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'web-app',
      cwd: '/opt/nae-expertos/web-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/web-app-error.log',
      out_file: '/var/log/pm2/web-app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF
```

### 5.2 Crear directorio de logs

```bash
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2
```

### 5.3 Iniciar aplicaciones con PM2

```bash
cd /opt/nae-expertos

# Iniciar todos los procesos
pm2 start ecosystem.config.js

# Verificar estado
pm2 status

# Ver logs en tiempo real
pm2 logs

# Ver logs de un servicio específico
pm2 logs api-backend
pm2 logs web-app

# Ver detalles de un proceso
pm2 show api-backend
pm2 show web-app
```

### 5.4 Configurar inicio automático al boot

```bash
# Generar script de startup
pm2 startup

# Ejecutar el comando que PM2 muestra en la salida (requiere sudo)
# Ejemplo: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u TU_USUARIO --hp /home/TU_USUARIO

# Guardar la lista de procesos actuales
pm2 save
```

### 5.5 Comandos útiles de PM2

| Acción              | Comando                                      |
|---------------------|----------------------------------------------|
| Iniciar todo        | `pm2 start ecosystem.config.js`              |
| Detener todo        | `pm2 stop all`                               |
| Reiniciar todo      | `pm2 restart all`                            |
| Recargar (0-downtime)| `pm2 reload all`                            |
| Detener un servicio | `pm2 stop api-backend`                       |
| Reiniciar un servicio| `pm2 restart api-backend`                   |
| Ver estado          | `pm2 status`                                 |
| Ver monitoreo       | `pm2 monit`                                  |
| Ver logs            | `pm2 logs`                                   |
| Ver logs (sin tail) | `pm2 logs --lines 100`                       |
| Eliminar proceso    | `pm2 delete api-backend`                     |
| Guardar lista       | `pm2 save`                                   |
| Cargar lista        | `pm2 resurrect`                              |
| Flush logs          | `pm2 flush`                                  |

---

## 6. Servicios Systemd (Alternativa a PM2)

> **NOTA:** Usar PM2 **o** Systemd, no ambos simultáneamente para los mismos procesos.  
> Systemd es preferible si se requiere integración nativa con el sistema operativo.

### 6.1 Servicio para API Backend

```bash
sudo tee /etc/systemd/system/api-backend.service << 'EOF'
[Unit]
Description=NAE Experts — API Backend
Documentation=https://github.com/denysbuedo/nae-expertos
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/nae-expertos/api-backend
ExecStart=/usr/bin/node /opt/nae-expertos/api-backend/dist/index.js
Restart=on-failure
RestartSec=5
StartLimitBurst=5
StartLimitIntervalSec=60

# Environment
Environment=NODE_ENV=production
Environment=PORT=3001
EnvironmentFile=/opt/nae-expertos/api-backend/.env

# Logging
StandardOutput=append:/var/log/nae-expertos/api-backend-out.log
StandardError=append:/var/log/nae-expertos/api-backend-error.log

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/nae-expertos
PrivateTmp=true

# Resource limits
LimitNOFILE=65536
MemoryMax=512M

[Install]
WantedBy=multi-user.target
EOF
```

### 6.2 Servicio para Frontend Next.js

```bash
sudo tee /etc/systemd/system/web-app.service << 'EOF'
[Unit]
Description=NAE Experts — Web App (Next.js)
Documentation=https://github.com/denysbuedo/nae-expertos
After=network.target api-backend.service
Wants=api-backend.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/nae-expertos/web-app
ExecStart=/usr/bin/node /opt/nae-expertos/web-app/node_modules/next/dist/bin/next start -p 3000
Restart=on-failure
RestartSec=5
StartLimitBurst=5
StartLimitIntervalSec=60

# Environment
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/opt/nae-expertos/web-app/.env.local

# Logging
StandardOutput=append:/var/log/nae-expertos/web-app-out.log
StandardError=append:/var/log/nae-expertos/web-app-error.log

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/nae-expertos
PrivateTmp=true

# Resource limits
LimitNOFILE=65536
MemoryMax=1G

[Install]
WantedBy=multi-user.target
EOF
```

### 6.3 Crear directorio de logs para Systemd

```bash
sudo mkdir -p /var/log/nae-expertos
sudo chown www-data:www-data /var/log/nae-expertos
sudo chmod 750 /var/log/nae-expertos
```

### 6.4 Dar permisos al usuario www-data sobre el código

```bash
sudo chown -R www-data:www-data /opt/nae-expertos
sudo chmod -R 750 /opt/nae-expertos
```

### 6.5 Habilitar e iniciar servicios

```bash
# Recargar definición de servicios
sudo systemctl daemon-reload

# Habilitar inicio automático
sudo systemctl enable api-backend
sudo systemctl enable web-app

# Iniciar servicios
sudo systemctl start api-backend
sudo systemctl start web-app

# Verificar estado
sudo systemctl status api-backend
sudo systemctl status web-app

# Ver logs
sudo journalctl -u api-backend -f
sudo journalctl -u web-app -f
```

### 6.6 Comandos útiles de Systemd

| Acción              | Comando                                          |
|---------------------|--------------------------------------------------|
| Iniciar             | `sudo systemctl start api-backend`               |
| Detener             | `sudo systemctl stop api-backend`                |
| Reiniciar           | `sudo systemctl restart api-backend`             |
| Recargar config     | `sudo systemctl daemon-reload`                   |
| Ver estado          | `sudo systemctl status api-backend`              |
| Ver logs            | `sudo journalctl -u api-backend -f`              |
| Ver logs (últimas 100 líneas) | `sudo journalctl -u api-backend -n 100` |
| Deshabilitar        | `sudo systemctl disable api-backend`             |

---

## 7. Configuración del Firewall

### 7.1 En el Servidor de Aplicación (Ubuntu)

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH (importante: no perder acceso)
sudo ufw allow 22/tcp comment 'SSH'

# Permitir tráfico desde el servidor HAProxy hacia los puertos de la app
# AJUSTAR IP según la del servidor HAProxy
sudo ufw allow from 10.0.0.100 to any port 3000 proto tcp comment 'HAProxy → Frontend'
sudo ufw allow from 10.0.0.100 to any port 3001 proto tcp comment 'HAProxy → API'

# Permitir PostgreSQL solo localmente
sudo ufw allow from 127.0.0.1 to any port 5432 proto tcp comment 'PostgreSQL local'

# Denegar todo lo demás por defecto
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Verificar reglas
sudo ufw status verbose
```

### 7.2 En el Servidor HAProxy (remoto)

```bash
sudo ufw enable
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw allow 8404/tcp comment 'HAProxy Stats'  # Restringir en producción

# Restringir acceso a stats a IPs específicas (recomendado)
# sudo ufw delete allow 8404/tcp
# sudo ufw allow from 10.0.0.0/24 to any port 8404 proto tcp

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw status verbose
```

### 7.3 Verificar conectividad

```bash
# Desde el servidor HAProxy al App Server
nc -zv 10.0.0.50 3000
nc -zv 10.0.0.50 3001

# Desde fuera, verificar que solo HAProxy expone puertos
nmap expertos-nae.mes.gob.cu -p 80,443
```

---

## 8. Migración de Base de Datos

### 8.1 Ejecutar Prisma DB Push

```bash
cd /opt/nae-expertos/api-backend

# Verificar que la conexión funciona
npx prisma db pull --force

# Aplicar esquema a la base de datos (crea las tablas)
npx prisma db push

# Verificar que las tablas se crearon
npx prisma db pull
```

### 8.2 Generar Prisma Client (si no se hizo antes)

```bash
cd /opt/nae-expertos/api-backend
npx prisma generate
```

### 8.3 Verificar tablas creadas

```bash
sudo -i -u postgres psql -d db_expertos_nae -c "\dt"
```

Debe mostrar las tablas:
- `users`
- `orders`
- `activities`
- `subactivities`
- `deliverables`
- `profiles`
- `expert_pool`
- `expert_pool_profiles`
- `assignments`
- `deliverable_assignments`

### 8.4 Crear usuario administrador inicial

Primero, necesitamos generar un hash de contraseña:

```bash
# Generar hash de contraseña con Node.js
node -e "const bcrypt = require('/opt/nae-expertos/api-backend/node_modules/bcrypt'); console.log(bcrypt.hashSync('Admin123!', 10));"
```

Copiar el hash generado y usarlo en la siguiente consulta:

```bash
sudo -i -u postgres psql -d db_expertos_nae << 'EOSQL'
-- Insertar usuario admin (reemplazar HASH con el valor generado arriba)
INSERT INTO users (id, username, password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'ADMIN',
  NOW(),
  NOW()
);

-- Verificar
SELECT id, username, role, "createdAt" FROM users;
EOSQL
```

> **⚠️ SEGURIDAD:** Cambiar la contraseña `Admin123!` por una contraseña segura en producción. El usuario admin debe cambiarla en el primer inicio de sesión.

### 8.5 Alternativa: Crear admin vía API

Si la API ya está corriendo y tiene un endpoint de registro:

```bash
# Crear admin vía API
curl -X POST https://expertos-nae.mes.gob.cu/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!",
    "role": "ADMIN"
  }'
```

---

## 9. Checklist Post-Despliegue

### 9.1 Verificación de Servicios

```bash
# ── En el Servidor de Aplicación ──

# PostgreSQL
sudo systemctl is-active postgresql          # Debe devolver "active"
sudo -i -u postgres pg_isready               # Debe devolver "accepting connections"

# PM2 (si se usa PM2)
pm2 status                                   # Ambos procesos deben estar "online"
pm2 ping                                     # PM2 daemon running

# Systemd (si se usa Systemd)
sudo systemctl is-active api-backend         # "active"
sudo systemctl is-active web-app             # "active"

# Puertos
ss -tlnp | grep -E ':(3000|3001|5432)\b'    # Deben estar escuchando

# Base de datos
npx prisma db pull --force 2>&1 | head -5    # Sin errores de conexión
```

### 9.2 Health Checks

```bash
# Health check de la API
curl -s http://localhost:3001/health | python3 -m json.tool
# Esperado: {"status": "ok", "timestamp": "..."}

# Health check del Frontend
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
# Esperado: 200

# Health check vía HAProxy (HTTPS)
curl -sk https://expertos-nae.mes.gob.cu/api/v1 -o /dev/null -w "%{http_code}\n"
# Esperado: 200

curl -sk https://expertos-nae.mes.gob.cu/ -o /dev/null -w "%{http_code}\n"
# Esperado: 200
```

### 9.3 Verificación de SSL/TLS

```bash
# Verificar certificado SSL
echo | openssl s_client -connect expertos-nae.mes.gob.cu:443 -servername expertos-nae.mes.gob.cu 2>/dev/null | openssl x509 -noout -dates

# Verificar que solo acepta TLS 1.2+
curl -sk --tlsv1.2 https://expertos-nae.mes.gob.cu -o /dev/null -w "%{http_code}\n"   # 200
curl -sk --tls-max 1.1 https://expertos-nae.mes.gob.cu -o /dev/null -w "%{http_code}\n" # 0 (falla)
```

### 9.4 Verificación de Base de Datos

```bash
# Contar registros en tablas principales
sudo -i -u postgres psql -d db_expertos_nae << 'EOSQL'
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'activities', COUNT(*) FROM activities
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'expert_pool', COUNT(*) FROM expert_pool;
EOSQL
```

### 9.5 Verificación de HAProxy

```bash
# ── En el servidor HAProxy ──

# Estado de HAProxy
sudo systemctl is-active haproxy              # "active"

# Estadísticas (si están habilitadas)
curl -s http://localhost:8404/stats -o /dev/null -w "%{http_code}\n"   # 200

# Verificar backends activos
echo "show stat" | sudo socat stdio /run/haproxy/admin.sock | grep -E "be_api|be_frontend" | cut -d',' -f1,2,18,19
```

### 9.6 Tabla de verificación

| Check                          | Comando rápido                                      | Resultado esperado |
|--------------------------------|-----------------------------------------------------|--------------------|
| PostgreSQL activo              | `sudo systemctl is-active postgresql`               | `active`           |
| API respondiendo               | `curl -s localhost:3001/health`                     | `{"status":"ok"}`  |
| Frontend respondiendo          | `curl -s -o /dev/null -w "%{http_code}" localhost:3000` | `200`          |
| HAProxy → API (HTTPS)         | `curl -sk https://expertos-nae.mes.gob.cu/api/v1`  | `200`              |
| HAProxy → Frontend (HTTPS)    | `curl -sk https://expertos-nae.mes.gob.cu/`        | `200`              |
| Certificado SSL válido         | `openssl s_client -connect ... :443`                | Verify OK          |
| PM2 procesos online            | `pm2 status`                                        | `online`           |
| DB conexión                    | `npx prisma db pull`                                | Sin errores        |

---

## 10. Procedimientos de Mantenimiento

### 10.1 Despliegue de Actualizaciones

#### Método A: Con PM2 (recomendado)

```bash
# 1. Conectar al servidor de aplicación
ssh usuario@app-server

# 2. Ir al directorio del proyecto
cd /opt/nae-expertos

# 3. Obtener últimos cambios
git stash
git pull origin main

# 4. Actualizar backend
cd api-backend
npm install --omit=dev
npx prisma generate
npx prisma db push
npm run build

# 5. Actualizar frontend
cd ../web-app
npm install
npm run build

# 6. Reiniciar con PM2 (zero-downtime reload)
cd /opt/nae-expertos
pm2 reload all

# 7. Verificar
pm2 status
curl -s http://localhost:3001/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```

#### Método B: Con Systemd

```bash
# Pasos 1-5 iguales que arriba...

# 6. Reiniciar con Systemd
sudo systemctl restart api-backend
sudo systemctl restart web-app

# 7. Verificar
sudo systemctl status api-backend web-app
```

#### Método C: Script automatizado

```bash
# Crear script de despliegue
cat > /opt/nae-expertos/deploy.sh << 'SCRIPT'
#!/bin/bash
set -e

echo "=== Iniciando despliegue ==="
cd /opt/nae-expertos

echo "[1/6] Obteniendo últimos cambios..."
git stash
git pull origin main

echo "[2/6] Actualizando backend..."
cd api-backend
npm install --omit=dev
npx prisma generate
npx prisma db push
npm run build

echo "[3/6] Actualizando frontend..."
cd ../web-app
npm install
npm run build

echo "[4/6] Reiniciando servicios (PM2)..."
cd /opt/nae-expertos
pm2 reload all || { echo "PM2 reload falló, intentando restart..."; pm2 restart all; }

echo "[5/6] Verificando servicios..."
sleep 3
pm2 status

echo "[6/6] Health checks..."
HEALTH_API=$(curl -s http://localhost:3001/health 2>/dev/null)
HEALTH_WEB=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)

if echo "$HEALTH_API" | grep -q '"status":"ok"'; then
    echo "✅ API: OK"
else
    echo "❌ API: FALLÓ — $HEALTH_API"
fi

if [ "$HEALTH_WEB" = "200" ]; then
    echo "✅ Frontend: OK (HTTP $HEALTH_WEB)"
else
    echo "❌ Frontend: FALLÓ (HTTP $HEALTH_WEB)"
fi

echo "=== Despliegue completado ==="
SCRIPT

chmod +x /opt/nae-expertos/deploy.sh

# Ejecutar despliegue
/opt/nae-expertos/deploy.sh
```

### 10.2 Ubicaciones de Logs

| Servicio         | Log de salida                    | Log de errores                  |
|------------------|----------------------------------|---------------------------------|
| PM2 API Backend  | `/var/log/pm2/api-backend-out.log` | `/var/log/pm2/api-backend-error.log` |
| PM2 Frontend     | `/var/log/pm2/web-app-out.log`   | `/var/log/pm2/web-app-error.log` |
| Systemd API      | `journalctl -u api-backend`      | `journalctl -u api-backend -p err` |
| Systemd Frontend | `journalctl -u web-app`          | `journalctl -u web-app -p err` |
| PostgreSQL       | `/var/log/postgresql/`           | `/var/log/postgresql/`          |
| HAProxy          | `/var/log/haproxy.log`           | `/var/log/haproxy.log`          |
| Nginx (si aplica)| `/var/log/nginx/access.log`      | `/var/log/nginx/error.log`      |

#### Rotación de logs PM2

```bash
# PM2 gestiona la rotación automáticamente con --log-date-format
# Para rotación manual o con logrotate:

sudo tee /etc/logrotate.d/pm2-nae-expertos << 'EOF'
/var/log/pm2/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 $USER $USER
    sharedscripts
    postrotate
        pm2 flush > /dev/null 2>&1 || true
    endscript
}
EOF
```

### 10.3 Backup de Base de Datos

#### Backup manual

```bash
# Crear directorio de backups
sudo mkdir -p /var/backups/nae-expertos/db
sudo chown postgres:postgres /var/backups/nae-expertos/db

# Backup completo (dump)
sudo -i -u postgres pg_dump -d db_expertos_nae -F c -f \
  /var/backups/nae-expertos/db/db_expertos_nae_$(date +%Y%m%d_%H%M%S).dump

# Backup en formato SQL (legible)
sudo -i -u postgres pg_dump -d db_expertos_nae --clean --if-exists \
  > /var/backups/nae-expertos/db/db_expertos_nae_$(date +%Y%m%d_%H%M%S).sql

# Verificar backups
ls -lh /var/backups/nae-expertos/db/
```

#### Backup automatizado (cron diario)

```bash
# Crear script de backup
sudo tee /usr/local/bin/backup-db-expertos.sh << 'SCRIPT'
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/nae-expertos/db"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/db_expertos_nae_${TIMESTAMP}.dump"

# Crear backup
sudo -i -u postgres pg_dump -d db_expertos_nae -F c -f "$BACKUP_FILE"

# Verificar que el backup no está vacío
if [ ! -s "$BACKUP_FILE" ]; then
    echo "ERROR: El backup está vacío: $BACKUP_FILE"
    exit 1
fi

# Eliminar backups antiguos
find "$BACKUP_DIR" -name "db_expertos_nae_*.dump" -mtime +${RETENTION_DAYS} -delete

echo "Backup completado: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
SCRIPT

sudo chmod +x /usr/local/bin/backup-db-expertos.sh

# Agregar al cron (diario a las 2:00 AM)
sudo tee /etc/cron.d/backup-db-expertos << 'EOF'
0 2 * * * root /usr/local/bin/backup-db-expertos.sh >> /var/log/backup-db-expertos.log 2>&1
EOF
```

#### Restaurar desde backup

```bash
# Desde backup .dump (formato custom)
sudo -i -u postgres pg_restore -d db_expertos_nae --clean --if-exists \
  /var/backups/nae-expertos/db/db_expertos_nae_20260413_020000.dump

# Desde backup .sql
sudo -i -u postgres psql -d db_expertos_nae \
  < /var/backups/nae-expertos/db/db_expertos_nae_20260413_020000.sql

# Verificar restauración
sudo -i -u postgres psql -d db_expertos_nae -c "SELECT COUNT(*) FROM users;"
```

### 10.4 Monitoreo

#### Monitoreo con PM2

```bash
# Dashboard en terminal
pm2 monit

# Métricas en formato JSON
pm2 jlist

# Generar reporte
pm2 report
```

#### Monitoreo con HAProxy Stats

Acceder a `http://haproxy-server:8404/stats` para ver:
- Tasa de requests por backend
- Backend servers UP/DOWN
- Tiempos de respuesta
- Errores y reintentos

#### Monitoreo básico del servidor

```bash
# Uso de CPU y memoria
htop

# Uso de disco
df -h
df -h /var/lib/postgresql

# Conexiones PostgreSQL activas
sudo -i -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'db_expertos_nae';"

# Logs de errores recientes (Systemd)
sudo journalctl -u api-backend -p err --since "1 hour ago"
sudo journalctl -u web-app -p err --since "1 hour ago"

# Logs de PostgreSQL
sudo tail -50 /var/log/postgresql/postgresql-16-main.log
```

#### Alertas recomendadas

| Métrica                    | Umbral          | Acción                    |
|----------------------------|-----------------|---------------------------|
| CPU > 80% por 5 min        | Warning         | Investigar procesos       |
| RAM > 85%                  | Warning         | Verificar memory leaks    |
| Disco > 80%                | Warning         | Limpiar logs/backups      |
| Disco > 90%                | Critical        | Expandir almacenamiento   |
| API response time > 2s     | Warning         | Revisar queries lentos    |
| PM2 process restart > 3/h  | Warning         | Investigar crash          |
| DB connections > 80        | Warning         | Ajustar pool o max_conns  |
| HAProxy backend DOWN       | Critical        | Verificar app server      |

### 10.5 Limpieza periódica

```bash
# Limpiar logs antiguos de PM2
pm2 flush

# Limpiar caché de npm
npm cache clean --force

# Limpiar paquetes de PostgreSQL no usados (en Ubuntu)
sudo apt autoremove --purge

# Limpiar logs de journalctl mayores a 7 días
sudo journalctl --vacuum-time=7d

# Limpiar backups de DB más antiguos que el período de retención
find /var/backups/nae-expertos/db/ -name "*.dump" -mtime +30 -delete
```

---

## 11. Resolución de Problemas

### 11.1 La API no responde

```bash
# 1. Verificar que el proceso está corriendo
pm2 status api-backend
# o
sudo systemctl status api-backend

# 2. Verificar puerto
ss -tlnp | grep 3001

# 3. Ver logs de errores
pm2 logs api-backend --lines 100
# o
sudo journalctl -u api-backend -n 100 --no-pager

# 4. Verificar conexión a DB
cd /opt/nae-expertos/api-backend
npx prisma db pull --force

# 5. Verificar variables de entorno
cat /opt/nae-expertos/api-backend/.env | grep DATABASE_URL

# 6. Reiniciar
pm2 restart api-backend
```

### 11.2 El Frontend no carga

```bash
# 1. Verificar proceso
pm2 status web-app

# 2. Verificar puerto
ss -tlnp | grep 3000

# 3. Ver logs
pm2 logs web-app --lines 100

# 4. Verificar NEXT_PUBLIC_API_URL
cat /opt/nae-expertos/web-app/.env.local | grep NEXT_PUBLIC_API_URL

# 5. Verificar que el build es correcto
ls -la /opt/nae-expertos/web-app/.next/

# 6. Rebuild si es necesario
cd /opt/nae-expertos/web-app
npm run build
pm2 restart web-app
```

### 11.3 Error 502 Bad Gateway en HAProxy

```bash
# 1. Verificar que los backends están UP
echo "show stat" | sudo socat stdio /run/haproxy/admin.sock | grep -E "be_api|be_frontend" | cut -d',' -f1,2,18

# 2. Verificar conectividad desde HAProxy al App Server
nc -zv 10.0.0.50 3000
nc -zv 10.0.0.50 3001

# 3. Verificar firewall en App Server
sudo ufw status

# 4. Ver logs de HAProxy
sudo tail -50 /var/log/haproxy.log

# 5. Recargar HAProxy
sudo systemctl reload haproxy
```

### 11.4 Error de conexión a PostgreSQL

```bash
# 1. Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# 2. Verificar que escucha en localhost
ss -tlnp | grep 5432

# 3. Probar conexión
sudo -i -u postgres psql -d db_expertos_nae -U app_expertos -W

# 4. Verificar pg_hba.conf
sudo cat /etc/postgresql/16/main/pg_hba.conf | grep app_expertos

# 5. Verificar contraseña en .env
grep DATABASE_URL /opt/nae-expertos/api-backend/.env

# 6. Reiniciar PostgreSQL si es necesario
sudo systemctl restart postgresql
```

### 11.5 Certificado SSL expirado

```bash
# Verificar fecha de expiración
echo | openssl s_client -connect expertos-nae.mes.gob.cu:443 2>/dev/null | openssl x509 -noout -enddate

# Renovar con Certbot (en servidor HAProxy)
sudo certbot renew --force-renewal

# Regenerar PEM para HAProxy
sudo bash -c 'cat /etc/letsencrypt/live/expertos-nae.mes.gob.cu/fullchain.pem \
  /etc/letsencrypt/live/expertos-nae.mes.gob.cu/privkey.pem \
  > /etc/haproxy/certs/expertos-nae.mes.gob.cu.pem'

sudo chmod 600 /etc/haproxy/certs/expertos-nae.mes.gob.cu.pem
sudo systemctl reload haproxy
```

### 11.6 PM2 no arranca al boot

```bash
# Re-configurar startup
pm2 unstartup
pm2 startup
# Ejecutar el comando sudo que se muestra

# Asegurar que la lista está guardada
pm2 save

# Verificar
sudo systemctl status pm2-$USER
```

---

## Apéndice A: Resumen de Puertos

| Puerto | Servicio          | Dirección de escucha  | Accesible desde        |
|--------|-------------------|-----------------------|------------------------|
| 80     | HAProxy (HTTP)    | 0.0.0.0 (HAProxy)     | Público (redirige)     |
| 443    | HAProxy (HTTPS)   | 0.0.0.0 (HAProxy)     | Público                |
| 8404   | HAProxy Stats     | 0.0.0.0 (HAProxy)     | Red interna            |
| 3000   | Next.js Frontend  | 127.0.0.1 (App Server)| Solo HAProxy           |
| 3001   | Express API       | 127.0.0.1 (App Server)| Solo HAProxy           |
| 5432   | PostgreSQL        | 127.0.0.1 (App Server)| Solo local             |
| 22     | SSH               | 0.0.0.0               | Admin                  |

---

## Apéndice B: Referencias

- [Documentación oficial de HAProxy](https://www.haproxy.org/download/2.8/doc/)
- [Documentación de Next.js Deployment](https://nextjs.org/docs/deployment)
- [Documentación de PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de PostgreSQL 16](https://www.postgresql.org/docs/16/)
- [Certbot / Let's Encrypt](https://certbot.eff.org/)
- [Node.js LTS Schedule](https://nodejs.org/en/about/releases/)

---

## Apéndice C: Contactos y Escalamiento

| Rol                  | Contacto           | Responsable           |
|----------------------|--------------------|-----------------------|
| Infraestructura      | admin@mes.gob.cu   | Equipo de sistemas    |
| Desarrollo           | denysbuedo@github  | Equipo de desarrollo  |
| Base de datos        | dba@mes.gob.cu     | DBA                   |

---

> **Documento creado:** Abril 2026  
> **Última revisión:** Abril 2026  
> **Próxima revisión:** Tras primer despliegue en producción
