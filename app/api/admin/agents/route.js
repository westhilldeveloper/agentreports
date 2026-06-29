import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const agents = await sql`SELECT * FROM agents ORDER BY id DESC`;
    return NextResponse.json({ success: true, data: agents });
  } catch (error) {
    console.error('Fetch Agents Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { agent_code, name, phone, email } = await req.json();
    if (!agent_code || !name || !phone || !email) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO agents (agent_code, name, phone, email) 
      VALUES (${agent_code}, ${name}, ${phone}, ${email}) 
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Create Agent Error:', error);
    return NextResponse.json({ success: false, message: 'Agent code or email already exists' }, { status: 500 });
  }
}