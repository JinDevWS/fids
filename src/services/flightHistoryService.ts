import {
  createFlightStatusHistory,
  findFlightStatusHistoryOne,
  getFlightStatusHistoryCount,
  updateFlightStatusHistory,
} from '@/daos/flightStatusHistoryDao';
import { FlightHistoryDTO } from '@/types/types';
import { FlightStatusHistory } from '@prisma';

// 테이블이 비어있는지 확인용
export const getFlightHistoryCount = async (): Promise<number> => {
  return await getFlightStatusHistoryCount();
};

// flightId로 status history 데이터 하나 찾기
export const findFlightHistoryOne = async (
  flightId: string,
): Promise<FlightStatusHistory | null> => {
  return await findFlightStatusHistoryOne(flightId);
};

// 히스토리 데이터 업데이트
export const updateFlightHistory = async (id: string, flightHistoryDto: FlightHistoryDTO) => {
  await updateFlightStatusHistory(id, flightHistoryDto);
};

// 히스토리 데이터 삽입
export const createFlightHistory = async (flightHistoryDto: FlightHistoryDTO) => {
  await createFlightStatusHistory(flightHistoryDto);
};
