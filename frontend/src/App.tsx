import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Session } from './pages/Session';
import { Multiplayer } from './pages/Multiplayer';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-mystical-darker">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/session" element={<Session />} />
          <Route path="/multiplayer" element={<Multiplayer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
