import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const month = searchParams.get('month'); // YYYY-MM

    if (!agentId || !month) {
      return NextResponse.json(
        { success: false, message: 'agentId and month are required' },
        { status: 400 }
      );
    }

    const monthYear = month + '-01';

    const query = `
      SELECT 
        at.ticket_number,
        ch.name AS chit_name,
        mt.target_amount AS target,
        COALESCE(c.collected_amount, 0) AS collected,
        COALESCE(mt.target_amount, 0) - COALESCE(c.collected_amount, 0) AS pending
      FROM agent_tickets at
      JOIN chits ch ON at.chit_id = ch.id
      LEFT JOIN monthly_targets mt ON mt.chit_id = ch.id AND mt.month_year = $1
      LEFT JOIN collections c ON c.agent_ticket_id = at.id AND c.month_year = $1
      WHERE at.agent_id = $2
      ORDER BY ch.name, at.ticket_number
    `;
    const result = await sql.query(query, [monthYear, parseInt(agentId)]);
    const rows = result.rows || result;

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Agent Tickets API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch agent tickets' },
      { status: 500 }
    );
  }
}