import { Server } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

let io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | null = null;

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (!io) {
    io = new Server({
      path: '/api/socket',
    });

    io.on('connection', socket => {
      socket.on('join room', roomID => {
        socket.join(roomID);
        const users = io?.sockets.adapter.rooms.get(roomID) || new Set();
        const usersArray = Array.from(users);
        socket.emit('all users', usersArray.filter(id => id !== socket.id));

        socket.broadcast.to(roomID).emit('user joined', { callerID: socket.id });

        socket.on('sending signal', payload => {
          io?.to(payload.userToSignal).emit('receiving signal', { signal: payload.signal, callerID: payload.callerID });
        });

        socket.on('returning signal', payload => {
          io?.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
        });

        socket.on('close room', () => {
          io?.in(roomID).emit('close room');
          io?.socketsLeave(roomID);
        });

        socket.on('leave room', () => {
          socket.leave(roomID);
        });

        socket.on('disconnect', () => {
          socket.broadcast.to(roomID).emit('user left', socket.id);
        });
      });
    });
  }

  res.end();
};

export default SocketHandler;
