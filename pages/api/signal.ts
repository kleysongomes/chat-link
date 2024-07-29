import { Server } from 'socket.io';

const SocketHandler = (req: any, res: any) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', socket => {
      socket.on('join room', roomID => {
        socket.join(roomID);
        const users = io.sockets.adapter.rooms.get(roomID);
        const usersArray = Array.from(users || []);
        socket.emit('all users', usersArray.filter(id => id !== socket.id));
      });

      socket.on('sending signal', payload => {
        io.to(payload.userToSignal).emit('user joined', {
          signal: payload.signal,
          callerID: payload.callerID
        });
      });

      socket.on('returning signal', payload => {
        io.to(payload.callerID).emit('receiving returned signal', {
          signal: payload.signal,
          id: socket.id
        });
      });
    });
  }
  res.end();
}

export default SocketHandler;
