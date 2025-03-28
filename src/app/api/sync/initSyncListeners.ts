// 모든 탭(리더든 팔로워든)에서 공통적으로 수신하는 메시지 처리

import { getFlightList } from '@/services/flightService';
import { syncChannel } from '@/utils/syncLeader';
import { isCurrentLeader, broadcastSyncedData } from '@/utils/syncLeader';
import { updateUI } from '@/utils/updateUI'; // TODO: UI 갱신 로직은 프로젝트에 맞게 연결

export function initSyncListeners(): void {
  syncChannel.onmessage = async (event) => {
    const { type, payload } = event.data;

    if (type === 'sync-data') {
      updateUI(payload); // 모든 탭에서 데이터 반영
    }

    if (type === 'push-received' && isCurrentLeader()) {
      try {
        const data = await getFlightList();

        broadcastSyncedData(data); // 팔로워에게도 전파
        updateUI(data); // 리더 자신의 UI도 갱신
      } catch (err) {
        console.error('[PUSH] 동기화 실패:', err);
      }
    }
  };
}
