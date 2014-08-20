function EventBroker(games, ui) {
	// Static vars (simulated)
	this.COUNTDOWN_LENGTH = 5000;

	// Member vars
	this.games = games;
	this.ui = ui;
	this.directionMap = {
		"up" : 0,
		"right" : 1,
		"down" : 2,
		"left" : 3
	}
	this.countDownStart = null;

	// Start listening for events
	this.initObservers_();
}

EventBroker.prototype.initObservers_ = function() {
	// Chromecast events
	document.addEventListener("sender-connected", function(e) {
		this.handleSenderConnected_(e.data);
	}.bind(this));
	document.addEventListener("sender-disconnected", function(e) {
		this.handleSenderDisconnected_(e.data);
	}.bind(this));
	document.addEventListener("sender-name-updated", function(e) {
		this.handleNameUpdated_(e.data);
	}.bind(this));

	// Game state changes
	document.addEventListener("game-should-start", function(e) {
		this.handleGameShouldStart_(e.data)
	}.bind(this));
	document.addEventListener("game-should-pause", function(e) {
		this.handleGameShouldPause_(e.data);
	}.bind(this));
	document.addEventListener("game-should-resume", function(e) {
		this.handleGameShouldResume_(e.data);
	}.bind(this));
	document.addEventListener("game-should-restart", function(e) {
		this.handleGameShouldRestart_(e.data);
	}.bind(this));

	// Game interactions
	document.addEventListener("in-game-move", function(e) {
		this.handleInGameMove_(e.data);
	}.bind(this));
}

EventBroker.prototype.handleSenderConnected_ = function(data) {
	console.debug("EventBroker: handleSenderConnected_()");
	this.ui.updatePlayerName(data.sender_index, data.name);
	if(this.ui.getState() === "loading") {
		this.ui.switchState("lobby");
	}
}

EventBroker.prototype.handleSenderDisconnected_ = function(data) {
	console.debug("EventBroker: handleSenderDisconnected_()");
	// Player has explicitly quit out
	if(data.reason === "explicit") {
		this.ui.updatePlayerName(data.sender_index, "Waiting for player...");
		if(this.ui.getState() === "in-game") {
			// If it's a game in progress go to the results screen
			this.ui.switchState("results");
		} else {
			// If it's not in game go to lobby screen
			this.ui.switchState("lobby");
		}
	}
	else {
		// Player has implicitly disconnected
		if(this.ui.getState() === "in-game") {
			// Pause if in game
			document.dispatchEvent(
				new CustomEvent("game-should-pause", {
					data : {
						reason : data.reason
					}
				})
			);
		} else {
			this.ui.updatePlayerName(data.sender_index,
				"Waiting for player...");
		}
	}
}

EventBroker.prototype.handleNameUpdated_ = function(data) {
	console.debug("EventBroker: handleNameUpdated_()");
	this.ui.updatePlayerName(data.sender_index, data.name);
}

EventBroker.prototype.handleGameShouldStart_ = function(data) {
	console.debug("EventBroker: handleGameShouldStart_()");

	// Reset player scores
	for(var i = 0; i < this.games.length; i++) {
		this.ui.updatePlayerScore(data.sender_index, 0);
	}
	
	// Trigger countdown
	this.ui.setLobbyText("Starting in...");
	this.countDownStart = new Date().getTime();
	this.triggerCountdown_();
}

EventBroker.prototype.triggerCountdown_ = function() {
	var timeSinceStart = new Date().getTime() - this.countDownStart;
	var countdownNumber =
				Math.round((this.COUNTDOWN_LENGTH - timeSinceStart) / 1000);
	if(countdownNumber === 0) {
		this.ui.setLobbyText("Waiting for players to join");
		this.ui.setCountdownNumber("");

		// Switch to in game state
		this.ui.switchState("in-game");
	} else {
		this.ui.setCountdownNumber(countdownNumber);
		setTimeout(function() {
			this.triggerCountdown_();
		}.bind(this), 1000);
	}
}

EventBroker.prototype.handleGameShouldPause_ = function(data) {
	console.debug("EventBroker: handleGameShouldPause_()");
	this.ui.updatePauseText(data.reason);
	this.ui.switchState("paused");
}

EventBroker.prototype.handleGameShouldResume_ = function(data) {
	console.debug("EventBroker: handleGameShouldResume_()");
	this.ui.switchState("in-game");
}

EventBroker.prototype.handleGameShouldRestart_ = function(data) {
	console.debug("EventBroker: handleGameShouldRestart_()");
	for(var i = 0; i < this.games.length; i++) {
		this.games[i].restart();
	}
	this.ui.switchState("lobby");
}

EventBroker.prototype.handleInGameMove_ = function(data) {
	console.debug("EventBroker: handleInGameMove_()");

	// Only respond to moves when in game
	if(this.ui.getState() === "in-game") {
		var senderIndex = data.sender_index;
		var direction = data.direction;
		this.games[senderIndex].move(this.directionMap[direction]);
	}
}


