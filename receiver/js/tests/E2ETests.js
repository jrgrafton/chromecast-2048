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
					//alert("tests complete");
				}
			}.bind(this));
		}.bind(this));
	}
	catch(e) {
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
E2ETests.prototype.joinTwoPlayers_ = function(callback) {
	document.dispatchEvent(
		new CustomEvent("game-should-handle-sender-connect", {
			"detail" : {
				sender_index : 0, 
				name : "E2ETests player one"
			}
		})
	);

	document.dispatchEvent(
		new CustomEvent("game-should-handle-sender-connect", {
			"detail" : {
				sender_index : 1, 
				name : "E2ETests player two"
			}
		})
	);

	callback();
} 

// Test functions
E2ETests.prototype.testPlayerJoin_ = function(callback) {
	console.debug("E2ETests.js: testPlayerJoin_()");
	this.joinTwoPlayers_(function() {
		callback();
	});	
}

E2ETests.prototype.testGameStart_ = function(callback) {
	console.debug("E2ETests.js: testGameStart_()");
	this.joinTwoPlayers_(function() {
		document.dispatchEvent(new CustomEvent("game-should-start"));
		callback();
	});
}
