import { prisma } from '@/lib/prisma';
import {
  FlightItem,
  PushSubscriptionEnabled,
  PushSubscriptionFields,
  PushSubscriptionUniqueKeys,
  PushUpdateOptions,
} from '@/types/types';
import { PushSubscription } from '@prisma';

// DB에서 푸시 구독 내역 하나 조회해서 enabled 여부를 반환
export const getPushSubscriptionEnabled = async (
  uniqueKeys: PushSubscriptionUniqueKeys,
): Promise<PushSubscriptionEnabled | null> => {
  return await prisma.pushSubscription.findUnique({
    where: {
      userId_airportCode_lineType_ioType: {
        ...uniqueKeys,
      },
    },
    select: {
      enabled: true,
    },
  });
};

// DB에서 푸시 구독 내역 목록 조회
export const findPushSubscriptionMany = async (
  item: FlightItem,
): Promise<PushSubscription[] | null> => {
  const line = item.line === '국제' ? 'I' : 'D';
  return await prisma.pushSubscription.findMany({
    where: {
      airportCode: item.airport,
      lineType: line,
      ioType: item.io,
      enabled: true,
    },
  });
};

// DB에서 푸시 구독 내역 삭제
export const deletePushSubscription = async (id: number) => {
  prisma.pushSubscription.delete({
    where: { id },
  });
};

// DB에 푸시 구독 내역 upsert
export const upsertPushSubscription = async (fields: PushSubscriptionFields) => {
  await prisma.pushSubscription.upsert({
    where: {
      userId_airportCode_lineType_ioType: {
        userId: fields.userId,
        airportCode: fields.airportCode,
        lineType: fields.lineType,
        ioType: fields.ioType,
      },
    },
    update: {
      endpoint: fields.endpoint,
      auth: fields.keys.auth,
      p256dh: fields.keys.p256dh,
      enabled: fields.enabled,
    },
    create: {
      userId: fields.userId,
      endpoint: fields.endpoint,
      auth: fields.keys.auth,
      p256dh: fields.keys.p256dh,
      airportCode: fields.airportCode,
      lineType: fields.lineType,
      ioType: fields.ioType,
      enabled: fields.enabled,
    },
  });
};

// DB에 푸시 구독 내역 upsert
export const updatePushSubscription = async (options: PushUpdateOptions): Promise<number> => {
  const updateResult = await prisma.pushSubscription.updateMany({
    where: {
      userId: options.userId,
      airportCode: options.airportCode,
      lineType: options.lineType,
      ioType: options.ioType,
    },
    data: {
      enabled: options.enabled,
    },
  });

  return updateResult.count;
};

// 유니크 키로 푸시 구독 삭제하기
export const deletePushSubscByUnique = async (uniqueKeys: PushSubscriptionUniqueKeys) => {
  await prisma.pushSubscription.deleteMany({
    where: {
      ...uniqueKeys,
    },
  });
};

// 테스트용으로 하나 찾아오기
export const findPushSubscriptionFirst = async (): Promise<PushSubscription | null> => {
  return await prisma.pushSubscription.findFirst({
    where: { enabled: true },
  });
};
