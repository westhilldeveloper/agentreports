import sql from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT: Update a target (chit_id, month_year, target_amount)
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { chit_id, month_year, target_amount } = await req.json();

    if (!chit_id || !month_year || !target_amount) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Ensure month_year is a full date (YYYY-MM-DD)
    let formattedMonth = month_year;
    if (formattedMonth && formattedMonth.length === 7) {
      formattedMonth = formattedMonth + '-01';
    }

    // Check if the target exists
    const existing = await sql`
      SELECT id FROM monthly_targets WHERE id = ${id}
    `;
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Target not found' },
        { status: 404 }
      );
    }

    const result = await sql`
      UPDATE monthly_targets 
      SET chit_id = ${chit_id}, month_year = ${formattedMonth}, target_amount = ${target_amount}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Update Target Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update target' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a target
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // Check if any collections exist for this target (optional safety)
    // We'll check if there are collections for this chit + month
    const target = await sql`
      SELECT chit_id, month_year FROM monthly_targets WHERE id = ${id}
    `;
    if (target.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Target not found' },
        { status: 404 }
      );
    }

    // Optionally, check if there are collections using this target
    // We'll check if there's any collection for this chit and month
    const collections = await sql`
      SELECT id FROM collections 
      WHERE month_year = ${target[0].month_year} AND agent_ticket_id IN (
        SELECT id FROM agent_tickets WHERE chit_id = ${target[0].chit_id}
      )
      LIMIT 1
    `;
    if (collections.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete target – collections already exist for this chit and month' },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM monthly_targets WHERE id = ${id} RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Target not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Target deleted successfully' });
  } catch (error) {
    console.error('Delete Target Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete target' },
      { status: 500 }
    );
  }
}