function Tile(position, value, renderer) {
  this.position         = { x: position.x, y: position.y };
  this.value            = value;
  this.renderer         = renderer;

  this.previousPosition = null;
  this.mergedFrom       = null; // Tracks tiles that merged together
  this.sprite           = PIXI.Sprite.fromFrame(
      this.renderer.getTileFrames()[value]); // The sprite that represents this tile in Pixi
  this.sprite.anchor.x  = 0.5;
  this.sprite.anchor.y  = 0.5;
  this.sprite.visible   = false;
  this.isAppearing      = false;

  // Add tile sprite to stage
  this.renderer.getStage().addChild(this.sprite);
}

Tile.prototype.savePosition = function () {
  console.debug("tile.js: savePosition()");

  this.previousPosition = { x: this.position.x, y: this.position.y };
};

Tile.prototype.clear = function () {
  console.debug("tile.js: clear()");

  this.previousPosition = null;
  this.mergedFrom = null;
};

Tile.prototype.updatePosition = function (position) {
  console.debug("tile.js: updatePosition({0}, {1})".format(position.x, position.y));

  this.x = position.x;
  this.y = position.y;
  this.position.x = this.x;
  this.position.y = this.y;
};

Tile.prototype.hide = function () {
  console.debug("tile.js: hide()");
  this.sprite.visible = false;
}

Tile.prototype.show = function () {
  console.debug("tile.js: show()");
  this.sprite.visible = true;
}

Tile.prototype.setSpritePosition = function (position) {
  console.debug("tile.js: setSpritePosition({0}, {1})".format(position.x, position.y));
  
  this.sprite.position.x = position.x;
  this.sprite.position.y = position.y;
}

Tile.prototype.setDisplayedTileValue = function (value) {
  console.debug("tile.js: setDisplayedTileValue({0})".format(value));
  this.sprite.setTexture(PIXI.Texture.fromFrame(
      this.renderer.getTileFrames()[value]));
}

Tile.prototype.setValue = function (value) {
  console.debug("tile.js: setValue({0})".format(value));
  this.value = value;
  this.setDisplayedTileValue(value);
};

Tile.prototype.preAnimateAppear = function () {
  console.debug("tile.js: preAnimateAppear()");
  this.sprite.scale.x = 0;
  this.sprite.scale.y = 0;
  this.sprite.alpha = 0;
  this.show();
}
Tile.prototype.animateGrowOrAppear = function (step) {
  console.debug("tile.js: animateGrowOrAppear()");

  if (step == 1) {
    this.isAppearing = (this.sprite.alpha <= 0);
  }
  if (this.isAppearing) {
    this.sprite.scale.x += this.renderer.getTileScalePerAppear();
    this.sprite.scale.y += this.renderer.getTileScalePerAppear();
    this.sprite.alpha += this.renderer.getTileScalePerAppear();
  } else {
    this.sprite.scale.x += this.renderer.getTileScalePerMerge();
    this.sprite.scale.y += this.renderer.getTileScalePerMerge();
  }

};

Tile.prototype.finalizeAppear = function () {
  console.debug("tile.js: finalizeAppear()");

  this.sprite.scale.x = 1;
  this.sprite.scale.y = 1;
  this.sprite.alpha = 1;
};
