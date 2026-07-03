import sql from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT: Update opening balance for a specific agent_ticket
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { openingBalance } = await req.json();

    if (openingBalance === undefined || isNaN(openingBalance)) {
      return NextResponse.json(
        { success: false, message: 'Valid opening balance is required' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existing = await sql`
      SELECT id FROM agent_tickets WHERE id = ${parseInt(id)}
    `;
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Update opening balance
    await sql`
      UPDATE agent_tickets 
      SET opening_balance = ${parseFloat(openingBalance)}
      WHERE id = ${parseInt(id)}
    `;

    return NextResponse.json({ success: true, message: 'Opening balance updated' });
  } catch (error) {
    console.error('PUT Opening Balance Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update opening balance' },
      { status: 500 }
    );
  }
}

// DELETE: Reset opening balance to 0 (soft delete)
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // Check if record exists
    const existing = await sql`
      SELECT id FROM agent_tickets WHERE id = ${parseInt(id)}
    `;
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Reset opening balance to 0
    await sql`
      UPDATE agent_tickets 
      SET opening_balance = 0
      WHERE id = ${parseInt(id)}
    `;

    return NextResponse.json({ success: true, message: 'Opening balance reset to 0' });
  } catch (error) {
    console.error('DELETE Opening Balance Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset opening balance' },
      { status: 500 }
    );
  }
}