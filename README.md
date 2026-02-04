# Refs App Vibe – Árbitros de baloncesto

Aplicación web para árbitros de baloncesto: partidos, designaciones, liquidaciones y perfil.

## Características

- **Autenticación**: login con credenciales o API externa (NextAuth v5).
- **Inicio**: designaciones descargadas/pendientes (si hay), próximo partido con cuenta atrás, logos de equipos y enlace a liquidaciones.
- **Partidos**: listado de partidos de la semana con escudos, categoría y compañero de arbitraje; detalle de partido (equipos, pabellón, designaciones, clasificación, resultado si existe).
- **Designaciones**: páginas de designaciones descargadas (con descarga de PDF) y pendientes (con aceptar).
- **Liquidaciones**: listado de liquidaciones y histórico de pagos.
- **Perfil**: datos del árbitro.
- **Splash screen** con logo al cargar la app.
- **Diseño responsive** con sidebar en escritorio y navegación inferior en móvil.

## Stack

- **Next.js 16** (App Router), **TypeScript**, **Tailwind CSS**
- **NextAuth v5** (Credentials + JWT, opcional API externa)
- **shadcn/ui** (Radix, Tailwind)
- **Lucide React** (iconos)

## Requisitos

- Node.js 18+
- npm (o pnpm/yarn)

## Instalación y ejecución

1. Clonar el repositorio:

```bash
git clone https://github.com/manurgz10/refs-app-vibe.git
cd refs-app-vibe
```

2. Instalar dependencias:

```bash
npm install
```

3. Configurar variables de entorno:

```bash
cp .env.local.example .env.local
```

Edita `.env.local` y rellena al menos:

| Variable | Descripción |
|----------|-------------|
| `AUTH_SECRET` | Secreto para NextAuth (ej: `openssl rand -base64 32`) |
| `CREDENTIALS_EMAIL` / `CREDENTIALS_PASSWORD` | Login de desarrollo si no usas API externa |
| `EXTERNAL_API_URL` | Base URL de la API de federación (si usas API real) |
| `EXTERNAL_API_LOGIN_URL` | URL de login de la API externa |
| `FEDERATION_HEADER` | Header Federation |
| `PUBLIC_TOKEN_FBIB` | Token para ficha de partido; ver detalle de partido |

Con `USE_MOCK_API=true` la app funciona con datos de prueba sin API externa.

4. Arrancar en desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Serás redirigido a `/login`.

5. Build para producción:

```bash
npm run build
npm start
```

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/login/          # Página de login
│   ├── (dashboard)/          # Rutas tras login
│   │   ├── page.tsx          # Inicio
│   │   ├── partidos/         # Listado y detalle /partidos/[id]
│   │   ├── designaciones-descargadas/
│   │   ├── designaciones-pendientes/
│   │   ├── liquidaciones/
│   │   └── perfil/
│   ├── api/                  # Rutas API (auth, partidos, designations, etc.)
│   └── layout.tsx
├── components/              # UI y componentes (sidebar, splash, designation-row, etc.)
└── lib/                      # auth, api-client, types, services (partidos, match-detail, etc.)
```

## Variables de entorno

Ver [.env.local.example](.env.local.example) para la lista completa y comentarios.

## Licencia

Proyecto privado.
