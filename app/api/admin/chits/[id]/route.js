import sql from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT: Update chit name and/or total_tickets
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { name, total_tickets, auction_date } = await req.json();

    if (!name || !total_tickets || !auction_date) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE chits 
      SET name = ${name}, total_tickets = ${total_tickets}, auction_date = ${auction_date}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: 'Chit not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Update Chit Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update chit' }, { status: 500 });
  }
}

// DELETE: Remove a chit (cascade will delete agent_tickets and collections if set up)
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // Check if chit has any assigned tickets (optional safety check)
    const tickets = await sql`
      SELECT id FROM agent_tickets WHERE chit_id = ${id} LIMIT 1
    `;
    if (tickets.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete chit – it has assigned tickets' },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM chits WHERE id = ${id} RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Chit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Chit deleted successfully' });
  } catch (error) {
    console.error('Delete Chit Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete chit' },
      { status: 500 }
    );
  }
}