import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { NewScan } from './pages/NewScan';
import { ScanResults } from './pages/ScanResults';
import { FindingDetails } from './pages/FindingDetails';
import { ScanHistory } from './pages/ScanHistory';
import { DependencyScan } from './pages/DependencyScan';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Documentation } from './pages/Documentation';
import { api } from './services/api';

export const App: React.FC = () => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if demo scans exist on initial load
    api.getAnalyticsOverview()
      .then(metrics => setIsDemoMode(metrics.is_demo_mode))
      .catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout isDemoMode={isDemoMode} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scans/new" element={<NewScan />} />
          <Route path="/scans/:id" element={<ScanResults />} />
          <Route path="/findings/:id" element={<FindingDetails />} />
          <Route path="/history" element={<ScanHistory />} />
          <Route path="/dependencies" element={<DependencyScan />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/docs" element={<Documentation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
