# Sistema de Gestión de Expertos - Proyecto NAE

> **Versión:** 1.0.0
> **Fecha:** Abril 2026
> **Descripción:** Sistema web para gestionar los expertos que trabajan en el Proyecto "Apoyo a los nuevos actores económicos para una diversificación económica, innovativa y sostenible (NAE)".

## 📋 Descripción

Este sistema permite gestionar y dar seguimiento a:
- **Órdenes de Pedido**: Órdenes de trabajo principales
- **Actividades**: Actividades asociadas a cada orden
- **Subactividades**: Desglose de actividades
- **Entregables**: Resultados entregables de subactividades
- **Perfiles**: Expertos/profesionales que participan en el proyecto
- **Asignaciones**: Relación entre perfiles y subactividades

## 🏗️ Arquitectura

### Entidades y Relaciones

```
Orden de Pedido (1) ──── (N) Actividad
                           │
                           └──── (N) Subactividad
                                      │
                                      ├──── (N) Entregable
                                      │         └──── Responsable (1 Perfil)
                                      │
                                      └──── (N) Assignment (N) ──── (1) Perfil
```

### Reglas de Negocio
- Una orden de trabajo tiene 1 o muchas actividades
- Una actividad tiene 1 o muchas subactividades
- Una subactividad tiene 1 o muchos entregables
- Un perfil (persona) trabaja en 1 o varias subactividades
- En una misma subactividad pueden trabajar varias personas
- Varias personas pueden tributar a un mismo entregable
- Solo un perfil (persona) es responsable de cada entregable
- Las actividades y subactividades tienen fecha de inicio y fecha de fin

## 🚀 Stack Tecnológico

### Frontend
- **Next.js 14+** - React Framework
- **TypeScript 5+** - Type Safety
- **TailwindCSS 3+** - Styling
- **Zustand** - State Management
- **Axios** - HTTP Client

### Backend
- **Node.js 20+ LTS** - Runtime
- **Express.js** - API Framework
- **PostgreSQL 15+** - Base de Datos
- **Prisma** - ORM

## 📁 Estructura del Proyecto

```
expertos-nae/
├── api-backend/              # Backend API
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── lib/             # Utilities
│   │   └── index.ts         # Entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── .env                 # Environment variables
│
├── web-app/                 # Frontend Web App
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   ├── components/      # UI components
│   │   └── lib/             # API client
│   ├── public/              # Static assets
│   └── .env.local           # Environment variables
│
├── modelo-desarrollo-agentes/  # Development model
└── Logo_nae.png              # Project logo
```

## 🛠️ Quick Start

### Prerequisitos
- Node.js 20+ LTS
- PostgreSQL 15+
- npm o yarn

### 1. Backend API

```bash
cd api-backend

# Instalar dependencias
npm install

# Configurar base de datos
# Editar .env con tus credenciales de PostgreSQL

# Generar Prisma client
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Iniciar servidor de desarrollo
npm run dev
```

El backend estará disponible en `http://localhost:3001`

### 2. Frontend Web App

```bash
cd web-app

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3002`

## 📡 API Endpoints

### Órdenes
- `GET /api/v1/orders` - Listar órdenes
- `GET /api/v1/orders/:id` - Obtener orden
- `POST /api/v1/orders` - Crear orden
- `PUT /api/v1/orders/:id` - Actualizar orden
- `DELETE /api/v1/orders/:id` - Eliminar orden

### Actividades
- `GET /api/v1/activities` - Listar actividades
- `GET /api/v1/activities/:id` - Obtener actividad
- `POST /api/v1/activities` - Crear actividad
- `PUT /api/v1/activities/:id` - Actualizar actividad
- `DELETE /api/v1/activities/:id` - Eliminar actividad

### Subactividades
- `GET /api/v1/subactivities` - Listar subactividades
- `GET /api/v1/subactivities/:id` - Obtener subactividad
- `POST /api/v1/subactivities` - Crear subactividad
- `PUT /api/v1/subactivities/:id` - Actualizar subactividad
- `DELETE /api/v1/subactivities/:id` - Eliminar subactividad

### Entregables
- `GET /api/v1/deliverables` - Listar entregables
- `GET /api/v1/deliverables/:id` - Obtener entregable
- `POST /api/v1/deliverables` - Crear entregable
- `PUT /api/v1/deliverables/:id` - Actualizar entregable
- `DELETE /api/v1/deliverables/:id` - Eliminar entregable

### Perfiles
- `GET /api/v1/profiles` - Listar perfiles
- `GET /api/v1/profiles/:id` - Obtener perfil
- `POST /api/v1/profiles` - Crear perfil
- `PUT /api/v1/profiles/:id` - Actualizar perfil
- `DELETE /api/v1/profiles/:id` - Eliminar perfil

### Asignaciones
- `GET /api/v1/assignments` - Listar asignaciones
- `GET /api/v1/assignments/:id` - Obtener asignación
- `POST /api/v1/assignments` - Crear asignación
- `PUT /api/v1/assignments/:id` - Actualizar asignación
- `DELETE /api/v1/assignments/:id` - Eliminar asignación

## 📊 Base de Datos

### Esquema

El esquema de base de datos incluye las siguientes tablas:
- `orders` - Órdenes de pedido
- `activities` - Actividades
- `subactivities` - Subactividades
- `deliverables` - Entregables
- `profiles` - Perfiles de expertos
- `assignments` - Relación perfiles-subactividades

### Comandos de Base de Datos

```bash
cd api-backend

# Abrir Prisma Studio (GUI de administración)
npm run db:studio

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Resetear base de datos
npx prisma migrate reset
```

## 🧪 Testing

```bash
# Backend
cd api-backend
npm run test

# Frontend
cd web-app
npm run test
```

## 📝 Desarrollo

### Convenciones de Commits

```
feat(orders): add order creation endpoint
fix(activities): resolve date parsing issue
docs(readme): update installation steps
```

### Git Flow

```
main ──────────────────────────►
        ↑ merge
develop ──────────────────────►
        ↑
feature/xxx ──┘
```

## 🔐 Variables de Entorno

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/nae_experts"
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## 📄 Licencia

Privado - Uso interno del Proyecto NAE.

## 👥 Equipo

Desarrollado siguiendo el [Modelo de Desarrollo con Agentes AI](modelo-desarrollo-agentes/MODELO-DESARROLLO.md).
