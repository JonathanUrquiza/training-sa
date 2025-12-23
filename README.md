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

## Notas

- Por ahora, la aplicación usa `user_id = 1` por defecto. En el futuro se puede implementar autenticación completa.
- Las credenciales de la base de datos están en variables de entorno para mayor seguridad.

## Licencia

Este proyecto es de uso personal/educacional.

# training-sa
