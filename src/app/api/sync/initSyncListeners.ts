// 모든 탭(리더든 팔로워든)에서 공통적으로 수신하는 메시지 처리

import { getFlightList } from '@/services/flightService';
import { ChannelMessage } from '@/types/types';
import { syncChannel } from '@/utils/syncLeader';
import { isCurrentLeader, broadcastSyncedData } from '@/utils/syncLeader';
import { updateUI } from '@/utils/updateUI';

export function initSyncListeners(): void {
  syncChannel.onmessage = async (event) => {
    const { type, payload }: ChannelMessage = event.data;

    // 리더가 데이터를 받은 뒤 전체 탭에 데이터 반영하라는 조건이면
    if (type === 'sync-data') {
      updateUI(payload); // 모든 탭에 데이터 반영
    }

    // 푸시를 수신받았고, 현재 탭이 리더이면
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
