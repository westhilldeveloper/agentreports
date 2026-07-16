import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const month = searchParams.get('month'); // "YYYY-MM"

    if (!agentId || !month) {
      return NextResponse.json({ success: false, message: 'agentId and month are required' }, { status: 400 });
    }

    const query = `
      SELECT 
        at.id AS ticket_id,
        ch.name AS chit_name,
        at.ticket_number,
        COALESCE(mt.target_amount, 0) AS monthly_target,
        COALESCE(at.opening_balance, 0) AS opening_balance,
        COALESCE(SUM(c.collected_amount), 0) AS collected,
        COALESCE(SUM(c.pending_amount), 0) AS pending
      FROM agent_tickets at
      JOIN chits ch ON at.chit_id = ch.id
      LEFT JOIN monthly_targets mt ON mt.chit_id = ch.id AND mt.month_year::text LIKE $1 || '%'
      LEFT JOIN collections c ON c.agent_ticket_id = at.id AND c.month_year::text LIKE $1 || '%'
      WHERE at.agent_id = $2
      GROUP BY at.id, ch.name, at.ticket_number, mt.target_amount, at.opening_balance
      ORDER BY ch.name, at.ticket_number
    `;

    const result = await sql.query(query, [month, parseInt(agentId)]);
    const rows = result.rows || result;

    const formattedRows = rows.map(row => {
      const monthlyTarget = parseFloat(row.monthly_target) || 0;
      const openingBalance = parseFloat(row.opening_balance) || 0;
      const totalTarget = monthlyTarget + openingBalance;

      // ✅ Clamp collected to never be negative
      let collected = parseFloat(row.collected) || 0;
      if (collected < 0) collected = 0;

      // ✅ Compute pending = totalTarget - collected, then clamp to 0
      let pending = totalTarget - collected;
      if (pending < 0) pending = 0;

      return {
        chit_name: row.chit_name,
        ticket_number: row.ticket_number,
        monthly_target: monthlyTarget,
        opening_balance: openingBalance,
        total_target: totalTarget,
        collected: collected,
        pending: pending,
      };
    });

    return NextResponse.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('Agent Tickets API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ticket data' },
      { status: 500 }
    );
  }
}

// export async function GET(req) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const agentId = searchParams.get('agentId');
//     const month = searchParams.get('month'); // YYYY-MM

//     if (!agentId || !month) {
//       return NextResponse.json(
//         { success: false, message: 'agentId and month are required' },
//         { status: 400 }
//       );
//     }

//     const monthYear = month + '-01';

//     const query = `
//       SELECT 
//         at.ticket_number,
//         ch.name AS chit_name,
//         mt.target_amount AS target,
//         COALESCE(c.collected_amount, 0) AS collected,
//         COALESCE(mt.target_amount, 0) - COALESCE(c.collected_amount, 0) AS pending
//       FROM agent_tickets at
//       JOIN chits ch ON at.chit_id = ch.id
//       LEFT JOIN monthly_targets mt ON mt.chit_id = ch.id AND mt.month_year = $1
//       LEFT JOIN collections c ON c.agent_ticket_id = at.id AND c.month_year = $1
//       WHERE at.agent_id = $2
//       ORDER BY ch.name, at.ticket_number
//     `;
//     const result = await sql.query(query, [monthYear, parseInt(agentId)]);
//     const rows = result.rows || result;

//     return NextResponse.json({ success: true, data: rows });
//   } catch (error) {
//     console.error('Agent Tickets API Error:', error);
//     return NextResponse.json(
//       { success: false, message: 'Failed to fetch agent tickets' },
//       { status: 500 }
//     );
//   }
// }