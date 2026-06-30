import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { pendingAmount } = await request.json();

    if (pendingAmount === undefined || isNaN(pendingAmount)) {
      return NextResponse.json({ success: false, message: 'Invalid pending amount' }, { status: 400 });
    }

    // First get the agent_ticket_id and month_year to recalc collected
    const existing = await sql`
      SELECT agent_ticket_id, month_year, target_amount
      FROM collections c
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

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const result = await sql`
      DELETE FROM collections WHERE id = ${parseInt(id)} RETURNING id
    `;
    if (result.length === 0) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}