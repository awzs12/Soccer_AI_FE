import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '../../css/VideoViewer.css';

const VideoViewer = () => {
    const { type, videoId } = useParams();
    const [data, setData] = useState([]);
    const [player, setPlayer] = useState(null);
    const canvasRef = useRef(null);
    const playerRef = useRef(null);
    const isYouTubeAPIReady = useRef(false);
    const animationFrameId = useRef(null);

    useEffect(() => {
        if (!videoId) {
            console.error('No videoId provided');
            return;
        }

        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:8081/api/players/by-video?videoId=${encodeURIComponent(videoId)}`);
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                const data = await response.json();
                console.log('Fetched data:', data);
                setData(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [videoId]);

    const drawOverlay = useCallback(() => {
        console.log('drawOverlay called');
        console.log('Player:', player);
        console.log('Canvas:', canvasRef.current);
        
        if (!player || !canvasRef.current || !playerRef.current) {
            console.error('Player or canvas not available');
            return;
        }
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Failed to get 2D context from canvas');
            return;
        }
        
        const playerWidth = playerRef.current.clientWidth;
        const playerHeight = playerRef.current.clientHeight;
        
        if (playerWidth <= 0 || playerHeight <= 0) {
            console.error('Player dimensions are not available');
            return;
        }
        
        canvas.width = playerWidth;
        canvas.height = playerHeight;
        
        const currentTime = player.getCurrentTime();
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const currentFrameData = data.filter(item => Math.abs(item.timestamp - currentTime) < 0.1);
        
        currentFrameData.forEach(item => {
            const x = item.x * canvas.width;
            const y = item.y * canvas.height;
            const width = item.width * canvas.width;
            const height = item.height * canvas.height;
        
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        
            ctx.font = '16px Arial';
            ctx.fillStyle = 'red';
            ctx.fillText(`ID: ${item.trackId}`, x, y - 10);
        });
        
        if (player.getPlayerState() === window.YT.PlayerState.PLAYING) {
            animationFrameId.current = requestAnimationFrame(drawOverlay);
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        }
    }, [data, player]);
    
    

    const onPlayerReady = useCallback((event) => {
        console.log('YouTube player is ready');
        const playerInstance = event.target;
        setPlayer(playerInstance);
    
        const updateCanvasSize = () => {
            if (playerRef.current) {
                const playerWidth = playerRef.current.clientWidth;
                const playerHeight = playerRef.current.clientHeight;
                console.log(`Player dimensions on ready: ${playerWidth}x${playerHeight}`);
                
                if (playerWidth > 0 && playerHeight > 0) {
                    canvasRef.current.width = playerWidth;
                    canvasRef.current.height = playerHeight;
                    drawOverlay(); // 초기 오버레이 그리기
                } else {
                    console.error('Player dimensions are invalid in onPlayerReady');
                }
            } else {
                console.error('PlayerRef not available on onPlayerReady');
            }
        };
    
        // 일정 시간 지연 후 크기 설정 시도
        setTimeout(updateCanvasSize, 1000);
    
        // 크기 변경 감지를 위해 resizeObserver 등록
        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });
    
        resizeObserver.observe(playerRef.current);
    
        return () => resizeObserver.disconnect(); // 컴포넌트 언마운트 시 옵저버 정리
    }, [drawOverlay]);
    
    const onPlayerStateChange = useCallback((event) => {
        console.log('Player state changed:', event.data);
        const newState = event.data;

        if (newState === window.YT.PlayerState.PLAYING) {
            console.log('Player is playing');
            if (!animationFrameId.current) {
                animationFrameId.current = requestAnimationFrame(drawOverlay);
            }
        } else if (newState === window.YT.PlayerState.PAUSED || newState === window.YT.PlayerState.ENDED) {
            console.log('Player is paused or ended');
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        }
    }, [drawOverlay]);

    const initializeYouTubePlayer = useCallback(() => {
        if (!playerRef.current) {
            console.error('Player reference is not available');
            return;
        }
    
        if (player) return;
    
        const newPlayer = new window.YT.Player(playerRef.current, {
            height: '450',
            width: '800',
            videoId: videoId,
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
        setPlayer(newPlayer);
        console.log('YouTube player initialized');
    }, [videoId, player, onPlayerReady, onPlayerStateChange]);

    useEffect(() => {
        if (window.YT && window.YT.Player) {
            console.log('YouTube API is loaded');
            if (!isYouTubeAPIReady.current) {
                initializeYouTubePlayer();
                isYouTubeAPIReady.current = true;
            }
        } else {
            window.onYouTubeIframeAPIReady = () => {
                console.log('YouTube API is ready');
                initializeYouTubePlayer();
                isYouTubeAPIReady.current = true;
            };
            const script = document.createElement('script');
            script.src = "https://www.youtube.com/iframe_api";
            script.async = true;
            document.body.appendChild(script);
        }
    }, [initializeYouTubePlayer]);
    
    useEffect(() => {
        const checkAndSetSize = () => {
            if (playerRef.current && canvasRef.current) {
                const playerWidth = playerRef.current.clientWidth;
                const playerHeight = playerRef.current.clientHeight;
    
                if (playerWidth > 0 && playerHeight > 0) {
                    canvasRef.current.width = playerWidth;
                    canvasRef.current.height = playerHeight;
                    drawOverlay(); // 크기 변경 후 drawOverlay 호출
                } else {
                    console.error('Player dimensions are invalid');
                }
            }
        };
    
        checkAndSetSize();
    }, [player, drawOverlay]);
    useEffect(() => {
        if (playerRef.current) {
            const resizeObserver = new ResizeObserver(() => {
                const playerWidth = playerRef.current.clientWidth;
                const playerHeight = playerRef.current.clientHeight;
                console.log(`ResizeObserver: Player dimensions are ${playerWidth}x${playerHeight}`);
                
                if (playerWidth > 0 && playerHeight > 0) {
                    canvasRef.current.width = playerWidth;
                    canvasRef.current.height = playerHeight;
                    drawOverlay();
                } else {
                    console.error('ResizeObserver: Player dimensions are invalid');
                }
            });
    
            resizeObserver.observe(playerRef.current);
    
            return () => resizeObserver.disconnect();
        }
    }, [player, drawOverlay]);
    
    useLayoutEffect(() => {
        if (player && playerRef.current && canvasRef.current) {
            const playerWidth = playerRef.current.clientWidth;
            const playerHeight = playerRef.current.clientHeight;
    
            console.log(`useLayoutEffect: Player dimensions are ${playerWidth}x${playerHeight}`);
    
            if (playerWidth > 0 && playerHeight > 0) {
                canvasRef.current.width = playerWidth;
                canvasRef.current.height = playerHeight;
                drawOverlay(); // 크기 변경 후 drawOverlay 호출
            } else {
                console.error('useLayoutEffect: Player dimensions are invalid');
            }
        }
    }, [player, drawOverlay]);
    

    return (
        <div>
            <Sidebar />
            <div className='videoviewerBody'>
                <h1>{type === 'analysis' ? 'Analysis View' : type === 'broadcasting' ? 'Broadcasting View' : 'Default View'}</h1>
                <div className="videoPlayer">
                    <div ref={playerRef} />
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
