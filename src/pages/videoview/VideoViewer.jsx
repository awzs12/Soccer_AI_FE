import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import '../../css/VideoViewer.css';
import PlayerNameInput from '../../components/PlayerNameInput';

const VideoViewer = () => {
    const { videoId } = useParams();
    const [allItems, setAllItems] = useState([]);
    const [team0Items, setTeam0Items] = useState([]);
    const [team1Items, setTeam1Items] = useState([]);
    const [minimapItems, setMinimapItems] = useState([]);
    const [isDataLoaded, setIsDataLoaded] = useState({ allItems: false, minimap: false });
    const [currentMinimapItems, setCurrentMinimapItems] = useState([]);
    const [teamColors, setTeamColors] = useState({});
    const [searchNumbers, setSearchNumbers] = useState([]);
    const [players, setPlayers] = useState([]);

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
            setIsDataLoaded(prevState => ({ ...prevState, minimap: true }));
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
            setIsDataLoaded(prevState => ({ ...prevState, allItems: true }));
        } catch (error) {
            console.error('모든 아이템 데이터 가져오는 중 오류 발생:', error);
        }
    }, [videoId]);

    const calculateTeamColors = useCallback((items) => {
        const teamCounts = items.reduce((acc, item) => {
            acc[item.team] = (acc[item.team] || 0) + 1;
            return acc;
        }, {});

        const sortedTeams = Object.keys(teamCounts).sort((a, b) => teamCounts[b] - teamCounts[a]);

        const colors = {
            [sortedTeams[0]]: 'rgba(255, 0, 0, 0.8)',    // 가장 많은 팀: 빨강
            [sortedTeams[1]]: 'rgba(0, 0, 255, 0.8)'    // 두 번째로 많은 팀: 파랑
            // [sortedTeams[2]]: 'rgba(255, 255, 0, 0.8)',  // 가장 적은 팀: 노랑
        };

        setTeamColors(colors);
    }, []);

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

        for (const item of currentMinimapItems) {
            const x = (item.x / 1050) * minimapWidth;
            const y = (item.y / 680) * minimapHeight;
            const radius = 9;
            const color = teamColors[item.team] || 'rgba(128, 128, 128, 0.8)';

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();

            ctx.font = 'bold 10px Arial';  
            ctx.fillStyle = 'white';       
            ctx.textAlign = 'center';     
            ctx.textBaseline = 'middle';   
            // ctx.fillText(item.jerseyNumber, x, y);  
        }
    }, [currentMinimapItems, teamColors]);

    const handleSearchChange = (event) => {
        const inputValue = event.target.value;
        const numbers = inputValue
            .split(/[\s,]+/) 
            .filter(num => num.trim() !== '') 
            .map(num => num.trim());
        setSearchNumbers(numbers);
    };

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
                const fps = 30; 
                const currentFrame = Math.floor(currentTime * fps);

                console.log('현재 시간:', currentTime);
                console.log('현재 프레임:', currentFrame);

                let filteredItems = allItems
                    .filter(item => item.frameNumber === currentFrame)
                    .filter(item => item.jerseyNumber !== 100 && item.jerseyNumber !== 0);

                if (searchNumbers.length > 0) {
                    filteredItems = filteredItems.filter(item => searchNumbers.includes(item.jerseyNumber.toString()));
                }
                    
                console.log('필터링된 아이템:', filteredItems);

                setTeam0Items(filteredItems.filter(item => item.team === 0));
                setTeam1Items(filteredItems.filter(item => item.team === 1));

                
                const currentMinimapItems = minimapItems
                    .filter(item => item.frameNumber === currentFrame);
                console.log('필터링된 미니맵 아이템:', currentMinimapItems);
                setCurrentMinimapItems(currentMinimapItems);

                // 오버레이 그리기
                for (const item of filteredItems) {
                    const x = (item.x / 1920) * canvas.width;
                    const y = (item.y / 1088) * canvas.height;
                    const width = (item.width / 1920) * canvas.width;
                    const height = (item.height / 1088) * canvas.height;
                    const centerX = x;
                    const centerY = y + Math.floor(height / 2);
                    
                    const radiusX = Math.floor(width / 2);
                    const radiusY = Math.floor(height / 5);
                    const angle = 0;
                    const startAngle = 0;
                    const endAngle = 250 * (Math.PI / 180); // 각도를 라디안으로 변환
                    const thickness = 2;
                    const arccolor = teamColors[item.team] || 'rgba(128, 128, 128, 0.8)';

                    ctx.beginPath();
                    ctx.ellipse(centerX, centerY, radiusX, radiusY, angle, startAngle, endAngle);
                    ctx.strokeStyle = arccolor;
                    ctx.lineWidth = thickness;
                    ctx.stroke();

                    ctx.font = 'bold 14px Arial';
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.lineWidth = 2;
                    const player = players.find(p => p.jerseyNumber === item.jerseyNumber && p.team === item.team);
                    const text = player ? `${item.jerseyNumber} - ${player.player_name}` : `${item.jerseyNumber}`;
                    const textWidth = ctx.measureText(text).width;
                    const orgX = x - textWidth / 2;
                    const orgY = y + Math.floor(height / 2) + 25;
                    ctx.strokeText(text, orgX, orgY);
                    ctx.fillText(text, orgX, orgY);
                }
            }
        }
    }, [allItems, minimapItems, teamColors, searchNumbers, players]);

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
    }, [videoId, drawOverlay, drawMinimap]);

    const handlePlayersUpdate = useCallback((updatedPlayers) => {
        setPlayers(updatedPlayers);
    }, []);

    useEffect(() => {
        fetchAllItemsData();
        fetchMinimapData();
    }, [fetchAllItemsData, fetchMinimapData]);

    useEffect(() => {
        if (isDataLoaded.allItems && isDataLoaded.minimap) {
            calculateTeamColors(allItems);
            drawOverlay();
            drawMinimap();
        }
    }, [isDataLoaded, allItems, calculateTeamColors, drawOverlay, drawMinimap]);

    useEffect(() => {
        drawMinimap();
    }, [currentMinimapItems, drawMinimap]);

    useEffect(() => {
        const onYouTubeIframeAPIReady = () => {
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
                    minimap.width = 700;
                    minimap.height = 450;
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

    useEffect(() => {
        if (allItems.length > 0) {
            calculateTeamColors(allItems);
        }
    }, [allItems, calculateTeamColors]);

    if (!isDataLoaded.allItems || !isDataLoaded.minimap) {
        return <div>데이터 로딩 중...</div>;
    }

    return (
        <div className="video-viewer">
            <Sidebar />
            <div className="video-container">
                <div className="imgBox">
                    <div className="bg"></div>
                    <h1>Video Viewer</h1>
                </div>
    
                <div className="content-box">
                    <div className="video-player-container">
                        <div ref={playerRef} className="video-player" />
                        <canvas ref={canvasRef} className="overlay-canvas" />
                    </div>
                    <div className="minimap-container">
                        <canvas ref={minimapRef} className="minimap-canvas" />
                    </div>
                </div>
    
                
                <div className="player-list-container">
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
                    </div>
                </div>
    
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="선수 번호 검색 (쉼표 또는 공백으로 구분)"
                        onChange={handleSearchChange}
                    />
                </div>
    
                <PlayerNameInput
                    videoId={videoId}
                    onPlayersUpdate={handlePlayersUpdate}
                />
            </div>
        </div>
    );
};    
export default VideoViewer;
