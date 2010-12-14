(function($){
  var ns     = window.networkPong = {},
      frame  = 0,
      last   = (new Date()).getTime(),
      now;

  ns.canvas = $("#pong-canvas")[0]

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

})(jQuery);
