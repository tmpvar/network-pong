(function(ns) {
  var snapshot = null;


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
  },
  resetBall = function(ball) {
    ball.x = Math.floor(ns.canvas.width/2) - Math.floor(ball.width/2);
    ball.y = Math.floor(ns.canvas.height/2) - Math.floor(ball.height/2);
    ball.velocity = { x: 0, y: 0};
  },
  initialVelocity = 0,
  silentBallEvents = false;

  ns.game    = carena.build({
    x      : 0,
    y      : 0,
    width  : ns.canvas.width,
    height : ns.canvas.height,
    style  : {
      backgroundColor : "rgba(0,0,0,0)"
    }
  }, ['carena.Box', 'carena.Eventable']);

  ns.paddles = {
    local  : paddleRenderStep(carena.build({
      width: 100,
      height: 5,
      x : 0,
      y : ns.canvas.height-5,
      style : {
        backgroundColor : "white"
      },
      velocity : {
        x : 0,
        y : 0
      }
    }, ['carena.Renderable', 'carena.Box'])),

    remote : paddleRenderStep(carena.build({
      width: 100,
      height: 5,
      x : 0,
      y : 0,
      style : {
        backgroundColor : "red"
      },
      velocity : {
        x : 0,
        y : 0
      }
    }, ['carena.Renderable', 'carena.Box']))
  };

  ns.ball = carena.build({
    width: 10,
    height: 10,
    style : {
      backgroundColor : "white"
    },
    rotation : 0,
    velocity : {
      x : 0,
      y : 0
    }
  }, ['carena.Node']);

  ns.ball.render = function(renderer) {
    var ctx = renderer.context;
    ctx.fillStyle = ns.ball.style.backgroundColor;
    ctx.fillRect(ns.ball.x,
                 ns.ball.y,
                 ns.ball.width,
                 ns.ball.height);
    //ctx.beginPath();
    //ctx.arc(ns.ball.x, ns.ball.y, ns.ball.width, 0, Math.PI*2, true);
    //ctx.closePath();
    //ctx.fill();
  };
  ns.game.add(ns.paddles.local).add(ns.paddles.remote).add(ns.ball);

  // Setup the events
  ns.game.event.bind("mouse.move", function(name, data) {
    var half = ns.paddles.local.width/2,
        old  = ns.paddles.local.x,
        x    = data.mouse.x-half;

    if (x+ns.paddles.local.width > ns.canvas.width) {
      x = (ns.canvas.width - ns.paddles.local.width);
    } else if (x < 0) {
      x = 0;
    }
    ns.paddles.local.velocity.x = old - ns.paddles.local.x;

    ns.paddles.local.x = x;

    ns.socket.send({
      type     : "paddle.move",
      x        : x,
      velocity : {
        x : ns.paddles.local.velocity.x
      }
    });

  });

  ns.ball.x = Math.floor(ns.canvas.width/2) - Math.floor(ns.ball.width/2);
  ns.ball.y = Math.floor(ns.canvas.height/2) - Math.floor(ns.ball.height/2);
  ns.ball.velocity.y = initialVelocity;

  // Move the ball
  setInterval(function() {
    var now = (new Date()).getTime();
    if (snapshot && snapshot.ball) {
      var dy = snapshot.ball.y - ns.ball.y,
          dx = snapshot.ball.x - ns.ball.x;

      // Since the server sent us a velocity at a point in the past, and we know
      // with relativly decent accuracy how long ago, we can simulate this
      // movement.
      ns.ball.velocity = snapshot.ball.velocity;
      ns.ball.y  = snapshot.ball.y + (ns.ball.velocity.y * ((now-(snapshot.time - ns.serverTimeDelta)))/16);
      ns.ball.x  = snapshot.ball.x + (ns.ball.velocity.x * ((now-(snapshot.time - ns.serverTimeDelta)))/16)
      snapshot = null;

    } else {
      var x           = ns.ball.x + ns.ball.velocity.x,
          y           = ns.ball.y + ns.ball.velocity.y;

      ns.ball.x += ns.ball.velocity.x;
      ns.ball.y += ns.ball.velocity.y;
    }
  }, 16);

  var paddleTimer = null;

  // Handle an authoritive snapshot from the server
  ns.handleDeltaSnapshot = function(data) {
    snapshot = data.snapshot;
    snapshot.time = (new Date()).getTime();

    if (snapshot && snapshot.paddles) {
      var remotePaddle, remoteMovementDelta;

      if (paddleTimer) {
        clearInterval(paddleTimer);
        paddleTimer = null;
      }

      remotePaddle = (ns.playerId === 0)  ?
                      snapshot.paddles[1] :
                      snapshot.paddles[0];

      remoteMovementDelta = Math.floor((remotePaddle.x-ns.paddles.remote.x)/16);
      paddleTimer = setInterval(function() {
        ns.paddles.remote.x += remoteMovementDelta;
        if (remoteMovementDelta > 0) {
          if (ns.paddles.remote.x >= remotePaddle.x) {
            ns.paddles.remote.x = remotePaddle.x;
            clearInterval(paddleTimer);
            paddleTimer = null;
          }
        } else {
          if (ns.paddles.remote.x <= remotePaddle.x) {
            ns.paddles.remote.x = remotePaddle.x;
            clearInterval(paddleTimer);
            paddleTimer = null;
          }
        }
      }, 16);
    }
  };


})(window.networkPong);
