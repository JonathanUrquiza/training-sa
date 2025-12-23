import { NextRequest, NextResponse } from 'next/server';
import db, { executeWithRetry } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const id = parseInt(params.id);

    if (!id) {
      return NextResponse.json(
        { error: 'ID del entrenamiento es requerido' },
        { status: 400 }
      );
    }

    // Construir la query dinámicamente
    const fields: string[] = [];
    const values: any[] = [];

    if (body.date !== undefined) {
      fields.push('date = ?');
      values.push(body.date);
    }
    if (body.level !== undefined) {
      fields.push('level = ?');
      values.push(body.level);
    }
    if (body.duration !== undefined) {
      fields.push('duration = ?');
      values.push(body.duration);
    }
    if (body.exercises !== undefined) {
      fields.push('exercises = ?');
      values.push(JSON.stringify(body.exercises));
    }
    if (body.completed !== undefined) {
      fields.push('completed = ?');
      values.push(body.completed ? 1 : 0);
    }
    if (body.notes !== undefined) {
      fields.push('notes = ?');
      values.push(body.notes);
    }
    if (body.calories !== undefined) {
      fields.push('calories = ?');
      values.push(body.calories);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    fields.push('updated_at = ?');
    values.push(new Date());
    values.push(id);

    await executeWithRetry(
      `UPDATE workouts 
       SET ${fields.join(', ')} 
       WHERE id = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating entrenamiento:', error);
    
    if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      return NextResponse.json(
        { error: 'Servidor ocupado. Por favor intenta nuevamente en unos momentos.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error al actualizar entrenamiento' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (!id) {
      return NextResponse.json(
        { error: 'ID del entrenamiento es requerido' },
        { status: 400 }
      );
    }

    // Obtener el user_id antes de eliminar para actualizar el contador
    const workouts = await executeWithRetry<any[]>(
      'SELECT user_id FROM workouts WHERE id = ?',
      [id]
    );

    if (!workouts || workouts.length === 0) {
      return NextResponse.json(
        { error: 'Entrenamiento no encontrado' },
        { status: 404 }
      );
    }

    const userId = workouts[0].user_id;

    // Eliminar el entrenamiento
    await executeWithRetry('DELETE FROM workouts WHERE id = ?', [id]);

    // Actualizar el contador de entrenamientos del usuario
    await executeWithRetry(
      `UPDATE users 
       SET workouts_completed = GREATEST(0, workouts_completed - 1) 
       WHERE id = ?`,
      [userId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting entrenamiento:', error);
    
    if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      return NextResponse.json(
        { error: 'Servidor ocupado. Por favor intenta nuevamente en unos momentos.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error al eliminar entrenamiento' },
      { status: 500 }
    );
  }
}

