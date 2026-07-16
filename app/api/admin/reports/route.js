import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const chitId = searchParams.get('chitId');
    const month = searchParams.get('month'); // "YYYY-MM"

    // Build base query to fetch all tickets (including those without collections)
    let ticketsQuery = `
      SELECT 
        at.id AS ticket_id,
        a.id AS agent_id,
        a.name AS agent_name,
        a.agent_code,
        ch.id AS chit_id,
        ch.name AS chit_name,
        at.ticket_number,
        COALESCE(mt.target_amount, 0) AS target_per_ticket,
        COALESCE(at.opening_balance, 0) AS opening_balance
      FROM agent_tickets at
      JOIN agents a ON at.agent_id = a.id
      JOIN chits ch ON at.chit_id = ch.id
      LEFT JOIN monthly_targets mt ON mt.chit_id = ch.id AND mt.month_year::text LIKE $1 || '%'
      WHERE 1=1
    `;
    const ticketParams = [];
    if (month) {
      ticketParams.push(month);
    }
    if (agentId) {
      ticketsQuery += ` AND a.id = $${ticketParams.length + 1}`;
      ticketParams.push(parseInt(agentId));
    }
    if (chitId) {
      ticketsQuery += ` AND ch.id = $${ticketParams.length + 1}`;
      ticketParams.push(parseInt(chitId));
    }

    const ticketResult = await sql.query(ticketsQuery, ticketParams);
    const ticketRows = ticketResult.rows || ticketResult;

    // For each ticket, fetch its collections for the month (if any)
    const formattedRows = [];
    for (const ticket of ticketRows) {
      let collected = 0;
      let pending = 0;
      let collectionDate = null;

      if (month) {
        const collectionQuery = `
          SELECT 
            SUM(collected_amount) as total_collected,
            SUM(pending_amount) as total_pending,
            MAX(updated_at) as last_collection_date
          FROM collections
          WHERE agent_ticket_id = $1 AND month_year::text LIKE $2 || '%'
        `;
        const collectionResult = await sql.query(collectionQuery, [ticket.ticket_id, month]);
        const collectionRows = collectionResult.rows || collectionResult;
        if (collectionRows.length > 0) {
          collected = parseFloat(collectionRows[0].total_collected) || 0;
          pending = parseFloat(collectionRows[0].total_pending) || 0;
          collectionDate = collectionRows[0].last_collection_date || null;
        }
      }

      // ─── Clamp collected to non‑negative ──────────────────────
      if (collected < 0) collected = 0;
      if (pending < 0) pending = 0;

      const targetPerTicket = parseFloat(ticket.target_per_ticket) || 0;
      const openingBalance = parseFloat(ticket.opening_balance) || 0;
      const totalTarget = targetPerTicket + openingBalance;

      // ─── Compute balance = totalTarget - collected, clamp to 0 ──
      let balance = totalTarget - collected;
      if (balance < 0) balance = 0;

      formattedRows.push({
        date: collectionDate, // will be null if no collection
        agent_name: ticket.agent_name,
        agent_code: ticket.agent_code,
        chit_name: ticket.chit_name,
        ticket_number: ticket.ticket_number,
        target: totalTarget,
        collected: collected,
        balance: balance,
      });
    }

    return NextResponse.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('Report API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
}