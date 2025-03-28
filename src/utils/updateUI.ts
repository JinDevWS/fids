import { Flight } from '@prisma';
import { useFlightStore } from '../stores/flightStore';

export function updateUI(flightList: Flight[]) {
  const setFlights = useFlightStore.getState().setFlights;
  setFlights(flightList);
}
