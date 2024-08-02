import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '../../css/MakeVideo.css';

const MakeVideo = () => {
    const [videoLink, setVideoLink] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { type } = useParams();

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
                    const savedVideos = JSON.parse(localStorage.getItem(`${type}Videos`) || '[]');
                    savedVideos.push(videoInfo);
                    localStorage.setItem(`${type}Videos`, JSON.stringify(savedVideos));

                    navigate(`/${type}`);
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
            <div className="makevideoBody">
                <div className="contentHeader">
                    <h1>{type === 'broadcasting' ? 'Add New Broadcast' : 'Add New Video'}</h1>
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
        </div>
    );
};

export default MakeVideo;