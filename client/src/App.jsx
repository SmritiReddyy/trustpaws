import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ParentAuthProvider } from './context/ParentAuthContext';

import Login from './pages/Login';
import StaffLayout from './components/layout/StaffLayout';
import Dashboard from './pages/staff/Dashboard';
import Appointments from './pages/staff/Appointments';
import AppointmentDetail from './pages/staff/AppointmentDetail';
import NewAppointment from './pages/staff/NewAppointment';
import Pets from './pages/staff/Pets';
import PetDetail from './pages/staff/PetDetail';
import Parents from './pages/staff/Parents';
import Monitor from './pages/staff/Monitor';
import TrackingPage from './pages/parent/TrackingPage';
import ParentLogin from './pages/parent/ParentLogin';
import ParentPortal from './pages/parent/ParentPortal';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ParentAuthProvider>
        <Routes>
          {/* Staff */}
          <Route path="/login" element={<Login />} />

          {/* Parent */}
          <Route path="/parent/login" element={<ParentLogin />} />
          <Route path="/my-pets" element={<ParentPortal />} />
          <Route path="/track/:token" element={<TrackingPage />} />

          {/* Staff portal */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="appointments/new" element={<NewAppointment />} />
            <Route path="appointments/:id" element={<AppointmentDetail />} />
            <Route path="pets" element={<Pets />} />
            <Route path="pets/:id" element={<PetDetail />} />
            <Route path="parents" element={<Parents />} />
            <Route path="monitor" element={<Monitor />} />
            <Route path="appointments/:id/monitor" element={<Monitor />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ParentAuthProvider>
    </AuthProvider>
  );
}
