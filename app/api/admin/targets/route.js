import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const targets = await sql`
      SELECT mt.*, c.name as chit_name 
      FROM monthly_targets mt 
      JOIN chits c ON mt.chit_id = c.id 
      ORDER BY mt.month_year DESC
    `;
    return NextResponse.json({ success: true, data: targets });
  } catch (error) {
    console.error('Fetch Targets Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch targets' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { chit_id, month_year, target_amount } = await req.json();
    if (!chit_id || !month_year || !target_amount) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    // Upsert logic
    const result = await sql`
      INSERT INTO monthly_targets (chit_id, month_year, target_amount) 
      VALUES (${chit_id}, ${month_year}, ${target_amount}) 
      ON CONFLICT (chit_id, month_year) 
      DO UPDATE SET target_amount = ${target_amount} 
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Set Target Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to set target' }, { status: 500 });
  }
}