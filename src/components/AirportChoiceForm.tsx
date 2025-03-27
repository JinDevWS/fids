'use client';

import { SyncConfigOptions } from '@/types/types';

export default function AirportChoiceForm() {
  const req: SyncConfigOptions = { airport: 'GMP', line: 'I', io: 'I' };

  return (
    <button
      onClick={async () => {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sync/update`, {
          method: 'POST',
          body: JSON.stringify(req),
        });
      }}
    >
      공항코드+국제/국내+출발/도착 설정 저장
    </button>
  );
}
