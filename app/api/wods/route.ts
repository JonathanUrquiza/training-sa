import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nivel = searchParams.get('nivel');
    const search = searchParams.get('search');

    let query = `
      SELECT w.*, ec.name as categoria_nombre
      FROM wods w
      LEFT JOIN exercise_categories ec ON w.category_id = ec.id
      WHERE w.active = 1
    `;
    const params: any[] = [];

    if (nivel) {
      query += ' AND w.nivel = ?';
      params.push(nivel);
    }

    if (search) {
      query += ' AND (w.nombre LIKE ? OR w.descripcion LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY w.nombre ASC';

    const [rows] = await db.execute(query, params);

    // Parsear JSON de ejercicios y metadata
    const wods = (rows as any[]).map(wod => ({
      ...wod,
      ejercicios: wod.ejercicios ? JSON.parse(wod.ejercicios) : [],
      metadata: wod.metadata ? JSON.parse(wod.metadata) : null
    }));

    return NextResponse.json(wods);
  } catch (error) {
    console.error('Error fetching wods:', error);
    return NextResponse.json(
      { error: 'Error al obtener WODs' },
      { status: 500 }
    );
  }
}

