

import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const chitId = searchParams.get('chitId');
    const agentId = searchParams.get('agentId');

    const agents = await sql`SELECT id, name, agent_code FROM agents ORDER BY name`;
    const chits = await sql`SELECT id, name, total_tickets FROM chits ORDER BY name`;

    let tickets = [];
    if (chitId) {
      const chitResult = await sql`SELECT total_tickets FROM chits WHERE id = ${chitId}`;
      const totalTickets = chitResult[0]?.total_tickets || 0;
      const allTicketNumbers = Array.from({ length: totalTickets }, (_, i) => i + 1);

      const assignments = await sql`
        SELECT at.ticket_number, a.name as assigned_agent_name, a.id as assigned_agent_id
        FROM agent_tickets at
        JOIN agents a ON at.agent_id = a.id
        WHERE at.chit_id = ${chitId}
      `;
      const assignedMap = {};
      assignments.forEach(a => {
        assignedMap[a.ticket_number] = {
          agentName: a.assigned_agent_name,
          agentId: a.assigned_agent_id,
        };
      });

      tickets = allTicketNumbers.map(num => {
        const assigned = assignedMap[num];
        if (assigned) {
          return {
            ticketNumber: num,
            isAssigned: true,
            assignedToAgentId: assigned.agentId,
            assignedToAgentName: assigned.agentName,
            isAssignedToSelected: agentId ? assigned.agentId === parseInt(agentId) : false,
          };
        } else {
          return {
            ticketNumber: num,
            isAssigned: false,
            assignedToAgentId: null,
            assignedToAgentName: null,
            isAssignedToSelected: false,
          };
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: { agents, chits, tickets },
    });
  } catch (error) {
    console.error('Daily Update GET Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch data' }, { status: 500 });
  }
}

// ========== POST handler with history logging ==========
export async function POST(req) {
  try {
    const { agentId, chitId, ticketNumber, monthYear, pendingAmount } = await req.json();

    // Validate inputs
    if (!agentId || !chitId || !ticketNumber || !monthYear || pendingAmount === undefined) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    // 1. Check if ticket is already assigned
    const existing = await sql`
      SELECT id FROM agent_tickets 
      WHERE chit_id = ${chitId} AND ticket_number = ${ticketNumber}
    `;

    let agentTicketId;
    if (existing.length > 0) {
      const agentTicket = await sql`
        SELECT id FROM agent_tickets 
        WHERE chit_id = ${chitId} AND ticket_number = ${ticketNumber} AND agent_id = ${agentId}
      `;
      if (agentTicket.length > 0) {
        agentTicketId = agentTicket[0].id;
      } else {
        return NextResponse.json({ success: false, message: 'This ticket is already assigned to another agent' }, { status: 400 });
      }
    } else {
      const newAssignment = await sql`
        INSERT INTO agent_tickets (agent_id, chit_id, ticket_number) 
        VALUES (${agentId}, ${chitId}, ${ticketNumber}) 
        RETURNING id
      `;
      agentTicketId = newAssignment[0].id;
    }

    // 2. Get target
    const targetResult = await sql`
      SELECT target_amount FROM monthly_targets 
      WHERE chit_id = ${chitId} AND month_year = ${monthYear}
    `;
    if (targetResult.length === 0) {
      return NextResponse.json({ success: false, message: 'Target not set for this chit and month' }, { status: 400 });
    }
    const targetAmount = parseFloat(targetResult[0].target_amount);
    const pending = parseFloat(pendingAmount);
    const collected = targetAmount - pending;

    // 3. Update collections table (current value)
    await sql`
      INSERT INTO collections (agent_ticket_id, month_year, pending_amount, collected_amount) 
      VALUES (${agentTicketId}, ${monthYear}, ${pending}, ${collected}) 
      ON CONFLICT (agent_ticket_id, month_year) 
      DO UPDATE SET pending_amount = ${pending}, collected_amount = ${collected}, updated_at = NOW()
    `;

    // 4. Insert into history (append-only log)
    await sql`
      INSERT INTO collection_history (agent_ticket_id, month_year, pending_amount, collected_amount)
      VALUES (${agentTicketId}, ${monthYear}, ${pending}, ${collected})
    `;

    return NextResponse.json({
      success: true,
      data: { agentTicketId, pending, collected },
    });
  } catch (error) {
    console.error('Daily Update POST Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update collection' }, { status: 500 });
  }
}