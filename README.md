# HotelWatch — Sistema de Monitoreo de Telefonía IP

Sistema web para monitorear la conectividad de los teléfonos IP del Hotel Dreams
Aventuras Riviera Maya mediante ping ICMP.

## Requisitos previos

Antes de trabajar en el proyecto, cada máquina debe tener instalado:

- **Node.js** (versión LTS) — https://nodejs.org
- **PostgreSQL** (versión 14 o superior) — https://www.postgresql.org/download
- **Git** — https://git-scm.com

Verificar que están instalados:

    node --version
    npm --version
    psql --version
    git --version

## Estructura del proyecto

    MONITOREO_TELEFONIA_IP/
    ├── backend/     API REST + servicio de monitoreo (Node.js + Express + TypeScript)
    └── frontend/    Interfaz de usuario (React) — pendiente

## Puesta en marcha del backend

Estos pasos se siguen al clonar el repositorio en una máquina nueva.

### 1. Clonar el repositorio

    git clone <URL_DEL_REPOSITORIO>
    cd MONITOREO_TELEFONIA_IP/backend

### 2. Instalar las dependencias

Un solo comando instala todo lo que el proyecto necesita (lo lee del package.json):

    npm install
    -npm run migrate up

Esto descarga las siguientes librerías:

**Producción (el sistema las usa para funcionar):**
- express — servidor web y API REST
- pg — conexión con PostgreSQL
- bcrypt — cifrado de contraseñas
- jsonwebtoken — autenticación por token (JWT)
- zod — validación de datos de entrada
- dotenv — lectura de variables de entorno

**Desarrollo (solo se usan al programar):**
- typescript — el lenguaje
- ts-node-dev — ejecuta el código y reinicia al guardar cambios
- @types/node, @types/express, @types/pg, @types/bcrypt, @types/jsonwebtoken — tipos de TypeScript

### 3. Crear la base de datos

Cada máquina tiene su propia base de datos local. Crearla una sola vez:

    psql -U postgres -c "CREATE DATABASE hotelwatch;"

### 4. Configurar las variables de entorno

Crear un archivo `.env` dentro de `backend/` (copiando el ejemplo) y ajustar los
datos reales de PostgreSQL:

    DATABASE_URL=postgres://postgres:TU_CONTRASEÑA@localhost:5432/hotelwatch
    PORT=4000
    NODE_ENV=development

> El archivo `.env` NO se sube al repositorio (contiene datos sensibles). Cada
> máquina tiene el suyo.

### 5. Arrancar el servidor

    npm run dev

Si todo está bien, se verá:

    HotelWatch backend en http://localhost:4000 (development)

Verificar en el navegador: http://localhost:4000/health → { "estado": "ok" }

## Comandos disponibles

    npm run dev      Arranca el servidor en modo desarrollo (recarga automática)
    npm run build    Compila el TypeScript a JavaScript (carpeta dist/)
    npm start        Ejecuta la versión compilada

## Notas para trabajo en varias máquinas

- El **código** se sincroniza vía Git/GitHub.
- La **base de datos** es local e independiente en cada máquina.
- La **estructura de las tablas** se recrea con las migraciones (se documentará
  cuando se implementen).
- Los **datos de prueba** son locales y no se sincronizan.