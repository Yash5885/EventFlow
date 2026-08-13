import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { myBookings } from '../../api/bookings.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export function MyBookingsPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['my-bookings'], queryFn: myBookings });

  return (
    <main className="page-container py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My bookings</h1>
        {isLoading && <LoadingSpinner label="Loading" />}
      </div>
      {isError && <p className="text-sm text-amber-700">Bookings will appear here after the API is running.</p>}
      <div className="grid gap-3">
        {data?.content.map(booking => (
          <Link key={booking.id} to={`/booking/${booking.id}/confirm`} className="rounded-md border border-border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{booking.status}</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(booking.createdAt)}</p>
              </div>
              <span className="font-semibold">{formatCurrency(Number(booking.totalAmount))}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

