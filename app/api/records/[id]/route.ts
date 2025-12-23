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
        { error: 'ID del récord es requerido' },
        { status: 400 }
      );
    }

    // Construir la query dinámicamente
    const fields: string[] = [];
    const values: any[] = [];

    if (body.exercise !== undefined) {
      fields.push('exercise = ?');
      values.push(body.exercise);
    }
    if (body.type !== undefined) {
      fields.push('type = ?');
      values.push(body.type);
    }
    if (body.value !== undefined) {
      fields.push('value = ?');
      values.push(body.value);
    }
    if (body.notes !== undefined) {
      fields.push('notes = ?');
      values.push(body.notes);
    }
    if (body.is_pr !== undefined) {
      fields.push('is_pr = ?');
      values.push(body.is_pr ? 1 : 0);
    }
    if (body.date !== undefined) {
      fields.push('date = ?');
      values.push(body.date);
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
      `UPDATE records 
       SET ${fields.join(', ')} 
       WHERE id = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating record:', error);
    
    if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      return NextResponse.json(
        { error: 'Servidor ocupado. Por favor intenta nuevamente en unos momentos.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error al actualizar récord' },
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
        { error: 'ID del récord es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el récord existe
    const records = await executeWithRetry<any[]>(
      'SELECT id FROM records WHERE id = ?',
      [id]
    );

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'Récord no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el récord
    await executeWithRetry('DELETE FROM records WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting record:', error);
    
    if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      return NextResponse.json(
        { error: 'Servidor ocupado. Por favor intenta nuevamente en unos momentos.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error al eliminar récord' },
      { status: 500 }
    );
  }
}

