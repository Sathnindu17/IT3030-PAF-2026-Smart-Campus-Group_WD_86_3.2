import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import ResourceList from './pages/resources/ResourceList';
import ResourceForm from './pages/resources/ResourceForm';
import CampusMapView from './pages/resources/CampusMapView';
import BookingForm from './pages/bookings/BookingForm';
import MyBookings from './pages/bookings/MyBookings';
import AdminBookings from './pages/bookings/AdminBookings';
import CreateTicket from './pages/tickets/CreateTicket';
import EditTicket from './pages/tickets/EditTicket';
import MyTickets from './pages/tickets/MyTickets';
import AdminTickets from './pages/tickets/AdminTickets';
import TechnicianTickets from './pages/tickets/TechnicianTickets';
import TicketDetail from './pages/tickets/TicketDetail';
import NotificationsPage from './pages/NotificationsPage';
import NotificationPreferences from './pages/NotificationPreferences';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/login" element={<Navigate to="/login" replace />} />
          <Route path="/auth/register" element={<Navigate to="/register" replace />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="resources" replace />} />
            <Route path="resources/map" element={<CampusMapView />} />

            <Route
              path="resources"
              element={
                <ProtectedRoute>
                  <ResourceList />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="resources/new"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <ResourceForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="resources/edit/:id"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <ResourceForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="bookings/new"
              element={
                <ProtectedRoute>
                  <BookingForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="bookings/my"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="bookings/admin"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminBookings />
                </ProtectedRoute>
              }
            />

            <Route
              path="tickets/new"
              element={
                <ProtectedRoute>
                  <CreateTicket />
                </ProtectedRoute>
              }
            />
            <Route
              path="tickets/my"
              element={
                <ProtectedRoute>
                  <MyTickets />
                </ProtectedRoute>
              }
            />
            <Route
              path="tickets/:id/edit"
              element={
                <ProtectedRoute>
                  <EditTicket />
                </ProtectedRoute>
              }
            />
            <Route
              path="tickets/:id"
              element={
                <ProtectedRoute>
                  <TicketDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="tickets/admin"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminTickets />
                </ProtectedRoute>
              }
            />
            <Route
              path="tickets/assigned"
              element={
                <ProtectedRoute roles={['TECHNICIAN', 'ADMIN']}>
                  <TechnicianTickets />
                </ProtectedRoute>
              }
            />

            <Route
              path="notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="notifications/preferences"
              element={
                <ProtectedRoute>
                  <NotificationPreferences />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
