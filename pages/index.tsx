import { useState } from 'react';
import { useRouter } from 'next/router';
import React from 'react';

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const generateRoomId = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/room?roomId=${newRoomId}`);
  };

  const joinRoom = async () => {
    if (roomId.trim() === '') {
      setError('Room ID cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/check-room?roomId=${roomId}`);
      const data = await response.json();
      if (data.exists) {
        router.push(`/room?roomId=${roomId}`);
      } else {
        setError('Room does not exist.');
      }
    } catch (error) {
      console.error('Error checking room ID:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <h1>Welcome to Video Call App</h1>
      <button onClick={generateRoomId}>Create Room</button>
      <input 
        type="text" 
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)} 
        placeholder="Enter Room ID"
      />
      <button onClick={joinRoom}>Join Room</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Home;
