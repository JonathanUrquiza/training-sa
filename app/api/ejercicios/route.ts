import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoriaId = searchParams.get('categoria_id');
    const subcategoriaId = searchParams.get('subcategoria_id');
    const nivel = searchParams.get('nivel');
    const search = searchParams.get('search');

    let query = `
      SELECT e.*, ec.name as categoria_nombre, esc.name as subcategoria_nombre
      FROM exercises e
      LEFT JOIN exercise_categories ec ON e.category_id = ec.id
      LEFT JOIN exercise_subcategories esc ON e.subcategory_id = esc.id
      WHERE e.active = 1
    `;
    const params: any[] = [];

    if (categoriaId) {
      query += ' AND e.category_id = ?';
      params.push(categoriaId);
    }

    if (subcategoriaId) {
      query += ' AND e.subcategory_id = ?';
      params.push(subcategoriaId);
    }

    if (nivel) {
      query += ' AND e.nivel = ?';
      params.push(nivel);
    }

    if (search) {
      query += ' AND (e.nombre LIKE ? OR e.grupo_muscular LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY e.nombre ASC';

    const [rows] = await db.execute(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching ejercicios:', error);
    return NextResponse.json(
      { error: 'Error al obtener ejercicios' },
      { status: 500 }
    );
  }
}

