// Room Component
import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import VideoPlayer from '../components/VideoPlayer';
import React from 'react';

const Room = () => {
  const [peers, setPeers] = useState<Peer.Instance[]>([]);
  const socketRef = useRef<any>();
  const userVideo = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ peerID: string, peer: Peer.Instance }[]>([]);
  const [roomID, setRoomID] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const roomId = new URLSearchParams(window.location.search).get('roomId');
      setRoomID(roomId);
      console.log('Room ID:', roomId);
    }
  }, []);

  useEffect(() => {
    if (roomID) {
      console.log('Connecting to socket...');
      // Certifique-se de que o caminho no cliente corresponda ao caminho do servidor
      // socketRef.current = io('http://localhost:3000', { path: '/api/socket' });
      socketRef.current = io('https://chat-link-alpha.vercel.app/', { path: '/api/socket' });

      socketRef.current.on('connect', () => {
        console.log('Connected to socket with ID:', socketRef.current.id);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socketRef.current.on('error', (error) => {
        console.error('Socket error:', error);
      });

      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          console.log('Got user media stream');
          if (userVideo.current) {
            userVideo.current.srcObject = stream;
          }

          socketRef.current.emit('join room', roomID);
          console.log('Joining room:', roomID);

          socketRef.current.on('all users', (users: any[]) => {
            console.log('All users in room:', users);
            if (users.length === 0) {
              setIsCreator(true);
              console.log('User is the creator of the room');
            }
            const peers: Peer.Instance[] = [];
            users.forEach(userID => {
              const peer = createPeer(userID, socketRef.current.id, stream);
              peersRef.current.push({
                peerID: userID,
                peer,
              });
              peers.push(peer);
            });
            setPeers(peers);
          });

          socketRef.current.on('user joined', ({ callerID }) => {
            console.log('User joined with ID:', callerID);
            const peer = addPeer(callerID, stream);
            peersRef.current.push({
              peerID: callerID,
              peer,
            });
            setPeers(users => [...users, peer]);
          });

          socketRef.current.on('receiving returned signal', ({ id, signal }) => {
            console.log('Receiving returned signal from user:', id);
            const item = peersRef.current.find(p => p.peerID === id);
            item?.peer.signal(signal);
          });

          socketRef.current.on('user left', id => {
            console.log('User left with ID:', id);
            const peerObj = peersRef.current.find(p => p.peerID === id);
            if (peerObj) {
              peerObj.peer.destroy();
            }
            const peers = peersRef.current.filter(p => p.peerID !== id);
            peersRef.current = peers;
            setPeers(peers);
          });

          socketRef.current.on('close room', () => {
            console.log('Room closed');
            handleLeaveCall(true);
          });
        })
        .catch(error => {
          console.error('Error getting user media:', error);
        });
    }
  }, [roomID]);

  const handleLeaveCall = (forceLeave = false) => {
    console.log('Leaving call...');
    peersRef.current.forEach(({ peer }) => peer.destroy());
    if (socketRef.current) {
      socketRef.current.emit('leave room', roomID);
      console.log('Emitting leave room event for room ID:', roomID);
      if (isCreator && !forceLeave) {
        socketRef.current.emit('close room', roomID);
        console.log('Emitting close room event for room ID:', roomID);
      }
      socketRef.current.disconnect();
      console.log('Disconnected from socket');
    }
    window.location.href = '/';
  };

  function createPeer(userToSignal: string, callerID: string, stream: MediaStream) {
    console.log('Creating peer with userToSignal:', userToSignal, 'callerID:', callerID);
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      console.log('Sending signal to user:', userToSignal);
      socketRef.current.emit('sending signal', { userToSignal, callerID, signal });
    });

    return peer;
  }

  function addPeer(callerID: string, stream: MediaStream) {
    console.log('Adding peer with callerID:', callerID);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      console.log('Returning signal to user:', callerID);
      socketRef.current.emit('returning signal', { signal, callerID });
    });

    return peer;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', height: '100vh' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
        <div style={{ width: 'calc(100% / 3)', height: 'calc(100% / 3)' }}>
          <video ref={userVideo} autoPlay playsInline muted style={{ width: '100%', height: '100%' }} />
        </div>
        {peers.map((peer, index) => (
          <div key={index} style={{ width: 'calc(100% / 3)', height: 'calc(100% / 3)' }}>
            <VideoPlayer stream={peer.streams[0]} />
          </div>
        ))}
      </div>
      <button onClick={() => handleLeaveCall()} style={{ margin: '20px', padding: '10px 20px', fontSize: '16px' }}>Leave Call</button>
    </div>
  );
};

export default Room;
