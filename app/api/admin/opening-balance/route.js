import sql from '@/lib/db';
import { NextResponse } from 'next/server';

// GET: Fetch all opening balances
export async function GET() {
  try {
    const query = `
      SELECT 
        at.id,
        at.ticket_number,
        at.opening_balance,
        ch.name AS chit_name,
        a.name AS agent_name
      FROM agent_tickets at
      JOIN chits ch ON at.chit_id = ch.id
      LEFT JOIN agents a ON at.agent_id = a.id
      ORDER BY ch.name, at.ticket_number
    `;
    const result = await sql.query(query);
    const rows = result.rows || result;
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('GET Opening Balance Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch' }, { status: 500 });
  }
}

// POST: Update opening balance for a ticket
export async function POST(req) {
  try {
    const { chitId, ticketNumber, openingBalance } = await req.json();

    if (!chitId || !ticketNumber || openingBalance === undefined) {
      return NextResponse.json(
        { success: false, message: 'Chit, Ticket, and Opening Balance are required' },
        { status: 400 }
      );
    }

    // Find the agent_ticket record
    const existing = await sql`
      SELECT id FROM agent_tickets 
      WHERE chit_id = ${parseInt(chitId)} AND ticket_number = ${parseInt(ticketNumber)}
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found or not assigned' },
        { status: 404 }
      );
    }

    // Update the opening balance
    await sql`
      UPDATE agent_tickets 
      SET opening_balance = ${parseFloat(openingBalance)}
      WHERE id = ${existing[0].id}
    `;

    return NextResponse.json({ success: true, message: 'Opening balance updated' });
  } catch (error) {
    console.error('POST Opening Balance Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
  }
}