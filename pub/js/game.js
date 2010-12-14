(function(ns) {

  // Build the game objects
  paddleRenderStep = function(paddle) {
    paddle.render = function(renderer) {
      var ctx = renderer.context;
      ctx.fillStyle = paddle.style.backgroundColor;
      ctx.fillRect(paddle.x,
                   paddle.y,
                   paddle.width,
                   paddle.height);
    };
    return paddle;
  };

  ns.game    = carena.build({
  }, ['carena.Renderable', 'carena.Eventable', 'carena.Box', 'carena.Eventable']);
  // Trick the collision detection
  ns.game.localBounds   = function() { return { x:0,y:0, x2: 900, y2: 900} };
  ns.game.containsPoint = function() { return true; };

  ns.paddles = {
    local  : paddleRenderStep(carena.build({
      width: 100,
      height: 30,
      x : 0,
      y : ns.canvas.height-30,
      style : {
        backgroundColor : "white"
      },
    }, ['carena.Renderable', 'carena.Box'])),

    remote : paddleRenderStep(carena.build({
      width: 100,
      height: 30,
      x : 0,
      y : 0,
      style : {
        backgroundColor : "red"
      },
    }, ['carena.Renderable', 'carena.Box']))
  };

  ns.ball = carena.build({
    width: 20,
    height: 20,
    x : 190,
    y : 240,
    style : {
      backgroundColor : "white"
    }
  }, ['carena.Node']);

  ns.ball.render = function(renderer) {
    var ctx = renderer.context;
    ctx.fillStyle = ns.ball.style.backgroundColor;
    ctx.beginPath();
    ctx.arc(ns.ball.x, ns.ball.y, ns.ball.width, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fill();
  };

  ns.game.add(ns.paddles.local).add(ns.paddles.remote).add(ns.ball);

  // Setup the events
  ns.game.event.bind("mouse.move", function(name, data) {
    var x = data.mouse.x;

    if (x+ns.paddles.local.width > ns.canvas.width) {
      x = ns.canvas.width - ns.paddles.local.width;
    }

    ns.paddles.local.x = x;
  });

  // Jump immediately into the game.. for now
  ns.camera.target = ns.game;

})(window.networkPong);
