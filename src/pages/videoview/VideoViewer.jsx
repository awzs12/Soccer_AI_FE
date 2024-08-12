import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '../../css/VideoViewer.css';

const VideoViewer = () => {
    const { videoId } = useParams();
    const [allItems, setAllItems] = useState([]);
    const [items, setItems] = useState([]); // 기존 Items를 items로 수정
    const [team0Items, setTeam0Items] = useState([]); // 팀 0 아이템
    const [team1Items, setTeam1Items] = useState([]); // 팀 1 아이템
    const [team2Items, setTeam2Items] = useState([]); // 팀 2 아이템
    const canvasRef = useRef(null);
    const playerRef = useRef(null);
    const playerInstanceRef = useRef(null);
    const isYouTubeAPIReady = useRef(false);
    const animationFrameId = useRef(null);

    

    const drawOverlay = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const playerElement = playerRef.current;
        const player = playerInstanceRef.current;
        
        if (!canvas || !ctx || !playerElement || !player) {
            return;
        }

        const playerWidth = playerElement.clientWidth || 800;
        const playerHeight = playerElement.clientHeight || 450;

        canvas.width = playerWidth;
        canvas.height = playerHeight;

        if (player instanceof window.YT.Player && typeof player.getPlayerState === 'function') {
            if (player.getPlayerState() === window.YT.PlayerState.PLAYING && typeof player.getCurrentTime === 'function') {
                try {
                    const currentTime = player.getCurrentTime();
                    const fps = 30; // 30 FPS
                    const currentFrame = Math.floor(currentTime * fps);

                    // Filter items for the current frame
                    const filteredItems = allItems
                    .filter(item => item.frameNumber === currentFrame)
                    .filter(item => item.jerseyNumber !== 100 && item.jerseyNumber !== 0);
                     
                    setTeam0Items(filteredItems.filter(item => item.team === 0));
                    setTeam1Items(filteredItems.filter(item => item.team === 1));
                    setTeam2Items(filteredItems.filter(item => item.team === 2));

                    // Update state with filtered items
                    setItems(filteredItems);

                    // Log the filtered items, current frame, and current time
                    console.log('Current time:', currentTime);
                    console.log('Current frame:', currentFrame);
                    console.log('Filtered items:', filteredItems);
                    console.log('items:', items);
                  
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    for (const item of filteredItems) {
                        console.log('Drawing item:', item);
                        const x = (item.x / 1920) * canvas.width;
                        const y = (item.y / 1088) * canvas.height;
                        const width = (item.width / 1920) * canvas.width;
                        const height = (item.height / 1088) * canvas.height;
                    
                        // 발 쪽 중앙 좌표 계산
                        const footX = x + (width / 2);
                        const footY = y + height;
                    
                        // 반원 크기 설정
                        const radius = width / 2;
                    
                        // const color = item.team === 0 ? 'rgba(255, 0, 0, 0.8)' : (item.team === 1 ? 'rgba(0, 0, 255, 0.8)' : null);
                    
                        //   팀에 따른 색상 설정
                        const color = item.team === 0 
                            ? 'rgba(255, 0, 0, 0.8)' 
                            : (item.team === 2 
                                ? 'rgba(0, 0, 255, 0.8)' 
                                : 'rgba(255, 255, 0, 0.8)');  // team이 1일 경우 노란

                    
                        // 반원 그리기
                        ctx.beginPath();
                        ctx.arc(footX, footY, radius, 0, Math.PI, false);
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    
                        // 저지 번호 그리기
                        ctx.font = 'bold 14px Arial';
                        ctx.fillStyle = 'white';
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.lineWidth = 2;
                        const text = `${item.jerseyNumber}`;
                        const textWidth = ctx.measureText(text).width;
                        ctx.strokeText(text, footX - textWidth / 2, footY - radius / 2);
                        ctx.fillText(text, footX - textWidth / 2, footY - radius / 2);
                    }
                    
                    
                    
                    
                } catch (error) {
                    console.error('Error drawing overlay:', error);
                }
            }
        }
    }, [allItems, items]); // items 상태에 의존

    const fetchData = useCallback(async () => {
        try {
            console.log('Fetching data...');
            const response = await fetch(`http://localhost:8081/api/players/by-video?videoId=${encodeURIComponent(videoId)}`);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Fetched data:', data);

            // Flatten the nested arrays into a single array
            const flattenedItems = Array.isArray(data) ? data.flat() : [];
            console.log('Flattened items:', flattenedItems);

            // Store flattened items in state
            setAllItems(flattenedItems);
            console.log('All items state updated:', flattenedItems);

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, [videoId]);

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
        fetchData();
    }, [fetchData]);

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
            document.body.appendChild(script);
        }

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        };
    }, [initializeYouTubePlayer]);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            const playerElement = playerRef.current;
            const canvas = canvasRef.current;
            if (playerElement && canvas) {
                canvas.width = playerElement.clientWidth || 800;
                canvas.height = playerElement.clientHeight || 450;
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
                <div className="video-player-container">
                    <div ref={playerRef} className="video-player" />
                    <canvas ref={canvasRef} className="overlay-canvas" />
                </div>
                <div className="player-list">
                <h2>선수 목록</h2>
                    <h3>팀 0</h3>
                    <ul>
                        {team0Items.map(item => (
                            <li key={item.idx}>{item.jerseyNumber}</li>
                        ))}
                    </ul>
                    <h3>팀 1</h3>
                    <ul>
                        {team1Items.map(item => (
                            <li key={item.idx}>{item.jerseyNumber}</li>
                        ))}
                    </ul>
                    <h3>팀 2</h3>
                    <ul>
                        {team2Items.map(item => (
                            <li key={item.idx}>{item.jerseyNumber}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default VideoViewer;
