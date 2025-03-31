// 공항코드 or 국제선/국내선 or 출발/도착 선택 중 하나라도 바뀌면 SyncConfig 테이블 upsert 하기

import { NextRequest, NextResponse } from 'next/server';
import { SyncConfigOptions } from '@/types/types';
import { upsertSyncConf } from '@/services/syncConfigService';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.airport || !body.line || !body.io) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  const config: SyncConfigOptions = { airport: body.airport, line: body.line, io: body.io };

  await upsertSyncConf(config);

  return NextResponse.json({ success: true });
}
