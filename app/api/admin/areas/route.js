import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const regionId = searchParams.get('regionId');
    let query = `SELECT * FROM areas`;
    const params = [];
    if (regionId) {
      query += ` WHERE region_id = $1`;
      params.push(parseInt(regionId));
    }
    query += ` ORDER BY name`;
    const result = await sql.query(query, params);
    return NextResponse.json({ success: true, data: result.rows || result });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch areas' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, region_id } = await req.json();
    if (!name || !region_id) {
      return NextResponse.json({ success: false, message: 'Name and region ID are required' }, { status: 400 });
    }
    const result = await sql`INSERT INTO areas (name, region_id) VALUES (${name}, ${region_id}) RETURNING *`;
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create area' }, { status: 500 });
  }
}