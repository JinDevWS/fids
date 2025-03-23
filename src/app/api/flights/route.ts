import { syncFlights } from '@/services/flightService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await syncFlights();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
