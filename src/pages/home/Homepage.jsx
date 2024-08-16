import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Homepage.css';
import Sidebar from '../../components/Sidebar'; 

// import soccerImage from '../../assets/images/1510_392.jpg'; 


const Homepage = () => {
  const navigate = useNavigate();

  const goToAnalysis = () => {
    navigate('/analysis');
  };

  const goToBroadCasting = () => {
    navigate('/broadcasting');
  };

  return (
    <div id="wrap">
      <div className="mainHeader">
        <ul>
          <li onClick={goToAnalysis}>Analysis</li>
          <li onClick={goToBroadCasting}>Broadcasting</li>
        </ul>
      </div>
      <div className="mainContent">
        <div className="leftContent">
          <div className="info">
            SOCCER<br/>
            ANALYSIS
          </div>
        </div>
        <div className="rightContent">
          <div className="logo">Anonymity</div>

          <div className="btnArea">
            <button className="analysis" onClick={goToAnalysis}>Analysis</button>
            <button className="broadcasting" onClick={goToBroadCasting}>Broadcasting</button>
          </div>
          {/* <div className="search">
            <input type="text" placeholder='Search...' />
          </div> */}
        </div>
      </div>
      
    </div>
  );
};

export default Homepage;
