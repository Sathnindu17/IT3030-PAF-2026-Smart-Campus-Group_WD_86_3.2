import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/Dashboard';
import ResourceList from './pages/resources/ResourceList';
import ResourceForm from './pages/resources/ResourceForm';
import BookingForm from './pages/bookings/BookingForm';
import MyBookings from './pages/bookings/MyBookings';
import AdminBookings from './pages/bookings/AdminBookings';
import CreateTicket from './pages/tickets/CreateTicket';
import EditTicket from './pages/tickets/EditTicket';
import MyTickets from './pages/tickets/MyTickets';
import TicketDetail from './pages/tickets/TicketDetail';
import AdminTickets from './pages/tickets/AdminTickets';
import TechnicianTickets from './pages/tickets/TechnicianTickets';
import NotificationsPage from './pages/NotificationsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected routes inside layout */}
          <Route path="/app" element={
            <ProtectedRoute><AppLayout /></ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="resources" element={<ResourceList />} />
            <Route path="resources/new" element={
              <ProtectedRoute roles={['ADMIN']}><ResourceForm /></ProtectedRoute>
            } />
            <Route path="resources/edit/:id" element={
              <ProtectedRoute roles={['ADMIN']}><ResourceForm /></ProtectedRoute>
            } />
            <Route path="bookings/new" element={<BookingForm />} />
            <Route path="bookings/my" element={<MyBookings />} />
            <Route path="bookings/admin" element={
              <ProtectedRoute roles={['ADMIN']}><AdminBookings /></ProtectedRoute>
            } />
            <Route path="tickets/new" element={<CreateTicket />} />
            <Route path="tickets/my" element={<MyTickets />} />
            <Route path="tickets/:id/edit" element={<EditTicket />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="tickets/admin" element={
              <ProtectedRoute roles={['ADMIN']}><AdminTickets /></ProtectedRoute>
            } />
            <Route path="tickets/assigned" element={
              <ProtectedRoute roles={['TECHNICIAN', 'ADMIN']}><TechnicianTickets /></ProtectedRoute>
            } />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
