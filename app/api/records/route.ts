import { NextRequest, NextResponse } from 'next/server';
import db, { executeWithRetry } from '@/lib/db';
import { ensureUserExists } from '@/lib/userHelper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = parseInt(searchParams.get('user_id') || '1');

    // No necesitamos verificar usuario en GET, solo consultar
    const [rows] = await db.execute(
      `SELECT * FROM records 
       WHERE user_id = ? 
       ORDER BY date DESC`,
      [userId]
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching records:', error);
    
    // Si el error es por usuario no existente, retornar array vacío
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { error: 'Error al obtener récords' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.user_id || 1;

    // Asegurar que el usuario exista antes de crear el récord
    await ensureUserExists(userId);

    const result = await executeWithRetry<any>(
      `INSERT INTO records 
       (user_id, exercise, type, value, notes, is_pr, date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        body.exercise,
        body.type || 'repeticiones',
        body.value,
        body.notes || null,
        body.is_pr ? 1 : 0,
        body.date || new Date()
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    });
  } catch (error: any) {
    console.error('Error creating record:', error);
    
    if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      return NextResponse.json(
        { error: 'Servidor ocupado. Por favor intenta nuevamente en unos momentos.' },
        { status: 503 }
      );
    }
    
    const errorMessage = error.code === 'ER_NO_REFERENCED_ROW_2' 
      ? 'El usuario especificado no existe'
      : error.message || 'Error al crear récord';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

