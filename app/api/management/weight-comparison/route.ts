import { NextRequest, NextResponse } from 'next/server';
import { executeWithRetry } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = parseInt(searchParams.get('user_id') || '1');
    const exerciseType = searchParams.get('type'); // 'oly' o 'muscle'

    if (!exerciseType || (exerciseType !== 'oly' && exerciseType !== 'muscle')) {
      return NextResponse.json(
        { error: 'Tipo de ejercicio requerido: oly o muscle' },
        { status: 400 }
      );
    }

    const comparison = await getWeightComparison(userId, exerciseType);
    return NextResponse.json(comparison);
  } catch (error: any) {
    console.error('Error fetching weight comparison:', error);
    return NextResponse.json(
      { error: 'Error al obtener comparación de pesos' },
      { status: 500 }
    );
  }
}

async function getWeightComparison(userId: number, exerciseType: 'oly' | 'muscle') {
  try {
    // Obtener todos los ejercicios del tipo especificado con sus pesos
    const components = await executeWithRetry<any[]>(
      `SELECT 
         wc.exercise_name,
         wc.weight,
         wc.reps,
         wc.sets,
         w.date,
         w.id as workout_id
       FROM workout_components wc
       INNER JOIN workouts w ON wc.workout_id = w.id
       WHERE w.user_id = ?
       AND wc.component_type = ?
       AND wc.weight IS NOT NULL
       AND wc.weight > 0
       ORDER BY wc.exercise_name ASC, w.date ASC`,
      [userId, exerciseType]
    );

    // Agrupar por ejercicio
    const exerciseMap = new Map<string, any[]>();
    
    (components || []).forEach((comp: any) => {
      const exerciseName = comp.exercise_name;
      if (!exerciseMap.has(exerciseName)) {
        exerciseMap.set(exerciseName, []);
      }
      exerciseMap.get(exerciseName)!.push({
        weight: comp.weight,
        reps: comp.reps,
        sets: comp.sets,
        date: comp.date,
        workout_id: comp.workout_id
      });
    });

    // Calcular estadísticas para cada ejercicio
    const comparisons = Array.from(exerciseMap.entries()).map(([exerciseName, records]) => {
      const weights = records.map(r => r.weight).filter(w => w > 0);
      
      if (weights.length === 0) return null;

      const stats = {
        count: weights.length,
        max_weight: Math.max(...weights),
        min_weight: Math.min(...weights),
        avg_weight: Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 100) / 100,
        improvement: weights.length > 1 ? weights[weights.length - 1] - weights[0] : 0,
        first_date: records[0].date,
        last_date: records[records.length - 1].date
      };

      return {
        exercise_name: exerciseName,
        records,
        stats
      };
    }).filter(c => c !== null);

    return comparisons;
  } catch (error: any) {
    // Si la tabla no existe, retornar array vacío
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return [];
    }
    throw error;
  }
}

