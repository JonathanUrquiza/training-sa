import { NextRequest, NextResponse } from 'next/server';
import { executeWithRetry } from '@/lib/db';
import { ensureUserExists } from '@/lib/userHelper';

// Función auxiliar para obtener un elemento aleatorio de un array
function getRandomElement<T>(array: T[]): T | null {
  if (array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

// Función auxiliar para obtener múltiples elementos aleatorios sin repetir
function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

// Calcular el nivel del usuario basado en las últimas 2 semanas
async function calculateUserLevel(userId: number): Promise<string> {
  try {
    // Obtener entrenamientos de las últimas 2 semanas
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const workouts = await executeWithRetry<any[]>(
      `SELECT level, date FROM workouts 
       WHERE user_id = ? 
       AND date >= ?
       ORDER BY date DESC`,
      [userId, twoWeeksAgo.toISOString().split('T')[0]]
    );

    if (workouts.length === 0) {
      // Si no hay entrenamientos, obtener el nivel del usuario
      const user = await executeWithRetry<any[]>(
        'SELECT current_level FROM users WHERE id = ?',
        [userId]
      );
      return (user[0]?.current_level || 'Intermedio') as string;
    }

    // Contar entrenamientos por nivel en las últimas 2 semanas
    const levelCounts: { [key: string]: number } = {};
    workouts.forEach((w: any) => {
      levelCounts[w.level] = (levelCounts[w.level] || 0) + 1;
    });

    // Determinar el nivel más común
    const mostCommonLevel = Object.keys(levelCounts).reduce((a, b) => 
      levelCounts[a] > levelCounts[b] ? a : b
    );

    // Si hay más de 8 entrenamientos (más de la mitad de 14 días), aumentar nivel
    if (workouts.length >= 8) {
      if (mostCommonLevel === 'Principiante') {
        return 'Intermedio';
      } else if (mostCommonLevel === 'Intermedio') {
        return 'Avanzado';
      } else {
        // Si es Avanzado, bajar a Intermedio (ciclo)
        return 'Intermedio';
      }
    }

    return mostCommonLevel;
  } catch (error) {
    console.error('Error calculating user level:', error);
    return 'Intermedio'; // Default
  }
}

// Obtener WODs usados recientemente (últimos 7 días) para no repetir
async function getRecentWODs(userId: number): Promise<number[]> {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentWODs = await executeWithRetry<any[]>(
      `SELECT DISTINCT wc.wod_id 
       FROM workout_components wc
       INNER JOIN workouts w ON wc.workout_id = w.id
       WHERE w.user_id = ? 
       AND wc.component_type = 'wod'
       AND wc.wod_id IS NOT NULL
       AND w.date >= ?`,
      [userId, weekAgo.toISOString().split('T')[0]]
    );

    return recentWODs.map((w: any) => w.wod_id).filter((id: number) => id !== null);
  } catch (error) {
    console.error('Error getting recent WODs:', error);
    return [];
  }
}

// Obtener ejercicios de Oly usados recientemente para rotación
async function getRecentOlyExercises(userId: number): Promise<string[]> {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentOly = await executeWithRetry<any[]>(
      `SELECT DISTINCT wc.exercise_name 
       FROM workout_components wc
       INNER JOIN workouts w ON wc.workout_id = w.id
       WHERE w.user_id = ? 
       AND wc.component_type = 'oly'
       AND wc.exercise_name IS NOT NULL
       AND w.date >= ?`,
      [userId, weekAgo.toISOString().split('T')[0]]
    );

    return recentOly.map((e: any) => e.exercise_name).filter((name: string) => name !== null);
  } catch (error) {
    console.error('Error getting recent Oly exercises:', error);
    return [];
  }
}

