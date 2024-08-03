import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '../../css/Analysis.css'; 

const Analysis = () => { 
  const [videos, setVideos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedVideos = JSON.parse(localStorage.getItem('analysisVideos') || '[]');
    setVideos(savedVideos);
  }, []);

  const handleAddVideo = () => {
    navigate('/analysis/makevideo'); 
  };

  const handleDeleteVideo = (id) => {
    const updatedVideos = videos.filter(video => video.id !== id);
    setVideos(updatedVideos);
    localStorage.setItem('analysisVideos', JSON.stringify(updatedVideos));
  };

  const handleVideoClick = (id) => {
    navigate(`/videoviewer/analysis/${id}`);
  };

  return (
    <div>
      <Sidebar />
      <div className='analysisBody'> 
        <div className="contentHeader">
          <h1>Video Analysis</h1> 
          <button onClick={handleAddVideo} className="addVideoButton">
            Add Video
          </button>
        </div>

        <div className="videoList">
          {videos.map((video) => (
            <div key={video.id} className="videoContent">
              <div onClick={() => handleVideoClick(video.id)}>
                <div className="thumbnail">
                  <img src={video.thumbnail} alt={`${video.title} thumbnail`} />
                </div>
                <div className="videoInfo">
                  <h3>{video.title}</h3>
                  <p>ID: {video.id}</p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteVideo(video.id);
                }}
                className="deleteButton"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analysis;