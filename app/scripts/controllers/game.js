'use strict';

angular.module('aApp')
  .controller('GameCtrl', ['$scope', '$routeParams', 'libgo',
          'underscore', 'Socket',
  function ($scope, $routeParams, libgo, _, socket) {

    function action (actionId) {

      if (actionId === 'done') { emitScoring(true); }

      else if (actionId === 'back-to-game') { backToGame(); }

      else { apiPlay({type:actionId}); }

    }

    function backToGame() {

    }

    function emitScoring(agree) {
      
      var myColor = game.myColor($scope.username);
      var myAttr = libgo.longColor(myColor) + 'Agree';
      var data = {
        gameId:$routeParams.gameId,
        points:game.scorePoints
      };
      data[myAttr] = agree;
      console.log('emitting',data);
      socket.emit('score',data);

    }

    function togglePrisoner(row,column) {

      game.markOrUnmarkAsPrisoner(row,column);
      stones2Scope();
      emitScoring(false);

    }


    function setTimings() {

      var remBlack = game.remainingMilliSeconds(libgo.BLACK);
      var remWhite = game.remainingMilliSeconds(libgo.WHITE);
      var interval = (game.getTurn() === libgo.BLACK ?  remBlack : remWhite) % 1000;
      $scope.blackTime = Math.floor(remBlack / 1000);
      $scope.whiteTime = Math.floor(remWhite / 1000);

      if (!interval) {interval = 1000;}

      setTimeout(function () {$scope.$apply(function() {setTimings();});}, interval);

    }

    function setTurn(turn) {

      $scope.turn = turn;
      console.log('turn',turn);
      $scope.blackTurn = turn === libgo.BLACK;
      $scope.whiteTurn = turn === libgo.WHITE;

    }

    function play2Point(row,column) { apiPlay({row:row,column:column}); }

    function game2Scope () {

      var state = game.getState();
      console.log('state now',state.state);
      setTurn(state.turn);
      
      $scope.white = game.white;
      $scope.black = game.black;
      $scope.boardSize = game.boardSize;
      $scope.komi = game.komi;
      $scope.handicaps = game.handicaps;
      $scope.timeMain = game.timeMain;
      $scope.timeExtraPeriods = game.timeExtraPeriods;
      $scope.timeStonesPerPeriod = game.timeStonesPerPeriod;
      $scope.timePeriodLength = game.timePeriodLength;

      if (state.state === 'scoring') {

        $scope.clickAction = togglePrisoner;

        if (!game.scoring.points) {
          game.scoring.points = game.getInitialScoring();
        }

        $scope.actions = [
          {name:'done',label:'Done'},
          {name:'back-to-game',label:'Back to game'}
        ];

      } else if (state.state === 'end') {

        var how = state.reason === 'resign' ? 'resignation' :
          state.reason === 'time' ? 'time' :
          state.reason === 'points' ? state.points + ' points (' +
              state.black + ' - ' + state.white + ')': state.reason;

        $scope.clickAction = function () {};
        $scope.actions = [ ];
        $scope.error = 'Game over. ' + libgo.longColor(state.winner) + ' won by ' + how;

      } else {

        $scope.clickAction = play2Point;
        $scope.actions = [
          {name:'pass',label:'Pass'},
          {name:'resign',label:'Resign'}
        ];

      }

      $scope.blackPrisoners = game.blackPrisoners;
      $scope.whitePrisoners = game.whitePrisoners;
      stones2Scope();

    }

    function stones2Scope() {

      var board = game.getBoard();
      $scope.stones = [];

      for (var row=0; row < board.boardSize; row++) {

        $scope.stones[row] = [];

        for (var column=0; column < board.boardSize; column++) {

          var score = game.scorePoint(board.point2Index(row,column));
          var stone = board.getStone(row,column);
          $scope.stones[row][column] = score || stone;

        }

      }

    }

    function updateGame (data) {

      $scope.error = null;
      console.log('received game', data);
      game = libgo.newGame(data);
      $scope.$apply(game2Scope);

    }

    function updateByError (data) {

      $scope.$apply(function() {

        $scope.error = data;
        game2Scope();
        
      });

    }

    function updateByEvent (data) {

      $scope.error = null;

      console.log('received event', data);

      if (data.type === 'move') {

        if (data.index === game.moves.length) {

          var move = libgo.newMove(data.move);
          game.play(move);
          $scope.$apply(game2Scope);

        } else {

          console.log(game.moves);
          console.log('Moves not in sync???');
          socket.emit('game', $routeParams.gameId);

        }

      } else if (data.type === 'score') {

        console.log('got scoring', data);
        game.scoreBoard = data.points;
        game.scoreOkBlack = data.blackAgree;
        game.scoreOkWhite = data.whiteAgree;
        $scope.$apply(game2Scope);

      }

    }

    function apiPlay(options) {

      var move = _.extend({
        stone: $scope.turn,
        type: 'stone'
      },options);
      var msg = { gameId: $routeParams.gameId, move: move };
      if (!move.stone) { throw new Error('Invalid stone',move.stone); }
      socket.emit('move',msg);
      setTurn(null);

    }

    function hoverIn (row,column) {

      if (!$scope.turn ||
        (game.myColor($scope.username) !== $scope.turn)) { return; }

      var obj = {timestamp: new Date().getTime(), type:'stone',stone:$scope.turn,row:row,column:column};
      var move = libgo.newMove(obj);
      var canPlay = game.isMoveOk(move);
      
      if (canPlay) {

        $scope.stones[row][column] = ($scope.turn === libgo.WHITE) ?
          libgo.WHITE_HOVER: libgo.BLACK_HOVER;

      }

    }

    function hoverOut(row,column) {

      if (!$scope.turn ||
        (game.myColor($scope.username) !== $scope.turn)) { return; }

      $scope.stones[row][column] = game.getBoard().getStone(row,column);

    }

    var listeners = {
      'game': updateGame,
      'event':updateByEvent,
      'error':updateByError,
      'connect_failed':setConnectionStatus,
      'connect':setConnectionStatus,
      'disconnect':setConnectionStatus,
      'connecting': setConnectionStatus,
      'reconnect_failed': setConnectionStatus,
      'reconnect': setConnectionStatus,
      'reconnecting': setConnectionStatus,
      //'error': null,
      //'message': null.
    };

    for (var ev in listeners) { socket.on(ev,listeners[ev]); }

    $scope.$on('destroy', function() {
      for (var ev in listeners) { socket.off(ev,listeners[ev]); }
    });

    internalSetConnectionStatus();

    function setConnectionStatus() {

      console.log('set c',socket.isConnected(),socket.getConnectionStatus());
      $scope.$apply(internalSetConnectionStatus);

    }

    function internalSetConnectionStatus () {

      $scope.connection = socket.getConnectionStatus();
      $scope.username = socket.getUserName();
      setTurn(null);

      if (socket.isConnected()) {

        console.log('=> refresh game', $routeParams.gameId);
        socket.emit('game', $routeParams.gameId);

      }
    }

    var game = null;
    //game2Scope();
    //setTimings();
    $scope.showCoords = true;
    $scope.hover = hoverIn;
    $scope.hoverOut = hoverOut;
    $scope.action = action;
    $scope.actions = [];

  }]);
