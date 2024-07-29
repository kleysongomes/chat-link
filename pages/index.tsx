import { useState } from 'react';
import { useRouter } from 'next/router';
import React from 'react';

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();

  const joinRoom = () => {
    if (roomId.trim() !== '') {
      router.push(`/room?roomId=${roomId}`);
    }
  };

  return (
    <div>
      <h1>Welcome to Video Call App</h1>
      <input 
        type="text" 
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)} 
        placeholder="Enter Room ID"
      />
      <button onClick={joinRoom}>Join Room</button>
    </div>
  );
};

export default Home;
