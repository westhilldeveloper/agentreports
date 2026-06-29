import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { id, name, phone } = await req.json();
    await sql`UPDATE agents SET name = ${name}, phone = ${phone} WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}