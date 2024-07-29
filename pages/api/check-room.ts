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

    if (res.socket.server.io) {
      const roomExists = res.socket.server.io.sockets.adapter.rooms.has(roomId as string);
      res.status(200).json({ exists: roomExists });
    } else {
      res.status(500).json({ error: 'Socket server not initialized' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};

export default checkRoomHandler;
