import { NextRequest, NextResponse } from 'next/server';
import db, { executeWithRetry } from '@/lib/db';
import { ensureUserExists } from '@/lib/userHelper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = parseInt(searchParams.get('user_id') || '1');

    // No necesitamos verificar usuario en GET, solo consultar
    const [rows] = await db.execute(
      `SELECT * FROM goals 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching objetivos:', error);
    
    // Si el error es por usuario no existente, retornar array vacío
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { error: 'Error al obtener objetivos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.user_id || 1;

    // Asegurar que el usuario exista antes de crear el objetivo
    await ensureUserExists(userId);

    const result = await executeWithRetry<any>(
      `INSERT INTO goals 
       (user_id, description, type, target_value, current_value, deadline, completed) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        body.description,
        body.type || 'general',
        body.target_value || 0,
        body.current_value || 0,
        body.deadline || null,
        body.completed ? 1 : 0
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    });
  } catch (error: any) {
    console.error('Error creating objetivo:', error);
    
    if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      return NextResponse.json(
        { error: 'Servidor ocupado. Por favor intenta nuevamente en unos momentos.' },
        { status: 503 }
      );
    }
    
    const errorMessage = error.code === 'ER_NO_REFERENCED_ROW_2' 
      ? 'El usuario especificado no existe'
      : error.message || 'Error al crear objetivo';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

