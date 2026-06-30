import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const chitId = searchParams.get('chitId');
    const month = searchParams.get('month'); // "YYYY-MM"

    let query = `
      SELECT 
        c.updated_at AS date,
        a.name AS agent_name,
        a.agent_code,
        ch.name AS chit_name,
        at.ticket_number,
        COALESCE(mt.target_amount, 0) AS target,
        c.collected_amount AS collected,
        c.pending_amount AS balance
      FROM collections c
      JOIN agent_tickets at ON c.agent_ticket_id = at.id
      JOIN agents a ON at.agent_id = a.id
      JOIN chits ch ON at.chit_id = ch.id
      LEFT JOIN monthly_targets mt ON mt.chit_id = ch.id AND mt.month_year = c.month_year
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (agentId) {
      query += ` AND a.id = $${idx}`;
      params.push(parseInt(agentId));
      idx++;
    }
    if (chitId) {
      query += ` AND ch.id = $${idx}`;
      params.push(parseInt(chitId));
      idx++;
    }
    if (month) {
      // month_year is a DATE column, cast to text for LIKE
      query += ` AND c.month_year::text LIKE $${idx} || '%'`;
      params.push(month);
      idx++;
    }

    query += ` ORDER BY c.updated_at DESC`;

    const result = await sql.query(query, params);
    const rows = result.rows || result;

    const formattedRows = rows.map(row => ({
      date: row.date,
      agent_name: row.agent_name,
      agent_code: row.agent_code,
      chit_name: row.chit_name,
      ticket_number: row.ticket_number,
      target: parseFloat(row.target) || 0,
      collected: parseFloat(row.collected) || 0,
      balance: parseFloat(row.balance) || 0,
    }));

    return NextResponse.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('Report API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
}