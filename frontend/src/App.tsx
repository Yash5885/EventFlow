import { Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { EventApprovalsPage } from './pages/admin/EventApprovalsPage';
import { PlatformAnalyticsPage } from './pages/admin/PlatformAnalyticsPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { BookingConfirmationPage } from './pages/customer/BookingConfirmationPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { MyBookingsPage } from './pages/customer/MyBookingsPage';
import { ProfilePage } from './pages/customer/ProfilePage';
import { SeatSelectionPage } from './pages/customer/SeatSelectionPage';
import { CreateEventPage } from './pages/organizer/CreateEventPage';
import { EditEventPage } from './pages/organizer/EditEventPage';
import { EventAnalyticsPage } from './pages/organizer/EventAnalyticsPage';
import { OrganizerDashboard } from './pages/organizer/OrganizerDashboard';
import { EventDetailPage } from './pages/public/EventDetailPage';
import { EventsPage } from './pages/public/EventsPage';
import { HomePage } from './pages/public/HomePage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { UnauthorizedPage } from './pages/public/UnauthorizedPage';
import { CreateVenuePage } from './pages/venue/CreateVenuePage';
import { QRScannerPage } from './pages/venue/QRScannerPage';
import { SeatLayoutBuilderPage } from './pages/venue/SeatLayoutBuilderPage';
import { VenueDashboard } from './pages/venue/VenueDashboard';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
            <Route path="/events/:id/seats" element={<SeatSelectionPage />} />
            <Route path="/checkout/:bookingId" element={<CheckoutPage />} />
            <Route path="/booking/:bookingId/confirm" element={<BookingConfirmationPage />} />
            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
            <Route path="/organizer" element={<OrganizerDashboard />} />
            <Route path="/organizer/events/create" element={<CreateEventPage />} />
            <Route path="/organizer/events/:id/edit" element={<EditEventPage />} />
            <Route path="/organizer/events/:id/analytics" element={<EventAnalyticsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['VENUE_MANAGER']} />}>
            <Route path="/venue" element={<VenueDashboard />} />
            <Route path="/venue/create" element={<CreateVenuePage />} />
            <Route path="/venue/:id/seats" element={<SeatLayoutBuilderPage />} />
            <Route path="/venue/scanner" element={<QRScannerPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/events" element={<EventApprovalsPage />} />
            <Route path="/admin/analytics" element={<PlatformAnalyticsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

