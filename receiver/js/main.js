window.onload = function() {
	var DEBUG = true;

	// Turn off logging when not in debugging
	if(!DEBUG) {
		console.log = function() {}
		console.debug = function() {}
		console.info = function() {}
	}

	// Create a 2048 Game instance
	window.ui = new UI();
	window.game1 = new GameManager(document.getElementById("player1"), 4);
	window.game2 = new GameManager(document.getElementById("player2"), 4);
	window.eventBroker = new EventBroker([game1, game2], ui);

	// Load tests or receiver code depending on environment
	if(navigator.userAgent.indexOf("armv7l") === -1) {
		window.e2eTests = new E2ETests();
		window.e2eTests.runTests();
	} else {
		//window.customReceiver = new CustomReceiver();
	}
}