import { NextApiRequest, NextApiResponse } from 'next';
import { Server } from 'socket.io';

let io: Server | null = null;

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (!io) {
    io = new Server(3001, {
      cors: {
        origin: '*',
      },
    });

    io.on('connection', socket => {
      socket.on('join room', roomID => {
        socket.join(roomID);
      });

      socket.on('disconnect', () => {
        // Handle user disconnecting
      });
    });
  }

  if (req.method === 'GET') {
    const { roomId } = req.query;
    const roomExists = io.sockets.adapter.rooms.has(roomId as string);
    res.status(200).json({ exists: roomExists });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
