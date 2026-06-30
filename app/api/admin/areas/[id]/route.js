import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { region_id, name } = await req.json();
    if (!region_id || !name) {
      return NextResponse.json({ success: false, message: 'Region and name are required' }, { status: 400 });
    }
    const result = await sql`UPDATE areas SET region_id = ${region_id}, name = ${name} WHERE id = ${id} RETURNING *`;
    if (result.length === 0) return NextResponse.json({ success: false, message: 'Area not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update area' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    // Check if any agents use this area
    const used = await sql`SELECT id FROM agents WHERE area_id = ${id} LIMIT 1`;
    if (used.length > 0) {
      return NextResponse.json({ success: false, message: 'Cannot delete – area is assigned to agents' }, { status: 400 });
    }
    await sql`DELETE FROM areas WHERE id = ${id}`;
    return NextResponse.json({ success: true, message: 'Area deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to delete area' }, { status: 500 });
  }
}