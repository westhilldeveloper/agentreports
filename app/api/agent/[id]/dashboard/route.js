import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const agentId = parseInt(id);
    if (isNaN(agentId)) {
      return NextResponse.json({ success: false, message: 'Invalid agent ID' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const chitId = searchParams.get('chitId');

    let monthParam = searchParams.get('month');
    if (!monthParam) {
      const now = new Date();
      monthParam = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    const monthYear = monthParam + '-01';

    // 1. Get tickets (optionally filtered by chit)
    let ticketsQuery = sql`
  SELECT at.id as agent_ticket_id, at.ticket_number, c.id as chit_id, c.name as chit_name, c.auction_date
  FROM agent_tickets at
  JOIN chits c ON at.chit_id = c.id
  WHERE at.agent_id = ${agentId}
`;
if (chitId) {
  ticketsQuery = sql`
    SELECT at.id as agent_ticket_id, at.ticket_number, c.id as chit_id, c.name as chit_name, c.auction_date
    FROM agent_tickets at
    JOIN chits c ON at.chit_id = c.id
    WHERE at.agent_id = ${agentId} AND at.chit_id = ${chitId}
  `;
}
    const tickets = await ticketsQuery;

    if (tickets.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: { totalTarget: 0, totalCollected: 0, totalPending: 0 },
          breakdown: [],
          monthlyTrend: [],
          dailyTrend: [],
        },
      });
    }

    // 2. Compute data per ticket
    const breakdownMap = {};
    let currentMonthTargetTotal = 0;
    let currentMonthCollectedTotal = 0;
    let cumulativePendingTotal = 0;

    for (const ticket of tickets) {
      // ---- Current month target ----
      const targetResult = await sql`
        SELECT target_amount FROM monthly_targets
        WHERE chit_id = ${ticket.chit_id} AND month_year = ${monthYear}
      `;
      const currentTarget = targetResult.length > 0 ? parseFloat(targetResult[0].target_amount) : 0;

      // ---- Current month collected ----
      const collectionResult = await sql`
        SELECT collected_amount FROM collections
        WHERE agent_ticket_id = ${ticket.agent_ticket_id} AND month_year = ${monthYear}
      `;
      const currentCollected = collectionResult.length > 0 ? parseFloat(collectionResult[0].collected_amount) : 0;

      // ---- Cumulative target up to current month ----
      const cumTargetResult = await sql`
        SELECT SUM(target_amount) as total FROM monthly_targets
        WHERE chit_id = ${ticket.chit_id} AND month_year <= ${monthYear}
      `;
      const cumTarget = cumTargetResult.length > 0 ? parseFloat(cumTargetResult[0].total) || 0 : 0;

      // ---- Cumulative collected up to current month ----
      const cumCollectedResult = await sql`
        SELECT SUM(collected_amount) as total FROM collections
        WHERE agent_ticket_id = ${ticket.agent_ticket_id} AND month_year <= ${monthYear}
      `;
      const cumCollected = cumCollectedResult.length > 0 ? parseFloat(cumCollectedResult[0].total) || 0 : 0;

      // ---- Pending = cumulative target - cumulative collected (carryover) ----
      const pending = cumTarget - cumCollected;

      // ---- Aggregate summary totals ----
      currentMonthTargetTotal += currentTarget;
      currentMonthCollectedTotal += currentCollected;
      cumulativePendingTotal += pending;

      // ---- Build breakdown entry ----
      const chitKey = ticket.chit_name;
      if (!breakdownMap[chitKey]) {
        breakdownMap[chitKey] = {
          chitId: ticket.chit_id,
          chitName: chitKey,
          auctionDate: ticket.auction_date,
          target: 0,
          collected: 0,
          pending: 0,
          tickets: [],
        };
      }
      breakdownMap[chitKey].target += currentTarget;
      breakdownMap[chitKey].collected += currentCollected;
      breakdownMap[chitKey].pending += pending;
      breakdownMap[chitKey].tickets.push({
        ticketNumber: ticket.ticket_number,
        monthYear,
        target: currentTarget,
        collected: currentCollected,
        pending: pending,
      });
    }

    const breakdown = Object.values(breakdownMap);

    // 3. Monthly trend (per‑month totals – unchanged)
    const agentTicketIds = tickets.map(t => t.agent_ticket_id);
    const monthlyTrend = await sql`
      SELECT 
        TO_CHAR(c.month_year, 'Mon YYYY') as month_label,
        SUM(c.collected_amount) as total_collected,
        SUM(c.pending_amount) as total_pending
      FROM collections c
      WHERE c.agent_ticket_id = ANY(${agentTicketIds})
      GROUP BY c.month_year
      ORDER BY c.month_year DESC
      LIMIT 6
    `;

    // 4. Daily trend (unchanged)
    const year = parseInt(monthYear.slice(0, 4));
    const month = parseInt(monthYear.slice(5, 7));
    const daysInMonth = new Date(year, month, 0).getDate();

    const allDates = Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      return `${monthYear.slice(0, 7)}-${day}`;
    });

    let dailyQuery = sql`
      WITH daily_totals AS (
        SELECT 
          DATE(ch.updated_at) as date,
          ch.agent_ticket_id,
          ch.collected_amount,
          LAG(ch.collected_amount) OVER (PARTITION BY ch.agent_ticket_id ORDER BY ch.updated_at) as prev_collected
        FROM collection_history ch
        JOIN agent_tickets at ON ch.agent_ticket_id = at.id
        WHERE at.agent_id = ${agentId}
          AND ch.month_year = ${monthYear}
    `;
    if (chitId) {
      dailyQuery = sql`
        WITH daily_totals AS (
          SELECT 
            DATE(ch.updated_at) as date,
            ch.agent_ticket_id,
            ch.collected_amount,
            LAG(ch.collected_amount) OVER (PARTITION BY ch.agent_ticket_id ORDER BY ch.updated_at) as prev_collected
          FROM collection_history ch
          JOIN agent_tickets at ON ch.agent_ticket_id = at.id
          WHERE at.agent_id = ${agentId}
            AND at.chit_id = ${chitId}
            AND ch.month_year = ${monthYear}
        )
        SELECT 
          date,
          SUM(collected_amount - COALESCE(prev_collected, 0)) as daily_collected
        FROM daily_totals
        GROUP BY date
      `;
    } else {
      dailyQuery = sql`
        WITH daily_totals AS (
          SELECT 
            DATE(ch.updated_at) as date,
            ch.agent_ticket_id,
            ch.collected_amount,
            LAG(ch.collected_amount) OVER (PARTITION BY ch.agent_ticket_id ORDER BY ch.updated_at) as prev_collected
          FROM collection_history ch
          JOIN agent_tickets at ON ch.agent_ticket_id = at.id
          WHERE at.agent_id = ${agentId}
            AND ch.month_year = ${monthYear}
        )
        SELECT 
          date,
          SUM(collected_amount - COALESCE(prev_collected, 0)) as daily_collected
        FROM daily_totals
        GROUP BY date
      `;
    }

    const actualDaily = await dailyQuery;

    const dailyMap = {};
    actualDaily.forEach(row => {
      const dateStr = row.date.toISOString().slice(0, 10);
      dailyMap[dateStr] = parseFloat(row.daily_collected) || 0;
    });

    const dailyTrend = allDates.map(date => ({
      date,
      collected: dailyMap[date] || 0,
    }));

    // 5. Monthly statement (history of updates for the selected month)
