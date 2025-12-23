# Guía de Deployment en Vercel

Esta guía te ayudará a desplegar la aplicación de entrenamiento en Vercel.

## Prerrequisitos

- ✅ Cuenta en [Vercel](https://vercel.com) (gratuita)
- ✅ Repositorio Git (GitHub, GitLab o Bitbucket)
- ✅ Base de datos MySQL accesible desde internet
- ✅ Node.js 18+ instalado localmente (para desarrollo)

## Paso 1: Preparar el Repositorio

1. Asegúrate de que todos los cambios estén commiteados:
```bash
git add .
git commit -m "Preparar para deployment"
git push
```

2. Verifica que el `.gitignore` incluya:
   - `.env.local`
   - `.env`
   - `node_modules`
   - `.next`

## Paso 2: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en **"Add New Project"** o **"Import Project"**
3. Conecta tu repositorio de Git (GitHub, GitLab o Bitbucket)
4. Selecciona el repositorio `entrenamiento-app`

## Paso 3: Configurar el Proyecto

Vercel detectará automáticamente que es un proyecto Next.js. Verifica:

- **Framework Preset**: Next.js ✅
- **Root Directory**: `./` (raíz del proyecto)
- **Build Command**: `npm run build` (automático)
- **Output Directory**: `.next` (automático)
- **Install Command**: `npm install` (automático)

## Paso 4: Configurar Variables de Entorno

**IMPORTANTE**: Debes configurar estas variables antes del primer deployment.

1. En la página de configuración del proyecto, ve a **Environment Variables**
2. Agrega las siguientes variables para **todos los ambientes** (Production, Preview, Development):

```
DB_HOST=mysql-funkotest.alwaysdata.net
DB_NAME=funkotest_training
DB_USER=funkotest
DB_PASSWORD=rootJonas
```

**Cómo agregar variables:**
- Haz clic en **"Add New"**
- Ingresa el nombre de la variable (ej: `DB_HOST`)
- Ingresa el valor
- Selecciona los ambientes (Production, Preview, Development)
- Haz clic en **"Save"**
- Repite para cada variable

## Paso 5: Ejecutar Migraciones (Primera vez)

Antes del primer deployment, ejecuta las migraciones de base de datos:

1. Ejecuta localmente:
```bash
npm run migrate
npm run migrate:calories
```

O ejecuta los scripts SQL directamente en tu base de datos:
- `scripts/create_workout_components_table.sql`
- `scripts/add_calories_to_workouts.sql`

## Paso 6: Deploy

1. Haz clic en **"Deploy"**
2. Vercel comenzará a construir tu aplicación
3. Puedes ver el progreso en tiempo real
4. Una vez completado, recibirás una URL como: `tu-app.vercel.app`

## Paso 7: Verificar el Deployment

1. Visita la URL proporcionada por Vercel
2. Verifica que la aplicación carga correctamente
3. Prueba las funcionalidades principales:
   - Navegación
   - Generar entrenamiento
   - Ver entrenamientos
   - Dashboard

## Configuración Adicional

### Dominio Personalizado

1. Ve a **Project Settings** > **Domains**
2. Agrega tu dominio personalizado
3. Sigue las instrucciones para configurar DNS

### Variables de Entorno por Ambiente

Puedes tener diferentes valores para cada ambiente:
- **Production**: Valores de producción
- **Preview**: Valores de staging/testing
- **Development**: Valores de desarrollo local

### Regiones

Por defecto, Vercel despliega en múltiples regiones. Si necesitas una región específica, edita `vercel.json`:

```json
{
  "regions": ["iad1"]
}
```

## Troubleshooting

### Error: "Cannot connect to database"

**Solución:**
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que la base de datos permita conexiones desde las IPs de Vercel
- Verifica que las credenciales sean correctas

### Error: "Build failed"

**Solución:**
- Revisa los logs en Vercel Dashboard > Deployments
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que no haya errores de TypeScript

### Error: "Module not found"

**Solución:**
- Verifica que todas las importaciones usen rutas relativas o alias `@/`
- Asegúrate de que `tsconfig.json` tenga la configuración correcta de paths

### La aplicación funciona localmente pero no en Vercel

**Solución:**
- Verifica que las variables de entorno estén configuradas en Vercel
- Revisa los logs del servidor en Vercel Dashboard
- Asegúrate de que la base de datos sea accesible desde internet

## Actualizaciones Futuras

Cada vez que hagas push a la rama principal:
- Vercel detectará los cambios automáticamente
- Creará un nuevo deployment
- Si el build es exitoso, actualizará la URL de producción

Para preview deployments:
- Cada pull request crea un deployment de preview
- Útil para probar cambios antes de mergear

## Recursos

- [Documentación de Vercel](https://vercel.com/docs)
- [Next.js en Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Variables de Entorno en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

## Notas Importantes

⚠️ **Seguridad:**
- Nunca commitees archivos `.env.local` o `.env` con credenciales reales
- Usa variables de entorno de Vercel para todas las credenciales
- Considera usar Vercel Secrets para información sensible

⚠️ **Base de Datos:**
- Asegúrate de que tu proveedor de MySQL permita conexiones desde Vercel
- El pool de conexiones está configurado para ser conservador (1 conexión)
- Considera usar un servicio de base de datos optimizado para serverless (como PlanetScale o Vercel Postgres)

⚠️ **Rendimiento:**
- Vercel usa Edge Functions para rutas API cuando es posible
- Las conexiones a base de datos pueden tener latencia adicional
- Considera implementar caché para queries frecuentes

