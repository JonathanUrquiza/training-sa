import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoriaId = searchParams.get('categoria_id');

    let query = 'SELECT * FROM exercise_subcategories WHERE 1=1';
    const params: any[] = [];

    if (categoriaId) {
      query += ' AND category_id = ?';
      params.push(categoriaId);
    }

    query += ' ORDER BY name ASC';

    const [rows] = await db.execute(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching subcategorias:', error);
    return NextResponse.json(
      { error: 'Error al obtener subcategorías' },
      { status: 500 }
    );
  }
}

