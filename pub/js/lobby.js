(function(ns) {

  ns.lobby = carena.build({}, ['carena.Box']);

  // TODO: THIS IS A HACK!!!
  window.addEventListener('keydown', function(ev) {

    if (ev.keyCode === 13) {
      if (chatInput.toString().length > 0) {
        ns.socket.send({
          type : "lobby.message",
          text : chatInput.toString()
        });
        chatInput.fromString("");
        // TODO: fix cider.Cursor!
        if (chatInput.cursor && chatInput.cursor.pos) {
          chatInput.cursor.pos(0,0);
        }
      }
      ev.stopPropagation();
      ev.stopImmediatePropagation();
    }

  }, true);

  // END HACK


  var chat = ns.chat = carena.build({
    x      : 5,
    y      : 45,
    width  : ns.canvas.width-5,
    height : ns.canvas.height - 35,
    text   : '',
    style  : {
      color : 'black',
      backgroundColor: 'grey',
      paddingLeft: 5
    }
  }, ['carena.Box', 'cider.Textual']),

  chatInput = carena.build({
    x      : 5,
    y      : ns.renderer.canvas.height - 25,
    width  : ns.renderer.canvas.width - 5,
    height : 20,
    text   : '',
    style  : {
      color : 'white',
      backgroundColor: 'red',
      paddingLeft: 5,
      paddingTop : 0,
      cursorColor : 'white',
      selectionColor : "rgba(255,255,255,0.2)"
    }
  }, ['carena.Box',
      'cider.Editable',
      'cider.FocusTarget',
  ]),
  ready = carena.build({
    x      : 5,
    y      : 5,
    width  : ns.renderer.canvas.width - 5,
    height : 40,
    text   : 'Click here to get in line to play!',
    style  : {
      color : 'white',
      backgroundColor: 'red',
      paddingTop: 10,
      paddingLeft: 70
    }
  }, ['carena.Box',
      'cider.Editable',
      'cider.FocusTarget',
  ]);


  ready.font.set(ns.defaultFont);

  ready.event.bind("mouse.down", function(name, data) {
    if (data.target === ready) {
      ns.socket.send({
        type : "ready"
      });
    }
  });

  chatInput.font.set(ns.defaultFont);
  chat.font.set(ns.defaultFont);

  chatInput.cursor.event.bind("keyboard.down", function(name, data) {
    if (data.key === 13) {
      return false;
    }
  }, true)

  ns.lobby.add(chat).add(chatInput).add(ready);
  // Jump immediately into the lobby.. for now
  ns.camera.target = ns.lobby;

})(window.networkPong);

