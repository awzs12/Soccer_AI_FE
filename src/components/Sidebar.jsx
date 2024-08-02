import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <div className="sidebar-icon">☰</div> {/* 햄버거 아이콘 */}
      </button>
      <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <button className="close-btn" onClick={toggleSidebar}>×</button>
        <h2>Menu</h2>
        <Link to="/" onClick={toggleSidebar}>Home</Link>
        <Link to="/analysis" onClick={toggleSidebar}>Analysis</Link>
        <Link to="/broadcasting" onClick={toggleSidebar}>Broadcasting</Link>
        <Link to="/makevideo" onClick={toggleSidebar}>Make Video</Link>
      </div>
    </div>
  );
};

export default Sidebar;
