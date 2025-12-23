import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await db.execute('SELECT * FROM exercise_categories ORDER BY name ASC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching categorias:', error);
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

