import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const flights = await prisma.flight.findMany({
    orderBy: { etd: 'asc' },
    take: 100,
  });

  return NextResponse.json(flights);
}
