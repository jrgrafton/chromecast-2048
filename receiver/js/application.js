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
    this.setupMessageBus();
    this.startReceiverManager();
    
    this.startGame();
}

Chromecast2048.prototype.startReceiverManager = function() {
    this.castReceiverManager.start();
}

Chromecast2048.prototype.setupReceiverManager = function() {
    this.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();

    this.castReceiverManager.onSenderConnected = function(senderId, userAgent) {
        this.attachMessageChannelToReceiver(senderId);
    }.bind(this);

    // Cast receiver definitions
    this.castReceiverManager.onSenderDisconnected = function(event) {
        if(window.castReceiverManager.getSenders().length == 0 &&
            event.reason == cast.receiver.system.DisconnectReason.REQUESTED_BY_SENDER) {
            window.close();
        }
    }.bind(this);
}

Chromecast2048.prototype.setupMessageBus = function() {
    this.customMessageBus = this.castReceiverManager.getCastMessageBus('urn:x-cast:com.twjg.chromecast2048');
}

Chromecast2048.prototype.attachMessageChannelToReceiver = function(senderId) {
    var messageChannel = this.customMessageBus.getCastChannel(senderId);
    messageChannel.onMessage = (function(messageChannel) {
        return function(event) {
            var debugString = "message: " + e.data + " from " + messageChannel.getSenderId();
            document.getElementById("debug-text").innerHTML = debugString;
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
        }
    })(messageChannel);
}

Chromecast2048.prototype.startGame = function() {
    // Wait till the browser is ready to render the game (avoids glitches)
    window.requestAnimationFrame(function () {
        window.game = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
    });
}