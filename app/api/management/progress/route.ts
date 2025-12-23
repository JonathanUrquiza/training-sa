import { NextRequest, NextResponse } from 'next/server';
import { executeWithRetry } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = parseInt(searchParams.get('user_id') || '1');

    // Obtener estadísticas generales
    const workoutStats = await executeWithRetry<any[]>(
      `SELECT 
         COUNT(*) as total_workouts,
         SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_workouts,
         AVG(duration) as avg_duration,
         MIN(date) as first_workout,
         MAX(date) as last_workout
       FROM workouts
       WHERE user_id = ?`,
      [userId]
    );

    const stats = (workoutStats || [])[0] || {};

    // Obtener estadísticas por tipo de componente
    let componentStats = {};
    try {
      const components = await executeWithRetry<any[]>(
        `SELECT 
           component_type,
           COUNT(*) as count,
           AVG(duration) as avg_duration
         FROM workout_components wc
         INNER JOIN workouts w ON wc.workout_id = w.id
         WHERE w.user_id = ?
         GROUP BY component_type`,
        [userId]
      );

      componentStats = (components || []).reduce((acc, comp) => {
        acc[comp.component_type] = {
          count: comp.count,
          avg_duration: comp.avg_duration ? Math.round(comp.avg_duration) : null
        };
        return acc;
      }, {});
    } catch (error: any) {
      // Si la tabla no existe, usar valores por defecto
      if (error.code === 'ER_NO_SUCH_TABLE') {
        componentStats = {};
      }
    }

    // Obtener progreso de objetivos
    const goals = await executeWithRetry<any[]>(
      `SELECT 
         COUNT(*) as total_goals,
         SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_goals,
         AVG((current_value / NULLIF(target_value, 0)) * 100) as avg_progress
       FROM goals
       WHERE user_id = ?`,
      [userId]
    );

    const goalStats = (goals || [])[0] || {};

    // Obtener récords personales
    const prs = await executeWithRetry<any[]>(
      `SELECT COUNT(*) as total_prs
       FROM records
       WHERE user_id = ? AND is_pr = 1`,
      [userId]
    );

    const prStats = (prs || [])[0] || {};

    // Calcular información del nivel y progreso
    let levelInfo = {
      current_level: 'Intermedio',
      next_level: 'Avanzado',
      progress_percentage: 0,
      weeks_into_period: 0,
      days_until_next_level: 14
    };

    if (stats.first_workout) {
      const firstWorkoutDate = new Date(stats.first_workout);
      const now = new Date();
      
      // Calcular días totales desde el primer entrenamiento
      const daysSinceFirst = Math.floor((now.getTime() - firstWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalWeeks = Math.floor(daysSinceFirst / 7);
      
      // Cada 2 semanas (14 días) cambia el nivel
      // Ciclo: 0-13 días: Principiante, 14-27 días: Intermedio, 28-41 días: Avanzado, luego ciclo
      const periodInCycle = Math.floor(daysSinceFirst / 14) % 3; // 0, 1, o 2
      const daysIntoCurrentPeriod = daysSinceFirst % 14; // Días dentro del período actual de 2 semanas
      
      // Determinar nivel actual basado en el ciclo
      const levels = ['Principiante', 'Intermedio', 'Avanzado'];
      const currentLevelIndex = periodInCycle;
      const currentLevel = levels[currentLevelIndex];
      
      // Determinar siguiente nivel
      let nextLevel: string;
      if (currentLevel === 'Principiante') {
        nextLevel = 'Intermedio';
      } else if (currentLevel === 'Intermedio') {
        nextLevel = 'Avanzado';
      } else {
        // Si es Avanzado, el siguiente es Intermedio (ciclo)
        nextLevel = 'Intermedio';
      }
      
      // Calcular progreso (0-100%) dentro del período actual de 2 semanas basado en días
      const progressPercentage = Math.min(100, Math.max(0, (daysIntoCurrentPeriod / 14) * 100));
      
      // Calcular días hasta el siguiente nivel
      const daysUntilNextLevel = 14 - daysIntoCurrentPeriod;
      
      levelInfo = {
        current_level: currentLevel,
        next_level: nextLevel,
        progress_percentage: Math.round(progressPercentage),
        weeks_into_period: Math.floor(daysIntoCurrentPeriod / 7),
        days_until_next_level: daysUntilNextLevel
      };
    }

    return NextResponse.json({
      workouts: {
        total: stats.total_workouts || 0,
        completed: stats.completed_workouts || 0,
        avg_duration: stats.avg_duration ? Math.round(stats.avg_duration) : null,
        first_workout: stats.first_workout,
        last_workout: stats.last_workout
      },
      components: componentStats,
      goals: {
        total: goalStats.total_goals || 0,
        completed: goalStats.completed_goals || 0,
        avg_progress: goalStats.avg_progress ? Math.round(goalStats.avg_progress * 100) / 100 : 0
      },
      records: {
        total_prs: prStats.total_prs || 0
      },
      level: levelInfo
    });
  } catch (error: any) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Error al obtener progreso' },
      { status: 500 }
    );
  }
}

