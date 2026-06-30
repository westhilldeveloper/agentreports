import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const chits = await sql`SELECT * FROM chits ORDER BY id DESC`;
    return NextResponse.json({ success: true, data: chits });
  } catch (error) {
    console.error('Fetch Chits Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch chits' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, total_tickets, auction_date } = await req.json();
    if (!name || !total_tickets || !auction_date) {
      return NextResponse.json(
        { success: false, message: 'Name, total tickets, and auction date are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO chits (name, total_tickets, auction_date) 
      VALUES (${name}, ${total_tickets}, ${auction_date}) 
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Create Chit Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create chit' }, { status: 500 });
  }
}