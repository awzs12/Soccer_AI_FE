import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '../../css/VideoViewer.css';

const VideoViewer = () => {
    const { videoId } = useParams();
    const [data, setData] = useState([]);
    const canvasRef = useRef(null);
    const playerRef = useRef(null);
    const playerInstanceRef = useRef(null);
    const isYouTubeAPIReady = useRef(false);
    const animationFrameId = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            console.log('Fetching data...');
            const response = await fetch(`http://localhost:8081/api/players/by-video?videoId=${encodeURIComponent(videoId)}`);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Fetched data:', data);
    
            // 데이터 구조를 확인
            console.log('Data type:', typeof data);
            console.log('Data length:', data.length);
       

            let items = [];
            if (Array.isArray(data)) {
                data.forEach((item, index) => {
                    items.push(item);
                });
            }
            console.log('items:',items)
    
            // 데이터를 상태에 저장
            setData(items);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, [videoId]);
    

    useEffect(() => {
        if (!videoId) {
            console.error('No videoId provided');
            return;
        }
        fetchData();
    }, [videoId, fetchData]);

    const drawOverlay = useCallback(() => {
        console.log('drawOverlay called');
    
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const playerElement = playerRef.current;
        const player = playerInstanceRef.current;
    
        if (!canvas || !ctx || !playerElement || !player) {
            console.log('Player or CanvasRef is not ready');
            return;
        }
    
        const playerWidth = playerElement.clientWidth || 800;
        const playerHeight = playerElement.clientHeight || 450;
    
        canvas.width = playerWidth;
        canvas.height = playerHeight;
    
        console.log('Canvas size:', canvas.width, canvas.height);
        console.log('Player size:', playerWidth, playerHeight);
    
        if (player instanceof window.YT.Player && typeof player.getPlayerState === 'function') {
            if (player.getPlayerState() === window.YT.PlayerState.PLAYING) {
                if (typeof player.getCurrentTime === 'function') {
                    try {
                        const currentTime = player.getCurrentTime();
                        const fps = 30; // 30 FPS
                        const currentFrame = Math.floor(currentTime * fps);
                        console.log('Current time:', currentTime, 'Frame:', currentFrame);
    
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

    
                        // Filtering data with tolerance
                        const tolerance = 15; // Tolerance for frame number
                        console.log('data:',data.item.frameNumber);
                        const filteredData = data.filter(item =>
                            item.frameNumber !== undefined &&
                            Math.abs(item.frameNumber - currentFrame) <= tolerance
                            
                        );
    
                        console.log('Filtered Data:', filteredData);
                        
    
                        if (filteredData.length === 0) {
                            console.log('No data to draw for current frame.');
                            return;
                        }
    
                        filteredData.forEach(item => {
                            console.log('Drawing item:', item.x, item.y, item.width, item.height);
    
                            const x = item.x * canvas.width;
                            const y = item.y * canvas.height;
                            const width = item.width * canvas.width;
                            const height = item.height * canvas.height;
    
                            ctx.strokeStyle = 'red';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(x, y, width, height);
    
                            ctx.font = '16px Arial';
                            ctx.fillStyle = 'red';
                            ctx.fillText(`${item.jerseyNumber}`, x, y - 10);
    
                            // Display team and trackID
                            ctx.font = '12px Arial';
                            ctx.fillStyle = 'blue';
                            ctx.fillText(`Team: ${item.team}`, x, y + height + 10);
                            ctx.fillText(`Track ID: ${item.trackId}`, x, y + height + 25);
                        });
                    } catch (error) {
                        console.error('Error drawing overlay:', error);
                    }
                } else {
                    console.log('getCurrentTime method is not available on player');
                }
            } else {
                console.log('Player is not in PLAYING state, current state:', player.getPlayerState());
            }
        } else {
            console.log('Player object is not an instance of YT.Player or getPlayerState method is not available');
        }
    }, [data]);

    const initializeYouTubePlayer = useCallback(() => {
        if (!playerRef.current || playerInstanceRef.current) return;

        console.log('Initializing YouTube player:', playerRef.current);

        const newPlayer = new window.YT.Player(playerRef.current, {
            height: '450',
            width: '800',
            videoId: videoId,
            events: {
                'onReady': (event) => {
                    console.log('YouTube player is ready:', event.target);
                    playerInstanceRef.current = event.target;

                    setTimeout(() => {
                        drawOverlay(); // Draw overlay once player is ready
                    }, 1000); // 1 second delay
                },
                'onStateChange': (event) => {
                    console.log('Player state changed:', event.data);
                    if (event.data === window.YT.PlayerState.PLAYING) {
                        if (!animationFrameId.current) {
                            const updateOverlay = () => {
                                drawOverlay();
                                animationFrameId.current = requestAnimationFrame(updateOverlay);
                            };
                            updateOverlay();
                        }
                    } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
                        if (animationFrameId.current) {
                            cancelAnimationFrame(animationFrameId.current);
                            animationFrameId.current = null;
                        }
                    }
                }
            }
        });

        console.log('New Player created:', newPlayer);
        playerInstanceRef.current = newPlayer;
    }, [videoId, drawOverlay]);

    useEffect(() => {
        const onYouTubeIframeAPIReady = () => {
            console.log('YouTube IFrame API is ready.');
            isYouTubeAPIReady.current = true;
            initializeYouTubePlayer();
        };

        if (window.YT && window.YT.Player) {
            onYouTubeIframeAPIReady();
        } else {
            window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
            const script = document.createElement('script');
            script.src = "https://www.youtube.com/iframe_api";
            script.async = true;
            script.onload = () => console.log('YouTube IFrame API script loaded.');
            document.body.appendChild(script);
        }
    }, [initializeYouTubePlayer]);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            console.log('ResizeObserver triggered');
            const playerElement = playerRef.current;
            const canvas = canvasRef.current;
            if (playerElement && canvas) {
                canvas.width = playerElement.clientWidth || 800;
                canvas.height = playerElement.clientHeight || 450;
                console.log('Canvas size updated:', canvas.width, canvas.height);
                drawOverlay();
            }
        });

        const playerElement = playerRef.current;
        if (playerElement) {
            resizeObserver.observe(playerElement);
        }

        return () => {
            if (playerElement) {
                resizeObserver.unobserve(playerElement);
            }
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        };
    }, [drawOverlay]);

    return (
        <div className="video-viewer">
            <Sidebar />
            <div className="video-container">
                <div ref={playerRef} className="video-player" />
                <canvas ref={canvasRef} className="overlay-canvas" />
            </div>
        </div>
    );
};

export default VideoViewer;
