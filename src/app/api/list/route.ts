import { getFlightList } from '@/services/flightService';
import { NextResponse } from 'next/server';

// 항공편 리스트 조회
export async function GET() {
  try {
    const data = await getFlightList();
    const serialized = data?.map((item) => ({
      ...item,
      id: item.id.toString(), // BigInt를 문자열로 변환
    }));

    return NextResponse.json(serialized);
  } catch (e) {
    console.error('항공편 목록 API 오류:', e);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
