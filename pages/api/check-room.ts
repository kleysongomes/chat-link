import { NextApiRequest, NextApiResponse } from 'next';
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Socket as NetSocket } from 'net';

type NextApiResponseWithSocket = NextApiResponse & {
  socket: NetSocket & {
    server: HttpServer & {
      io?: Server;
    };
  };
};

const checkRoomHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (req.method === 'GET') {
    const { roomId } = req.query;

    if (!roomId || typeof roomId !== 'string') {
      res.status(400).json({ error: 'Invalid room ID' });
      return;
    }

    if (res.socket.server.io) {
      console.log(`Checking if room exists: ${roomId}`);
      const roomExists = res.socket.server.io.sockets.adapter.rooms.has(roomId);
      res.status(200).json({ exists: roomExists });
    } else {
      console.error('Socket.io server not initialized');
      res.status(500).json({ error: 'Socket.io server not initialized' });
    }
  } else {
    console.warn(`Method ${req.method} not allowed`);
    res.status(405).json({ error: 'Method not allowed' });
  }
};

export default checkRoomHandler;
