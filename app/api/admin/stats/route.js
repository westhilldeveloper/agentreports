import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const agents = await sql`SELECT COUNT(*) as count FROM agents`;
    const chits = await sql`SELECT COUNT(*) as count FROM chits`;
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const collections = await sql`
      SELECT SUM(collected_amount) as collected, SUM(pending_amount) as pending 
      FROM collections WHERE month_year = ${monthYear}
    `;
    return NextResponse.json({
      success: true,
      data: {
        agents: parseInt(agents[0].count),
        chits: parseInt(chits[0].count),
        collections: parseFloat(collections[0]?.collected || 0),
        pending: parseFloat(collections[0]?.pending || 0),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}