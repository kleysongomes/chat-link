// pages/api/socket.ts
import { Server } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as HttpServer } from 'http';
import { Socket as NetSocket } from 'net';

type NextApiResponseWithSocket = NextApiResponse & {
  socket: NetSocket & {
    server: HttpServer & {
      io?: Server;
    };
  };
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    console.log('Initializing new Socket.io server...');

    // Inicializa o servidor Socket.io com o caminho e opções de CORS configurados
    const io = new Server(res.socket.server, {
      path: '/api/socket', // Certifique-se de que o cliente use este caminho
      cors: {
        origin: "https://chat-link-alpha.vercel.app/", // Ajuste conforme necessário para seu domínio de frontend
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        credentials: true
      }
    });

    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('join room', (roomID) => {
        console.log(`User ${socket.id} joining room: ${roomID}`);
        socket.join(roomID);

        const users = io.sockets.adapter.rooms.get(roomID) || new Set();
        const usersArray = Array.from(users);
        socket.emit('all users', usersArray.filter(id => id !== socket.id));

        socket.broadcast.to(roomID).emit('user joined', { callerID: socket.id });

        socket.on('sending signal', (payload) => {
          io.to(payload.userToSignal).emit('receiving signal', { signal: payload.signal, callerID: payload.callerID });
        });

        socket.on('returning signal', (payload) => {
          io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
        });

        socket.on('close room', () => {
          io.in(roomID).emit('close room');
          io.socketsLeave(roomID);
        });

        socket.on('leave room', () => {
          socket.leave(roomID);
        });

        socket.on('disconnect', () => {
          socket.broadcast.to(roomID).emit('user left', socket.id);
        });
      });
    });
  } else {
    console.log('Socket.io server already running');
  }

  res.end(); // Finaliza a resposta para o Next.js
};

export default SocketHandler;
