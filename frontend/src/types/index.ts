export type UserRole = 'CUSTOMER' | 'ORGANIZER' | 'VENUE_MANAGER' | 'ADMIN';
export type EventStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
export type SeatType = 'GENERAL' | 'PREMIUM' | 'VIP' | 'WHEELCHAIR';
export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'BLOCKED';
export type PaymentStatus = 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  profileImageUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: UserResponse;
}

export interface EventSummaryResponse {
  id: string;
  title: string;
  category?: string;
  bannerUrl?: string;
  eventDate: string;
  status: EventStatus;
  venueId: string;
  venueName: string;
  city: string;
}

export interface EventDetailResponse {
  event: {
    id: string;
    organizerId: string;
    venueId: string;
    title: string;
    description?: string;
    category?: string;
    bannerUrl?: string;
    eventDate: string;
    doorsOpenTime?: string;
    endTime?: string;
    status: EventStatus;
    isPublic: boolean;
    adminNote?: string;
  };
  venueName: string;
  venueAddress: string;
  city: string;
  state: string;
}

export interface SeatMapSeat {
  eventSeatId: string;
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: SeatType;
  price: number;
  status: SeatStatus;
  xPosition?: number;
  yPosition?: number;
}

export interface SeatMapRow {
  rowLabel: string;
  seats: SeatMapSeat[];
}

export interface SeatMapResponse {
  eventId: string;
  venueId: string;
  venueName: string;
  rows: SeatMapRow[];
}

export interface BookingSeatResponse {
  eventSeatId: string;
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: SeatType;
  price: number;
}

export interface BookingResponse {
  id: string;
  eventId: string;
  status: BookingStatus;
  totalAmount: number;
  platformFee: number;
  expiresAt: string;
  seats: BookingSeatResponse[];
  createdAt: string;
}

export interface LockStatusResponse {
  bookingId: string;
  expiresAt: string;
  remainingSeconds: number;
  isExpired: boolean;
}

export interface PaymentInitResponse {
  paymentId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  gatewayKey: string;
}

export interface TicketResponse {
  id: string;
  bookingId: string;
  eventSeatId: string;
  ticketCode: string;
  qrCodeUrl?: string;
  pdfUrl?: string;
  isUsed: boolean;
}

