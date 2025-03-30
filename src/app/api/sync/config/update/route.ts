// 공항코드 or 국제선/국내선 or 출발/도착 선택 중 하나라도 바뀌면 SyncConfig 테이블 update 하기

import { NextRequest, NextResponse } from 'next/server';
import { SyncConfig } from '@prisma';
import { upsertSyncConfig } from '@/daos/syncConfigDao';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { airport, line, io }: SyncConfig = body;

  if (!airport || !line || !io) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  await upsertSyncConfig({ airport, line, io });

  return NextResponse.json({ success: true });
}
