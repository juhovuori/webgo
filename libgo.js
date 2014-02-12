(function(exports) {

  var BLACK = 'b';
  var WHITE = 'w';
  var EMPTY = '_';

  var PLAY = 'play';
  var PASS = 'pass';
  var RESIGN = 'resign';

  exports.PLAY = PLAY;
  exports.PASS = PASS;
  exports.RESIGN = RESIGN;
  exports.BLACK = BLACK;
  exports.WHITE = WHITE;
  exports.EMPTY = EMPTY;
  exports.BLACK_HOVER = 'B';
  exports.WHITE_HOVER = 'W';

  exports.newGame = function (options) { return new Game(options); }

  function Game(options) {

    var defaults = {
      black : 'black', // name of the player
      white : 'white', // name of the player
      boardSize : 19,
      handicaps : 0,
      scoring : {},
      moves : []

    };

    options = options || {};

    for (var key in defaults) {
      this[key] = options[key] !== undefined ? options[key] : defaults[key];
    }

    this.boards = [new Board(this.boardSize)];  // cached boards

  }

  Game.prototype.isMoveOk = function (move) {

    try {

      var newBoard = this.getBoard().play(move);

    } catch (e) {

      return false;

    }

    return true;

  };

  Game.prototype.play = function (move) {

    /*
    if (!(move instanceof Move)) {
      throw new Error ('You must play only Move objects');
    }
    */

    var newBoard = this.getBoard().play(move);
    this.moves.push(move);
    this.boards.push(newBoard);

    return newBoard;

  };

  Game.prototype.getState = function () {

    var moves = this.moves.length;
    var whoplays = (((this.handicaps > 0) ? 1 : 1) + moves) % 2;
    var twoPasses = this.moves.length >= 2 &&
                    this.moves[moves-1].type == PASS &&
                    this.moves[moves-2].type == PASS;
    var resign = this.moves.length >= 1 && this.moves[moves-1].type == RESIGN;
    var scored = this.scoring.whiteAgree && this.scoring.blackAgree;

    if (scored) {

    }

  };

  Game.prototype.getBoard = function (moveNumber) {

    if (moveNumber === undefined) moveNumber = this.moves.length;

    if (moveNumber < 0) { throw new Error('Move must be a positive integer'); }

    if (this.boards[moveNumber] === undefined) {

      var lastMove = this.moves[moveNumber-1];
      this.boards[moveNumber] = this.getBoard(moveNumber-1).play(lastMove);

    }

    return this.boards[moveNumber];

  };

  function Board(boardSize,template) {

    this.stones = [];
    this.length = boardSize

    for (var i=0;i<boardSize;i++) {

      this.stones[i] = [];

      for (var j=0;j<boardSize;j++) {

        this.stones[i][j] = (template === undefined) ?
                            EMPTY :
                            template[i][j];

      }

    }

  }

  Board.prototype.validCoordinate = function (row) {
    return (row >= 0 && row < this.length);
  }

  Board.prototype.setStone = function (row,column,content) {

    if (!this.validCoordinate(row)) {
      throw new Error('Invalid row ' + row);
    }
    if (!this.validCoordinate(column)) {
      throw new Error('Invalid column ' + column);
    }
    this.stones[row][column] = content;

  };

  Board.prototype.getStone = function (row,column) {
    return this.stones[row][column];
  };

  Board.prototype.toString = function () {

    var rows = this.stones.map(function (row) { return row.join(' '); });

    return rows.join('\n');

  }

  Board.prototype.play = function (move) {

    function kill(row,column) {

      var opposite = move.stone === WHITE ? BLACK : WHITE;
      var groupToKill = new Group(newBoard,row,column);

      if (groupToKill.content !== opposite) { return; }

      if (groupToKill.getLiberties(newBoard) > 0) { return; }

      groupToKill.removeFromBoard(newBoard);

    }

    if (!this.validCoordinate(move.row)) {
      throw new Error('Invalid row ' + move.row);
    }
    if (!this.validCoordinate(move.column)) {
      throw new Error('Invalid column ' + move.column);
    }
    if (move.stone != WHITE && move.stone !== BLACK) {
      throw new Error('Invalid stone ' + move.stone);
    }
    if (this.getStone(move.row,move.column) !== EMPTY) {
      throw new Error('Point ' + move.row + ',' + move.column + ' not empty');
    }

    var newBoard = new Board(this.length,this.stones);

    newBoard.setStone(move.row,move.column, move.stone);
    var myGroup = new Group(newBoard,move.row,move.column);
    
    kill(move.row-1, move.column);
    kill(move.row+1, move.column);
    kill(move.row, move.column-1);
    kill(move.row, move.column+1);

    if (false) {
      throw new Error('Move not possible because of ko');
    }
    if (myGroup.getLiberties(newBoard) == 0) {
      throw new Error('Suicide is not allowed');
    }

    return newBoard;


  };

  Board.prototype.point2Hash = function (row,column) {

    return row*this.length + column;

  };

  Board.prototype.hash2Point = function (hash) {

    var row = Math.floor (hash / this.length);
    var col = hash % this.length;

    return [row,col];

  };

  // A recursive constructor, oho!
  function Group (board, row, column) {

    var hash = board.point2Hash(row,column);

    // If this is initial call, set desired point content
    if (this.content === undefined) {

      this.content = board.getStone(row,column);
      this.hashes = { };

    }

    // check that point coordinates are on board
    if (!board.validCoordinate(row) ||
      !board.validCoordinate(column)) {
      return;
    }

    // Stop recursion if this point is already in the group.
    if (this.hashes[hash] !== undefined) { return; }

    // Stop recursion if this point is not of desired content
    else if (board.getStone(row,column) != this.content) { return; }

    // Otherwise add this point to the group and recurse.
    else {

      this.hashes[hash] = true;
      Group.bind(this)(board, row + 1,column);
      Group.bind(this)(board, row - 1,column);
      Group.bind(this)(board, row,column + 1);
      Group.bind(this)(board, row,column - 1);
      
    }

  };

  Group.prototype.removeFromBoard = function (board) {

    for (var hash in this.hashes) {

      var point = board.hash2Point(hash);
      board.setStone(point[0],point[1],EMPTY);

    }

  };

  Group.prototype.getNeighbours = function (board) {

    function tryToAddToNeighbours(hashes,row,col) {

      var hash = board.point2Hash(row,col);

      if (hashes[hash] === undefined) neighbours[hash] = true;

    }
    var neighbours = {};

    for (var hash in this.hashes) {

      var point = board.hash2Point(hash);
      tryToAddToNeighbours(this.hashes,point[0]+1,point[1]);
      tryToAddToNeighbours(this.hashes,point[0]-1,point[1]);
      tryToAddToNeighbours(this.hashes,point[0],point[1]+1);
      tryToAddToNeighbours(this.hashes,point[0],point[1]-1);
    }

    return neighbours;

  };

  Group.prototype.getLiberties = function (board) {

    var neighbours = this.getNeighbours(board);
    var freedoms = Object.keys(neighbours).filter(function (hash) {
      var point = board.hash2Point(hash);
      return (board.getStone(point[0],point[1]) === EMPTY)
    });

    return freedoms.length;

  };


})(typeof exports === 'undefined' ? this.libgo = {} : exports);
