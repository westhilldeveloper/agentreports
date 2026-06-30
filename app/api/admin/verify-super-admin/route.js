import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { password } = await req.json();
    const superPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!superPassword) {
      return NextResponse.json(
        { success: false, message: 'Super admin password not configured' },
        { status: 500 }
      );
    }

    if (password === superPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}