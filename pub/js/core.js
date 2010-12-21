
window.networkPong = {};

(function($){
  var ns     = window.networkPong,
      frame  = 0,
      last   = (new Date()).getTime(),
      now, connected = false;

  ns.canvas = $("#pong-canvas")[0];
  ns.defaultFont = "16px ProggyClean";

  // Initial setup
  ns.renderer = carena.build({}, ["carena.Renderer"], {canvas: ns.canvas});
  ns.camera   = carena.build({}, ["carena.Camera"], { renderer: ns.renderer});

  // Render loop
  setTimeout(function render() {
    ns.camera.render();
    now = (new Date()).getTime();
    fps = Math.floor(1000/(now-last));
    last = now;
    document.title = "(" + fps + ")";
    setTimeout(render, 1000/40);
  }, 0);

  setTimeout(function() {
    frame = 0;
  },1000);

  // Setup websocket/flashsocket connection to the server
  ns.socket = new io.Socket(null, {port: 1972, rememberTransport: false});
  ns.socket.connect();
  ns.socket.on('message', function(msg) {
    if (!msg || !msg.type) { return; }

    var now = (new Date()).getTime();

    // This is a delta of both actual time difference (TZ), latency, and
    // misconfiguration. Some of this inaccuracy can be illeviated by keeping
    // a rolling average of the delta.
    if (msg.time) {
    console.log("hrm")
      var delta = now - msg.time;
      // Setup the server delta/etc
      // TODO: make this less hackable
      if (!ns.serverTimeDelta) {
        ns.serverTimeDelta = delta;
      } else {
        ns.serverTimeDelta = (ns.serverTimeDelta + delta) / 2;
      }
    }

    // Ready for playtime.
    switch (msg.type) {
      case 'connected':
        ns.chat.fromString("connected!\n" + msg.clients.total + " players online");
      break;
      case 'player.connected' :
        ns.chat.prepend("\nPlayer Connected, " + msg.clients.total + " players online");
      break;
      case 'player.ready' :
        ns.chat.prepend("\nPlayer Ready #" + msg.player);
      break;
      case 'player.disconnected' :
        ns.chat.prepend("\nPlayer Disconnected, " + msg.clients.total + " players online");
      break;
      case 'lobby.message':
        ns.chat.prepend("\nPlayer [" + msg.client + "] says: " + msg.text);
      break;
      case 'game.new':
        ns.chat.prepend("\nNew Game! Player #" + msg.players.join(" vs Player #"));
      break;
      case 'game.join':
        ns.time = {
          server : msg.time,
          local  : now,
          diff   : now - msg.time
        };
        ns.playerId = msg.playerId;
        ns.camera.target = ns.game;
      break;
      case 'paddle.move':
        // TODO: do client prediction
        //ns.paddles.remote.x = msg.x;
      break;
/*      case 'ball.update' :
        ns.ball.x = msg.ball.x || ns.ball.x;
        ns.ball.y = msg.ball.y || ns.ball.y;
        ns.ball.velocity.x = msg.ball.velocity.x || ns.ball.velocity.x;
        ns.ball.velocity.y = msg.ball.velocity.y || ns.ball.velocity.y;
      break;*/
      case 'game.end':
        // TODO: cleanup state
        ns.camera.target = ns.lobby;
        // TODO: "ready" should probably be done via a button
        ns.socket.send({
          type : "ready"
        });
      break;

      case 'snapshot.delta':
        ns.handleDeltaSnapshot(msg);
      break;

      case 'snapshot.full':
        ns.handleFullSnapshot(msg);
      break;

    }
  });
})(jQuery);