const history = await sql`
  WITH history_with_diff AS (
    SELECT 
      DATE(ch.updated_at) as date,
      c.name as chit_name,
      at.ticket_number,
      ch.collected_amount,
      ch.pending_amount,
      LAG(ch.collected_amount) OVER (
        PARTITION BY ch.agent_ticket_id 
        ORDER BY ch.updated_at
      ) as prev_collected
    FROM collection_history ch
    JOIN agent_tickets at ON ch.agent_ticket_id = at.id
    JOIN chits c ON at.chit_id = c.id
    WHERE at.agent_id = ${agentId}
      AND ch.month_year = ${monthYear}
      ${chitId ? sql`AND at.chit_id = ${chitId}` : sql``}
  )
  SELECT 
    date,
    chit_name,
    ticket_number,
    (collected_amount - COALESCE(prev_collected, 0)) as daily_collected,
    pending_amount as balance
  FROM history_with_diff
  ORDER BY date ASC, ticket_number ASC
`;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalTarget: currentMonthTargetTotal,
          totalCollected: currentMonthCollectedTotal,
          totalPending: cumulativePendingTotal,
        },
        breakdown,
        monthlyTrend: monthlyTrend.reverse(),
        dailyTrend,
         history,
      },
    });

    
  } catch (error) {
    console.error('Agent Dashboard Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}