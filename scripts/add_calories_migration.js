const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno manualmente desde .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
}

async function runMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: envVars.DB_HOST || process.env.DB_HOST,
      database: envVars.DB_NAME || process.env.DB_NAME,
      user: envVars.DB_USER || process.env.DB_USER,
      password: envVars.DB_PASSWORD || process.env.DB_PASSWORD,
    });

    console.log('✅ Conectado a la base de datos');

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'add_calories_to_workouts.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Ejecutar el SQL
    console.log('📝 Agregando campo calories a la tabla workouts...');
    await connection.query(sql);

    console.log('✅ Campo calories agregado exitosamente!');

    // Verificar que el campo existe
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM workouts LIKE 'calories'"
    );

    if (columns.length > 0) {
      console.log('✅ Verificación: El campo calories existe en la tabla workouts');
    } else {
      console.log('⚠️  Advertencia: No se pudo verificar el campo calories');
    }

  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  El campo calories ya existe. Esto está bien.');
    } else {
      console.error('Detalles del error:', error);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

runMigration();

