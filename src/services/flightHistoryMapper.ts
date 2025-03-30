import { FlightHistoryDTO, FlightItem } from '@/types/types';

/**
 * 항공편 상태 기록을 위한 DTO 생성 함수
 * @param item - 항공편 원본 데이터 (API 응답 등)
 * @param prevStatus
 * @param newStatus
 * @param flightId - 연결된 Flight 테이블의 ID (string)
 */
export function toFlightHistoryDTO(
  item: FlightItem,
  prevStatus: string | null,
  newStatus: string | null,
  flightId: string,
): FlightHistoryDTO {
  return {
    flightId: flightId.toString(), // BigInt → string
    flightNumber: item.airFln,
    std: item.std,
    etd: item.etd,
    airport: item.airport,
    line: item.line,
    io: item.io,

    prevStatus,
    newStatus,
    changedAt: new Date(), // 현재 시각 기준 변경시간

    gate: item.gate,
    airlineKor: item.airlineKorean,
    airlineEng: item.airlineEnglish,
    boardingKor: item.boardingKor,
    boardingEng: item.boardingEng,
    arrivedKor: item.arrivedKor,
    arrivedEng: item.arrivedEng,
    city: item.city,

    rmkKor: item.rmkKor,
    rmkEng: item.rmkEng,
  };
}
