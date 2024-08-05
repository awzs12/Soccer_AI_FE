import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '../../css/BroadCasting.css';

const BroadCasting = () => {
  const [videos, setVideos] = useState([]);
  const navigate = useNavigate();
  const [videoLink, setVideoLink] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedVideos = JSON.parse(localStorage.getItem('broadcastingVideos') || '[]');
    setVideos(savedVideos);
  }, []);

  const handleDeleteVideo = (id) => {
    const updatedVideos = videos.filter(video => video.id !== id);
    setVideos(updatedVideos);
    localStorage.setItem('broadcastingVideos', JSON.stringify(updatedVideos));
  };

  const handleVideoClick = (id) => {
    navigate(`/videoviewer/broadcasting/${id}`);
  };

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|watch\?.+&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleInputChange = (e) => {
    setVideoLink(e.target.value);
    setError('');
  };

  const handleVideoLoad = async () => {
    const videoId = extractVideoId(videoLink);
    if (videoId) {
      try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=AIzaSyDi0CfLxwI9TsOXQCfRv-90MEokH3hO3YI`);
        const data = await response.json();
        if (data.items.length > 0) {
          const videoInfo = {
            id: videoId,
            title: data.items[0].snippet.title,
            thumbnail: data.items[0].snippet.thumbnails.medium.url
          };
          
          // 로컬 스토리지에 저장
          const savedVideos = JSON.parse(localStorage.getItem('broadcastingVideos') || '[]');
          savedVideos.push(videoInfo);
          localStorage.setItem('broadcastingVideos', JSON.stringify(savedVideos));

          // VideoViewer 페이지로 즉시 이동
          navigate(`/videoviewer/broadcasting/${videoId}`);
        } else {
          setError('Video not found');
        }
      } catch (error) {
        console.error('Error fetching video info:', error);
        setError('Error fetching video info');
      }
    } else {
      setError('Invalid YouTube URL');
    }
  };

  return (
    <div>
      <Sidebar />
      <div className='broadcastingBody'>
        <h1>Broadcasting</h1>

        <div className="makevideoBody">
          <div className="search">
            <input
              type="text"
              value={videoLink}
              onChange={handleInputChange}
              placeholder="Enter YouTube Video URL"
              className="videoInput"
            />
            <button onClick={handleVideoLoad} className="loadButton">Load Video</button>
          </div>
          {error && <p className="error">{error}</p>}
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
                X
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BroadCasting;