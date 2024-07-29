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

  useEffect(() => {
    // Verificar se o código está sendo executado no cliente
    if (typeof window !== 'undefined') {
      const roomId = new URLSearchParams(window.location.search).get('roomId');
      setRoomID(roomId);
    }
  }, []);

  useEffect(() => {
    if (roomID) {
      socketRef.current = io('/'); // Conecte ao seu servidor de sinalização
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }

        socketRef.current.emit('join room', roomID);
        socketRef.current.on('all users', (users: any[]) => {
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

        socketRef.current.on('user joined', (payload: { signal: any, callerID: string }) => {
          const peer = addPeer(payload.signal, payload.callerID, stream);
          peersRef.current.push({
            peerID: payload.callerID,
            peer,
          });

          setPeers(users => [...users, peer]);
        });

        socketRef.current.on('receiving returned signal', (payload: { id: string, signal: any }) => {
          const item = peersRef.current.find(p => p.peerID === payload.id);
          item?.peer.signal(payload.signal);
        });

        socketRef.current.on('user left', id => {
          const peerObj = peersRef.current.find(p => p.peerID === id);
          if (peerObj) {
            peerObj.peer.destroy();
          }
          const peers = peersRef.current.filter(p => p.peerID !== id);
          peersRef.current = peers;
          setPeers(peers);
        });
      });
    }
  }, [roomID]);

  function createPeer(userToSignal: string, callerID: string, stream: MediaStream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socketRef.current.emit('sending signal', { userToSignal, callerID, signal });
    });

    return peer;
  }

  function addPeer(incomingSignal: any, callerID: string, stream: MediaStream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socketRef.current.emit('returning signal', { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  return (
    <div>
      <video muted ref={userVideo} autoPlay playsInline />
      {peers.map((peer, index) => (
        <VideoPlayer key={index} stream={peer.streams[0]} />
      ))}
    </div>
  );
};

export default Room;
