import sql from '@/lib/db';
import { sendOTPEmail } from '@/lib/nodemailer';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Save OTP to DB
    await sql`
      INSERT INTO agent_otps (email, otp, expires_at) 
      VALUES (${email}, ${otp}, ${expiresAt})
    `;

    // Send email
    const sent = await sendOTPEmail(email, otp);
    if (!sent) {
      return NextResponse.json({ success: false, message: 'Failed to send OTP email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}