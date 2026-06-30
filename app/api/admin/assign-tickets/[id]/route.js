import sql from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT: Reassign a ticket to a different agent
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

    // Check if ticket is already assigned to another agent (optional)
    const ticket = await sql`
      SELECT chit_id, ticket_number FROM agent_tickets WHERE id = ${id}
    `;
    const alreadyAssigned = await sql`
      SELECT id FROM agent_tickets 
      WHERE chit_id = ${ticket[0].chit_id} 
        AND ticket_number = ${ticket[0].ticket_number} 
        AND agent_id = ${agentId}
        AND id != ${id}
    `;
    if (alreadyAssigned.length > 0) {
      return NextResponse.json(
        { success: false, message: 'This ticket is already assigned to the selected agent' },
        { status: 400 }
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

    // ✅ Delete history records first
    await sql`
      DELETE FROM collection_history WHERE agent_ticket_id = ${id}
    `;

    // ✅ Delete collection records
    await sql`
      DELETE FROM collections WHERE agent_ticket_id = ${id}
    `;

    // ✅ Now delete the assignment
    await sql`
      DELETE FROM agent_tickets WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      message: 'Ticket unassigned and all related data deleted successfully',
    });
  } catch (error) {
    console.error('Unassign Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to unassign ticket' },
      { status: 500 }
    );
  }
}