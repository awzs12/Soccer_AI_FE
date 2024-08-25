import React, { useState } from 'react';

const PlayerNameInput = ({ onSave }) => {
    const [jerseyNumber, setJerseyNumber] = useState('');
    const [team, setTeam] = useState('');
    const [playerName, setPlayerName] = useState('');

    const handleSave = () => {
        if (jerseyNumber && team && playerName) {
            onSave(jerseyNumber, team, playerName);
            setJerseyNumber('');
            setTeam('');
            setPlayerName('');
        } else {
            alert('모든 필드를 입력해 주세요.');
        }
    };

    return (
        <div className="player-name-input">
            <h2>선수 정보 추가</h2>
            <input
                type="text"
                placeholder="저지 번호"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
            />
            <input
                type="text"
                placeholder="팀 (0 또는 1)"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
            />
            <input
                type="text"
                placeholder="선수 이름"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
            />
            <button onClick={handleSave}>저장</button>
        </div>
    );
};

export default PlayerNameInput;
