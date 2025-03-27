import { prisma } from '@/lib/prisma';
import { PushSubscriptionFields } from '@/types/types';
import { NextRequest, NextResponse } from 'next/server';

// GET: 사용자 구독 상태 조회
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const airportCode = searchParams.get('airportCode');
  const lineType = searchParams.get('lineType');
  const ioType = searchParams.get('ioType');

  if (!userId || !airportCode || !lineType || !ioType) {
    return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
  }

  try {
    const subscription = await prisma.pushSubscription.findUnique({
      where: {
        userId_airportCode_lineType_ioType: {
          userId,
          airportCode,
          lineType,
          ioType,
        },
      },
      select: {
        enabled: true,
      },
    });

    return NextResponse.json({
      enabled: subscription?.enabled ?? false,
    });
  } catch (err) {
    console.error('Failed to fetch subscription status:', err);
    return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 });
  }
}

// POST: 구독 등록 또는 수정 (푸시 키, 상태 포함)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    endpoint,
    keys,
    userId,
    airportCode,
    lineType,
    ioType,
    enabled = false,
  }: PushSubscriptionFields = body;

  if (
    !endpoint ||
    !keys?.auth ||
    !keys?.p256dh ||
    !userId ||
    !airportCode ||
    !lineType ||
    !ioType
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    await prisma.pushSubscription.upsert({
      where: {
        userId_airportCode_lineType_ioType: {
          userId,
          airportCode,
          lineType,
          ioType,
        },
      },
      update: {
        endpoint,
        auth: keys.auth,
        p256dh: keys.p256dh,
        enabled,
      },
      create: {
        userId,
        endpoint,
        auth: keys.auth,
        p256dh: keys.p256dh,
        airportCode,
        lineType,
        ioType,
        enabled,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to save subscription:', err);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

// PATCH: enabled 상태만 토글 (스위치 on/off)
// 사용자가 알림만 끄는 경우
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { userId, airportCode, lineType, ioType, enabled } = body;

  if (!userId || !airportCode || !lineType || !ioType || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  try {
    const updated = await prisma.pushSubscription.updateMany({
      where: {
        userId,
        airportCode,
        lineType,
        ioType,
      },
      data: {
        enabled,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to update subscription:', err);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}

// DELETE: 구독 제거 (로그아웃, 푸시 만료 등)
// 매번 스위치를 끌 때마다 Delete 처리하면 비효율적이므로,
// 스위치 on/off는 patch로 기능 구현
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { userId, airportCode, lineType, ioType } = body;

  if (!userId || !airportCode || !lineType || !ioType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    await prisma.pushSubscription.deleteMany({
      where: {
        userId,
        airportCode,
        lineType,
        ioType,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete subscription:', err);
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
  }
}
