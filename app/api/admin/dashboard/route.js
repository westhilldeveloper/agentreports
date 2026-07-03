import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month');
    const chitId = searchParams.get('chitId');

    let monthYear;
    if (monthParam) {
      monthYear = monthParam + '-01';
    } else {
      const now = new Date();
      const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      monthYear = m + '-01';
    }

    // ---------- 1. Summary & Breakdown by Chit ----------
    // Query: chit target per ticket + sum of opening balances
    let chitTargetsQuery = `
      SELECT 
        mt.chit_id,
        mt.target_amount,
        ch.name AS chit_name,
        COALESCE(SUM(at.opening_balance), 0) AS total_opening_balance,
        COUNT(at.id) AS ticket_count
      FROM monthly_targets mt
      JOIN chits ch ON mt.chit_id = ch.id
      LEFT JOIN agent_tickets at ON at.chit_id = ch.id
      WHERE mt.month_year = $1
    `;
    const params = [monthYear];
    if (chitId) {
      chitTargetsQuery += ` AND mt.chit_id = $2`;
      params.push(parseInt(chitId));
    }
    chitTargetsQuery += `
      GROUP BY mt.chit_id, mt.target_amount, ch.name
    `;

    const chitTargetsResult = await sql.query(chitTargetsQuery, params);
    const chitTargets = chitTargetsResult.rows || chitTargetsResult;

    if (chitTargets.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: { totalTarget: 0, totalCollected: 0, totalPending: 0 },
          dailyTrend: [],
          breakdown: [],
          agentsBreakdown: [],
          monthlyTrend: [],
        },
      });
    }

    let breakdown = [];
    let grandTarget = 0;
    let grandCollected = 0;

    for (const row of chitTargets) {
      const chitIdVal = row.chit_id;
      const targetPerTicket = parseFloat(row.target_amount) || 0;
      const chitName = row.chit_name;
      const ticketCount = parseInt(row.ticket_count) || 0;
      const totalOpeningBalance = parseFloat(row.total_opening_balance) || 0;

      // Total target for this chit = (target per ticket * ticket count) + total opening balance
      const totalTargetForChit = (targetPerTicket * ticketCount) + totalOpeningBalance;

      // Collected for this chit (sum of collected_amount across all tickets)
      let collectedQuery = `
        SELECT SUM(c.collected_amount) as total_collected
        FROM collections c
        JOIN agent_tickets at ON c.agent_ticket_id = at.id
        WHERE at.chit_id = $1 AND c.month_year = $2
      `;
      const collectedParams = [chitIdVal, monthYear];
      const collectedRes = await sql.query(collectedQuery, collectedParams);
      const collectedRows = collectedRes.rows || collectedRes;
      const collected = parseFloat(collectedRows[0]?.total_collected) || 0;

      const pending = totalTargetForChit - collected;
      grandTarget += totalTargetForChit;
      grandCollected += collected;

      breakdown.push({
        chitId: chitIdVal,
        chitName,
        target: totalTargetForChit,
        collected,
        pending,
      });
    }

    const totalPending = grandTarget - grandCollected;

    // ---------- 2. Daily Trend (unchanged) ----------
    // ---------- 2. Daily Trend (fixed: non-negative daily collections) ----------
// Build the query with optional chit filter
let dailyQuery = `
  WITH daily_last AS (
    SELECT 
      TO_CHAR(DATE(ch.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), 'YYYY-MM-DD') as date,
      ch.agent_ticket_id,
      ch.collected_amount,
      ROW_NUMBER() OVER (
        PARTITION BY ch.agent_ticket_id, DATE(ch.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')
        ORDER BY ch.updated_at DESC
      ) as rn
    FROM collection_history ch
    JOIN agent_tickets at ON ch.agent_ticket_id = at.id
    WHERE ch.month_year = $1
`;
const dailyParams = [monthYear];
if (chitId) {
  dailyQuery += ` AND at.chit_id = $2`;
  dailyParams.push(parseInt(chitId));
}
dailyQuery += `
  ),
  daily_last_cumulative AS (
    SELECT date, agent_ticket_id, collected_amount
    FROM daily_last
    WHERE rn = 1
  ),
  daily_with_prev AS (
    SELECT 
      date,
      agent_ticket_id,
      collected_amount,
      LAG(collected_amount, 1, 0) OVER (
        PARTITION BY agent_ticket_id 
        ORDER BY date
      ) as prev_collected
    FROM daily_last_cumulative
  )
  SELECT 
    date,
    SUM(GREATEST(0, collected_amount - prev_collected)) as daily_collected
  FROM daily_with_prev
  GROUP BY date
  ORDER BY date
`;

