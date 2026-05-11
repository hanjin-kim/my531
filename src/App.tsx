import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { AppShell } from './components/layout/AppShell';
import { seedDefaults } from './db/seed';
import { db } from './db/schema';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SetupPage = lazy(() => import('./pages/SetupPage'));
const WorkoutPage = lazy(() => import('./pages/WorkoutPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SeventhWeekPage = lazy(() => import('./pages/SeventhWeekPage'));

function Loading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppRoutes() {
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    seedDefaults().then(() => setSeeded(true));
  }, []);

  const querier = useCallback(
    () => db.programs.where('status').equals('active').first().then(p => p ?? null),
    [],
  );
  const activeProgram = useLiveQuery(querier, [], null);

  if (!seeded) return <Loading />;

  const hasProgram = activeProgram !== null;

  return (
    <Routes>
      <Route path="/setup" element={
        <Suspense fallback={<Loading />}><SetupPage /></Suspense>
      } />
      <Route path="/" element={
        hasProgram
          ? <AppShell><Suspense fallback={<Loading />}><DashboardPage /></Suspense></AppShell>
          : <Navigate to="/setup" replace />
      } />
      <Route path="/workout" element={
        <AppShell><Suspense fallback={<Loading />}><DashboardPage /></Suspense></AppShell>
      } />
      <Route path="/workout/:workoutDayId" element={
        <AppShell><Suspense fallback={<Loading />}><WorkoutPage /></Suspense></AppShell>
      } />
      <Route path="/history" element={
        <AppShell><Suspense fallback={<Loading />}><HistoryPage /></Suspense></AppShell>
      } />
      <Route path="/settings" element={
        <AppShell><Suspense fallback={<Loading />}><SettingsPage /></Suspense></AppShell>
      } />
      <Route path="/seventh-week/:programId" element={
        <AppShell><Suspense fallback={<Loading />}><SeventhWeekPage /></Suspense></AppShell>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
