import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Feed from './pages/Feed';
import Login from './pages/Login';
import CreateMatch from './pages/CreateMatch';
import ScoreMatch from './pages/ScoreMatch';
import WatchMatch from './pages/WatchMatch';
import History from './pages/History';
import Profile from './pages/Profile';
import Rankings from './pages/Rankings';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import NotFound from './pages/NotFound';
import './index.css';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/watch/:matchId" element={<WatchMatch />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout><Feed /></Layout>} />
          <Route path="/match/new" element={<Layout><CreateMatch /></Layout>} />
          <Route path="/match/:matchId" element={<Layout><ScoreMatch /></Layout>} />
          <Route path="/history" element={<Layout><History /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/rankings" element={<Layout><Rankings /></Layout>} />
          <Route path="/players" element={<Layout><Players /></Layout>} />
          <Route path="/player/:aftId" element={<Layout><PlayerProfile /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}