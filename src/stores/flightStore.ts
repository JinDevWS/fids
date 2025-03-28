import { FlightState } from '@/types/types';
import { create } from 'zustand';

export const useFlightStore = create<FlightState>((set) => ({
  flights: [],
  setFlights: (list) => set({ flights: list }),
}));
