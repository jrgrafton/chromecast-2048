function Renderer(canvas, onRenderCallback, onCompleteCallback) {
  console.debug("renderer.js: Renderer()");

	// Static vars (similulated)
	this.GRID_WIDTH = 500;
	this.GRID_HEIGHT = 500;
  this.NUM_FRAMES_PER_ANIMATE = 10; // Number of frames before tile appears (baseline)
  this.NUM_FRAMES_FOR_MOVING = 5;   // Number of frames to be used for moving
  this.NUM_FRAMES_FOR_MOVING = 
      this.NUM_FRAMES_PER_ANIMATE - this.NUM_FRAMES_FOR_MOVING;

  this.TILE_SCALE_PER_APPEAR = 1 / this.NUM_FRAMES_FOR_MOVING;
  this.TILE_SCALE_PER_MERGE = 0.2 / this.NUM_FRAMES_FOR_MOVING; // Merging is 5 * faster than appearing

	// Temporary global references. TODO: Refactor
	this.TILE_FRAMES = {
       2: "tile2.png",
       4: "tile4.png",
       8: "tile8.png",
       16: "tile16.png",
       32: "tile32.png",
       64: "tile64.png",
       128: "tile128.png",
       256: "tile256.png",
       512: "tile512.png",
       1024: "tile1024.png",
       2048: "tile2048.png",
       4096: "tile4096.png",
       8192: "tile8192.png",
  };
  this.stage = null;

	// Member vars
	this.assetList = [
      'json/tiles.json',
  ];
  this.renderer = null;
  this.canvas = canvas;
  this.onRenderCallback = onRenderCallback;

  // Startup functions
  this.setupPixi_();
	this.loadAssets_(function() {
    requestAnimFrame(this.onRender_.bind(this));
		onCompleteCallback();
	}.bind(this));
}

Renderer.prototype.setupPixi_ = function(canvas) {
  console.debug("renderer.js: setupPixi_({0})".format(canvas));
	this.stage = new PIXI.Stage(0xFFFFFF);
  this.stage.interactive = false;
  this.renderer = new PIXI.autoDetectRenderer(this.GRID_WIDTH,
      this.GRID_HEIGHT, this.canvas, true, false);
}

Renderer.prototype.onRender_ = function() {
  // Called too often to console.log
  // console.debug("renderer.js: onRender_({0})".format(canvas)); 
  this.onRenderCallback();
  this.renderer.render(this.stage);
  requestAnimFrame(this.onRender_.bind(this));
}

Renderer.prototype.loadAssets_ = function(onCompleteCallback) {
  console.debug("renderer.js: loadAssets_({0})");
	loader = new PIXI.AssetLoader(this.assetList);
	loader.onComplete = onCompleteCallback
	loader.load();
}

// Public functions
Renderer.prototype.getStage = function() {
  return this.stage;
}

Renderer.prototype.getTileFrames = function() {
  return this.TILE_FRAMES;
}

Renderer.prototype.getTileScalePerAppear = function() {
  return this.TILE_SCALE_PER_APPEAR;
}

Renderer.prototype.getTileScalePerMerge = function() {
  return this.TILE_SCALE_PER_MERGE;
}

Renderer.prototype.getNumFramesPerAnimate = function() {
  return this.NUM_FRAMES_PER_ANIMATE;
}
Renderer.prototype.getNumFramesForMoving = function() {
  return this.NUM_FRAMES_FOR_MOVING;
}
