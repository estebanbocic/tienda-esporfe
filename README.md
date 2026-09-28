# Es Por Fé

Ecommerce chileno de Biblias y productos cristianos con propósito. El proyecto usa Medusa para comercio y administración, y Astro para una tienda rápida enfocada en conversión.

## Estructura

```text
apps/
├── backend/                 # Workspace generado por Medusa
│   └── apps/backend/        # Aplicación Medusa
└── storefront/              # Tienda Astro
project-context.md           # Alcance, decisiones, fases y pendientes
```

## Requisitos

- Node.js 22.12 o superior
- npm 11 o superior
- PostgreSQL 15 o superior para ejecutar Medusa

## Desarrollo

```bash
# Iniciar PostgreSQL
npm run db:up

# Terminal 1: backend y panel admin
npm run dev:backend

# Terminal 2: storefront
npm run dev:storefront
```

El storefront se sirve inicialmente en `http://localhost:4321`. Medusa usa `http://localhost:9000` y su panel se encuentra en `/app`.

Antes de arrancar el backend, copia `apps/backend/apps/backend/.env.template` como `.env`. La plantilla ya apunta al PostgreSQL local de Docker. Nunca agregues credenciales reales al repositorio.

## Comprobaciones

```bash
npm run build:storefront
npm run lint:backend
```

Consulta [project-context.md](./project-context.md) antes de implementar una fase nueva.
