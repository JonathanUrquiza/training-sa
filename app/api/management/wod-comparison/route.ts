import { NextRequest, NextResponse } from 'next/server';
import { executeWithRetry } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = parseInt(searchParams.get('user_id') || '1');
    const wodType = searchParams.get('type'); // 'hero' o 'nasty_girls'

    // Determinar el subcategory_code según el tipo
    let subcategoryCode = '';
    if (wodType === 'hero') {
      subcategoryCode = 'hero_wods_detallados';
    } else if (wodType === 'nasty_girls') {
      subcategoryCode = 'the_girls_benchmark_wods';
    } else {
      // Si no se especifica tipo, obtener ambos secuencialmente
      const heroData = await getWODComparison(userId, 'hero_wods_detallados');
      const nastyGirlsData = await getWODComparison(userId, 'the_girls_benchmark_wods');
      return NextResponse.json({
        hero: heroData,
        nasty_girls: nastyGirlsData
      });
    }

    const comparison = await getWODComparison(userId, subcategoryCode);
    return NextResponse.json(comparison);
  } catch (error: any) {
    console.error('Error fetching WOD comparison:', error);
    return NextResponse.json(
      { error: 'Error al obtener comparación de WODs' },
      { status: 500 }
    );
  }
}

async function getWODComparison(userId: number, subcategoryCode: string) {
  try {
    // Optimizar: hacer una sola consulta con JOIN en lugar de múltiples consultas
    const components = await executeWithRetry<any[]>(
      `SELECT 
         w.id as wod_id,
         w.nombre as wod_name,
         w.tipo as wod_type,
         wc.duration,
         wo.date,
         wo.id as workout_id
       FROM wods w
       INNER JOIN workout_components wc ON wc.wod_id = w.id
       INNER JOIN workouts wo ON wc.workout_id = wo.id
       WHERE w.category_id = 7 
       AND w.subcategory_code = ?
       AND w.active = 1
       AND wo.user_id = ?
       AND wc.component_type = 'wod'
       AND wc.duration IS NOT NULL
       ORDER BY w.nombre ASC, wo.date ASC`,
      [subcategoryCode, userId]
    );

    // Agrupar por WOD
    const wodMap = new Map<number, any>();
    
    (components || []).forEach((comp: any) => {
      if (!wodMap.has(comp.wod_id)) {
        wodMap.set(comp.wod_id, {
          wod_id: comp.wod_id,
          wod_name: comp.wod_name,
          wod_type: comp.wod_type,
          times: []
        });
      }
      
      wodMap.get(comp.wod_id)!.times.push({
        duration: comp.duration,
        date: comp.date,
        workout_id: comp.workout_id
      });
    });

    // Calcular estadísticas para cada WOD
    const wodComparisons = Array.from(wodMap.values()).map((wod) => {
      const durations = wod.times.map((t: any) => t.duration).filter((d: number) => d > 0);
      
      const stats = durations.length > 0 ? {
        count: durations.length,
        best: Math.min(...durations),
        worst: Math.max(...durations),
        average: Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length),
        improvement: durations.length > 1 
          ? durations[0] - durations[durations.length - 1] 
          : 0
      } : null;

      return {
        ...wod,
        stats
      };
    });

    return wodComparisons.filter(w => w.times.length > 0);
  } catch (error: any) {
    // Si la tabla no existe, retornar array vacío
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return [];
    }
    throw error;
  }
}

