const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function runMigration() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log('✅ Conectado a la base de datos');

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'create_workout_components_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Ejecutar el SQL
    console.log('📝 Ejecutando migración...');
    await connection.query(sql);

    console.log('✅ Tabla workout_components creada exitosamente!');

    // Verificar que la tabla se creó
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'workout_components'"
    );

    if (tables.length > 0) {
      console.log('✅ Verificación: La tabla existe en la base de datos');
      
      // Mostrar estructura de la tabla
      const [columns] = await connection.query(
        "DESCRIBE workout_components"
      );
      console.log('\n📋 Estructura de la tabla:');
      console.table(columns);
    } else {
      console.log('⚠️  Advertencia: No se pudo verificar la creación de la tabla');
    }

  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
    
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  La tabla ya existe. Esto está bien si quieres mantener los datos existentes.');
    } else {
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

