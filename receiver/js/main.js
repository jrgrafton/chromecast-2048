window.onload = function() {
	var DEBUG = true;

	// Turn off logging when not in debugging
	if(!DEBUG) {
		console.log = function() {}
		console.debug = function() {}
		console.info = function() {}
	}

	// Create a 2048 Game instance
	window.boardOne = new GameManager(document.getElementById("canvas"), 4);

	// Load tests or receiver code depending on environment
	if(navigator.userAgent.indexOf("armv7l") === -1) {
		//window.e2eTests = new E2ETests();
		//window.e2eTests.runTests();
	} else {
		//window.customReceiver = new CustomReceiver();
	}
}