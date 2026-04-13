# Plantillas de Proyectos

> Este directorio contiene templates reutilizables para不同类型的 proyectos.

## Templates Disponibles

### 1. Web App (Next.js + TypeScript)
- **Uso:** Aplicaciones web full-stack
- **Stack:** Next.js, React, TypeScript, TailwindCSS, Zustand
- **Comando:** `npx create-next-app --example [template-name]`

### 2. API Backend (Node.js + Express)
- **Uso:** APIs RESTful, microservicios
- **Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Comando:** `npm init @backend-api`

### 3. Data Analytics (Python)
- **Uso:** Análisis de datos, ETL pipelines, reportes
- **Stack:** Python, Pandas, SQLAlchemy, Jupyter
- **Comando:** `cookiecutter [template-url]`

## Cómo Usar

1. Copia el template del directorio `templates/`
2. Renombra el proyecto
3. Ejecuta `npm install` o `pip install -r requirements.txt`
4. Configura `.env` desde `.env.example`
5. Inicia desarrollo
