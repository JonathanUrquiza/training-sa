import { NextRequest, NextResponse } from 'next/server';
import db, { executeWithRetry } from '@/lib/db';
import { ensureUserExists } from '@/lib/userHelper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = parseInt(searchParams.get('user_id') || '1');

    // Obtener entrenamientos
    const [rows] = await db.execute(
      `SELECT * FROM workouts 
       WHERE user_id = ? 
       ORDER BY date DESC 
       LIMIT 50`,
      [userId]
    );

    // Obtener componentes de cada entrenamiento
    const workouts = await Promise.all((rows as any[]).map(async (workout) => {
      const [components] = await db.execute(
        `SELECT wc.*, w.nombre as wod_nombre, w.tipo as wod_tipo
         FROM workout_components wc
         LEFT JOIN wods w ON wc.wod_id = w.id
         WHERE wc.workout_id = ?
         ORDER BY wc.\`order\` ASC, wc.id ASC`,
        [workout.id]
      );

      // Parsear componentes y extraer detalles del WOD si existen
      const parsedComponents = (components as any[]).map((comp: any) => {
        const parsed = { ...comp };
        
        // Intentar parsear notes como JSON para obtener wod_details
        if (comp.notes) {
          try {
            const notesParsed = JSON.parse(comp.notes);
            if (notesParsed.wod_details) {
              parsed.wod_details = notesParsed.wod_details;
              parsed.notes = notesParsed.custom_notes || null;
            }
          } catch (e) {
            // Si no es JSON, mantener notes como está
          }
        }
        
        return parsed;
      });

      return {
        ...workout,
        exercises: workout.exercises ? JSON.parse(workout.exercises) : [],
        components: parsedComponents
      };
    }));

    return NextResponse.json(workouts);
  } catch (error: any) {
    console.error('Error fetching entrenamientos:', error);
    
    // Si el error es por usuario no existente o tabla no existe, retornar array vacío
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { error: 'Error al obtener entrenamientos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.user_id || 1;

    // Asegurar que el usuario exista antes de crear el entrenamiento
    await ensureUserExists(userId);

    // Calcular duración total si hay componentes
    let totalDuration = body.duration || null;
    if (body.components && body.components.length > 0) {
      const totalSeconds = body.components.reduce((sum: number, comp: any) => {
        return sum + (comp.duration || 0);
      }, 0);
      totalDuration = totalSeconds > 0 ? totalSeconds : null;
    }

    // Crear el entrenamiento
    const result = await executeWithRetry<any>(
      `INSERT INTO workouts 
       (user_id, date, level, duration, exercises, completed, notes, calories) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        body.date || new Date(),
        body.level || 'Intermedio',
        totalDuration,
        JSON.stringify(body.exercises || []),
        body.completed ? 1 : 0,
        body.notes || null,
        body.calories || null
      ]
    );

    const workoutId = (result as any).insertId;

    // Crear los componentes del entrenamiento
    if (body.components && Array.isArray(body.components)) {
      for (let i = 0; i < body.components.length; i++) {
        const component = body.components[i];
        
        // Si tiene wod_details, guardarlo en notes como JSON
        let notesValue = component.notes || null;
        if (component.wod_details) {
          notesValue = JSON.stringify({
            wod_details: component.wod_details,
            ...(component.notes ? { custom_notes: component.notes } : {})
          });
        }
        
        await executeWithRetry(
          `INSERT INTO workout_components 
           (workout_id, component_type, wod_id, exercise_name, duration, weight, reps, sets, distance, calories, notes, \`order\`)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            workoutId,
            component.component_type,
            component.wod_id || null,
            component.exercise_name || null,
            component.duration || null,
            component.weight || null,
            component.reps || null,
            component.sets || null,
            component.distance || null,
            component.calories || null,
            notesValue,
            component.order !== undefined ? component.order : i
          ]
        );
      }
    }

    // Actualizar el contador de entrenamientos del usuario
    await executeWithRetry(
      `UPDATE users 
       SET workouts_completed = workouts_completed + 1 
       WHERE id = ?`,
      [userId]
    );

    return NextResponse.json({ 
      success: true, 
      id: workoutId 
    });
  } catch (error: any) {
    console.error('Error creating entrenamiento:', error);
    
    if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      return NextResponse.json(
        { error: 'Servidor ocupado. Por favor intenta nuevamente en unos momentos.' },
        { status: 503 }
      );
    }
    
    // Mensaje de error más descriptivo
    const errorMessage = error.code === 'ER_NO_REFERENCED_ROW_2' 
      ? 'El usuario especificado no existe'
      : error.code === 'ER_NO_SUCH_TABLE'
      ? 'La tabla workout_components no existe. Por favor ejecuta el script de migración.'
      : error.message || 'Error al crear entrenamiento';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


