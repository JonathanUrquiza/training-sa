import mysql from 'mysql2/promise';

// Validar que las variables de entorno estén configuradas
if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error('Error: Faltan variables de entorno para la base de datos.');
  console.error('Asegúrate de tener un archivo .env.local con las siguientes variables:');
  console.error('DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
}

// Pool con configuración muy conservadora para servidores con límites estrictos
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 1, // Solo 1 conexión para evitar exceder límites del servidor
  queueLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Función helper para ejecutar queries con retry
export async function executeWithRetry<T>(
  query: string,
  params: any[] = [],
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const [result] = await pool.execute(query, params);
      return result as T;
    } catch (error: any) {
      // Si es error de demasiadas conexiones y no es el último intento, esperar y reintentar
      if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS' && i < retries - 1) {
        console.warn(`Intento ${i + 1} fallido por demasiadas conexiones. Reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Backoff exponencial
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export default pool;

