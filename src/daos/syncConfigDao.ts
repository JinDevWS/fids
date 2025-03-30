import { prisma } from '@/lib/prisma';
import { SyncConfigOptions } from '@/types/types';
import { SyncConfig } from '@prisma';

// DB에서 항공편 동기화용 필터링 설정값(공항코드, 국제선/국내선, 출발/도착) 조회
export const findSyncConfig = async (): Promise<SyncConfig | null> => {
  return await prisma.syncConfig.findUnique({ where: { id: 1 } });
};

// 항공편 동기화용 필터링 설정값 upsert
export const upsertSyncConfig = async (config: SyncConfigOptions) => {
  await prisma.syncConfig.upsert({
    where: { id: 1 },
    update: { ...config },
    create: { id: 1, ...config },
  });
};
