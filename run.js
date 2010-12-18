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
        waiting : lobby.length
      }
    });
  });

  client.on('message', function(msg) {
    if (!msg || !msg.type) { return; }
    switch (msg.type) {
      case 'ready' :
        client.status.ready = true;
        ready.push(client);
        if (ready.length > 1) {
          // Unshift 2 clients off and create a game
          var player1 = ready.shift(), player2 = ready.shift(), gameId, clientMsg;

          games.push({
            gameId  : gameId,
            players : [player1, player2]
          });
          gameId = games.length-1;

          player1.game = gameId;
          player2.game = gameId;

          clientMsg = {
            type    : "game.new",
            gameId  : gameId,
            players : [ player1._id, player2._id ]
          }
          game.broadcast(clientMsg);

          clientMsg.type = "game.join";
          player1.send(clientMsg);
          player2.send(clientMsg);

        }
      break;
      case 'paddle.move':
        // Only 2 players, one or the other..
        if (games[client.game].players[0] === client) {
          games[client.game].players[1].send(msg);
        } else {
          games[client.game].players[0].send(msg);
        }
      break;
      case 'lobby.message':
        msg.client = client._id;
        game.broadcast(msg);
      break;
    }
  })
});