// Obtener objetivos relacionados con cardio
async function getCardioGoals(userId: number): Promise<any[]> {
  try {
    const goals = await executeWithRetry<any[]>(
      `SELECT * FROM goals 
       WHERE user_id = ? 
       AND completed = 0
       AND (type = 'resistencia' OR description LIKE '%correr%' OR description LIKE '%cardio%' OR description LIKE '%5k%' OR description LIKE '%calorías%')`,
      [userId]
    );

    return goals || [];
  } catch (error) {
    console.error('Error getting cardio goals:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.user_id || 1;

    // Asegurar que el usuario exista
    await ensureUserExists(userId);

    // Calcular nivel del usuario
    const userLevel = await calculateUserLevel(userId);

    // Obtener datos necesarios
    const recentWODs = await getRecentWODs(userId);
    const recentOlyExercises = await getRecentOlyExercises(userId);
    const cardioGoals = await getCardioGoals(userId);

    const components: any[] = [];
    let order = 0;

    // 1. WARMUP - Ejercicios aleatorios
    const warmupExercises = await executeWithRetry<any[]>(
      `SELECT e.*, ec.name as categoria_nombre 
       FROM exercises e
       LEFT JOIN exercise_categories ec ON e.category_id = ec.id
       WHERE e.active = 1 
       AND (ec.name LIKE '%calentamiento%' OR ec.name LIKE '%warmup%' OR e.nombre LIKE '%calentamiento%' OR e.nombre LIKE '%estiramiento%')
       ORDER BY RAND()
       LIMIT 3`,
      []
    );

    if (warmupExercises && warmupExercises.length > 0) {
      warmupExercises.forEach((exercise: any) => {
        components.push({
          component_type: 'warmup',
          exercise_name: exercise.nombre,
          duration: 300, // 5 minutos por defecto
          order: order++
        });
      });
    } else {
      // Si no hay ejercicios de warmup específicos, usar ejercicios básicos
      components.push({
        component_type: 'warmup',
        exercise_name: 'Calentamiento general',
        duration: 600, // 10 minutos
        order: order++
      });
    }

    // 2. CALISTENIA - Ejercicios aleatorios
    const calisthenicsExercises = await executeWithRetry<any[]>(
      `SELECT e.*, ec.name as categoria_nombre 
       FROM exercises e
       LEFT JOIN exercise_categories ec ON e.category_id = ec.id
       WHERE e.active = 1 
       AND (ec.name LIKE '%calistenia%' OR e.grupo_muscular LIKE '%cuerpo%' OR e.nombre LIKE '%flexión%' OR e.nombre LIKE '%sentadilla%' OR e.nombre LIKE '%dominada%' OR e.nombre LIKE '%burpee%' OR e.nombre LIKE '%mountain climber%')
       AND (e.nivel = ? OR e.nivel IS NULL)
       ORDER BY RAND()
       LIMIT 3`,
      [userLevel]
    );

    if (calisthenicsExercises && calisthenicsExercises.length > 0) {
      calisthenicsExercises.forEach((exercise: any) => {
        const reps = userLevel === 'Principiante' ? 10 : userLevel === 'Intermedio' ? 15 : 20;
        components.push({
          component_type: 'calisthenics',
          exercise_name: exercise.nombre,
          reps: reps,
          sets: 3,
          order: order++
        });
      });
    }

    // 3. OLY - Rotación de ejercicios
    const allOlyExercises = await executeWithRetry<any[]>(
      `SELECT e.*, ec.name as categoria_nombre 
       FROM exercises e
       LEFT JOIN exercise_categories ec ON e.category_id = ec.id
       WHERE e.active = 1 
       AND (ec.name LIKE '%olímpico%' OR ec.name LIKE '%oly%' OR e.nombre LIKE '%snatch%' OR e.nombre LIKE '%clean%' OR e.nombre LIKE '%jerk%' OR e.nombre LIKE '%arranque%' OR e.nombre LIKE '%envión%')
       ORDER BY e.nombre ASC`,
      []
    );

    if (allOlyExercises && allOlyExercises.length > 0) {
      // Filtrar ejercicios recientes
      const availableOly = allOlyExercises.filter(
        (e: any) => !recentOlyExercises.includes(e.nombre)
      );

      // Si todos los ejercicios fueron usados recientemente, usar todos
      const olyToUse = availableOly.length > 0 ? availableOly : allOlyExercises;
      const selectedOly = getRandomElements(olyToUse, 2); // 2 ejercicios de Oly

      selectedOly.forEach((exercise: any) => {
        const weight = userLevel === 'Principiante' ? 40 : userLevel === 'Intermedio' ? 60 : 80;
        components.push({
          component_type: 'oly',
          exercise_name: exercise.nombre,
          weight: weight,
          reps: 5,
          sets: 3,
          order: order++
        });
      });
    }

    // 4. MUSCLE - Ejercicios aleatorios
    const muscleExercises = await executeWithRetry<any[]>(
      `SELECT e.*, ec.name as categoria_nombre 
       FROM exercises e
       LEFT JOIN exercise_categories ec ON e.category_id = ec.id
       WHERE e.active = 1 
       AND (ec.name LIKE '%musculación%' OR ec.name LIKE '%fuerza%')
       AND (e.nivel = ? OR e.nivel IS NULL)
       ORDER BY RAND()
       LIMIT 4`,
      [userLevel]
    );

    if (muscleExercises && muscleExercises.length > 0) {
      muscleExercises.forEach((exercise: any) => {
        const reps = userLevel === 'Principiante' ? 8 : userLevel === 'Intermedio' ? 10 : 12;
        const sets = userLevel === 'Principiante' ? 3 : userLevel === 'Intermedio' ? 4 : 5;
        components.push({
          component_type: 'muscle',
          exercise_name: exercise.nombre,
          reps: reps,
          sets: sets,
          order: order++
        });
      });
    }

    // 5. WOD - Por nivel, 1 por día, no repetir
    const availableWODs = await executeWithRetry<any[]>(
      `SELECT * FROM wods 
       WHERE active = 1 
       AND nivel = ?
       ${recentWODs.length > 0 ? 'AND id NOT IN (' + recentWODs.join(',') + ')' : ''}
       ORDER BY RAND()
       LIMIT 1`,
      [userLevel]
    );

    let selectedWOD = null;
    if (availableWODs && availableWODs.length > 0) {
      selectedWOD = availableWODs[0];
    } else {
      // Si no hay WODs disponibles, usar uno aleatorio de cualquier nivel
      const anyWOD = await executeWithRetry<any[]>(
        `SELECT * FROM wods 
         WHERE active = 1 
         ORDER BY RAND()
         LIMIT 1`,
        []
      );
      if (anyWOD && anyWOD.length > 0) {
        selectedWOD = anyWOD[0];
      }
    }

    if (selectedWOD) {
      // Parsear ejercicios y metadata del WOD
      const ejercicios = selectedWOD.ejercicios ? JSON.parse(selectedWOD.ejercicios) : [];
      const metadata = selectedWOD.metadata ? JSON.parse(selectedWOD.metadata) : null;
      
      components.push({
        component_type: 'wod',
        wod_id: selectedWOD.id,
        exercise_name: selectedWOD.nombre,
        duration: null, // Se completará después
        wod_details: {
          nombre: selectedWOD.nombre,
          descripcion: selectedWOD.descripcion,
          tipo: selectedWOD.tipo,
          nivel: selectedWOD.nivel,
          total_rondas: selectedWOD.total_rondas,
          descanso_entre_rondas: selectedWOD.descanso_entre_rondas,
          ejercicios: ejercicios,
          metadata: metadata
        },
        order: order++
      });
    }

    // 6. CARDIO - Basado en objetivos
    let cardioType = '5k'; // Default
    let cardioValue = null;

    if (cardioGoals.length > 0) {
      const goal = cardioGoals[0];
      const description = goal.description.toLowerCase();

      if (description.includes('5k') || description.includes('correr')) {
        cardioType = '5k';
        cardioValue = 5.0; // km
      } else if (description.includes('1000') || description.includes('calorías')) {
        cardioType = 'calories';
        cardioValue = 1000; // calorías
      } else {
        // Aleatorio entre 5k y 1000kcal
        cardioType = Math.random() > 0.5 ? '5k' : 'calories';
        cardioValue = cardioType === '5k' ? 5.0 : 1000;
      }
    } else {
      // Si no hay objetivos, aleatorio
      cardioType = Math.random() > 0.5 ? '5k' : 'calories';
      cardioValue = cardioType === '5k' ? 5.0 : 1000;
    }

    if (cardioType === '5k') {
      components.push({
        component_type: 'cardio',
        exercise_name: 'Correr 5k',
        distance: 5.0,
        order: order++
      });
    } else {
      components.push({
        component_type: 'cardio',
        exercise_name: 'Cardio 1000kcal',
        calories: 1000,
        order: order++
      });
    }

    return NextResponse.json({
      success: true,
      level: userLevel,
      components,
      date: new Date().toISOString().split('T')[0]
    });
  } catch (error: any) {
    console.error('Error generating workout:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar entrenamiento' },
      { status: 500 }
    );
  }
}

