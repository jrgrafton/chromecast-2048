function CustomReceiver()  {
	// Static vars (simulated)
	this.NAMESPACE ='urn:x-cast:com.twjg.chromecast2048';
	this.NAMESPACE_WEBSOCKET = NAMESPACE + '.websocket';
	this.MAX_PLAYERS = 2;

	this.SENDER_HEARTBEAT_INTERVAL = 5000;
	this.SENDER_HEARTBEAT_TIMEOUT = this.SENDER_HEARTBEAT_INTERVAL * 2;

	this.SENDER_STATUS = {
		CONNECTED : 0,
		IMPLICIT_DISCONNECT : 1
	}
	// Enums that should be present in each Sender application
	this.SENDER_RECEIVER_MESSAGES = {
		UP : "0",
		RIGHT : "1",
		DOWN : "2",
		LEFT : "3",
		RESTART : "4",
		START : "5",
		PLAYER_NAME : "6", 
		PONG : "7"
	}
	this.RECEIVER_SENDER_MESSAGES = {
		JOIN_FAILED_TOO_MANY_PLAYERS : "0",
		JOIN_SUCCESSFUL : "1",
		PING : "2"
	}

	// Member vars
	this.senders = [];
	this.senderCount = 0;
	this.castReceiverManager = null;
	this.gameMessageBus = null;
	this.socketMessageBus = null;
	this.castStatusText = "2048: Cast Party";

	// Startup functions
	this.createCastMessageReceiver_();
	this.startGameMessageChannel_();
	this.startSocketMessageChannel_();
	this.startCastReceiver_();
	this.startSenderHeartbeating_();
}


CustomReceiver.prototype.createCastMessageReceiver_ = function() {
	console.debug("CustomReceiver.js: createCastMessageReceiver_()");
	this.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
	this.castReceiverManager.onSenderConnected =
		this.onSenderConnected_.bind(this)
	this.castReceiverManager.onSenderDisconnected =
		this.onSenderDisconnected_.bind(this);
}

CustomReceiver.prototype.onSenderConnected_ = function(event) {
	console.debug("CustomReceiver.js: onSenderConnected_()");

	// Send message back to sender if MAX_PLAYERS have been reached
	if(this.senderCount === this.MAX_PLAYERS) {
		// Too many players!
		this.gameMessageBus.getCastChannel(event.senderId).send(
			this.RECEIVER_SENDER_MESSAGES.JOIN_FAILED_TOO_MANY_PLAYERS);
	} else {
		this.addSender_(event.senderId);
		document.dispatchEvent(
			new CustomEvent("game-should-handle-sender-connect", {
				"detail" : {
					sender_index : this.getSenderIndex_(event.senderId),
					sender_count : this.senderCount;,
					name : "Player " + this.getSenderIndex_(event.senderId) + 1
				}
			})
		);
		this.gameMessageBus.getCastChannel(event.senderId).send(
			this.RECEIVER_SENDER_MESSAGES.JOIN_SUCCESSFUL);
	}
}

CustomReceiver.prototype.onSenderDisconnected_ = function(event) {
	console.debug("CustomReceiver.js: onSenderDisconnected()");
	document.dispatchEvent(
		new CustomEvent("game-should-handle-sender-disconnect", {
			"detail" : {
				sender_index : this.senders.indexOf(event.senderId),
				reason : "explicit",
				message : "Player has quit the game"
			}
		})
	);
	this.removeSender_(event.senderId);
	if(this.senders.length === 0) {
		this.castReceiverManager.stop();
	}
}

CustomReceiver.prototype.addSender_ = function(senderId) {
	console.debug("CustomReceiver.js: addSender_({0})".format(senderId));

	var sender = {
		sender_id : senderId,
		sender_state : this.SENDER_STATUS.CONNECTED,
		sender_name : "Player " + (this.senders.length + 1)
		heartbeat_time : new Date().getTime()
	};
	var senderAdded = false;

	// Fill holes first
	for(var i = 0; i < this.senders.length; i++) {
		if(this.senders[i] === null) {
			this.senders[i] = sender;
			senderAdded = true;
			break;
		}
	}
	// No holes to fill - append it to the end
	if(!senderAdded) {
		this.senders.push(sender);
	}
	++this.senderCount;
}

CustomReceiver.prototype.removeSender_ = function(senderId) {
	console.debug("CustomReceiver.js: removeSender_({0})".format(senderId));

	for(var i = 0; i < this.senders.length; i++) {
		if(this.senders[i] === null) continue; // May have holes in array

		if(this.senders[i].sender_id === senderId) {
			clearInterval(this.senders[i].heartbeat_interval_object);
			delete this.senders[i];
			--this.senderCount;
			break;
		}
	}
}

CustomReceiver.prototype.getSender_ = function(senderId) {
	console.debug("CustomReceiver.js: getSender_({0})".format(senderId));

	for(var i = 0; i < this.senders.length; i++) {
		if(this.senders[i] === null) continue; // May have holes in array
		if(this.senders[i].sender_id === senderId) {
			return this.senders.splice(i, 1);
		}
	}
}

CustomReceiver.prototype.getSenderIndex_ = function(senderId) {
	console.debug("CustomReceiver.js: getSender_({0})".format(senderId));
	var index = -1;
	for(var i = 0; i < this.senders.length; i++) {
		if(this.senders[i] === null) continue; // May have holes in array
		if(this.senders[i].sender_id === senderId) {
			index = i;
			break;
		}
	}

	return index;
}

