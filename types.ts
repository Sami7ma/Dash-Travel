export type City = {
  id: string;
  name: string;
};

export type RouteOption = {
  id: string;
  from: string;
  to: string;
  date: string;
  departure: string;
  arrival: string;
  bus: string;
  price: number;
  duration: string;
  availableSeats: number;
  seatMap: string[];
};

export type BookingRecord = {
  id: string;
  route: string;
  date: string;
  time: string;
  seats: string[];
  status: 'Paid' | 'Pending' | 'Cancelled';
  amount: number;
};
