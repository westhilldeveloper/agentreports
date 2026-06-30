import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { agentId, chitId, ticketNumber } = await req.json();

    // Validate inputs
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

    // Assign ticket to agent
    await sql`
      INSERT INTO agent_tickets (agent_id, chit_id, ticket_number) 
      VALUES (${agentId}, ${chitId}, ${ticketNumber})
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

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { agentId } = await req.json();

    if (!agentId) {
      return NextResponse.json(
        { success: false, message: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Check if the assignment exists
    const existing = await sql`
      SELECT id FROM agent_tickets WHERE id = ${id}
    `;
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Update the agent
    await sql`
      UPDATE agent_tickets SET agent_id = ${agentId} WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      message: 'Ticket reassigned successfully',
    });
  } catch (error) {
    console.error('Reassign Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reassign ticket' },
      { status: 500 }
    );
  }
}

// DELETE: Unassign a ticket (remove assignment)
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // Check if assignment exists
    const existing = await sql`
      SELECT id FROM agent_tickets WHERE id = ${id}
    `;
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check if there are any collections or history linked to this assignment
    const collections = await sql`
      SELECT id FROM collections WHERE agent_ticket_id = ${id} LIMIT 1
    `;
    if (collections.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot unassign – this ticket has collection records. Delete collections first.' },
        { status: 400 }
      );
    }

    const history = await sql`
      SELECT id FROM collection_history WHERE agent_ticket_id = ${id} LIMIT 1
    `;
    if (history.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot unassign – this ticket has history records. Delete history first.' },
        { status: 400 }
      );
    }

    // Delete the assignment
    await sql`
      DELETE FROM agent_tickets WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      message: 'Ticket unassigned successfully',
    });
  } catch (error) {
    console.error('Unassign Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to unassign ticket' },
      { status: 500 }
    );
  }
}