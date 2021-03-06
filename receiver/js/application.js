// On window load
window.addEventListener("load",function(){
    window.chromecast2048 = new Chromecast2048();
});

function Chromecast2048() {
    this.keymap = {
        "0" : "UP",
        "1" : "RIGHT",
        "2" : "DOWN",
        "3" : "LEFT",
        "4" : "RESTART"
    }  

    this.setupReceiverManager();
    this.startReceiverManager();
    
    this.startGame();
}

Chromecast2048.prototype.startReceiverManager = function() {
    this.castReceiverManager.start();
}

Chromecast2048.prototype.setupReceiverManager = function() {
    this.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    this.gameMessageBus = this.castReceiverManager.getCastMessageBus('urn:x-cast:com.twjg.chromecast2048');
    this.socketMessageBus = this.castReceiverManager.getCastMessageBus('urn:x-cast:com.twjg.chromecast2048.websocket');

    this.castReceiverManager.onSenderConnected = function(event) {
        console.log("Sender connected: " + event.senderId);
        this.attachMessageChannelToReceiver(event.senderId);
    }.bind(this);

    // Cast receiver definitions
    this.castReceiverManager.onSenderDisconnected = function(event) {
        if(window.castReceiverManager.getSenders().length == 0 &&
            event.reason == cast.receiver.system.DisconnectReason.REQUESTED_BY_SENDER) {
            window.close();
        }
    }.bind(this);
}

Chromecast2048.prototype.attachMessageChannelToReceiver = function(senderId) {
    console.log("Requesting channels for: " + senderId);
    var gameMessageChannel = this.gameMessageBus.getCastChannel(senderId);
    var that = this;
    gameMessageChannel.onMessage = function(event) {
        var debugString = "message: " + event.message + " from " + this.getSenderId();
        console.log(debugString);
        that.handleMessage(this.getSenderId(), event.message);
    }

    // Create a special message channel for creating a WS
    var socketMessageChannel = this.socketMessageBus.getCastChannel(senderId);
    socketMessageChannel.onMessage = function(event) {
        console.log("Socket channel received message: " + event.message);
        // TODO: Add support for web sockets from multiple clients
        this.startWebSocketConnection(event.message);
    }.bind(this);
}

Chromecast2048.prototype.handleMessage = function(senderId, message) {
    console.log("Handling message: " + message)
    switch (message) {
        case "0" :
        case "1" :
        case "2" :
        case "3" :
            window.game.move(message);
            break;
        case "4" :
            window.game.restart();
            break;
    }
};

Chromecast2048.prototype.startGame = function() {
    // Wait till the browser is ready to render the game (avoids glitches)
    window.requestAnimationFrame(function () {
        window.game = new GameManager(4, KeyboardInputManager, 
            HTMLActuator, LocalStorageManager);
    });
}



/** Prototype WebSocket code **/
Chromecast2048.prototype.startWebSocketConnection = function(address) {
  console.log("Connecting web socket to: " + address);

  this.websocketConnection_ = new WebSocket('ws://' + address);

  // When the connection is open, send some data to the server
  this.websocketConnection_.onopen = function() {
    // Send the message 'Ping' to the server
    this.websocketConnection_.send('Ping');
  }.bind(this);

  // Log errors
  this.websocketConnection_.onerror = function(error) {
    console.log('WebSocket error ' + error.data + " " + error.reason);
  }.bind(this);

  this.websocketConnection_.onmessage = function(event) {
    this.handleMessage("", event.data);
  }.bind(this);
};