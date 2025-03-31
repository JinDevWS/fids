import { prisma } from '@/lib/prisma';
import { FlightHistoryDTO } from '@/types/types';
import { FlightStatusHistory } from '@prisma';

// flightStatusHistory 테이블에서 Flight의 id와 일치하는 history를 최신데이터 하나만 찾는 함수
export const findFlightStatusHistoryOne = async (
  flightId: string,
): Promise<FlightStatusHistory | null> => {
  const flightStatusHistory = await prisma.flightStatusHistory.findFirst({
    where: {
      flightId: BigInt(flightId),
    },
    orderBy: {
      changedAt: 'desc',
    },
  });

  return flightStatusHistory;
};

// FlightStatusHistory에 데이터 추가
export const createFlightStatusHistory = async (flightHistoryDto: FlightHistoryDTO) => {
  console.log('createFlightStatusHistory flightHistoryDto: ', flightHistoryDto);
  await prisma.flightStatusHistory.create({
    data: {
      ...flightHistoryDto,
      flightId: BigInt(flightHistoryDto.flightId),
    },
  });
};

// FlightStatusHistory 데이터 업데이트
export const updateFlightStatusHistory = async (id: string, flightHistoryDto: FlightHistoryDTO) => {
  await prisma.flightStatusHistory.update({
    where: { id: BigInt(id) },
    data: {
      ...flightHistoryDto,
      flightId: BigInt(flightHistoryDto.flightId),
    },
  });
};

// 히스토리 테이블의 행 개수를 세는 함수
export const getFlightStatusHistoryCount = async (): Promise<number> => {
  return prisma.flightStatusHistory.count();
};
