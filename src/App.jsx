import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import CalendarView from './pages/Calendar';
import FixedExpenses from './pages/FixedExpenses';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';

// Protected Route Component
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return user ? <Outlet /> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="movimentacoes" element={<Transactions />} />
                <Route path="calendario" element={<CalendarView />} />
                <Route path="gastos-fixos" element={<FixedExpenses />} />
                <Route path="reportes" element={<Analytics />} />
                <Route path="configuracion" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </FinanceProvider>
    </AuthProvider>
  );
}

export default App;
