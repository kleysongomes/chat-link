import { Server } from 'socket.io';

const SocketHandler = (req: any, res: any) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', socket => {
      socket.on('join room', roomID => {
        socket.join(roomID);
        const users = io.sockets.adapter.rooms.get(roomID) || new Set();
        const usersArray = Array.from(users);
        socket.emit('all users', usersArray.filter(id => id !== socket.id));

        socket.broadcast.to(roomID).emit('user joined', { signal: null, callerID: socket.id });

        socket.on('sending signal', payload => {
          io.to(payload.userToSignal).emit('receiving signal', { signal: payload.signal, callerID: payload.callerID });
        });

        socket.on('returning signal', payload => {
          io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
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
