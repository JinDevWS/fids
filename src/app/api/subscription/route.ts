import {
  deletePushSubscUnique,
  getPushSubscEnable,
  updatePushSubsc,
  upsertPushSubsc,
} from '@/services/pushSubscriptionService';
import {
  PushSubscriptionFields,
  PushSubscriptionUniqueKeys,
  PushUpdateOptions,
} from '@/types/types';
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
    const subscriptionEnabled = await getPushSubscEnable({
      userId,
      airportCode,
      lineType,
      ioType,
    });

    return NextResponse.json({
      enabled: subscriptionEnabled?.enabled ?? false,
    });
  } catch (err) {
    console.error('Failed to fetch subscription status:', err);
    return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 });
  }
}

// POST: 구독 등록 또는 수정 (푸시 키, 상태 포함)
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (
    !body.endpoint ||
    !body.keys?.auth ||
    !body.keys?.p256dh ||
    !body.userId ||
    !body.airportCode ||
    !body.lineType ||
    !body.ioType
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const fields: PushSubscriptionFields = {
    endpoint: body.endpoint,
    keys: body.keys,
    userId: body.userId,
    airportCode: body.airportCode,
    lineType: body.lineType,
    ioType: body.ioType,
    enabled: body.enabled ?? false,
  };

  try {
    await upsertPushSubsc(fields);

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

  if (
    !body.userId ||
    !body.airportCode ||
    !body.lineType ||
    !body.ioType ||
    typeof body.enabled !== 'boolean'
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  const options: PushUpdateOptions = {
    userId: body.userId,
    airportCode: body.airportCode,
    lineType: body.lineType,
    ioType: body.ioType,
    enabled: body.enabled,
  };

  try {
    const updatedCount = await updatePushSubsc(options);

    if (updatedCount === 0) {
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

  if (!body.userId || !body.airportCode || !body.lineType || !body.ioType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const uniqueKeys: PushSubscriptionUniqueKeys = {
    userId: body.userId,
    airportCode: body.airportCode,
    lineType: body.lineType,
    ioType: body.ioType,
  };

  try {
    await deletePushSubscUnique(uniqueKeys);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete subscription:', err);
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
  }
}
