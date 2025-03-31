import {
  deletePushSubscByUnique,
  deletePushSubscription,
  findPushSubscriptionFirst,
  findPushSubscriptionMany,
  getPushSubscriptionEnabled,
  updatePushSubscription,
  upsertPushSubscription,
} from '@/daos/pushSubscriptionDao';
import {
  FlightItem,
  PushSubscriptionEnabled,
  PushSubscriptionFields,
  PushSubscriptionUniqueKeys,
  PushUpdateOptions,
} from '@/types/types';
import { PushSubscription } from '@prisma';

// 사용자가 푸시를 구독했는지 안했는지 (enabled) 값을 가져옴
export const getPushSubscEnable = async ({
  userId,
  airportCode,
  lineType,
  ioType,
}: PushSubscriptionUniqueKeys): Promise<PushSubscriptionEnabled | null> => {
  return await getPushSubscriptionEnabled({
    userId,
    airportCode,
    lineType,
    ioType,
  });
};

// 푸시 구독하면 upsert
export const upsertPushSubsc = async (fields: PushSubscriptionFields) => {
  await upsertPushSubscription(fields);
};

/**
 * enabled 상태만 토글 (스위치 on/off)
 * 사용자가 알림만 끄는 경우
 * update하고 update한 갯수를 반환
 */
export const updatePushSubsc = async (options: PushUpdateOptions): Promise<number> => {
  return await updatePushSubscription(options);
};

// 구독 제거(로그아웃, 푸시 만료 등)
export const deletePushSubscUnique = async (uniqueKeys: PushSubscriptionUniqueKeys) => {
  await deletePushSubscByUnique(uniqueKeys);
};

// 410 | 404 코드 떨어지면 푸시 구독 삭제
export const deletePushSubsc = async (subId: number) => {
  await deletePushSubscription(subId);
};

// 테스트용으로 푸시구독 데이터 하나 찾아오기
export const findPushSubscFirst = async (): Promise<PushSubscription | null> => {
  return await findPushSubscriptionFirst();
};

// 푸시 구독 데이터 여러개 가져오기
export const findPushSubscMany = async (item: FlightItem): Promise<PushSubscription[] | null> => {
  return await findPushSubscriptionMany(item);
};
