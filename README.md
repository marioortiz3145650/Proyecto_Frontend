# Laying Hens - Frontend

Este proyecto es el frontend Angular para el sistema de gestión de gallinas ponedoras.

## Estructura

- `src/app/` - Aplicación principal Angular (standalone)
- `src/app/components/` - Componentes de UI
- `src/app/services/` - Servicios Angular (HTTP)
- `src/environments/` - Configuración por entorno

## Servicios Configurados

- `UsersService` - Consume API de usuarios desde el backend NestJS
- Endpoint base: `/api/users` (proxy a `http://localhost:3000/users`)

## Backend

El backend NestJS debe estar corriendo en `http://localhost:3000` con CORS habilitado para `http://localhost:4200`.

## Scripts

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (con proxy configurado)
npm start

# Build de producción
npm run build
```

## Conexión Backend-Frontend

El proxy configuration (`proxy.conf.json`) redirige las peticiones a `/api/*` hacia el backend en `http://localhost:3000`.

El servicio `UsersService` usa `environment.apiUrl` para construir la URL base.

## Componentes

- `Dashboard` - Página principal
- `Usuarios` - CRUD de usuarios con activar/desactivar
