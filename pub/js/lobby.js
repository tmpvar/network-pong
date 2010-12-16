(function(ns) {

  ns.lobby = carena.build({}, ['carena.Box']);

  // TODO: THIS IS A HACK!!!
  window.addEventListener('keydown', function(ev) {

    if (ev.keyCode === 13) {
      if (input.toString().length > 0) {
        ns.socket.send({
          type : "lobby.message",
          text : input.toString()
        });
        input.fromString("");
        // TODO: fix cider.Cursor!
        input.cursor.pos(0,0);
      }
      ev.stopPropagation();
      ev.stopImmediatePropagation();
    }

  }, true);

  // END HACK


  var chat = carena.build({
    x      : 5,
    y      : 20,
    width  : ns.canvas.width-10,
    height : ns.canvas.height - 50,
    text   : '',
    style  : {
      color : 'black',
      backgroundColor: 'grey',
      paddingLeft: 5
    }
  }, ['carena.Box', 'cider.Textual']),

  input = carena.build({
    x      : 5,
    y      : ns.renderer.canvas.height - 30,
    width  : ns.renderer.canvas.width - 10,
    height : 30,
    text   : '',
    style  : {
      color : 'white',
      backgroundColor: 'white',
      paddingLeft: 5,
      paddingTop : 7,
      cursorColor : 'white',
      selectionColor : "rgba(255,255,255,0.2)"
    }
  }, ['carena.Box',
      'cider.Textual',
      'cider.Editable',
      'cider.FocusTarget',
      'cider.TextualSelection',
      'cider.Clipboard'
  ]);


  input.font.set(ns.defaultFont);
  chat.font.set(ns.defaultFont);

  input.cursor.event.bind("keyboard.down", function(name, data) {
    console.log(data);
    if (data.key === 13) {
      return false;
    }
  }, true)

  ns.lobby.add(chat).add(input);
  // Jump immediately into the lobby.. for now
  ns.camera.target = ns.lobby;

})(window.networkPong);

