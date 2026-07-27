import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ReturnsDataProvider } from './context/ReturnsDataContext';
import Layout from './components/Layout';
import WelcomePage from './pages/WelcomePage';
import Dashboard from './pages/Dashboard';
import ReturnsList from './pages/ReturnsList';
import ReturnDetail from './pages/ReturnDetail';
import AffordancesPage from './pages/AffordancesPage';
import TasksPage from './pages/TasksPage';
import AIReviewQueue from './pages/AIReviewQueue';
import MessagesPage from './pages/MessagesPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import Placeholder from './pages/Placeholder';

function AppShell() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ReturnsDataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route element={<AppShell />}>
              <Route path="/dashboard"     element={<Dashboard />} />
              <Route path="/returns"       element={<ReturnsList />} />
              <Route path="/returns/:id"   element={<ReturnDetail />} />
              <Route path="/affordances"   element={<AffordancesPage />} />
              <Route path="/tasks"         element={<TasksPage />} />
              <Route path="/ai-review"     element={<AIReviewQueue />} />
              <Route path="/messages"      element={<MessagesPage />} />
              <Route path="/reports"       element={<ReportsPage />} />
              <Route path="/settings"      element={<SettingsPage />} />
              <Route path="/clients"       element={<Placeholder title="Clients" />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ReturnsDataProvider>
    </AppProvider>
  );
}
