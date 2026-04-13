# Guía de Instalación - Sistema de Gestión de Expertos NAE

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalados los siguientes requisitos:

- **Node.js** 20+ LTS (versión recomendada: 20.x o superior)
- **npm** 9+ (viene con Node.js)
- **PostgreSQL** 15+ 
- **Git** (opcional, para control de versiones)

## Paso 1: Base de Datos

### 1.1 Crear Base de Datos PostgreSQL

```sql
-- Conectarse a PostgreSQL como superusuario
psql -U postgres

-- Crear la base de datos
CREATE DATABASE nae_experts;

-- (Opcional) Crear usuario dedicado
CREATE USER nae_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nae_experts TO nae_user;
```

### 1.2 Configurar Variables de Entorno del Backend

Editar el archivo `api-backend/.env`:

```env
DATABASE_URL="postgresql://nae_user:your_secure_password@localhost:5432/nae_experts?schema=public"
PORT=3001
NODE_ENV=development
JWT_SECRET=change-this-to-a-secure-random-string-in-production
```

**Nota:** Si estás usando el usuario postgres por defecto:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nae_experts?schema=public"
```

## Paso 2: Backend API

### 2.1 Instalar Dependencias

```bash
cd api-backend

# Instalar todas las dependencias
npm install
```

**Solución de problemas:**
- Si la instalación falla, intenta: `npm install --legacy-peer-deps`
- Para problemas de caché: `npm cache clean --force && npm install`

### 2.2 Configurar Base de Datos con Prisma

```bash
# Generar el cliente Prisma
npm run db:generate

# Ejecutar migraciones (creará las tablas)
npm run db:migrate

# (Opcional) Abrir Prisma Studio para ver/administrar datos
npm run db:studio
```

Esto creará automáticamente las siguientes tablas:
- `orders` - Órdenes de pedido
- `activities` - Actividades
- `subactivities` - Subactividades
- `deliverables` - Entregables
- `profiles` - Perfiles de expertos
- `assignments` - Asignaciones perfil-subactividad

### 2.3 Iniciar el Servidor Backend

```bash
# Modo desarrollo (con auto-reload)
npm run dev
```

El servidor estará disponible en: `http://localhost:3001`

**Verificar que funciona:**
Abre en tu navegador: `http://localhost:3001/health`

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2026-04-10T..."
}
```

## Paso 3: Frontend Web App

### 3.1 Instalar Dependencias

```bash
cd web-app

# Instalar todas las dependencias
npm install
```

### 3.2 Configurar Variables de Entorno

El archivo `.env.local` ya está configurado con:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Si cambiaste el puerto del backend, actualiza esta URL.

### 3.2 Iniciar la Aplicación Frontend

```bash
# Modo desarrollo (con hot-reload)
npm run dev
```

La aplicación estará disponible en: `http://localhost:3002`

## Paso 4: Verificar la Instalación

### 4.1 Probar la API

```bash
# Obtener lista de endpoints
curl http://localhost:3001/api/v1

# Crear una orden de prueba
curl -X POST http://localhost:3001/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "number": "OP-001",
    "title": "Orden de Prueba",
    "description": "Esto es una prueba",
    "status": "ACTIVE",
    "startDate": "2026-04-10"
  }'
```

### 4.2 Probar el Frontend

1. Abre tu navegador en `http://localhost:3002`
2. Deberías ver el Dashboard con el logo del Proyecto NAE
3. Navega a las diferentes secciones:
   - Órdenes
   - Actividades
   - Subactividades
   - Entregables
   - Perfiles

## Comandos Útiles

### Backend

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm start

# Ver/Editar base de datos
npm run db:studio

# Crear nueva migración
npx prisma migrate dev --name nombre_de_la_migracion

# Resetear base de datos (¡CUIDADO! Borra todos los datos)
npx prisma migrate reset
```

### Frontend

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar build de producción
npm run start

# Linting
npm run lint

# Type checking
npm run type-check
```

## Estructura de URLs del Backend

| Recurso | Endpoint |
|---------|----------|
| Órdenes | `GET/POST /api/v1/orders` |
| Órdenes (detalle) | `GET/PUT/DELETE /api/v1/orders/:id` |
| Actividades | `GET/POST /api/v1/activities` |
| Subactividades | `GET/POST /api/v1/subactivities` |
| Entregables | `GET/POST /api/v1/deliverables` |
| Perfiles | `GET/POST /api/v1/profiles` |
| Asignaciones | `GET/POST /api/v1/assignments` |

## Solución de Problemas

### Error: "Cannot find module '@prisma/client'"

```bash
cd api-backend
npm run db:generate
```

### Error: "Database connection failed"

1. Verifica que PostgreSQL esté corriendo
2. Verifica las credenciales en `api-backend/.env`
3. Prueba la conexión:
   ```bash
   psql -U postgres -d nae_experts
   ```

### Error: "Port already in use"

Cambia el puerto en el archivo `.env` del backend:
```env
PORT=3002
```

Y actualiza el frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
```

### Error: "Module not found" en frontend

```bash
cd web-app
rm -rf node_modules package-lock.json
npm install
```

### Error: Prisma migrate falla

```bash
cd api-backend
# Resetear completamente
npx prisma migrate reset --force
# Regenerar cliente
npm run db:generate
# Aplicar migraciones
npm run db:migrate
```

## Próximos Pasos

1. **Crear datos de prueba**: Usa Prisma Studio (`npm run db:studio`) para crear registros manualmente

2. **Personalizar el sistema**:
   - Actualiza colores en `web-app/tailwind.config.js`
   - Modifica el layout en `web-app/src/app/layout.tsx`
   - Añade más campos al esquema en `api-backend/prisma/schema.prisma`

3. **Deploy**: Revisa la documentación de despliegue en `modelo-desarrollo-agentes/deployment/`

## Soporte

Si encuentras problemas no documentados aquí:
1. Revisa los logs de la consola
2. Verifica que todos los prerequisitos estén cumplidos
3. Consulta la documentación en `MODELO-DESARROLLO.md`

---

**¡Listo!** Tu sistema de gestión de expertos debería estar funcionando correctamente.
