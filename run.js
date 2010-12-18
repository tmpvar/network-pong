var connect = require('connect'),
    carena  = require('carena').server.node.connect,
    cider   = require('cider').server.node.connect,
    io      = require('socket.io'),
    server  = connect.createServer(
      connect.staticProvider(__dirname + "/pub"),
      carena(),
      cider(),
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
        type : 'game.end'
      };

      // Only 2 players, one or the other..
      if (games[client.game].players[0] === client) {
        games[client.game].players[1].send(endGame);
      } else {
        games[client.game].players[0].send(endGame);
      }
    }

    game.broadcast({
      type      : 'player.disconnected',
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
                  { x: 0, y: 0 },
                  { x: 0, y: 0 }
                ],
                players : [player1, player2]
              };

          _game.ball.velocity.y = 1;
          games.push(_game);

          player1.game = gameId;
          player2.game = gameId;

          clientMsg = {
            type    : "game.new",
            time    : (new Date()).getTime(),
            gameId  : gameId,
            players : [ player1._id, player2._id ]
          }
          game.broadcast(clientMsg);

          clientMsg.type = "game.join";
          player1.send(clientMsg);
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

/*

            if (collisions.length > 1 || collisions2.length > 1) {
              if (collisions[1] === ns.paddles.local ||
                  collisions2[1] === ns.paddles.local)
              {
                ns.ball.velocity.y = -Math.abs(ns.ball.velocity.y);
                ns.ball.velocity.x -= ns.paddles.local.velocity.x;
              } else if (collisions[1] === ns.paddles.remote ||
                         collisions2[1] === ns.paddles.remote)
              {
                ns.ball.velocity.y = Math.abs(ns.ball.velocity.y);
                ns.ball.velocity.x -= ns.paddles.remote.velocity.x;
              }
            } else if (y < 0) {
              resetBall(ns.ball);
              ns.ball.velocity.y = 1;
            } else if (y + ns.ball.height > ns.canvas.height) {
              resetBall(ns.ball);
              ns.ball.velocity.y = -1;
            } else if (x <= 0) {
              ns.ball.velocity.x = -ns.ball.velocity.x;
              ns.ball.x = 1;
            } else if (ns.ball.x + ns.ball.width > ns.canvas.width) {
              ns.ball.velocity.x = -ns.ball.velocity.x;
              ns.ball.x = ns.canvas.width - ns.ball.width;
            }*/

            player1.send({
              type : "ball.update",
              ball : _game.ball
            });

            // inverse the direction so it makes sense
            player2.send({
              type: "ball.update",
              ball: {
                x : _game.ball.x,
                y : 500-_game.ball.y,
                velocity: {
                  x : _game.ball.velocity.x,
                  y : -_game.ball.velocity.y
                }
              }
            });
          }, 10);


        }
      break;
      case 'paddle.move':
        // Only 2 players, one or the other..
        if (games[client.game].players[0] === client) {
          games[client.game].players[1].send(msg);
          games[client.game].paddles[0].x = msg.x;
          games[client.game].paddles[0].y = msg.y;
        } else {
          games[client.game].players[0].send(msg);
          games[client.game].paddles[1].x = msg.x;
          games[client.game].paddles[1].y = msg.y;
        }
      break;

      case 'lobby.message':
        msg.client = client._id;
        game.broadcast(msg);
      break;
    }
  })
});
