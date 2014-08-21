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
	document.addEventListener(
			"game-should-handle-sender-connect", function(e) {
		this.handleSenderConnected_(e.detail);
	}.bind(this));
	document.addEventListener(
			"game-should-handle-sender-disconnect",function(e) {
		this.handleSenderDisconnected_(e.detail);
	}.bind(this));
	document.addEventListener(
			"game-should-handle-sender-name-update", function(e) {
		this.handleSenderNameUpdated_(e.detail);
	}.bind(this));

	// Game state changes
	document.addEventListener("game-should-start", function(e) {
		this.handleGameShouldStart_(e.detail)
	}.bind(this));
	document.addEventListener("game-should-pause", function(e) {
		this.handleGameShouldPause_(e.detail);
	}.bind(this));
	document.addEventListener("game-should-resume", function(e) {
		this.handleGameShouldResume_(e.detail);
	}.bind(this));
	document.addEventListener("game-should-restart", function(e) {
		this.handleGameShouldRestart_(e.detail);
	}.bind(this));

	// Game interactions
	document.addEventListener("game-should-handle-move", function(e) {
		this.handleGameShouldHandleMove_(e.detail);
	}.bind(this));

	// Game events
	for(var i = 0; i < this.games.length; i++) {
		(function(i) {
			this.games[i].on("game-did-score", function(e) {
				e.detail.index = i;
				this.handleGameDidScore_(e.detail);
			}.bind(this));
			this.games[i].on("game-did-end", function(e) {
				this.handleGameDidEnd_(e.detail);
			}.bind(this));
		}.bind(this))(i)
	}
}

EventBroker.prototype.handleSenderConnected_ = function(data) {
	console.debug("EventBroker: handleSenderConnected_()");
	this.ui.updatePlayerName(data.sender_index, data.name);
	if(this.ui.getState() === "loading") {
		this.ui.switchToState("lobby");
	}

	document.dispatchEvent(new Event("game-did-handle-sender-connect"));
}

EventBroker.prototype.handleSenderDisconnected_ = function(data) {
	console.debug("EventBroker: handleSenderDisconnected_()");
	// Player has explicitly quit out
	if(data.reason === "explicit") {
		this.ui.updatePlayerName(data.sender_index, "Waiting for player...");
		if(this.ui.getState() === "in-game") {
			// If it's a game in progress go to the results screen
			this.ui.switchToState("results");
		} else {
			// If it's not in game go to lobby screen
			this.ui.switchToState("lobby");
		}
	}
	else {
		// Player has implicitly disconnected
		if(this.ui.getState() === "in-game") {
			// Pause if in game
			document.dispatchEvent(
				new CustomEvent("game-should-pause", {
					"detail" : {
						reason : data.reason
					}
				})
			);
		} else {
			this.ui.updatePlayerName(data.sender_index,
				"Waiting for player...");
		}
	}
	document.dispatchEvent(new Event("game-did-handle-sender-disconnect"));
}

EventBroker.prototype.handleSenderNameUpdated_ = function(data) {
	console.debug("EventBroker: handleSenderNameUpdated_()");
	this.ui.updatePlayerName(data.sender_index, data.name);
	document.dispatchEvent(new Event("game-did-handle-sender-name-update"));
}

EventBroker.prototype.handleGameShouldStart_ = function(data) {
	console.debug("EventBroker: handleGameShouldStart_()");

	// Reset player scores
	for(var i = 0; i < this.games.length; i++) {
		this.ui.updatePlayerScore(i, 0);
	}
	
	// Trigger countdown
	this.ui.setLobbyMessage("Starting in...");
	this.countDownStart = new Date().getTime();
	this.triggerCountdown_();
}

EventBroker.prototype.triggerCountdown_ = function() {
	var timeSinceStart = new Date().getTime() - this.countDownStart;
	var countdownNumber =
				Math.round((this.COUNTDOWN_LENGTH - timeSinceStart) / 1000);
	if(countdownNumber === 0) {
		// Switch to in game state
		this.ui.switchToState("in-game");
		document.dispatchEvent(new Event("game-did-start"));

		this.ui.setLobbyMessage("Waiting for players to join");
		this.ui.setCountdownNumber("");
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
	this.ui.switchToState("paused");
	document.dispatchEvent(new Event("game-did-pause"));
}

EventBroker.prototype.handleGameShouldResume_ = function(data) {
	console.debug("EventBroker: handleGameShouldResume_()");
	this.ui.switchToState("in-game");
	document.dispatchEvent(new Event("game-did-resume"));
}

EventBroker.prototype.handleGameShouldRestart_ = function(data) {
	console.debug("EventBroker: handleGameShouldRestart_()");
	for(var i = 0; i < this.games.length; i++) {
		this.games[i].restart();
	}
	this.ui.switchToState("lobby");
	document.dispatchEvent(new Event("game-did-restart"));
}

EventBroker.prototype.handleGameMove_ = function(data) {
	console.debug("EventBroker: handleGameMove_()");

	// Only respond to moves when in game
	if(this.ui.getState() === "in-game") {
		var senderIndex = data.sender_index;
		var direction = data.direction;
		this.games[senderIndex].move(this.directionMap[direction]);
	}
}

EventBroker.prototype.handleGameShouldHandleMove_ = function(data) {
	console.debug("EventBroker: handleGameShouldHandleMove_()");

	// Only respond to moves when in game
	if(this.ui.getState() === "in-game") {
		var senderIndex = data.sender_index;
		var direction = data.direction;
		this.games[senderIndex].move(this.directionMap[direction]);
	}
}

EventBroker.prototype.handleGameDidScore_ = function(data) {
	console.debug("EventBroker: handleGameDidScore_()");
	var index = data.index;
	var score = data.score;

	this.ui.updatePlayerScore(index, score);
}

EventBroker.prototype.handleGameDidEnd_ = function(data) {
	console.debug("EventBroker: handleGameDidEnd_()");
	
	// See who has won
	var topScore = 0;
	var winner = -1;
	for(var i = 0; i < this.games.length; i++) {
		if(this.games[i].score > topScore) {
			topScore = this.games[i].score;
			winner = i;
		}
	}
	this.ui.setWinner(winner);
	this.ui.switchToState("results");
}
