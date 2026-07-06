import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { agentId, chitId, ticketNumber, customer_name, customer_phone } = await req.json();

    if (!agentId || !chitId || !ticketNumber) {
      return NextResponse.json(
        { success: false, message: 'Agent, Chit, and Ticket are required' },
        { status: 400 }
      );
    }

    // Check if ticket is already assigned
    const existing = await sql`
      SELECT id FROM agent_tickets 
      WHERE chit_id = ${chitId} AND ticket_number = ${ticketNumber}
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'This ticket is already assigned to another agent' },
        { status: 400 }
      );
    }

    // Assign ticket to agent with customer details
    await sql`
      INSERT INTO agent_tickets (agent_id, chit_id, ticket_number, customer_name, customer_phone) 
      VALUES (${agentId}, ${chitId}, ${ticketNumber}, ${customer_name || null}, ${customer_phone || null})
    `;

    return NextResponse.json({
      success: true,
      message: `Ticket ${ticketNumber} assigned successfully`,
    });
  } catch (error) {
    console.error('Assign Ticket Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to assign ticket' },
      { status: 500 }
    );
  }
}

// Optional: GET to fetch assigned tickets for an agent or chit
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const chitId = searchParams.get('chitId');

    let query = `
      SELECT 
        at.id, 
        at.ticket_number, 
        at.agent_id,
        at.customer_name,
        at.customer_phone,
        TO_CHAR(at.assigned_at, 'DD Mon YYYY') as assigned_date,
        c.name as chit_name, 
        a.name as agent_name, 
        a.agent_code
      FROM agent_tickets at
      JOIN chits c ON at.chit_id = c.id
      JOIN agents a ON at.agent_id = a.id
    `;
    const conditions = [];
    const params = [];

    if (agentId) {
      conditions.push(`at.agent_id = $${params.length + 1}`);
      params.push(agentId);
    }
    if (chitId) {
      conditions.push(`at.chit_id = $${params.length + 1}`);
      params.push(chitId);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY at.id DESC';

    const result = await sql.query(query, params);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Fetch Assignments Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch assignments' }, { status: 500 });
  }
}

