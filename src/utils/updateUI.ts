import { useFlightStore } from '../stores/flightStore';
import { FlightList } from '@/types/types';

export function updateUI(flightList: FlightList) {
  console.log('======== flightList: ======== ', flightList);
  const setFlights = useFlightStore.getState().setFlights;
  setFlights(flightList);
}
