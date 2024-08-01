import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Homepage from './pages/home/Homepage';
import Analysis from './pages/videolist/Analysis';
import BroadCasting from './pages/videolist/BroadCasting';

function App() {
  return (
    <Router>
      <main>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/broadcasting" element={<BroadCasting />} />
          
        </Routes>
      </main>
    </Router>
  );
}

export default App;
