function CustomReceiver()  {
	// Static vars (simulated)
	this.NAMESPACE ='urn:x-cast:com.twjg.chromecast2048';
	this.NAMESPACE_WEBSOCKET = NAMESPACE + '.websocket';

	// Member vars
	this.senders = [];
	this.castReceiverManager = null;
	this.gameMessageBus = null;
	this.socketMessageBus = null;
	this.castStatusText = "2048: Cast Party";

	// Startup functions
	this.createCastMessageReceiver_();
	this.startGameMessageChannel_();
	this.startSocketMessageChannel_();
	this.startCastReceiver_();
}


CustomReceiver.prototype.createCastMessageReceiver_ = function() {
	console.debug("CustomReceiver.js: createCastMessageReceiver_()");
	this.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
	this.castReceiverManager.onSenderConnected = function(event) {
		console.debug("CustomReceiver.js: onSenderConnected()");
		this.senders[event.senderId] = true;
		document.dispatchEvent(
			new CustomEvent("sender-connected", {
				data : {
					sender_index : this.senders.length, 
					name : "REPLACE_ME_" + Math.random()
				}
			})
		);

		// TODO: send message back to sender if maximum players have
		// been exceeded

	}
	this.castReceiverManager.onSenderDisconnected = function(event) {
		console.debug("CustomReceiver.js: onSenderDisconnected()");
		document.dispatchEvent(
			new CustomEvent("sender-disconnected", {
				data : {
					sender_index : this.senders.length,
					reason : "explicit",
					message : "player has quit the game"
				}
			})
		);
		delete this.senders[event.senderId];
		if(this.senders.length === 0) {
			this.castReceiverManager.stop();
		}
	}
}

CustomReceiver.prototype.startGameMessageChannel_ = function() {
	console.debug("CustomReceiver.js: startGameMessageChannel_()");

	this.gameMessageBus =
		this.castReceiverManager.getCastMessageBus(this.NAMESPACE);
	this.gameMessageBus.onMessage = function(event) {
		this.onMessageGameCommand_(event.data);
	}.bind(this);
}

CustomReceiver.prototype.startSocketMessageChannel_ = function() {
	console.debug("CustomReceiver.js: startSocketMessageChannel_()");
	this.socketMessageBus =
		this.castReceiverManager.getCastMessageBus(this.NAMESPACE_WEBSOCKET);

	this.socketMessageBus.onMessage = function(event) {
		this.startWebSocketConnection_(event.data);
	}.bind(this);

}

CustomReceiver.prototype.startWebSocketConnection_ = function(address) {
	console.debug("CustomReceiver.js: startWebSocketConnection_({0})", address);
	var connection = new WebSocket('ws://'+ address);
	// When the connection is open, send some data to the server
	connection.onopen = function () {
	    console.log('onopen');
	    connection.send('Ping'); // Send the message 'Ping' to the server
	};

	// Log errors
	connection.onerror = function (error) {
	    console.log('WebSocket Error ' + error);
	};

	// Log messages from the server
	connection.onmessage = function (event) {
	    console.log("websocket.onMessage");
	    this.onMessageGameCommand_(event.data);
	}.bind(this);
}

CustomReceiver.prototype.onMessageGameCommand_ = function(senderIndex, message) {
	console.debug("CustomReceiver.js: onMessageGameCommand_({0},{1})",
			senderIndex, message);

	switch (message) {
        case "0":
        	document.dispatchEvent(
        		new CustomEvent("in-game-move", {
					data : {
	        			direction : "up",
	        			sender_index : senderIndex 
					}
				})
			);
        break;
        case "1":
            document.dispatchEvent(
        		new CustomEvent("in-game-move", {
					data : {
	        			direction : "right",
	        			sender_index : senderIndex 
					}
				})
			);
        break;
        case "2":
            document.dispatchEvent(
        		new CustomEvent("in-game-move", {
					data : {
	        			direction : "down",
	        			sender_index : senderIndex 
					}
				})
			);
        break;
        case "3":
            document.dispatchEvent(
        		new CustomEvent("in-game-move", {
					data : {
	        			direction : "left",
	        			sender_index : senderIndex 
					}
				})
			);
        break;
        case "4":
            document.dispatchEvent(new CustomEvent("game-should-restart"));
        break;
    }
}

CustomReceiver.prototype.startCastReceiver_  = function() {
	console.debug("CustomReceiver.js: startCastReceiver_()");

	var appConfig = new cast.receiver.CastReceiverManager.Config();
	appConfig.statusText = this.castStatusText;
	appConfig.maxInactivity = 6000; // 100 minutes
	this.castReceiverManager.start(appConfig);
}