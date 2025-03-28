'use client';

import { useFlightStore } from '@/stores/flightStore';
import { handleManualRefresh } from '@/utils/handleManualRefresh';
import { useEffect } from 'react';

export default function FlightList() {
  const flights = useFlightStore((state) => state.flights);
  console.log('[항공편 목록]: ', flights);

  useEffect(() => {
    handleManualRefresh(); // 목록 수동 갱신 함수 호출
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>시각</th>
          <th>변경시각</th>
          <th>출발지(도착지)</th>
          <th>항공사 / 편명</th>
          <th>Gate</th>
          <th>상태</th>
        </tr>
      </thead>
      <tbody>
        {flights.map((flight) => (
          <tr key={flight.id}>
            <td>{flight.std}</td>
            <td>{flight.etd}</td>
            <td>
              {flight.boardingKor} {flight.arrivedKor}
            </td>
            <td>
              {flight.airlineKor} {flight.flightNumber}
            </td>
            <td>{flight.gate}</td>
            <td>{flight.statusKor}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
