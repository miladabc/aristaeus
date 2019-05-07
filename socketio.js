const socketIO = require('socket.io');

const roomNamePrefix = 'ttt_';

const initSocketIO = server => {
  const io = socketIO(server);

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
  });
};

module.exports = { initSocketIO };
