import { getSyncConfig } from '@/services/flightService';
import SaveSyncConfigBtn from './SaveSyncConfigBtn';

export default async function AirportChoiceForm() {
  const syncConfig = await getSyncConfig();

  return <SaveSyncConfigBtn syncConfig={syncConfig} />;
}
