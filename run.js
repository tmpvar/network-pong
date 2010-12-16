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
    ), game, clients = [], lobby = [], games = [], ready = [];

server.listen(1972);

game = io.listen(server, {
  transports : ['websocket', 'server-events', 'flashsocket'],
  flashPolicyServer : true
});

game.on('connection', function(client) {

  clients.push(client);
  lobby.push(client);

  // setup the client
  client.status = { ready : false };

  // TODO: add to lobby


  client.send({
    type      : 'connected',
    clients   :  {
      total   : clients.length,
      ingame  : games.length*2,
      waiting : lobby.length
    }
  });

  client.broadcast({
    type      : 'player.connected',
    clients   :  {
      total   : clients.length,
      ingame  : games.length*2,
      waiting : lobby.length
    }
  });


  client.on('disconnect', function(client) {
    clients.splice(clients.indexOf(client));
    lobby.splice(lobby.indexOf(client));

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
        console.log("client is ready!");
        client.status.ready = true;
      break;
      case 'paddle':

      break;


    }
  })


});


