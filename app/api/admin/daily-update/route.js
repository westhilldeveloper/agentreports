import sql from '@/lib/db';
import { NextResponse } from 'next/server';

// ========== GET ==========
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const list = searchParams.get('list');
    const chitId = searchParams.get('chitId');
    const agentId = searchParams.get('agentId');
    const month = searchParams.get('month');

    // If list=true → return collection list with filters
    if (list === 'true') {
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
    // ✅ Cast month_year to text for LIKE comparison
    query += ` AND c.month_year::text LIKE $${idx++} || '%'`;
    params.push(month);
  }
  query += ` ORDER BY c.updated_at DESC`;
  const result = await sql.query(query, params);
  return NextResponse.json({ success: true, data: result.rows || result });
}

    // Otherwise → return dropdowns (agents, chits, tickets)
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
    console.error('GET Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch data' }, { status: 500 });
  }
}

// ========== POST ==========
export async function POST(req) {
  try {
    const { agentId, chitId, ticketNumber, monthYear, pendingAmount } = await req.json();

    if (!agentId || !chitId || !ticketNumber || !monthYear || pendingAmount === undefined) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    // ✅ Validate agent exists
    const agentCheck = await sql`SELECT id FROM agents WHERE id = ${agentId}`;
    if (agentCheck.length === 0) {
      return NextResponse.json({ success: false, message: 'Agent not found' }, { status: 400 });
    }

    // ✅ Validate chit exists
    const chitCheck = await sql`SELECT id FROM chits WHERE id = ${chitId}`;
    if (chitCheck.length === 0) {
      return NextResponse.json({ success: false, message: 'Chit not found' }, { status: 400 });
    }

    // 1. Ensure ticket is assigned
    let agentTicketId;
    const existing = await sql`
      SELECT id FROM agent_tickets 
      WHERE chit_id = ${chitId} AND ticket_number = ${ticketNumber}
    `;
    if (existing.length > 0) {
      const agentTicket = await sql`
        SELECT id FROM agent_tickets 
        WHERE chit_id = ${chitId} AND ticket_number = ${ticketNumber} AND agent_id = ${agentId}
      `;
      if (agentTicket.length === 0) {
        return NextResponse.json({ success: false, message: 'Ticket assigned to another agent' }, { status: 400 });
      }
      agentTicketId = agentTicket[0].id;
    } else {
      const newAssignment = await sql`
        INSERT INTO agent_tickets (agent_id, chit_id, ticket_number) 
        VALUES (${agentId}, ${chitId}, ${ticketNumber}) RETURNING id
      `;
      agentTicketId = newAssignment[0].id;
    }

    // 2. Get target
    const targetResult = await sql`
      SELECT target_amount FROM monthly_targets 
      WHERE chit_id = ${chitId} AND month_year = ${monthYear}
    `;
    if (targetResult.length === 0) {
      return NextResponse.json({ success: false, message: 'Target not set for this month' }, { status: 400 });
    }
    const target = parseFloat(targetResult[0].target_amount);
    const collected = target - parseFloat(pendingAmount);

    // 3. Upsert into collections
    const upsert = await sql`
      INSERT INTO collections (agent_ticket_id, month_year, pending_amount, collected_amount)
      VALUES (${agentTicketId}, ${monthYear}, ${parseFloat(pendingAmount)}, ${collected})
      ON CONFLICT (agent_ticket_id, month_year) 
      DO UPDATE SET pending_amount = ${parseFloat(pendingAmount)}, collected_amount = ${collected}, updated_at = NOW()
      RETURNING *
    `;

    // 4. Insert into history
    await sql`
      INSERT INTO collection_history (agent_ticket_id, month_year, pending_amount, collected_amount)
      VALUES (${agentTicketId}, ${monthYear}, ${parseFloat(pendingAmount)}, ${collected})
    `;

    return NextResponse.json({ success: true, data: upsert[0] });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update collection' }, { status: 500 });
  }
}

// ========== PUT ==========
export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    }

    const { pendingAmount } = await req.json();
    if (pendingAmount === undefined || isNaN(pendingAmount)) {
      return NextResponse.json({ success: false, message: 'Invalid pending amount' }, { status: 400 });
    }

    // Get existing record and target
    const existing = await sql`
      SELECT c.agent_ticket_id, c.month_year, mt.target_amount
      FROM collections c
      JOIN agent_tickets at ON c.agent_ticket_id = at.id
      JOIN monthly_targets mt ON mt.chit_id = (SELECT chit_id FROM agent_tickets WHERE id = c.agent_ticket_id)
      WHERE c.id = ${parseInt(id)}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: 'Collection not found' }, { status: 404 });
    }

    const target = parseFloat(existing[0].target_amount);
    const collected = target - parseFloat(pendingAmount);

    const result = await sql`
      UPDATE collections
      SET pending_amount = ${parseFloat(pendingAmount)},
          collected_amount = ${collected},
          updated_at = NOW()
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
  }
}

// ========== DELETE ==========
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM collections WHERE id = ${parseInt(id)} RETURNING id
    `;
    if (result.length === 0) {
      return NextResponse.json({ success: false, message: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}