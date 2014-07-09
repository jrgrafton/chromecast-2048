function Chromecast2048() {
    // See https://cast.google.com/publish/#/overview
    this.applicationID = "33AA2579";
    this.initializeUI(); // Initialize UI

    // Wait for Chromecast to be detected
    window['__onGCastApiAvailable'] = function(loaded, errorInfo) {
      if (loaded) {
        this.initializeCastApi();
      } else {
        console.log(errorInfo);
      }
    }.bind(this);
};

Chromecast2048.prototype = {
    // Connect to Chromecast device upon discovery
    initializeCastApi : function(){
        console.log("Initialising cast API");
        
        // Create API config with session listeners
        var sessionRequest = new chrome.cast.SessionRequest(this.applicationID);
        var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
        function(e) {
            this.session = e;
            console.log('connected to session: ' + e.sessionId);
        }.bind(this),
        function(e){
            if (e === 'available') { console.log('receiver found'); }
            else { console.log('receiver list empty'); }
        });
    
        // Initialise Chromecast
        chrome.cast.initialize(apiConfig,
        function() {
            // Devices are available and can be connected to, lets grab a session
            console.log("initialization success");
            setTimeout(function() {
                if(this.session == null) {
                    console.log("no existing session found - requesting new one");
                    chrome.cast.requestSession(function(e) {
                        // Session established (receiver will have launched by this point)
                        console.log('session request success');
                        this.session = e;
                    }.bind(this),
                    function(e) {
                        console.log('session request failure');
                        console.log(e);
                    });
                }
            }.bind(this), 1000);
            
        }.bind(this),
        function(e){
            console.log("initialization failure");
            console.log(e);
        });
    },
    // Initialize UI
    initializeUI : function(){
        // Initialize input manager
        this.inputManager = new KeyboardInputManager();
        this.inputManager.on("move", this.sendMessage.bind(this));
        this.inputManager.on("restart", this.sendMessage.bind(this));
        
        var options = {
            transformMinScale: 0.1,
            transformMinRotation: 2,
            dragBlockHorizontal: true,
            tapAlways: false
        };
        Hammer(document.body, options).on("doubletap", function(ev) {
            if ( confirm("Restart this game?") ) {
                this.sendMessage("4");
            }
        }.bind(this));
    },
    // Send message
    sendMessage : function(message){
        console.log("sending message: " + message);
        var sendTime = new Date().getTime();
        this.session.sendMessage("urn:x-cast:com.twjg.chromecast2048", message, 
        function(){ 
            console.log("send message success: " + message) 
            console.log("round trip time was: " + (new Date().getTime() - sendTime));
        },
        function(e) {
            console.log("send message failure: " + message);
            console.log(e);
        });    	
    }
};

window.addEventListener('load',function(){
    window.application = new Chromecast2048();
});