CustomReceiver.prototype.updateSenderName_ = function(senderId, senderName) {
	console.debug("CustomReceiver.js: updateSenderName_({0}, {1})"
		.format(senderId, senderName));

	for(var i = 0; i < this.senders.length; i++) {
		if(this.senders[i] === null) continue; // May have holes in array
		if(this.senders[i].sender_id === senderId) {
			this.senders[i].sender_name = senderName;
			break;
		}
	}
}

CustomReceiver.prototype.updateSenderHeartbeatTime_ = function(senderId) {
	console.debug("CustomReceiver.js: updateSenderHeartbeatTime_({0})"
		.format(senderId));

	for(var i = 0; i < this.senders.length; i++) {
		if(this.senders[i] === null) continue; // May have holes in array
		if(this.senders[i].sender_id === senderId) {
			this.senders[i].heartbeat_time = new Date().getTime();
			break;
		}
	}
}

CustomReceiver.prototype.startSenderHeartbeating_ = function() {
	console.debug("CustomReceiver.js: startSenderHeartbeating_({0})");

	setInterval(this.heartbeatSenders_.bind(this),
		this.SENDER_HEARTBEAT_INTERVAL);
}

CustomReceiver.prototype.heartbeatSenders_ = function() {
	console.debug("CustomReceiver.js: heartbeatSenders_()");

	// Check for sender timeouts
	for(var i = 0; i < this.senders.length; i++) {
		if(this.senders[i] === null) continue; // May have holes in array

		// Ping sender
		this.gameMessageBus.getCastChannel(this.senders[i].sender_id).send(
			this.RECEIVER_SENDER_MESSAGES.PING);

		// Check for timeout
		if(new Date().getTime() - this.senders[i].heartbeat_time >
			this.SENDER_HEARTBEAT_TIMEOUT) {
			// If sender was previously in connected
			// state send implicit disconnect message
			if(this.senders[i].sender_state === this.SENDER_STATUS.CONNECTED) {
				this.senders[i].sender_state =
					this.SENDER_STATUS.IMPLICIT_DISCONNECT;
				new CustomEvent("game-should-handle-sender-disconnect", {
					"detail" : {
						sender_index : i,
						reason : "implicit",
						message : this.senders[i].sender_name +
							" is having connection issues"
					}
				})
			}
		}
	}
}

CustomReceiver.prototype.startGameMessageChannel_ = function() {
	console.debug("CustomReceiver.js: startGameMessageChannel_()");

	this.gameMessageBus =
		this.castReceiverManager.getCastMessageBus(this.NAMESPACE);
	this.gameMessageBus.onMessage = function(event) {
		var senderIndex = this.senders.indexOf(event.senderId);
		this.onMessageGameCommand_(event.data, senderIndex, );
	}.bind(this);
}

CustomReceiver.prototype.startSocketMessageChannel_ = function() {
	console.debug("CustomReceiver.js: startSocketMessageChannel_()");
	this.socketMessageBus =
		this.castReceiverManager.getCastMessageBus(this.NAMESPACE_WEBSOCKET);

	this.socketMessageBus.onMessage = function(event) {
		var senderIndex = this.senders.indexOf(event.senderId);
		var dataString = event.data.split(":");
	    dataString = (dataString.length === 2)? dataString[1] : null;
		this.startWebSocketConnection_(event.data, senderIndex, dataString);
	}.bind(this);

}

CustomReceiver.prototype.startWebSocketConnection_ =
	function(address, senderIndex) {
	
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
	    var dataString = event.data.split(":");
	    dataString = (dataString.length === 2)? dataString[1] : null;
	    this.onMessageGameCommand_(senderIndex, event.data, dataString);
	}.bind(this);
}

CustomReceiver.prototype.onMessageGameCommand_ =
	function(senderIndex, message, dataString) {

	console.debug("CustomReceiver.js: onMessageGameCommand_({0},{1})",
			senderIndex, message);

	switch (message) {
        case this.SENDER_RECEIVER_MESSAGES.UP:
        	document.dispatchEvent(
        		new CustomEvent("game-should-move", {
					"detail" : {
	        			direction : "up",
	        			sender_index : senderIndex 
					}
				})
			);
        break;
        case this.SENDER_RECEIVER_MESSAGES.RIGHT:
            document.dispatchEvent(
        		new CustomEvent("game-should-move", {
					"detail" : {
	        			direction : "right",
	        			sender_index : senderIndex 
					}
				})
			);
        break;
        case this.SENDER_RECEIVER_MESSAGES.DOWN:
            document.dispatchEvent(
        		new CustomEvent("game-should-move", {
					"detail" : {
	        			direction : "down",
	        			sender_index : senderIndex 
					}
				})
			);
        break;
        case this.SENDER_RECEIVER_MESSAGES.LEFT:
            document.dispatchEvent(
        		new CustomEvent("game-should-move", {
					"detail" : {
	        			direction : "left",
	        			sender_index : senderIndex 
					}
				})
			);
        break;
        case this.SENDER_RECEIVER_MESSAGES.RESTART:
            document.dispatchEvent(new CustomEvent("game-should-restart"));
        break;
        case this.SENDER_RECEIVER_MESSAGES.START:
            document.dispatchEvent(new CustomEvent("game-should-start"));
        break;
        case this.SENDER_RECEIVER_MESSAGES.PLAYER_NAME:
        	this.updateSenderName_(senderIndex, dataString);

            document.dispatchEvent(
            	new CustomEvent("game-should-handle-sender-name-update"), {
            		"detail" : {
            			name : dataString,
            			sender_index : senderIndex
            		}
            	});
        break;
        case this.SENDER_RECEIVER_MESSAGES.PONG:
        	this.updateSenderHeartbeatTime_(senderIndex);
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