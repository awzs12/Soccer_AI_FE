import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Homepage from './pages/home/Homepage';
import Analysis from './pages/videolist/Analysis';
import BroadCasting from './pages/videolist/BroadCasting';
import VideoViewer from './pages/videoview/VideoViewer';
import MakeVideo from './pages/makevideo/MakeVideo';

function App() {
  return (
    <Router>
      <main>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/broadcasting" element={<BroadCasting />} />
          <Route path="/makevideo" element={<MakeVideo />} />
          <Route path="/:type/makevideo" element={<MakeVideo />} />
          <Route path="/videoviewer/:type/:videoId" element={<VideoViewer />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;