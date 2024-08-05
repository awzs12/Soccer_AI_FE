import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '../../css/VideoViewer.css';

const VideoViewer = () => {
    const { type, videoId } = useParams();
    const [data, setData] = useState([]);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!videoId) return;

        fetch(`http://localhost:8081/api/players/by-video?videoId=${videoId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Fetched data:', data);
                setData(data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setData([]); // 에러 발생 시 데이터 초기화
            });
    }, [videoId]);

    useEffect(() => {
        drawOverlay();
    }, [data]); // 데이터가 업데이트될 때마다 drawOverlay 호출

    const drawOverlay = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        data.forEach(player => {
            if (player.x && player.y && player.width && player.height) {
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.strokeRect(player.x, player.y, player.width, player.height);

                ctx.font = '16px Arial';
                ctx.fillStyle = 'red';
                ctx.fillText(`ID: ${player.trackId}`, player.x, player.y - 10);
            }
        });
    };

    return (
        <div>
            <Sidebar />
            <div className='videoviewerBody'>
                <h1>
                    {type === 'analysis' ? 'Analysis View' : type === 'broadcasting' ? 'Broadcasting View' : 'Default View'}
                </h1>
                <div className="videoPlayer">
                    <iframe
                        width="800"
                        height="450"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube Video Player"
                    />
                    <canvas ref={canvasRef} className="videoOverlay" />
                </div>
                
                <div className="additionalContent">
                    {type === 'analysis' && (
                        <div className="analysisContent">
                            <h2>Analysis Tools</h2>
                            <p>Analysis specific content goes here.</p>
                        </div>
                    )}

                    {type === 'broadcasting' && (
                        <div className="broadcastingContent">
                            <h2>Broadcasting Controls</h2>
                            <p>Broadcasting specific content goes here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoViewer;
