import { getSyncConfig } from '@/services/flightService';

export default async function AirportChoiceForm() {
  const syncConfig = await getSyncConfig();

  const handleSubmit = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sync/config/update`, {
      method: 'POST',
      body: JSON.stringify(syncConfig),
    });
  };

  return <button onClick={handleSubmit}>공항코드+국제/국내+출발/도착 설정 저장</button>;
}
