# App de Entrenamiento

Aplicación web de seguimiento de entrenamiento construida con Next.js, React, Bootstrap y MySQL.

## Características

- 📋 **Ejercicios**: Explora más de 700 ejercicios organizados por categorías, subcategorías y niveles
- ⚡ **WODs**: Accede a más de 38 WODs incluyendo benchmarks famosos (Fran, Grace, Nasty Girls, etc.)
- 📊 **Entrenamientos**: Registra y revisa tu historial de entrenamientos
- 🏆 **Récords Personales**: Lleva un seguimiento de tus mejores marcas
- 🎯 **Objetivos**: Establece y monitorea tus metas de entrenamiento

## Tecnologías

- **Next.js 14** - Framework React con App Router
- **React 18** - Biblioteca de UI
- **Bootstrap 5** - Framework CSS
- **MySQL** - Base de datos
- **TypeScript** - Tipado estático

## Configuración

### Requisitos previos

- Node.js 18+ 
- npm o yarn
- Acceso a la base de datos MySQL

### Instalación

1. Clona el repositorio o navega al directorio del proyecto

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
DB_HOST=mysql-funkotest.alwaysdata.net
DB_NAME=funkotest_training
DB_USER=funkotest
DB_PASSWORD=rootJonas
JWT_SECRET=tu_secreto_jwt_aqui_cambiar_en_produccion
```

4. Ejecuta el servidor de desarrollo:

```bash
npm run dev
```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## Estructura del Proyecto

```
entrenamiento-app/
├── app/
│   ├── api/              # Rutas API
│   │   ├── ejercicios/
│   │   ├── wods/
│   │   ├── entrenamientos/
│   │   ├── records/
│   │   └── objetivos/
│   ├── ejercicios/        # Página de ejercicios
│   ├── wods/             # Páginas de WODs
│   ├── entrenamientos/   # Página de entrenamientos
│   ├── records/          # Página de récords
│   ├── objetivos/        # Página de objetivos
│   ├── layout.tsx        # Layout principal
│   ├── page.tsx          # Página de inicio
│   └── globals.css       # Estilos globales
├── components/
│   ├── Navbar.tsx        # Componente de navegación
│   └── BootstrapClient.tsx
├── lib/
│   └── db.ts            # Configuración de base de datos
└── package.json
```

## Base de Datos

La aplicación se conecta a una base de datos MySQL con las siguientes tablas principales:

- `exercise_categories` - Categorías de ejercicios
- `exercise_subcategories` - Subcategorías
- `exercises` - Ejercicios (700+)
- `wods` - WODs (38+)
- `users` - Usuarios
- `workouts` - Entrenamientos realizados
- `records` - Récords personales
- `goals` - Objetivos

## Uso

### Ejercicios
- Navega a `/ejercicios` para ver todos los ejercicios disponibles
- Filtra por categoría, subcategoría, nivel o busca por nombre

### WODs
- Visita `/wods` para ver todos los WODs disponibles
- Haz clic en "Ver Detalles" para ver la información completa de un WOD

### Entrenamientos
- Ve a `/entrenamientos` para ver tu historial
- Haz clic en "Nuevo Entrenamiento" para registrar uno nuevo

### Récords
- Accede a `/records` para ver tus récords personales
- Registra nuevos récords marcándolos como PR (Personal Record)

### Objetivos
- Visita `/objetivos` para gestionar tus metas
- Crea nuevos objetivos y monitorea tu progreso

## Desarrollo

### Scripts disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm run migrate` - Ejecuta migraciones de base de datos

## Deployment en Vercel

### Requisitos previos

1. Cuenta en [Vercel](https://vercel.com)
2. Repositorio Git (GitHub, GitLab o Bitbucket)
3. Base de datos MySQL accesible desde internet

### Pasos para deployment

1. **Preparar el repositorio**
   - Asegúrate de que todos los cambios estén commiteados
   - Push al repositorio remoto

2. **Conectar con Vercel**
   - Ve a [vercel.com](https://vercel.com) e inicia sesión
   - Haz clic en "Add New Project"
   - Importa tu repositorio de Git

3. **Configurar variables de entorno**
   En la configuración del proyecto en Vercel, agrega las siguientes variables de entorno:
   
   ```
   DB_HOST=mysql-funkotest.alwaysdata.net
   DB_NAME=funkotest_training
   DB_USER=funkotest
   DB_PASSWORD=rootJonas
   ```
   
   Para agregar variables:
   - Ve a **Project Settings** > **Environment Variables**
   - Agrega cada variable para los ambientes: Production, Preview y Development
   - Guarda los cambios

4. **Configurar Build Settings**
   Vercel detectará automáticamente que es un proyecto Next.js. Asegúrate de que:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (automático)
   - **Output Directory**: `.next` (automático)
   - **Install Command**: `npm install` (automático)

5. **Deploy**
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará tu aplicación automáticamente
   - Una vez completado, recibirás una URL (ej: `tu-app.vercel.app`)

### Configuración adicional

- **Regiones**: Puedes configurar la región de deployment en `vercel.json` si es necesario
- **Dominio personalizado**: Puedes agregar un dominio personalizado en Project Settings > Domains
- **Variables de entorno por ambiente**: Puedes tener diferentes valores para Production, Preview y Development

### Notas importantes

- ⚠️ **Base de datos**: Asegúrate de que tu base de datos MySQL permita conexiones desde las IPs de Vercel
- ⚠️ **Variables de entorno**: Nunca commitees archivos `.env.local` o `.env` con credenciales reales
- ⚠️ **Migraciones**: Las migraciones de base de datos deben ejecutarse manualmente antes del primer deployment
- ⚠️ **Conexiones**: El pool de conexiones está configurado para ser conservador (1 conexión) para evitar límites del servidor

### Troubleshooting

Si tienes problemas con el deployment:

1. **Error de build**: Revisa los logs en Vercel Dashboard > Deployments
2. **Error de conexión a BD**: Verifica que las variables de entorno estén correctamente configuradas
3. **Error de variables**: Asegúrate de que todas las variables estén en todos los ambientes (Production, Preview, Development)

## Notas

- Por ahora, la aplicación usa `user_id = 1` por defecto. En el futuro se puede implementar autenticación completa.
- Las credenciales de la base de datos están en variables de entorno para mayor seguridad.
- El proyecto está optimizado para funcionar en Vercel con configuración mínima.

## Licencia

Este proyecto es de uso personal/educacional.
