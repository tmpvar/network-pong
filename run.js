var connect = require('connect'),
    carena  = require('carena').server.node.connect,
    cider   = require('cider').server.node.connect,
    motionjs = require('motion').server.node.connect,
    io      = require('socket.io'),
    server  = connect.createServer(
      connect.staticProvider(__dirname + "/pub"),
      carena(),
      cider(),
      motionjs(),
      connect.logger(),
      connect.router(function(app) {
        app.get('/', function(req, res) {
          res.writeHead(203, { 'Location' : '/index.html' });
          res.end();
        });
      })
    ), game, clients = [], lobby = [], games = [], ready = [], clientId = 0;

server.listen(1972);

game = io.listen(server, {
  transports : ['websocket', 'server-events', 'flashsocket'],
  flashPolicyServer : true
});

game.on('connection', function(client) {
  client._id = ++clientId;
  clients.push(client);
  lobby.push(client);

  // setup the client
  client.status = { ready : false };

  game.broadcast({
    time    : (new Date()).getTime(),
    type      : 'player.connected',
    clients   :  {
      total   : clients.length,
      ingame  : games.length*2,
      waiting : lobby.length
    }
  });

  client.on('disconnect', function() {
    clients.splice(clients.indexOf(client));
    lobby.splice(lobby.indexOf(client));
    ready.splice(ready.indexOf(client));

    if (typeof client.game !== 'undefined') {
      var endGame = {
        type : 'game.end',
        time : (new Date()).getTime()
      };

      clearTimeout(games[client.game].timer);

      // Only 2 players, one or the other..
      if (games[client.game].players[0] === client) {
        games[client.game].players[1].send(endGame);
      } else {
        games[client.game].players[0].send(endGame);
      }
    }

    game.broadcast({
      type      : 'player.disconnected',
      time      : (new Date()).getTime(),
      clients   :  {
        total   : clients.length,
        ingame  : games.length*2,
        waiting : lobby.length,
        ready   : ready.length
      }
    });
  });

  function resetBall() {
    return { x: 190, y: 240, velocity : { x: 2, y: 1 }};
  }

  client.on('message', function(msg) {
    if (!msg || !msg.type) { return; }
    switch (msg.type) {
      case 'ready' :

        if (ready.indexOf(client) < 0) {
          ready.push(client);
        }

        game.broadcast({
          type   : "player.ready",
          time    : (new Date()).getTime(),
          player : client._id
        })
        client.status.ready = true;

        if (ready.length > 1) {
          // Unshift 2 clients off and create a game
          var player1 = ready.shift(),
              player2 = ready.shift(),
              gameId = games.length,
              clientMsg,
              _game = {
                gameId  : gameId,
                ball    : resetBall(),
                paddles : [
                  { x: 0, y: 0, velocity : { x: 0, y: 0 }},
                  { x: 0, y: 0, velocity : { x: 0, y: 0 }}
                ]
              };

          _game.ball.velocity.y = 1;
          games.push(_game);

          player1.game = gameId;
          player1.playerId = 0;
          player2.game = gameId;
          player2.playerId = 1;

          clientMsg = {
            type    : "game.new",
            time    : (new Date()).getTime(),
            gameId  : gameId,
            players : [ player1._id, player2._id ]
          }
          game.broadcast(clientMsg);

          clientMsg.type = "game.join";
          clientMsg.playerId = player1.playerId;
          player1.send(clientMsg);

          clientMsg.playerId = player2.playerId;
          player2.send(clientMsg);


          _game.ticker = setInterval(function() {
            var x = _game.ball.x + _game.ball.velocity.x,
                y = _game.ball.y + _game.ball.velocity.y,
                rX = -_game.ball.velocity.x,
                rY = -_game.ball.velocity.x;

            // top of screen, player 1 gets a point
            if (y < 0) {
              console.log("player1 gets point!");
              _game.ball = resetBall();
              _game.ball.velocity.y = 1;
            } else if (y + 10 > 500) {
              console.log("player2 gets point!");
              _game.ball = resetBall();
              _game.ball.velocity.y = -1;
            } else if (x + 10 > 400 || x < 0) {
              _game.ball.velocity.x = -_game.ball.velocity.x;
            // test for player1 paddle
            } else if (y + 10 > 495 && x > _game.paddles[0].x && x + 10 < _game.paddles[0].x + 100) {
              _game.ball.velocity.y = -_game.ball.velocity.y;
            } else if (y < 10 && x > _game.paddles[1].x && x + 10 < _game.paddles[1].x + 100) {
              _game.ball.velocity.y = -_game.ball.velocity.y;
            // test for player2 paddle
            } else {
              _game.ball.x = x;
              _game.ball.y = y;
            }
          }, 16);


          setInterval(function() {
            var snapshot = JSON.parse(JSON.stringify(_game));
            snapshot.time = (new Date).getTime();

            player1.send({
              type : "snapshot.delta",
              time    : (new Date()).getTime(),
              snapshot : snapshot
            });

            // inverse the direction so it makes sense
            snapshot.ball.y = 500 - snapshot.ball.y;
            snapshot.ball.velocity.y = - snapshot.ball.velocity.y;
            player2.send({
              type : "snapshot.delta",
              time    : (new Date()).getTime(),
              snapshot : snapshot
            });
          }, 100);
        }
      break;
      case 'paddle.move':
        if (games[client.game]) {
          games[client.game].paddles[client.playerId].x = msg.x;
          games[client.game].paddles[client.playerId].y = msg.y;
          games[client.game].paddles[client.playerId].velocity = msg.velocity || {x: 0, y: 0};
        }
      break;

      case 'lobby.message':
        msg.client = client._id;
        msg.time   = (new Date()).getTime();

        game.broadcast(msg);
      break;
    }
  })
});
