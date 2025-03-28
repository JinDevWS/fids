'use client';

import { SyncConfigOptions } from '@/types/types';

export default function SaveSyncConfigBtn({ syncConfig }: { syncConfig: SyncConfigOptions }) {
  const handleSubmit = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sync/config/update`, {
      method: 'POST',
      body: JSON.stringify(syncConfig),
    });
  };

  return <button onClick={handleSubmit}>공항코드+국제/국내+출발/도착 설정 저장</button>;
}
