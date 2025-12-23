import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [rows] = await db.execute(
      `SELECT w.*, ec.name as categoria_nombre
       FROM wods w
       LEFT JOIN exercise_categories ec ON w.category_id = ec.id
       WHERE w.id = ? AND w.active = 1`,
      [params.id]
    );

    const wod = (rows as any[])[0];
    if (!wod) {
      return NextResponse.json(
        { error: 'WOD no encontrado' },
        { status: 404 }
      );
    }

    // Parsear JSON
    wod.ejercicios = wod.ejercicios ? JSON.parse(wod.ejercicios) : [];
    wod.metadata = wod.metadata ? JSON.parse(wod.metadata) : null;

    return NextResponse.json(wod);
  } catch (error) {
    console.error('Error fetching wod:', error);
    return NextResponse.json(
      { error: 'Error al obtener WOD' },
      { status: 500 }
    );
  }
}

