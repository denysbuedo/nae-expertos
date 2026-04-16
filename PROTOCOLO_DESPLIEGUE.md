# Protocolo de Despliegue - Sistema de Gestión de Expertos NAE

Este documento describe el protocolo de despliegue para los entornos de Producción/Staging del Sistema de Gestión de Expertos NAE. El proyecto consta de un backend en Node.js (Express) con base de datos PostgreSQL, ORM Prisma y un frontend en Next.js.

## 🛠 Entorno Recomendado

Para un despliegue tradicional en un VPS (Virtual Private Server) como Ubuntu 22.04 LTS o superior, se recomiendan las siguientes herramientas:

- **Node.js** (v20+ LTS)
- **PostgreSQL** (v15+)
- **Nginx** (como Proxy Inverso)
- **PM2** (Gestor de procesos para mantener Node.js y Next.js en ejecución)
- **Git**

*(Alternativamente, se puede utilizar Docker y Docker Compose para empaquetar y aislar ambas dependencias)*.

---

## 📦 Fase 1: Preparación del Entorno

### 1.1 Actualización del Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Instalación de Dependencias Principales
```bash
# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Nginx y Git
sudo apt install -y nginx git

# Instalar PM2 globalmente
sudo npm install -g pm2
```

### 1.3 Instalación y Configuración de Base de Datos PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib

# Iniciar sesión como usuario postgres
sudo -i -u postgres

# Crear base de datos y usuario de producción
psql
CREATE DATABASE nae_experts_prod;
CREATE USER nae_user WITH PASSWORD 'tu_contraseña_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE nae_experts_prod TO nae_user;
\q
exit
```

---

## 🚀 Fase 2: Despliegue del Backend (API)

### 2.1 Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO> ~/expertos-nae
cd ~/expertos-nae/api-backend
```

### 2.2 Configurar Variables de Entorno
Crea o edita el archivo `.env` en la carpeta `api-backend`:
```env
DATABASE_URL="postgresql://nae_user:tu_contraseña_segura_aqui@localhost:5432/nae_experts_prod?schema=public"
PORT=3001
NODE_ENV=production
JWT_SECRET=tu_jwt_secret_secreto_largo_y_aleatorio
```

### 2.3 Instalación y Construcción
```bash
npm install

# Generar tipados de Prisma
npm run db:generate

# Migrar base de datos a su versión final
npm run db:migrate 

# (Si la API backend requiere fase de build):
# npm run build 
```

### 2.4 Iniciar API de backend con PM2
```bash
# Formato general usando npm:
pm2 start npm --name "nae-api" -- run start

# Guardar lista de procesos en PM2 para auto-arranque y futuros reinicios
pm2 save
pm2 startup
```

---

## 🌐 Fase 3: Despliegue del Frontend (Web App Next.js)

### 3.1 Configuración Web App
```bash
cd ~/expertos-nae/web-app
```

### 3.2 Variables de Entorno
Crea o edita el archivo `.env.production` (o `.env.local`) en la carpeta `web-app`:
```env
# La URL expuesta desde Nginx o proxy correspondiente para tu API
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api/v1
```

### 3.3 Construcción (Build)
```bash
npm install
npm run build
```

### 3.4 Iniciar Frontend con PM2
```bash
# Iniciar servidor nativo de next en el port por defecto 3000 o 3002 según config.
pm2 start npm --name "nae-frontend" -- run start
pm2 save
```

---

## 🛡 Fase 4: Configuración del Proxy Inverso (Nginx) y SSL

Configurar Nginx para que las peticiones externas al dominio lleguen al Frontend y a la API de backend de manera segura.

### 4.1 Configurar Nginx para el Frontend
Crear y editar archivo `/etc/nginx/sites-available/nae-frontend`:
```nginx
server {
    listen 80;
    server_name sistema.tudominio.com; # Cambiar por el dominio web

    location / {
        proxy_pass http://localhost:3002;  # O el puerto final configurado para la web-app (por defecto 3000 o 3002)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.2 Configurar Nginx para la API Backend
Crear archivo `/etc/nginx/sites-available/nae-api`:
```nginx
server {
    listen 80;
    server_name api.tudominio.com; # Cambiar por el sub-dominio api

    location / {
        proxy_pass http://localhost:3001; # Puerto de Nodejs Backend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.3 Habilitar Sitios y Reiniciar Nginx
```bash
sudo ln -s /etc/nginx/sites-available/nae-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/nae-api /etc/nginx/sites-enabled/

# Verificar sintaxis y reiniciar servicio
sudo nginx -t
sudo systemctl restart nginx
```

### 4.4 Configurar SSL / HTTPS gratuitod (Certbot/Let's Encrypt)
Es fundamental usar HTTPS en producción.
```bash
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Generar certificados y auto-configurar Nginx
sudo certbot --nginx -d sistema.tudominio.com -d api.tudominio.com
```

---

## 🔄 Fase 5: Protocolo de Actualizaciones (Despliegues Manuales)

Cuando exista una nueva versión (nuevo código implementado y mezclado en `main`), se recomienda ejecutar:

**Para actualizar Componente Backend API:**
```bash
cd ~/expertos-nae/api-backend
git pull origin main
npm install
npm run db:generate
npm run db:migrate
# npm run build # si aplica
pm2 restart nae-api
```

**Para actualizar Componente Frontend:**
```bash
cd ~/expertos-nae/web-app
git pull origin main
npm install
npm run build
pm2 restart nae-frontend
```

---

## 🏥 Monitorización de la Salud del Sistema y Operaciones

**PM2 (Process Manager):**
```bash
pm2 status    # Ver listado de procesos y su estado (en línea/caído/reiniciando)
pm2 monit     # Dashboard interactivo con uso de CPU y RAM de Node.js/Next.js
pm2 logs      # Ver logs en tiempo real para encontrar errores

# Comandos de manejo útil 
pm2 stop nae-api         # detener script
pm2 restart nae-frontend # reiniciar aplicación
```

## 🚨 Consideraciones Extra de Producción y Seguridad
1. **Firewall (UFW)**: Habilitar solo los puertos expuestos seguros (80 y 443).
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```
2. **Backups de Base de Datos DB**: Programar copias de seguridad de PostgreSQL periódicas creando un script `cron` que utilice la utilidad `pg_dump`.
3. Usar variables seguras: Mantén contraseñas y `JWT_SECRET` siempre complejas, largas y no rastreables. Jamás deben compartirse ni guardarse bajo seguimiento en repositorios públicos.
