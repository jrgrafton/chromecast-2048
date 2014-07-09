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
    this.customMessageBus = this.castReceiverManager.getCastMessageBus('urn:x-cast:com.twjg.chromecast2048');

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
    console.log("Requesting socket for: " + senderId);
    var messageChannel = this.customMessageBus.getCastChannel(senderId);
    messageChannel.onMessage = function(event) {
        var debugString = "message: " + event.data + " from " + this.getSenderId();
        console.log(debugString);

        switch (event.data) {
            case "0" :
            case "1" :
            case "2" :
            case "3" :
                window.game.move(event.data);
                break;
            case "4" :
                window.game.restart();
                break;
        }
    };
}

Chromecast2048.prototype.startGame = function() {
    // Wait till the browser is ready to render the game (avoids glitches)
    window.requestAnimationFrame(function () {
        window.game = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
    });
}