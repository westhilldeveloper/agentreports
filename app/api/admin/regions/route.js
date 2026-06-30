import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const regions = await sql`SELECT * FROM regions ORDER BY name`;
    return NextResponse.json({ success: true, data: regions });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch regions' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ success: false, message: 'Region name is required' }, { status: 400 });
    }
    const result = await sql`INSERT INTO regions (name) VALUES (${name}) RETURNING *`;
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create region' }, { status: 500 });
  }
}