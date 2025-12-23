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
        { error: 'ID del objetivo es requerido' },
        { status: 400 }
      );
    }

    // Construir la query dinámicamente
    const fields: string[] = [];
    const values: any[] = [];

    if (body.description !== undefined) {
      fields.push('description = ?');
      values.push(body.description);
    }
    if (body.type !== undefined) {
      fields.push('type = ?');
      values.push(body.type);
    }
    if (body.target_value !== undefined) {
      fields.push('target_value = ?');
      values.push(body.target_value);
    }
    if (body.current_value !== undefined) {
      fields.push('current_value = ?');
      values.push(body.current_value);
    }
    if (body.deadline !== undefined) {
      fields.push('deadline = ?');
      values.push(body.deadline || null);
    }
    if (body.completed !== undefined) {
      fields.push('completed = ?');
      values.push(body.completed ? 1 : 0);
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
      `UPDATE goals 
       SET ${fields.join(', ')} 
       WHERE id = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating objetivo:', error);
    
    if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      return NextResponse.json(
        { error: 'Servidor ocupado. Por favor intenta nuevamente en unos momentos.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error al actualizar objetivo' },
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
        { error: 'ID del objetivo es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el objetivo existe
    const goals = await executeWithRetry<any[]>(
      'SELECT id FROM goals WHERE id = ?',
      [id]
    );

    if (!goals || goals.length === 0) {
      return NextResponse.json(
        { error: 'Objetivo no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el objetivo
    await executeWithRetry('DELETE FROM goals WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting objetivo:', error);
    
    if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      return NextResponse.json(
        { error: 'Servidor ocupado. Por favor intenta nuevamente en unos momentos.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error al eliminar objetivo' },
      { status: 500 }
    );
  }
}

