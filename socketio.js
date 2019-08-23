const socketIO = require('socket.io');

const roomNamePrefix = 'ttt_';

const simpleWinner = ({ smallBoard, marksNum }) => {
  const status = {
    board: smallBoard,
    winner: '',
    line: [],
    gameFinished: false
  };

  if (marksNum < 3) return status;

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

    if (
      smallBoard[a] &&
      smallBoard[a] === smallBoard[b] &&
      smallBoard[a] === smallBoard[c]
    ) {
      status.winner = smallBoard[a];
      status.line = lines[i];
      status.gameFinished = true;

      return status;
    }
  }

  if (!smallBoard.includes(null)) {
    status.winner = 'DRAW';
    status.gameFinished = true;

    return status;
  }

  return status;
};
const ultimateWinner = board => {
  const status = { board, winner: '', line: [], gameFinished: false };

  board.largeBoard.forEach((smallBoard, index) => {
    if (!board.boardsWinner[index]) {
      const { winner } = simpleWinner(smallBoard);

      if (winner) status.board.boardsWinner[index] = winner;
    }
  });

  const numberOfSmallWins = board.boardsWinner.filter(
    boardWinner => boardWinner !== null
  ).length;

  const { winner, line, gameFinished } = simpleWinner({
    smallBoard: board.boardsWinner,
    marksNum: numberOfSmallWins
  });

  status.winner = winner;
  status.line = line;
  status.gameFinished = gameFinished;

  return status;
};

const detectWinner = (room, board) => {
  switch (room.mode) {
    case 'simple':
      return simpleWinner(board);
    case 'ultimate':
      return ultimateWinner(board);
    default:
      return { winner: '', line: [], gameFinished: false };
  }
};

const initSocketIO = server => {
  const io = socketIO(server);

  io.use((socket, next) => {
    socket.username = socket.handshake.query.username;
    next();
  });

  io.on('connection', socket => {
    const { rooms } = io.sockets.adapter;

    socket.on('disconnect', () => {
      io.emit('roomsList', rooms);
    });

    socket.on('getRooms', () => {
      socket.emit('roomsList', rooms);
    });

    socket.on(
      'joinRoom',
      ({ roomToJoin, roomMode, joinedRoom, creating }, cb) => {
        socket.leave(roomNamePrefix + joinedRoom);
        socket.join(roomNamePrefix + roomToJoin, () => {
          cb();
          if (!creating) io.to(roomNamePrefix + roomToJoin).emit('roomReady');
          if (creating) rooms[roomNamePrefix + roomToJoin].mode = roomMode;
          io.emit('roomsList', rooms);
        });
      }
    );

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

    socket.on('turnPlayed', ({ room, board, lastMovePosition }, cb) => {
      const status = detectWinner(room, board);

      socket.to(roomNamePrefix + room.name).broadcast.emit('turnPlayed', {
        status,
        lastMovePosition
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
