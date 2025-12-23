import db from './db';

/**
 * Asegura que un usuario exista en la base de datos
 * Si no existe, lo crea con valores por defecto
 */
// Cache para evitar múltiples verificaciones del mismo usuario
const userCache = new Set<number>();

export async function ensureUserExists(userId: number = 1): Promise<number> {
  try {
    // Si ya verificamos este usuario recientemente, no hacer otra consulta
    if (userCache.has(userId)) {
      return userId;
    }

    // Verificar si el usuario existe
    const [users] = await db.execute(
      'SELECT id FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    const userRows = users as any[];

    if (userRows.length === 0) {
      // Crear usuario por defecto si no existe
      const [result] = await db.execute(
        `INSERT INTO users (id, email, password, name, current_level, workouts_completed) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          `usuario${userId}@entrenamiento.app`,
          'default_password', // En producción esto debería ser un hash
          `Usuario ${userId}`,
          'Intermedio',
          0
        ]
      );

      const insertedId = (result as any).insertId || userId;
      userCache.add(insertedId);
      return insertedId;
    }

    // Agregar al cache
    userCache.add(userId);
    return userId;
  } catch (error: any) {
    // Si el error es por demasiadas conexiones, intentar sin cache
    if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      console.warn('Demasiadas conexiones, limpiando cache de usuarios');
      userCache.clear();
      throw error;
    }
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}

