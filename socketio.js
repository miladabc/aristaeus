const socketIO = require('socket.io');

const roomNamePrefix = 'ttt_';

const detectWinner = board => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];

    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: lines[i], gameFinished: true };
    }
  }

  if (!board.includes(null))
    return { winner: 'DRAW', line: [], gameFinished: true };

  return {};
};

const initSocketIO = server => {
  const io = socketIO(server);

  io.use((socket, next) => {
    socket.username = socket.handshake.query.username;
    next();
  });

  io.on('connection', socket => {
    const rooms = io.sockets.adapter.rooms;

    socket.on('disconnect', () => {
      io.emit('roomsList', rooms);
    });

    socket.on('getRooms', () => {
      socket.emit('roomsList', rooms);
    });

    socket.on('joinRoom', ({ roomToJoin, joinedRoom, creating }, cb) => {
      socket.leave(roomNamePrefix + joinedRoom);
      socket.join(roomNamePrefix + roomToJoin, () => {
        cb();
        if (!creating) io.to(roomNamePrefix + roomToJoin).emit('roomReady');
        io.emit('roomsList', rooms);
      });
    });

    socket.on('message', ({ room, message }) => {
      socket.to(roomNamePrefix + room).broadcast.emit('message', message);
    });

    socket.on('whosTurn', (room, cb) => {
      const players = Object.keys(rooms[roomNamePrefix + room].sockets);

      const opponent = players.filter(player => player !== socket.id)[0];

      const opponentUsername = io.sockets.connected[opponent].username;

      const response = { opponent: opponentUsername, turn: false };

      if (players[0] === socket.id) response.turn = true;

      cb(response);
    });

    socket.on('turnPlayed', ({ room, board }, cb) => {
      const status = detectWinner(board);

      socket.to(roomNamePrefix + room).broadcast.emit('turnPlayed', {
        board,
        status
      });

      cb(status);
    });

    socket.on('resetGame', room => {
      const playerTurn = Object.keys(rooms[roomNamePrefix + room].sockets)[0];

      io.to(roomNamePrefix + room).emit('resetGame', { playerTurn });
    });
  });
};

module.exports = { initSocketIO };
