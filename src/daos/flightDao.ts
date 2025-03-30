import { prisma } from '@/lib/prisma';
import { FlightItem, FlightList, SyncConfigOptions } from '@/types/types';
import { Flight } from '@prisma';

// DB에서 항공편 목록 조회
export const findFlightMany = async (config: SyncConfigOptions): Promise<FlightList> => {
  return await prisma.flight.findMany({
    where: {
      ...config,
    },
    include: {
      histories: {
        orderBy: { changedAt: 'desc' },
        take: 1, // 가장 최근 상태만
      },
    },
  });
};

// flight 테이블에서 FlightItem으로 일치하는 flight 하나 찾기(id 찾아내기용)
export const findFlightOne = async (item: FlightItem): Promise<Flight | null> => {
  const flight = await prisma.flight.findUnique({
    where: {
      flightNumber_std_airport_io_line: {
        flightNumber: item.airFln,
        std: item.std ? String(item.std) : '',
        airport: item.airport,
        io: item.io,
        line: item.line === '국제' ? 'I' : 'D',
      },
    },
  });

  return flight;
};

// DB에 flight upsert
export const flightUpsert = async (item: FlightItem) => {
  const flightNumber = item.airFln;
  const std = item.std ? String(item.std) : '';
  const etd = item.etd ? String(item.etd) : '';
  const gate = item.gate ? String(item.gate) : '';
  const line = item.line === '국제' ? 'I' : 'D';

  await prisma.flight.upsert({
    where: {
      flightNumber_std_airport_io_line: {
        flightNumber,
        std,
        airport: item.airport,
        io: item.io,
        line,
      },
    },
    update: {
      etd,
      gate,
      rmkKor: item.rmkKor,
      rmkEng: item.rmkEng,
      airlineKor: item.airlineKorean,
      airlineEng: item.airlineEnglish,
      boardingKor: item.boardingKor,
      boardingEng: item.boardingEng,
      arrivedKor: item.arrivedKor,
      arrivedEng: item.arrivedEng,
      city: item.city,
    },
    create: {
      flightNumber,
      std,
      etd,
      airport: item.airport,
      io: item.io,
      line,
      gate,
      rmkKor: item.rmkKor,
      rmkEng: item.rmkEng,
      airlineKor: item.airlineKorean,
      airlineEng: item.airlineEnglish,
      boardingKor: item.boardingKor,
      boardingEng: item.boardingEng,
      arrivedKor: item.arrivedKor,
      arrivedEng: item.arrivedEng,
      city: item.city,
    },
  });
};
