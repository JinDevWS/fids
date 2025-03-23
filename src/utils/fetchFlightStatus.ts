import axios from 'axios';

export const fetchFlightStatus = async (params: {
  schStTime: string;
  schEdTime: string;
  schLineType: string;
  schIOType: string;
  schAirCode?: string;
  schFln?: string;
  schRmk?: string;
  pageNo?: number;
  numOfRows?: number;
}) => {
  const url = 'http://openapi.airport.co.kr:80/service/rest/FlightStatusList/getFlightStatusList';
  const serviceKey = process.env.AIRPORT_API_KEY; // .env에 저장된 키 읽어오기

  const response = await axios.get(url, {
    params: {
      ...params,
      serviceKey,
      _type: 'json', // JSON 형식으로 받기
    },
  });

  return response.data.response.body.items.item || [];
};
