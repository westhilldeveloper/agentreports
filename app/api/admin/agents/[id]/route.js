import sql from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT: Update agent details
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { agent_code, name, phone, email, region_id, area_id } = await req.json();

    if (!agent_code || !name || !phone || !email) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    const result = await sql`
      UPDATE agents 
      SET agent_code = ${agent_code}, name = ${name}, phone = ${phone}, email = LOWER(${email}),
          region_id = ${region_id || null}, area_id = ${area_id || null}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Update Agent Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update agent' }, { status: 500 });
  }
}

// DELETE: Remove an agent
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // Check if agent has any assigned tickets
    const tickets = await sql`
      SELECT id FROM agent_tickets WHERE agent_id = ${id} LIMIT 1
    `;
    if (tickets.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete agent – they have assigned tickets' },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM agents WHERE id = ${id} RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Delete Agent Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}