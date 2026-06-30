import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const chitId = searchParams.get('chitId');
    const month = searchParams.get('month');

    let query = `
      SELECT 
        c.id,
        c.agent_ticket_id,
        c.month_year,
        c.pending_amount,
        c.collected_amount,
        a.name AS agent_name,
        a.agent_code,
        ch.name AS chit_name,
        at.ticket_number
      FROM collections c
      JOIN agent_tickets at ON c.agent_ticket_id = at.id
      JOIN agents a ON at.agent_id = a.id
      JOIN chits ch ON at.chit_id = ch.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (agentId) {
      query += ` AND a.id = $${idx++}`;
      params.push(parseInt(agentId));
    }
    if (chitId) {
      query += ` AND ch.id = $${idx++}`;
      params.push(parseInt(chitId));
    }
    if (month) {
      query += ` AND c.month_year LIKE $${idx++} || '%'`;
      params.push(month);
    }

    query += ` ORDER BY c.updated_at DESC`;

    const result = await sql.query(query, params);
    return NextResponse.json({ success: true, data: result.rows || result });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}