const dailyResult = await sql.query(dailyQuery, dailyParams);
const dailyRows = dailyResult.rows || dailyResult;

// Generate all dates of the month
const year = parseInt(monthYear.slice(0, 4));
const month = parseInt(monthYear.slice(5, 7));
const daysInMonth = new Date(year, month, 0).getDate();
const allDates = Array.from({ length: daysInMonth }, (_, i) => {
  const day = String(i + 1).padStart(2, '0');
  return `${monthYear.slice(0, 7)}-${day}`;
});

// Map results to all dates (fill missing with 0)
const dailyMap = {};
dailyRows.forEach(row => {
  dailyMap[row.date] = parseFloat(row.daily_collected) || 0;
});

const dailyTrend = allDates.map(date => ({
  date,
  collected: dailyMap[date] || 0,
}));

    // ---------- 3. Agents Breakdown (with opening balance) ----------
    let agentsQuery = `
      SELECT DISTINCT a.id, a.name, a.agent_code
      FROM agents a
      JOIN agent_tickets at ON a.id = at.agent_id
      JOIN monthly_targets mt ON mt.chit_id = at.chit_id AND mt.month_year = $1
    `;
    const agentsParams = [monthYear];
    if (chitId) {
      agentsQuery += ` AND at.chit_id = $2`;
      agentsParams.push(parseInt(chitId));
    }
    const agentsResult = await sql.query(agentsQuery, agentsParams);
    const agentsRows = agentsResult.rows || agentsResult;

    let agentsBreakdown = [];
    for (const agent of agentsRows) {
      // Sum target + opening balance for this agent
      let targetQuery = `
        SELECT 
          SUM(mt.target_amount) + COALESCE(SUM(at.opening_balance), 0) as total_target
        FROM agent_tickets at
        JOIN monthly_targets mt ON at.chit_id = mt.chit_id AND mt.month_year = $1
        WHERE at.agent_id = $2
      `;
      const targetParams = [monthYear, agent.id];
      if (chitId) {
        targetQuery += ` AND at.chit_id = $3`;
        targetParams.push(parseInt(chitId));
      }
      const targetRes = await sql.query(targetQuery, targetParams);
      const targetRows = targetRes.rows || targetRes;
      const target = parseFloat(targetRows[0]?.total_target) || 0;

      // Collected for this agent (sum of collected_amount)
      let collectedQuery = `
        SELECT SUM(c.collected_amount) as total_collected
        FROM collections c
        JOIN agent_tickets at ON c.agent_ticket_id = at.id
        WHERE at.agent_id = $1 AND c.month_year = $2
      `;
      const collectedParams = [agent.id, monthYear];
      if (chitId) {
        collectedQuery += ` AND at.chit_id = $3`;
        collectedParams.push(parseInt(chitId));
      }
      const collectedRes = await sql.query(collectedQuery, collectedParams);
      const collectedRows = collectedRes.rows || collectedRes;
      const collected = parseFloat(collectedRows[0]?.total_collected) || 0;

      agentsBreakdown.push({
        agentId: agent.id,
        agentName: agent.name,
        agentCode: agent.agent_code,
        target,
        collected,
        pending: target - collected,
      });
    }

    agentsBreakdown.sort((a, b) => b.collected - a.collected);

    // ---------- 4. Monthly Trend (unchanged) ----------
    let monthlyTrendQuery = `
      SELECT 
        TO_CHAR(c.month_year, 'Mon YYYY') as month_label,
        SUM(c.collected_amount) as total_collected,
        SUM(c.pending_amount) as total_pending
      FROM collections c
    `;
    if (chitId) {
      monthlyTrendQuery += ` JOIN agent_tickets at ON c.agent_ticket_id = at.id AND at.chit_id = ${parseInt(chitId)}`;
    }
    monthlyTrendQuery += `
      GROUP BY c.month_year
      ORDER BY c.month_year DESC
      LIMIT 6
    `;
    const monthlyTrendResult = await sql.query(monthlyTrendQuery);
    const monthlyTrendRows = monthlyTrendResult.rows || monthlyTrendResult;
    const monthlyTrend = monthlyTrendRows.reverse();

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalTarget: grandTarget,
          totalCollected: grandCollected,
          totalPending,
        },
        dailyTrend,
        breakdown,
        agentsBreakdown,
        monthlyTrend,
      },
    });
  } catch (error) {
    console.error('Admin Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}