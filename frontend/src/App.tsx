import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { RefundQueuePage } from './pages/admin/RefundQueuePage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { EventApprovalsPage } from './pages/admin/EventApprovalsPage';
import { PlatformAnalyticsPage } from './pages/admin/PlatformAnalyticsPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { ProfilePage } from './pages/customer/ProfilePage';
import { SeatSelectionPage } from './pages/customer/SeatSelectionPage';
import { EventAnalyticsPage } from './pages/organizer/EventAnalyticsPage';
import { OrganizerDashboard } from './pages/organizer/OrganizerDashboard';
import { EventDetailPage } from './pages/public/EventDetailPage';
import { EventsPage } from './pages/public/EventsPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { UnauthorizedPage } from './pages/public/UnauthorizedPage';
import { CreateVenuePage } from './pages/venue/CreateVenuePage';
import { SeatLayoutBuilderPage } from './pages/venue/SeatLayoutBuilderPage';
import { VenueDashboard } from './pages/venue/VenueDashboard';

const HomePage = lazy(() => import('./pages/public/HomePage').then(module => ({ default: module.HomePage })));
const BookingConfirmationPage = lazy(() => import('./pages/customer/BookingConfirmationPage').then(module => ({ default: module.BookingConfirmationPage })));

const CreateEventPage = lazy(() => import('./pages/organizer/CreateEventPage').then(module => ({ default: module.CreateEventPage })));

const EditEventPage = lazy(() => import('./pages/organizer/EditEventPage').then(module => ({ default: module.EditEventPage })));

const MyBookingsPage = lazy(() => import('./pages/customer/MyBookingsPage').then(module => ({ default: module.MyBookingsPage })));

const QRScannerPage = lazy(() => import('./pages/venue/QRScannerPage').then(module => ({ default: module.QRScannerPage })));

function PageLoading() {
  return <main className="page-container route-loading"><LoadingSpinner /></main>;
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Suspense fallback={<PageLoading />}><HomePage /></Suspense>} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
            <Route path="/events/:id/seats" element={<SeatSelectionPage />} />
            <Route path="/checkout/:bookingId" element={<CheckoutPage />} />
            <Route path="/booking/:bookingId/confirm" element={<Suspense fallback={<PageLoading />}><BookingConfirmationPage /></Suspense>} />
            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/my-bookings" element={<Suspense fallback={<PageLoading />}><MyBookingsPage /></Suspense>} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
            <Route path="/organizer" element={<OrganizerDashboard />} />
            <Route path="/organizer/events/create" element={<Suspense fallback={<PageLoading />}><CreateEventPage /></Suspense>} />
            <Route path="/organizer/events/:id/edit" element={<Suspense fallback={<PageLoading />}><EditEventPage /></Suspense>} />
            <Route path="/organizer/events/:id/analytics" element={<EventAnalyticsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['VENUE_MANAGER']} />}>
            <Route path="/venue" element={<VenueDashboard />} />
            <Route path="/venue/create" element={<CreateVenuePage />} />
            <Route path="/venue/:id/seats" element={<SeatLayoutBuilderPage />} />
            <Route path="/venue/scanner" element={<Suspense fallback={<PageLoading />}><QRScannerPage /></Suspense>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/refunds" element={<RefundQueuePage />} />
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
