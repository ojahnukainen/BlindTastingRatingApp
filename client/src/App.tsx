import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { HostConsole } from './pages/HostConsole';
import { PlayRoom } from './pages/PlayRoom';

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/host" element={<HostConsole />} />
        <Route path="/play/:code" element={<PlayRoom />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
