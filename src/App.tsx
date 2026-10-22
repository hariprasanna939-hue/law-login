import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { LandLegalPage } from './pages/LandLegalPage';
import { AISearchPage } from './pages/AISearchPage';
import { LegalAIPage } from './pages/LegalAIPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/land-legal" element={<LandLegalPage />} />
            <Route path="/legal-ai" element={<LegalAIPage />} />
            <Route path="/ai-search" element={<AISearchPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
