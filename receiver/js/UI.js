function UI() {
	// Psuedo static vars
	this.STATES = ["loading", "lobby", "in-game", "paused", "results"];

	// Member vars
	this.state = null;
	this.rootNode = document.body;

	// Startup functions
	this.switchToState("loading");
}

UI.prototype.switchToState = function(state) {
	console.debug("UI.js: switchToState({0})".format(state));
	if(this.STATES.indexOf(state) !== -1) {
		var currentClasses = this.rootNode.classList;
		for(var i = 0; i < currentClasses.length; i++) {
			this.rootNode.classList.remove(currentClasses[i]);
		}
		this.rootNode.classList.add(state);
		this.state = state;
	}
}

UI.prototype.reset = function() {
	this.switchToState("loading");
	document.querySelector(".score-container").innerHTML = 0;
	document.querySelector(".result").innerHTML = "";
	document.querySelector(".name").innerHTML = "Waiting for player...";
}

UI.prototype.getState = function() {
	console.debug("UI.js: getState()");
	return this.state;
}

UI.prototype.setLobbyMessage = function(message) {
	console.debug("UI.js: setLobbyMessage({0})".format(message));
	document.querySelector("section.lobby .message").innerHTML = message;
}

UI.prototype.setCountdownNumber = function(number) {
	console.debug("UI.js: setCountdownNumber({0})".format(number));
	document.querySelector("section.lobby .countdown").innerHTML = number;
}

UI.prototype.updatePlayerName = function(index, name) {
	console.debug("UI.js: updatePlayerName({0}, {1})".format(index, name));
	var elementSelector =
		".player[data-player-index='{0}'] .name".format(index);
	document.querySelector(elementSelector).innerHTML = name;
}

UI.prototype.updatePlayerScore = function(index, score) {
	console.debug("UI.js: updatePlayerScore({0}, {1})".format(index, name));
	var elementSelector =
		".score-container[data-player-index='{0}']".format(index);
	document.querySelector(elementSelector).innerHTML = score;
}

UI.prototype.updatePauseText = function(text) {
	console.debug("UI.js: updatePauseText({0})".format(text));
	document.querySelector("section.paused .reason").innerHTML = text;
}

UI.prototype.setWinner = function(playerIndex) {
	console.debug("UI.js: setWinner({0}, {1})"
		.format(playerOneHasWon, playerTwoHasWon));

	var playerOneText = (playerIndex === 0)? "win" : "loose";
	var playerTwoText = (playerIndex === 1)? "win" : "loose";
	var elementSelector =
		".results .result[data-player-index='{0}']".format(0);
	document.querySelector(elementSelector).innerHTML = playerOneText;
	var elementSelector =
		".results .result[data-player-index='{0}']".format(1);
	document.querySelector(elementSelector).innerHTML = playerTwoText;
}




