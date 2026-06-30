import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { name } = await req.json();
    if (!name) return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    const result = await sql`UPDATE regions SET name = ${name} WHERE id = ${id} RETURNING *`;
    if (result.length === 0) return NextResponse.json({ success: false, message: 'Region not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update region' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    // Check if any agents or areas use this region
    const used = await sql`SELECT id FROM agents WHERE region_id = ${id} LIMIT 1`;
    if (used.length > 0) {
      return NextResponse.json({ success: false, message: 'Cannot delete – region is assigned to agents' }, { status: 400 });
    }
    await sql`DELETE FROM regions WHERE id = ${id}`;
    return NextResponse.json({ success: true, message: 'Region deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to delete region' }, { status: 500 });
  }
}