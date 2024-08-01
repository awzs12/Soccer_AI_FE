import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Homepage.css';

const Homepage = () => {
  const navigate = useNavigate();

  const goToAnalysis = () => {
    navigate('/analysis');
  };

  const goToBroadCasting = () => {
    navigate('/broadcasting');
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Welcome to My Homepage</h1>
      </header>
      <section className="home-content">
        <p>This is a simple React homepage example.</p>
        <p>Feel free to customize and expand it as you like!</p>
      </section>
      <div className="button-container">
        <button className="btn" onClick={goToAnalysis}>Analysis</button>
        <button className="btn" onClick={goToBroadCasting}>Broadcasting</button>
      </div>
      <footer className="home-footer">
        <p>© 2024 My Simple Website</p>
      </footer>
    </div>
  );
};

export default Homepage;
