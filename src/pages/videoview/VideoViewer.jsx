import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '../../css/VideoViewer.css';

const VideoViewer = () => {
    const { videoId } = useParams();
    const [allItems, setAllItems] = useState([]);
    const [team0Items, setTeam0Items] = useState([]);
    const [team1Items, setTeam1Items] = useState([]);
    const [team2Items, setTeam2Items] = useState([]);
    const [minimapItems, setMinimapItems] = useState([]);
    const [isDataLoaded, setIsDataLoaded] = useState({ allItems: false, minimap: false });
    const [currentMinimapItems, setCurrentMinimapItems] = useState([]);

    const canvasRef = useRef(null);
    const minimapRef = useRef(null);
    const playerRef = useRef(null);
    const playerInstanceRef = useRef(null);
    const isYouTubeAPIReady = useRef(false);
    const animationFrameId = useRef(null);

    const fetchMinimapData = useCallback(async () => {
        try {
            console.log('미니맵 데이터 가져오는 중...');
            const response = await fetch(`http://localhost:8081/api/client/minimap?videoId=${encodeURIComponent(videoId)}`);
            if (!response.ok) {
                throw new Error(`네트워크 응답이 정상적이지 않습니다: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('가져온 미니맵 데이터:', data);
            setMinimapItems(data);
            setIsDataLoaded(prevState => ({...prevState, minimap: true}));
        } catch (error) {
            console.error('미니맵 데이터 가져오는 중 오류 발생:', error);
        }
    }, [videoId]);

    const fetchAllItemsData = useCallback(async () => {
        try {
            console.log('모든 아이템 데이터 가져오는 중...');
            const response = await fetch(`http://localhost:8081/api/players/by-video?videoId=${encodeURIComponent(videoId)}`);
            if (!response.ok) {
                throw new Error(`네트워크 응답이 정상적이지 않습니다: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('가져온 모든 아이템 데이터:', data);
            const flattenedItems = Array.isArray(data) ? data.flat() : [];
            console.log('평면화된 아이템:', flattenedItems);
            setAllItems(flattenedItems);
            setIsDataLoaded(prevState => ({...prevState, allItems: true}));
        } catch (error) {
            console.error('모든 아이템 데이터 가져오는 중 오류 발생:', error);
        }
    }, [videoId]);

    const drawMinimap = useCallback(() => {
        const minimap = minimapRef.current;
        const ctx = minimap?.getContext('2d');

        if (!minimap || !ctx) return;

        const minimapWidth = 800;
        const minimapHeight = 450;

        minimap.width = minimapWidth;
        minimap.height = minimapHeight;

        ctx.clearRect(0, 0, minimap.width, minimap.height);

        if (currentMinimapItems.length === 0) {
            console.log('현재 미니맵 아이템이 없습니다.');
            return;
        }

        console.log('현재 미니맵 아이템:', currentMinimapItems);

        for (const item of currentMinimapItems) {
            const x = (item.x / 1050) * minimapWidth;
            const y = (item.y / 680) * minimapHeight;
            const radius = 9;

            // const color = 'rgba(255, 0, 0, 0.8)';
            const color = item.team === 0 
                ? 'rgba(255, 0, 0, 0.8)' 
                : (item.team === 1 
                    ? 'rgba(0, 0, 255, 0.8)' 
                    : 'rgba(255, 255, 0, 0.8)');

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }, [currentMinimapItems]);

    const drawOverlay = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const playerElement = playerRef.current;
        const player = playerInstanceRef.current;
    
        if (!canvas || !ctx || !playerElement || !player) {
            console.log('캔버스, 컨텍스트, 플레이어 요소 또는 플레이어 인스턴스가 누락되었습니다.');
            return;
        }
    
        if (allItems.length === 0) {
            console.log('오버레이 아이템이 없습니다.');
            return;
        }
    
        const playerWidth = playerElement.clientWidth || 800;
        const playerHeight = playerElement.clientHeight || 450;
    
        canvas.width = playerWidth;
        canvas.height = playerHeight;
    
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        if (player instanceof window.YT.Player && typeof player.getPlayerState === 'function') {
            if (player.getPlayerState() === window.YT.PlayerState.PLAYING && typeof player.getCurrentTime === 'function') {
                const currentTime = player.getCurrentTime();
                const fps = 30; // 비디오 FPS 확인 필요
                const currentFrame = Math.floor(currentTime * fps);
    
                console.log('현재 시간:', currentTime);
                console.log('현재 프레임:', currentFrame);
    
                const filteredItems = allItems
                    .filter(item => item.frameNumber === currentFrame)
                    .filter(item => item.jerseyNumber !== 100 && item.jerseyNumber !== 0);
    
                console.log('필터링된 아이템:', filteredItems);
    
                setTeam0Items(filteredItems.filter(item => item.team === 0));
                setTeam1Items(filteredItems.filter(item => item.team === 1));
                setTeam2Items(filteredItems.filter(item => item.team === 2));
    
                // 현재 프레임에 해당하는 미니맵 아이템 업데이트
                const currentMinimapItems = minimapItems.filter(item => item.frameNumber === currentFrame);
                setCurrentMinimapItems(currentMinimapItems);
    
                // 오버레이 그리기
                for (const item of filteredItems) {
                    const x = (item.x / 1920) * canvas.width;
                    const y = (item.y / 1088) * canvas.height;
                    const width = (item.width / 1920) * canvas.width;
                    const height = (item.height / 1088) * canvas.height;
                    const footX = x + (width / 2);
                    const footY = y + height;
                    const radius = width / 2;
                    const color = item.team === 0 
                        ? 'rgba(255, 0, 0, 0.8)' 
                        : (item.team === 2 
                            ? 'rgba(0, 0, 255, 0.8)' 
                            : 'rgba(255, 255, 0, 0.8)');
    
                    ctx.beginPath();
                    ctx.arc(footX, footY, radius, 0, Math.PI, false);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.stroke();
    
                    ctx.font = 'bold 14px Arial';
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.lineWidth = 2;
                    const text = `${item.jerseyNumber}`;
                    const textWidth = ctx.measureText(text).width;
                    ctx.strokeText(text, footX - textWidth / 2, footY - radius / 2);
                    ctx.fillText(text, footX - textWidth / 2, footY - radius / 2);
                }
            }
        }
    }, [allItems, minimapItems]);

    const initializeYouTubePlayer = useCallback(() => {
        if (!playerRef.current || playerInstanceRef.current) return;

        console.log('YouTube 플레이어 초기화:', playerRef.current);

        const newPlayer = new window.YT.Player(playerRef.current, {
            height: '450',
            width: '800',
            videoId: videoId,
            events: {
                'onReady': (event) => {
                    console.log('YouTube 플레이어 준비 완료:', event.target);
                    playerInstanceRef.current = event.target;
                },
                'onStateChange': (event) => {
                    console.log('플레이어 상태 변경:', event.data);
                    if (event.data === window.YT.PlayerState.PLAYING) {
                        if (!animationFrameId.current) {
                            const updateOverlay = () => {
                                drawOverlay();
                                drawMinimap();
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

        console.log('새로운 플레이어 생성:', newPlayer);
        playerInstanceRef.current = newPlayer;
    }, [videoId, drawOverlay,drawMinimap]);

    useEffect(() => {
        fetchAllItemsData();
        fetchMinimapData();
    }, [fetchAllItemsData, fetchMinimapData]);

    useEffect(() => {
        if (isDataLoaded.allItems && isDataLoaded.minimap) {
            drawOverlay();
            drawMinimap();
        }
    }, [isDataLoaded, drawOverlay, drawMinimap]);

    useEffect(() => {
        drawMinimap();
    }, [currentMinimapItems, drawMinimap]);


    useEffect(() => {
        const onYouTubeIframeAPIReady = () => {
            console.log('YouTube IFrame API 준비 완료.');
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
            const minimap = minimapRef.current;

            if (playerElement && canvas) {
                canvas.width = playerElement.clientWidth || 800;
                canvas.height = playerElement.clientHeight || 450;
                drawOverlay();

                if (minimap) {
                    minimap.width = 800;
                    minimap.height = 112;
                    drawMinimap();
                }
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
    }, [drawOverlay, drawMinimap]);

    useEffect(() => {
        if (minimapItems.length > 0) {
            drawMinimap();
        }
    }, [minimapItems, drawMinimap]);

    if (!isDataLoaded.allItems || !isDataLoaded.minimap) {
        return <div>데이터 로딩 중...</div>;
    }

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
            <div className="minimap-container">
                <canvas ref={minimapRef} className="minimap-canvas" />
            </div>
        </div>
    );
};

export default VideoViewer;