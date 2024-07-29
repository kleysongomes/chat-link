import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  stream: MediaStream;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%' }} />
  );
};

export default VideoPlayer;
