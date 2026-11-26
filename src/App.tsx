import { Navigate, Outlet, RouterProvider, createHashRouter } from 'react-router-dom';
import { AppProvider, useApp } from './state';
import { Layout, Splash } from './Layout';
import { Home } from './pages/Home';
import { Dictionary, WordDetail } from './pages/Dictionary';
import { Stats } from './pages/Stats';
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';
import { About } from './pages/About';
import { Onboarding } from './pages/Onboarding';
import { Practice } from './pages/Practice';

function Gate() {
  const { ready, error, settings } = useApp();
  if (error) return <div className="splash"><p>{error}</p></div>;
  if (!ready) return <Splash />;
  if (!settings.onboarded) return <Navigate to="/welcome" replace />;
  return <Outlet />;
}

function Welcome() {
  const { ready, error } = useApp();
  if (error) return <div className="splash"><p>{error}</p></div>;
  if (!ready) return <Splash />;
  return <Onboarding />;
}

const router = createHashRouter([
  { path: '/welcome', element: <Welcome /> },
  {
    path: '/',
    element: <Gate />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'words', element: <Dictionary /> },
          { path: 'words/:id', element: <WordDetail /> },
          { path: 'stats', element: <Stats /> },
          { path: 'talk', element: <Chat /> },
          { path: 'settings', element: <Settings /> },
          { path: 'about', element: <About /> },
        ],
      },
      { path: 'practice', element: <Practice mode="daily" /> },
      { path: 'drill', element: <Practice mode="weak" /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
