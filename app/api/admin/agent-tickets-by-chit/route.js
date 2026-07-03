import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const chitId = searchParams.get('chitId');

    if (!chitId) {
      return NextResponse.json({ success: false, message: 'chitId required' }, { status: 400 });
    }

    const query = `
      SELECT at.ticket_number, a.name AS agent_name
      FROM agent_tickets at
      LEFT JOIN agents a ON at.agent_id = a.id
      WHERE at.chit_id = ${parseInt(chitId)}
      ORDER BY at.ticket_number
    `;
    const result = await sql.query(query);
    const rows = result.rows || result;
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch Tickets Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch' }, { status: 500 });
  }
}