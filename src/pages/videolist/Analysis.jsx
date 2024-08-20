import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Sidebar from '../../components/Sidebar'; 
import '../../css/Analysis.css'; 
import '../../css/MakeVideo.css';

const Analysis = () => {
  const [videos, setVideos] = useState([]);
  const [videoLink, setVideoLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [status, setStatus] = useState('idle'); // 분석 상태를 관리하는 새로운 상태
  const navigate = useNavigate();

  useEffect(() => {
    const savedVideos = JSON.parse(localStorage.getItem('analysisVideos') || '[]');
    setVideos(savedVideos);
  }, []);

  const handleDeleteVideo = useCallback((id) => {
    console.log(`Deleting video with ID: ${id}`);
    setVideos(prevVideos => {
      const updatedVideos = prevVideos.filter(video => video.id !== id);
      localStorage.setItem('analysisVideos', JSON.stringify(updatedVideos));
      return updatedVideos;
    });
  }, []);

  const handleVideoClick = useCallback((id) => {
    navigate(`/videoviewer/analysis/${id}`);
  }, [navigate]);

  const extractVideoId = useCallback((url) => {
    console.log(`Extracting video ID from URL: ${url}`);
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|watch\?.+&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }, []);

  const handleInputChange = useCallback((e) => {
    setVideoLink(e.target.value);
    setError('');
    console.log(`Input changed: ${e.target.value}`);
  }, []);

  const checkStatus = useCallback(async (videoId) => {
    try {
      const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8081';
      const statusResponse = await fetch(`${SERVER_URL}/api/status/${videoId}`);
      if (!statusResponse.ok) throw new Error(`Status request failed: ${statusResponse.statusText}`);
      const status = await statusResponse.text();
      return status;
    } catch (error) {
      console.error('Error fetching status:', error);
      return 'pending';
    }
  }, []);

  const handleVideoLoad = useCallback(async () => {
    if (loading || isRequesting) {
      console.log('Request or loading already in progress');
      return;
    }
  
    setLoading(true);
    setIsRequesting(true);
    setStatus('loading'); // 분석이 시작되면 상태를 'loading'으로 설정
  
    const videoId = extractVideoId(videoLink);
    if (!videoId) {
      setError('Invalid YouTube URL');
      setLoading(false);
      setIsRequesting(false);
      return;
    }
  
    try {
      console.log('Fetching YouTube video info');
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=AIzaSyDi0CfLxwI9TsOXQCfRv-90MEokH3hO3YI`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  
      const data = await response.json();
      if (data.items.length === 0) {
        setError('Video not found');
        return;
      }
  
      const videoInfo = {
        id: videoId,
        title: data.items[0].snippet.title,
        thumbnail: data.items[0].snippet.thumbnails.medium.url
      };
  
      const savedVideos = JSON.parse(localStorage.getItem('analysisVideos') || '[]');
      if (savedVideos.some(video => video.id === videoId)) {
        setError('This video is already added');
        return;
      }
  
      savedVideos.push(videoInfo);
      localStorage.setItem('analysisVideos', JSON.stringify(savedVideos));
      setVideos(savedVideos);
  
      console.log('Starting video analysis');
      const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8081';
      const analysisResponse = await fetch(`${SERVER_URL}/api/analyze-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: videoLink, path: `analysis/${videoId}` })
      });
       
      if (!analysisResponse.ok) throw new Error(`Analysis request failed: ${analysisResponse.statusText}`);
      const responseData = await analysisResponse.json();
      console.log('Video analysis started:', responseData);

      // 분석 상태를 주기적으로 확인하고 완료되면 리디렉션
      let status = await checkStatus(videoId);
      while (status !== 'completed') {
        console.log('Status:', status);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기
        status = await checkStatus(videoId);
      }

      console.log('Video analysis completed');
      setStatus('completed'); // 분석이 완료되면 상태를 'completed'로 설정
      navigate(`/videoviewer/analysis/${videoId}`);
  
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setStatus('idle'); // 에러가 발생하면 상태를 'idle'로 설정
    } finally {
      setLoading(false);
      setIsRequesting(false);
    }
  }, [videoLink, loading, isRequesting, extractVideoId, navigate, checkStatus]);

  return (
    <div>
      <Sidebar />
      <div className='analysisBody'> 
        <div className="imgBox">
          <div className="bg"></div>
          <h1>Analysis</h1>
        </div>

        <div className="makevideoBody">
          <div className="search">
            <input
              type="text"
              value={videoLink}
              onChange={handleInputChange}
              placeholder="Enter YouTube Video URL"
              className="videoInput"
            />
            <button 
              onClick={handleVideoLoad} 
              className="loadButton" 
              disabled={loading || isRequesting} // 요청 진행 중 비활성화
            >
              {loading ? 'Loading...' : 'Load Video'}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </div>

        <div className="videoList">
          {status === 'loading' && (
            <p>데이터를 준비 중입니다...</p> // 분석 중일 때 표시
          )}
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

export default React.memo(Analysis);
