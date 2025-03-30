import { prisma } from '@/lib/prisma';
import { FlightHistoryDTO } from '@/types/types';
import { FlightStatusHistory } from '@prisma';

// flightStatusHistory 테이블에서 Flight의 id와 일치하는 history를 최신데이터 하나만 찾는 함수
export const findFlightStatusHistoryOne = async (
  flightId: number,
): Promise<FlightStatusHistory | null> => {
  const flightStatusHistory = await prisma.flightStatusHistory.findFirst({
    where: {
      flightId,
    },
    orderBy: {
      changedAt: 'desc',
    },
  });

  return flightStatusHistory;
};

// FlightStatusHistory에 데이터 추가
export const createFlightStatusHistory = async (flightHistoryDto: FlightHistoryDTO) => {
  await prisma.flightStatusHistory.create({
    data: {
      ...flightHistoryDto,
      flightId: Number(flightHistoryDto.flightId),
    },
  });
};

// FlightStatusHistory 데이터 업데이트
export const updateFlightStatusHistory = async (id: number, flightHistoryDto: FlightHistoryDTO) => {
  await prisma.flightStatusHistory.update({
    where: { id },
    data: {
      ...flightHistoryDto,
      flightId: Number(flightHistoryDto.flightId),
    },
  });
};

// 히스토리 테이블의 행 개수를 세는 함수
export const getFlightStatusHistoryCount = async (): Promise<number> => {
  return prisma.flightStatusHistory.count();
};
