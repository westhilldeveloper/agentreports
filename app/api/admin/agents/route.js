import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const agents = await sql`
      SELECT a.*, r.name as region_name, ar.name as area_name
      FROM agents a
      LEFT JOIN regions r ON a.region_id = r.id
      LEFT JOIN areas ar ON a.area_id = ar.id
      ORDER BY a.id DESC
    `;
    return NextResponse.json({ success: true, data: agents });
  } catch (error) {
    console.error('Fetch Agents Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { agent_code, name, phone, email, region_id, area_id } = await req.json();
    if (!agent_code || !name || !phone || !email) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO agents (agent_code, name, phone, email, region_id, area_id) 
      VALUES (${agent_code}, ${name}, ${phone}, LOWER(${email}), ${region_id || null}, ${area_id || null}) 
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Create Agent Error:', error);
    return NextResponse.json({ success: false, message: 'Agent code or email already exists' }, { status: 500 });
  }
}

