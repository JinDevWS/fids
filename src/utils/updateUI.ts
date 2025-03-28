import { Flight } from '@prisma';
import { useFlightStore } from '../stores/flightStore';

export function updateUI(flightList: Flight[]) {
  console.log('======== flightList: ======== ', flightList);
  const setFlights = useFlightStore.getState().setFlights;
  setFlights(flightList);
}
