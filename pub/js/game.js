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
  },
  resetBall = function(ball) {
    ball.x = Math.floor(ns.canvas.width/2) - Math.floor(ball.width/2);
    ball.y = Math.floor(ns.canvas.height/2) - Math.floor(ball.height/2);
    ball.velocity = { x: 0, y: 0};
  },
  initialVelocity = 1,
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
        x    = data.mouse.x-half;

    if (x+ns.paddles.local.width+half > ns.canvas.width) {
      x = (ns.canvas.width - ns.paddles.local.width);
    } else if (x < 0) {
      x = 0;
    }
    ns.paddles.local.velocity.x = x-ns.paddles.local.x;

    ns.paddles.local.x = x;
    ns.paddles.remote.x = x;
  });

  ns.ball.x = Math.floor(ns.canvas.width/2) - Math.floor(ns.ball.width/2);
  ns.ball.y = Math.floor(ns.canvas.height/2) - Math.floor(ns.ball.height/2);
  ns.ball.velocity.y = 1;

  // Jump immediately into the game.. for now
  ns.camera.target = ns.game;

  // Move the ball
  setInterval(function() {
    var x           = ns.ball.x + ns.ball.velocity.x,
        y           = ns.ball.y + ns.ball.velocity.y,
        collisions  = ns.game.nodesByPoint(x, y),
        collisions2 = ns.game.nodesByPoint(x+ns.ball.width, y+ns.ball.height)

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
        console.log("bouncy", ns.ball.velocity.x)
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
    }

    ns.ball.x += ns.ball.velocity.x;
    ns.ball.y += ns.ball.velocity.y;
  }, 16);


})(window.networkPong);
