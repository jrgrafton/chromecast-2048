function Grid(size, tilePool, renderer) {
  // Static vars (similulated)
  this.TILE_POSITIONS = [68.5, 189.5, 311.5, 431.5];
  this.TEMP_POS = { x: 0.0, y: 0.0 };

  // Member vars
  this.size = size;
  this.tilePool = tilePool;
  this.renderer = renderer;

  this.cells = this.empty();
  this.isAnimating = false;
  this.animatedFrames = 0;
  this.animateTilesGrow = [];
}

// Build a grid of the specified size
Grid.prototype.empty = function () {
  var cells = [];

  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(null);
    }
  }

  return cells;
};
Grid.prototype.clear = function () {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
        var currentTile = this.cells[x][y];
        if (currentTile != null) {
            currentTile.hide();
            this.tilePool.push(currentTile);
        }
        this.cells[x][y] = null;
    }
  }  
}

Grid.prototype.getNewTile = function (position, value) {
    var tile = this.tilePool.shift();
    if (!tile) {
       console.log("no more tiles?!");
       return null;
    }
    tile.clear();
    tile.updatePosition(position);
    tile.setValue(value);
    return tile;
}

// Find the first available random position
Grid.prototype.randomAvailableCell = function () {
  var cells = this.availableCells();

  if (cells.length) {
    return cells[Math.floor(Math.random() * cells.length)];
  }
};

Grid.prototype.availableCells = function () {
  var cells = [];

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (this.cells[x][y] == null) {
        cells.push({ x: x, y: y });
      }
    }
  }

  return cells;
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
};

// Check if the specified cell is taken
Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
};

Grid.prototype.prepareTiles = function () {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      var tile = this.cells[x][y];
      if (tile) {
        tile.mergedFrom = null;
        tile.savePosition();
      }
    }
  }
}

// Inserts a tile at its position
Grid.prototype.insertTile = function (tile) {
  var currentTile = this.cells[tile.position.x][tile.position.y];
  if (currentTile != null && currentTile != tile) {
    currentTile.hide();
    this.tilePool.push(currentTile);
  }
  this.cells[tile.position.x][tile.position.y] = tile;
};

Grid.prototype.markTileAsMerging = function (tile) {
  this.cells[tile.position.x][tile.position.y] = null;
};

Grid.prototype.withinBounds = function (position) {
  return position.x >= 0 && position.x < this.size &&
         position.y >= 0 && position.y < this.size;
};

Grid.prototype.updateTileSprites = function() {
  this.isAnimating = true;
  this.animatedFrames = 0;
};

Grid.prototype.animateTileSprite = function (tile, startingPos, targetPos) {
  console.debug("grid.js: animateTileSprite()");

  var targetPosX = this.TILE_POSITIONS[targetPos.x];
  var targetPosY = this.TILE_POSITIONS[targetPos.y];
  if (this.animatedFrames >= this.renderer.getNumFramesPerAnimate()) {
      this.TEMP_POS.x = targetPosX;
      this.TEMP_POS.y = targetPosY;
      tile.setSpritePosition(this.TEMP_POS);
  } else {
      var startingPosX = this.TILE_POSITIONS[startingPos.x];
      var startingPosY = this.TILE_POSITIONS[startingPos.y];
      var differenceX = (targetPosX - startingPosX) /
          this.renderer.getNumFramesForMoving();
      var differenceY = (targetPosY - startingPosY) /
          this.renderer.getNumFramesForMoving();

      this.TEMP_POS.x = tile.sprite.position.x + differenceX;
      this.TEMP_POS.y = tile.sprite.position.y + differenceY;
      tile.setSpritePosition(this.TEMP_POS);
  }
}



Grid.prototype.onRender = function () {
  if (!this.isAnimating) {
      return;
  }

  if (this.animatedFrames >= this.renderer.getNumFramesPerAnimate()) {
    for (var i = 0; i < this.animateTilesGrow.length; i++) {
       this.animateTilesGrow[i].finalizeAppear();
    }

     this.isAnimating = false;
     this.animateTilesGrow.length = 0;
     return;
  }
  this.animatedFrames++;
  if (this.animatedFrames > this.renderer.getNumFramesForMoving()) {
        var animateTileSize = this.animateTilesGrow.length;
        if(animateTileSize > 0) {
          var step = this.animatedFrames -
              this.renderer.getNumFramesForMoving();
          for (var i = 0; i < animateTileSize; i++) {
            this.animateTilesGrow[i].animateGrowOrAppear(step);
          }
        } else {
         this.animateTilesGrow.length = 0;
         this.isAnimating = false;
         return;
        }
  } else {
      for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
          var tile = this.cells[x][y];
          if (tile) {
              var sprite = tile.sprite;
              var tileAddedToGrow = false;

              if (tile.mergedFrom != null) {
                this.TEMP_POS.x = this.TILE_POSITIONS[tile.position.x];
                this.TEMP_POS.y = this.TILE_POSITIONS[tile.position.y];
                tile.setSpritePosition(this.TEMP_POS);

                var mergedTile = tile.mergedFrom[0];
                this.animateTileSprite(mergedTile,
                      mergedTile.previousPosition, tile.position);
                if (this.animatedFrames == this.renderer.getNumFramesForMoving()) {
                   mergedTile.hide();
                   this.animateTilesGrow.push(tile);
                   tileAddedToGrow = true;
                   this.tilePool.push(mergedTile);
                   tile.mergedFrom = null;
                   tile.setDisplayedTileValue(tile.value);
                } else {
                   tile.setDisplayedTileValue(mergedTile.value);
                }
              } 
              
              if (tile.previousPosition == null) {
                  if (this.animatedFrames >= this.renderer.getNumFramesForMoving()) {
                      this.TEMP_POS.x = this.TILE_POSITIONS[tile.position.x];
                      this.TEMP_POS.y = this.TILE_POSITIONS[tile.position.y];
                      tile.setSpritePosition(this.TEMP_POS);
                      if (!tileAddedToGrow) {
                        this.animateTilesGrow.push(tile);
                        tile.preAnimateAppear();
                      }
                  }
              } else if (tile.previousPosition.x != tile.position.x ||
                    tile.previousPosition.y != tile.position.y) {
                  
                  this.animateTileSprite(tile, tile.previousPosition, tile.position);
              }
              
          }
        }
      }
  }
  
};

