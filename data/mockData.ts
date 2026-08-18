import type { BookingRecord, City, RouteOption } from '../types';

export const cities: City[] = [
  { id: 'addis', name: 'Addis Ababa' },
  { id: 'dire', name: 'Dire Dawa' },
  { id: 'hawassa', name: 'Hawassa' },
  { id: 'bahir', name: 'Bahir Dar' },
  { id: 'gondar', name: 'Gondar' },
  { id: 'mekelle', name: 'Mekelle' },
  { id: 'adama', name: 'Adama' },
  { id: 'jimma', name: 'Jimma' },
];

export const routeResults: RouteOption[] = [
  {
    id: 'route-1',
    from: 'Addis Ababa',
    to: 'Dire Dawa',
    date: '2026-08-19',
    departure: '06:30',
    arrival: '10:15',
    bus: 'ET-102',
    price: 950,
    duration: '3h 45m',
    availableSeats: 14,
    seatMap: ['1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D', '3A', '3B', '3C', '3D', '4A', '4B', '4C', '4D'],
  },
  {
    id: 'route-2',
    from: 'Addis Ababa',
    to: 'Dire Dawa',
    date: '2026-08-19',
    departure: '08:15',
    arrival: '12:00',
    bus: 'ET-204',
    price: 1100,
    duration: '3h 45m',
    availableSeats: 9,
    seatMap: ['1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D', '3A', '3B', '3C', '3D', '4A', '4B', '4C', '4D'],
  },
  {
    id: 'route-3',
    from: 'Addis Ababa',
    to: 'Hawassa',
    date: '2026-08-20',
    departure: '07:00',
    arrival: '11:10',
    bus: 'ET-308',
    price: 820,
    duration: '4h 10m',
    availableSeats: 12,
    seatMap: ['1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D', '3A', '3B', '3C', '3D', '4A', '4B', '4C', '4D'],
  },
  {
    id: 'route-4',
    from: 'Addis Ababa',
    to: 'Bahir Dar',
    date: '2026-08-21',
    departure: '19:00',
    arrival: '06:15',
    bus: 'ET-510',
    price: 1450,
    duration: '11h 15m',
    availableSeats: 7,
    seatMap: ['1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D', '3A', '3B', '3C', '3D', '4A', '4B', '4C', '4D'],
  },
];

export const bookingRecords: BookingRecord[] = [
  {
    id: 'DT-1',
    route: 'Addis Ababa → Dire Dawa',
    date: '2026-08-19',
    time: '06:30',
    seats: ['2A', '2B'],
    status: 'Paid',
    amount: 1900,
  },
  {
    id: 'DT-2',
    route: 'Addis Ababa → Hawassa',
    date: '2026-08-20',
    time: '07:00',
    seats: ['1C'],
    status: 'Pending',
    amount: 820,
  },
];

export const getScheduleResults = (from?: string | string[], to?: string | string[], date?: string | string[]) => {
  const origin = Array.isArray(from) ? from[0] : from;
  const destination = Array.isArray(to) ? to[0] : to;
  const travelDate = Array.isArray(date) ? date[0] : date;

  return routeResults.filter((route) => {
    const matchesOrigin = !origin || route.from === origin;
    const matchesDestination = !destination || route.to === destination;
    const matchesDate = !travelDate || route.date === travelDate;
    return matchesOrigin && matchesDestination && matchesDate;
  });
};

export const getScheduleById = (id?: string | string[]) => {
  const targetId = Array.isArray(id) ? id[0] : id;
  return routeResults.find((route) => route.id === targetId) ?? routeResults[0];
};
