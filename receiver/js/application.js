window.keymap = {
    "0" : "UP",
    "1" : "RIGHT",
    "2" : "DOWN",
    "3" : "LEFT",
    "4" : "RESTART"
}

window.addEventListener("load",function(){
    // Wait till the browser is ready to render the game (avoids glitches)
    window.requestAnimationFrame(function () {
        window.game = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
    });

    window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    window.castReceiverManager.onSenderDisconnected = function(event) {
        if(window.castReceiverManager.getSenders().length == 0 &&
            event.reason == cast.receiver.system.DisconnectReason.REQUESTED_BY_SENDER) {
            window.close();
        }
    }

    var customMessageBus = castReceiverManager.getCastMessageBus('urn:x-cast:com.twjg.chromecast2048');
    customMessageBus.onMessage = function(event) {
        document.getElementById("debug-text").innerHTML = window.keymap[event.data];
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

    // Start receiver
    window.castReceiverManager.start();
});