import { NextApiRequest, NextApiResponse } from 'next';
import { Server } from 'socket.io';

let io: Server | null = null;

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    if (!io) {
      io = new Server({
        cors: {
          origin: '*',
        },
      });
    }

    const { roomId } = req.query;
    const roomExists = io.sockets.adapter.rooms.has(roomId as string);
    res.status(200).json({ exists: roomExists });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
