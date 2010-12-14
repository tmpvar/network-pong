var connect = require('connect'),
    carena  = require('carena').server.node.connect;


connect.createServer(
  connect.staticProvider(__dirname + "/pub"),
  carena(),
  connect.logger(),
  connect.router(function(app) {
    app.get('/', function(req, res) {
      res.writeHead(203, { 'Location' : '/index.html' });
      res.end();
    });
  })
).listen(1972);
