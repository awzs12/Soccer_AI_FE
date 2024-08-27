import React, { useState, useEffect, useCallback } from 'react';
import '../css/PlayerNameInput.css';

const PlayerNameInput = ({ videoId, onPlayersUpdate }) => {
    const [jerseyNumber, setJerseyNumber] = useState('');
    const [team, setTeam] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [players, setPlayers] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    const fetchPlayerInfo = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8081/api/players/info?videoId=${encodeURIComponent(videoId)}`);
            if (!response.ok) {
                throw new Error(`네트워크 응답이 정상적이지 않습니다: ${response.statusText}`);
            }
            const data = await response.json();
            setPlayers(data);
            onPlayersUpdate(data);
        } catch (error) {
            console.error('선수 정보 가져오는 중 오류 발생:', error);
        }
    }, [videoId, onPlayersUpdate]);

    useEffect(() => {
        fetchPlayerInfo();
    }, [fetchPlayerInfo]);

    const saveOrUpdatePlayer = async (e) => {
        e.preventDefault();
        try {
            const url = selectedPlayer 
                ? `http://localhost:8081/api/players/info/${selectedPlayer.id}`
                : 'http://localhost:8081/api/players/info';
            const method = selectedPlayer ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jerseyNumber: parseInt(jerseyNumber),
                    team: parseInt(team),
                    player_name: playerName,
                    videoId: videoId
                }),
            });
            if (!response.ok) {
                throw new Error(`네트워크 응답이 정상적이지 않습니다: ${response.statusText}`);
            }
            fetchPlayerInfo();
            resetForm();
        } catch (error) {
            console.error('선수 정보 저장/수정 중 오류 발생:', error);
        }
    };

    const deletePlayer = async (jerseyNumber, team) => {
        try {
            const response = await fetch(`http://localhost:8081/api/players/info?jerseyNumber=${jerseyNumber}&team=${team}&videoId=${videoId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`네트워크 응답이 정상적이지 않습니다: ${response.statusText}`);
            }
            await fetchPlayerInfo();
            resetForm();
        } catch (error) {
            console.error('선수 정보 삭제 중 오류 발생:', error);
        }
    };

    const selectPlayerForEdit = (player) => {
        setSelectedPlayer(player);
        setJerseyNumber(player.jerseyNumber.toString());
        setTeam(player.team.toString());
        setPlayerName(player.player_name);
    };

    const resetForm = () => {
        setSelectedPlayer(null);
        setJerseyNumber('');
        setTeam('');
        setPlayerName('');
    };

    return (
    <div className="player-container">
        <form onSubmit={saveOrUpdatePlayer} className="form-inline">
            <input
                type="number"
                placeholder="등번호"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                required
            />
            <input
                type="number"
                placeholder="팀 (0 또는 1)"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                required
            />
        <input
            type="text"
            placeholder="선수 이름"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
        />
        <div className="button-group">
            <button type="submit">{selectedPlayer ? '수정' : '저장'}</button>
            {selectedPlayer && <button type="button" onClick={resetForm}>취소</button>}
        </div>
    </form>
    <ul className="player-list">
        {players.map(player => (
            <li key={player.id}>
                <div className="player-info">
                    {player.jerseyNumber} - {player.player_name} (팀: {player.team})
                </div>
                <div className="button-group">
                    <button onClick={() => selectPlayerForEdit(player)}>수정</button>
                    <button onClick={() => deletePlayer(player.jerseyNumber, player.team)}>삭제</button>
                </div>
            </li>
        ))}
    </ul>
</div>
    );
};

export default PlayerNameInput;
