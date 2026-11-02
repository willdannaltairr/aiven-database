import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// PUT /api/categories/:id -> update a category
export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Field "name" wajib diisi' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const [result] = await pool.query(
      'UPDATE categories SET name = ? WHERE id = ?',
      [name, params.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ id: Number(params.id), name });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/categories/:id -> delete a category
export async function DELETE(request, { params }) {
  try {
    const pool = getPool();
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [
      params.id,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}