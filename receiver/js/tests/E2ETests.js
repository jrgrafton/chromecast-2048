function E2ETests() {
	this.tests = [];
	this.discoverTests_();

	// Psuedo static vars
	this.TEST_START_DELAY = 1000;
	this.NEXT_TEST_DELAY = 1000 * 5;
}

E2ETests.prototype.discoverTests_ = function() {
	console.debug("E2ETests.js: discoverTests_()");
	for(var property in E2ETests.prototype) {
		var name = property.toString();
		if(name.indexOf("test") === 0) {
			this.tests.push(property);
		}
	}
}

E2ETests.prototype.runTests = function() {
	console.debug("E2ETests.js: runTests()");
	setTimeout(function() {
		this.runNextTest_();
	}.bind(this), this.TEST_START_DELAY);
}

E2ETests.prototype.expect_ = function(actual, expected) {
	if(actual !== expected) {
		throw "Expected: {0} Actual: {1}";
	}
}

E2ETests.prototype.runNextTest_ = function() {
	console.debug("E2ETests.js: runNextTest_()");
	try {
		var testName = this.tests.shift();
		this.setup_(function() {
			this[testName](function() {
				if(this.tests.length > 0) {
					setTimeout(function() {
						this.runNextTest_();
					}.bind(this), this.NEXT_TEST_DELAY);
				} else {
					console.info("All tests completed");
				}
			}.bind(this));
		}.bind(this));
	}
	catch(e) {
		console.error(e.message);
		console.error("Aborting test run - test failed with error: "
			+ e.stack);
	}
}

E2ETests.prototype.setup_ = function(callback) {
	console.debug("E2ETests.js: setup_()");
	var restartListener = function(e) {
		document.removeEventListener("game-did-restart", restartListener);
		window.ui.reset();
		callback();
	}.bind(this);
	document.addEventListener("game-did-restart", restartListener);

	// Dispatch restart event
	document.dispatchEvent(new Event("game-should-restart"));
}

// Utility functions
E2ETests.prototype.joinPlayer_ =
		function(senderIndex, senderCount, name, callback) {

	console.debug("E2ETests.js: joinPlayer_()");
	// Setup did connect listeners
	var didConnectListener = function() {
		document.removeEventListener("game-did-handle-sender-connect",
			didConnectListener);
		callback();
	}.bind(this);

	document.addEventListener("game-did-handle-sender-connect",
		didConnectListener);

	// Actually connect players
	document.dispatchEvent(
		new CustomEvent("game-should-handle-sender-connect", {
			"detail" : {
				sender_index : senderIndex, 
				sender_count : senderCount,
				name : name
			}
		})
	);
} 

E2ETests.prototype.joinTwoPlayers_ = function(callback) {
	this.joinPlayer_(0, 1, "E2E Player One", function() {
		this.joinPlayer_(1, 2, "E2E Player Two", function() {
			callback();
		}.bind(this));
	}.bind(this));
}

// Test functions
E2ETests.prototype.testLobbyExplicitDisconnect_ = function(callback) {
	console.debug("E2ETests.js: testPlayerJoinExplicitDisconnect_()");
	this.joinTwoPlayers_(function() {
		setTimeout(function() {
			document.dispatchEvent(
				new CustomEvent("game-should-handle-sender-disconnect", {
					"detail" : {
						sender_index : 0,
						reason : "explicit",
						message : "player has quit the game"
					}
				})
			);
			this.expect_(window.ui.getState(), "lobby");
			callback();
		}.bind(this), 2000);
	}.bind(this));

}

E2ETests.prototype.testGameDisconnectScenarios_ = function(callback) {
	console.debug("E2ETests.js: testGameDisconnectScenarios_()");

	// For when game starts
	var didStartListener = function() {
		document.removeEventListener("game-did-start", didStartListener);
		this.expect_(window.ui.getState(), "in-game");

		setTimeout(function() {
			// Using sepparate function so nested syntax doesn't get unreadable
			document.dispatchEvent(
				new CustomEvent("game-should-handle-sender-disconnect", {
					"detail" : {
						sender_index : 0,
						reason : "implicit",
						message : "lost connection with E2E Player One"
					}
				})
			);	
		}.bind(this), 2000);
	}.bind(this)

	// For when player reconnects after disconnect event
	var didDisconnectListener = function() {
		document.removeEventListener("game-did-handle-sender-disconnect",
			didDisconnectListener);
		this.expect_(window.ui.getState(), "paused");
		setTimeout(function(){
			// Rejoin game with sender
			document.dispatchEvent(
				new CustomEvent("game-should-handle-sender-connect", {
					"detail" : {
						sender_index : 0, 
						sender_count : 2,
						name : "E2E Player One"
					}
				})
			);
		}.bind(this), 2000);
	}.bind(this);

	// For when game resumes after player reconnects
	var didResumeListener = function() {
		document.removeEventListener("game-did-resume", didResumeListener);
		this.expect_(window.ui.getState(), "in-game");
		
		// Trigger explicit disconnect
		setTimeout(function() {
			document.dispatchEvent(
				new CustomEvent("game-should-handle-sender-disconnect", {
					"detail" : {
						sender_index : 0,
						reason : "explicit"
					}
				})
			);	
		}.bind(this), 2000);
	}.bind(this);

	// For when player explitly disconnects
	var didEndListener = function() {
		document.removeEventListener("game-did-end", didEndListener);
		this.expect_(window.ui.getState(), "results");

		callback();
	}.bind(this);

	// State listeners
	document.addEventListener("game-did-start", didStartListener);
	document.addEventListener("game-did-handle-sender-disconnect", 
		didDisconnectListener);
	document.addEventListener("game-did-resume", didResumeListener);
	document.addEventListener("game-did-end", didEndListener);

	// Join two players
	this.joinTwoPlayers_(function() {});	
}

E2ETests.prototype.testGamePlaythrough_ = function(callback) {
	var moveMap = ["up", "right", "down", "left"];

	var didStartListener = function() {
		document.removeEventListener("game-did-start", didStartListener);
		console.log("Move: {1} {0}".format("up", 0));
		console.log("Move: {1} {0}".format("up", 1));
		document.dispatchEvent(
    		new CustomEvent("game-should-move", {
				"detail" : {
        			direction : "up",
        			sender_index : 0 
				}
			})
		);
		document.dispatchEvent(
    		new CustomEvent("game-should-move", {
				"detail" : {
        			direction : "up",
        			sender_index : 1
				}
			})
		);
	}.bind(this)
	
	var didMoveListener = function(e) {
		var senderIndex = e.detail.sender_index;
		var direction = e.detail.direction;
		var newDirectionIndex = moveMap.indexOf(direction) + 1;
		var newDirection = moveMap[newDirectionIndex % moveMap.length];

		document.dispatchEvent(
    		new CustomEvent("game-should-move", {
				"detail" : {
        			direction : newDirection,
        			sender_index : senderIndex 
				}
			})
		);
	}.bind(this)

	var didEndListener = function() {
		document.removeEventListener("game-did-end", didEndListener);
		this.expect_(window.ui.getState(), "results");
		callback();
	}.bind(this);

	this.joinTwoPlayers_(function() {});
	document.addEventListener("game-did-start", didStartListener);
	document.addEventListener("game-did-move", didMoveListener);
	document.addEventListener("game-did-end", didEndListener);
}
