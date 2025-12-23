import { NextRequest, NextResponse } from 'next/server';
import { executeWithRetry } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = parseInt(searchParams.get('user_id') || '1');
    const month = searchParams.get('month'); // YYYY-MM
    const year = searchParams.get('year');

    let startDate: string;
    let endDate: string;

    if (month && year) {
      // Obtener entrenamientos del mes específico
      startDate = `${year}-${month.padStart(2, '0')}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;
    } else {
      // Obtener entrenamientos del mes actual
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
    }

    // Optimizar: hacer una sola consulta con JOIN en lugar de múltiples consultas
    const workouts = await executeWithRetry<any[]>(
      `SELECT 
         wo.id,
         wo.date,
         wo.level,
         wo.duration,
         wo.completed,
         wo.notes,
         wc.component_type,
         wc.wod_id,
         wc.exercise_name,
         w.nombre as wod_nombre,
         wc.\`order\` as component_order
       FROM workouts wo
       LEFT JOIN workout_components wc ON wc.workout_id = wo.id
       LEFT JOIN wods w ON wc.wod_id = w.id
       WHERE wo.user_id = ?
       AND DATE(wo.date) >= ?
       AND DATE(wo.date) <= ?
       ORDER BY wo.date ASC, wc.\`order\` ASC`,
      [userId, startDate, endDate]
    );

    // Agrupar componentes por entrenamiento
    const workoutMap = new Map<number, any>();
    
    (workouts || []).forEach((row: any) => {
      if (!workoutMap.has(row.id)) {
        workoutMap.set(row.id, {
          id: row.id,
          date: row.date,
          level: row.level,
          duration: row.duration,
          completed: row.completed,
          notes: row.notes,
          components: []
        });
      }
      
      // Agregar componente si existe
      if (row.component_type) {
        workoutMap.get(row.id)!.components.push({
          component_type: row.component_type,
          wod_id: row.wod_id,
          exercise_name: row.exercise_name,
          wod_nombre: row.wod_nombre
        });
      }
    });

    const calendarData = Array.from(workoutMap.values());

    return NextResponse.json(calendarData);
  } catch (error: any) {
    console.error('Error fetching calendar:', error);
    
    // Si la tabla no existe, retornar array vacío
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { error: 'Error al obtener calendario' },
      { status: 500 }
    );
  }
}

