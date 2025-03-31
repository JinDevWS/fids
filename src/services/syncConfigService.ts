import { findSyncConfig, upsertSyncConfig } from '@/daos/syncConfigDao';
import { SyncConfigOptions } from '@/types/types';
import { SyncConfig } from '@prisma';

// 공항코드 or 국제선/국내선 or 출발/도착 조합으로 SyncConfig 테이블 upsert
export const upsertSyncConf = async (config: SyncConfigOptions) => {
  await upsertSyncConfig(config);
};

// SyncConfig에서 항공편 목록 동기화 필터링용 설정값 가져오기
export const findSyncConf = async (): Promise<SyncConfig | null> => {
  return await findSyncConfig();
};
