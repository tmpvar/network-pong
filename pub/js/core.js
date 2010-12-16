
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
    // Ready for playtime.
    if (!connected) {
      ns.socket.send({
        type : "ready"
      });
      connected = true;
    }

    switch (msg.type) {
      case 'connected':
        ns.lobby.child(0).fromString("connected!\n" + msg.clients.total + " players online");
      break;
      case 'player.connected' :
        ns.lobby.child(0).append("\nPlayer Connected, " + msg.clients.total + " players online");
      break;
      case 'player.disconnected' :
        ns.lobby.child(0).append("\nPlayer Disconnected, " + msg.clients.total + " players online");
      break;

    }



  });
})(jQuery);
