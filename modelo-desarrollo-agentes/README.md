# Modelo de Desarrollo de Software con Agentes AI

> **Versión:** 1.0.0  
> **Fecha:** Abril 2026  
> **Estado:** ✅ Activo

## 📋 Descripción

Modelo formal de desarrollo de software diseñado para **equipos pequeños (3-5 personas)** que trabajan en **Web Apps, APIs/Backend y proyectos de Data/Analytics**, potenciado con agentes de Inteligencia Artificial.

## 🚀 Quick Start

```bash
# 1. Clonar este repositorio
git clone <repo-url>
cd modelo-desarrollo-agentes

# 2. Revisar la documentación principal
cat MODELO-DESARROLLO.md

# 3. Usar un template para tu proyecto
cp -r templates/web-app ../mi-nuevo-proyecto
cd ../mi-nuevo-proyecto

# 4. Instalar dependencias
npm install

# 5. Configurar variables de entorno
cp .env.example .env

# 6. Iniciar desarrollo
npm run dev
```

## 📁 Estructura del Repositorio

```
modelo-desarrollo-agentes/
├── MODELO-DESARROLLO.md    # Documento principal del modelo
├── MODELO-DESARROLLO.html  # 📖 Documentación visual completa (abrir en navegador)
├── README.md                # Este archivo
├── .env.example             # Template de variables de entorno
├── .gitignore              # Archivos ignorados por git
│
├── templates/               # 🚀 Plantillas de proyectos CON CÓDIGO REAL
│   ├── web-app/             # Next.js + TypeScript + TailwindCSS
│   ├── api-backend/         # Node.js + Express + Prisma + PostgreSQL
│   └── data-analytics/      # Python + Pandas + Matplotlib
│
├── testing/                 # 🧪 Protocolos de pruebas
├── deployment/              # 🚀 Protocolos de despliegue
└── docs/                    # 📚 Documentación adicional
```

## 📚 Documentación

### Documentación Principal
- **📄 [MODELO-DESARROLLO.md](MODELO-DESARROLLO.md)**: Documento técnico completo (Markdown)
- **📖 [MODELO-DESARROLLO.html](docs/MODELO-DESARROLLO.html)**: Documentación visual completa (abrir en navegador)

### Guías por Rol

**Para Developers:**
- Revisar templates en `templates/`
- Seguir protocolos de testing en `testing/`
- Usar agentes según matriz de responsabilidades

**Para Arquitecto:**
- Revisar arquitectura de referencia
- Configurar CI/CD con templates de `deployment/`
- Establecer reglas de escalamiento

**Para QA:**
- Implementar pirámide de testing
- Configurar coverage requirements
- Establecer procesos de review


### 1. [Roles y Agentes](MODELO-DESARROLLO.md#1-roles-y-agentes)
- Estructura del equipo (3-5 personas)
- Agentes AI especializados
- Matriz de responsabilidades

### 2. [Arquitectura de Referencia](MODELO-DESARROLLO.md#2-arquitectura-de-referencia)
- Stack de desarrollo predeterminado
- Patrones arquitectónicos (Web Apps, APIs, Data)
- Diagramas de arquitectura

### 3. [Plantillas de Proyectos](MODELO-DESARROLLO.md#3-plantillas-de-proyectos)
- **Web App (Next.js)**: Template completo con código real
- **API Backend (Node.js)**: CRUD con Prisma + PostgreSQL
- **Data Analytics (Python)**: ETL + análisis + visualización

**Uso rápido:**
```bash
# Web App
cp -r templates/web-app ../mi-proyecto && cd ../mi-proyecto && npm install

# API Backend
cp -r templates/api-backend ../mi-api && cd ../mi-api && npm install

# Data Analytics
cp -r templates/data-analytics ../mi-data && cd ../mi-data && pip install -r requirements.txt
```

### 4. [Protocolos de Pruebas](MODELO-DESARROLLO.md#4-protocolos-de-pruebas)
- Pirámide de testing
- Cobertura mínima requerida
- Workflow de testing

### 5. [Protocolos de Despliegue](MODELO-DESARROLLO.md#5-protocolos-de-despliegue)
- Environments (dev, staging, production)
- CI/CD Pipeline
- Estrategias de deploy

### 6. [Esquemas de Soporte](MODELO-DESARROLLO.md#6-esquemas-de-soporte)
- Niveles de soporte
- Monitoreo
- Runbooks

## 🤖 Agentes AI Disponibles

### 💻 Agentes de Desarrollo

| Agente | Especialidad | Modo | Ejemplo |
|--------|--------------|------|---------|
| `frontend-dev` | React, Next.js, TypeScript, Tailwind | ✅/⚠️ | "Crea dashboard UI" |
| `backend-dev` | APIs, Node.js, PostgreSQL, Auth | ✅/⚠️ | "Crea API de usuarios" |
| `data-engineer` | ETL, Pandas, Visualización | ✅/⚠️ | "Analiza ventas Q4" |
| `fullstack-dev` | Features end-to-end, MVPs | ✅/⚠️ | "Sistema de login completo" |

### 🔧 Agentes de Soporte

| Agente | Uso | Trigger |
|--------|-----|---------|
| `general-purpose` | Investigación, búsqueda | Tareas multi-paso |
| `devops-deployment-expert` | Infraestructura, CI/CD | Deployments, servidores |
| `analista-datos-encuestas` | Análisis de encuestas | Métricas, reportes |
| `Explore` | Exploración de codebase | Búsquedas rápidas |

**Modo:** ✅ Autónomo (revisión auto) | ⚠️ Asistido (supervisión humana)

## 📊 Stack Tecnológico

### Frontend
- React 18+, TypeScript 5+, Next.js 14+
- TailwindCSS, Zustand/Redux

### Backend
- Node.js 20+ LTS, Express.js/FastAPI
- PostgreSQL 15+, Redis 7+

### DevOps
- Docker, GitHub Actions
- HAProxy/Nginx, PM2

### Testing
- Jest, pytest, Playwright, Supertest

## 🔄 Workflow de Desarrollo

```
Planificación → Desarrollo → Testing → Review → Deploy → Monitoreo
```

## ✅ Definition of Done

- [ ] Código implementado
- [ ] Tests unitarios passing (>80% coverage)
- [ ] Tests de integración passing
- [ ] Code review aprobado
- [ ] Documentación actualizada
- [ ] Deploy en staging exitoso
- [ ] QA aprobado

## 📝 Convenciones

### Commits
```
feat(auth): add JWT validation
fix(api): resolve null pointer
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

## 🛠️ Comandos Útiles

```bash
# Testing
npm run test
npm run test:coverage
npm run test:e2e

# Development
npm run dev
npm run lint
npm run type-check

# Build
npm run build
npm run preview
```

## 📞 Soporte

| Nivel | Contacto | SLA |
|-------|----------|-----|
| L1 | Automated/Bot | Inmediato |
| L2 | Developer | 4 horas |
| L3 | Arquitecto | 1 hora |

## 📄 Licencia

Privado - Uso interno del equipo de desarrollo.

## 🔄 Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0.0 | Abril 2026 | Versión inicial del modelo |

---

**¿Preguntas?** Revisa [MODELO-DESARROLLO.md](MODELO-DESARROLLO.md) para la documentación completa.
