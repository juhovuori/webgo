'use strict';

(function () {
  var map = {};
  map[libgo.EMPTY] = 'images/empty.png';
  map[libgo.BLACK] = 'images/black.png';
  map[libgo.WHITE] = 'images/white.png';
  map[libgo.BLACK_HOVER] = 'images/black-hover.png';
  map[libgo.WHITE_HOVER] = 'images/white-hover.png';
  angular.module('aApp')
  .filter('stoneUrl', function () {
    return function (content) { return map[content]; }
  })
  .filter('stoneCount', function () {
    return function (stones) {
      var sum = 0;
      var boardSize = stones.length;
      for (var i=0; i<boardSize;i++) {
        for (var j=0; j<boardSize;j++) {
          sum += (stones[i][j] !== libgo.EMPTY) ? 1 : 0;
        }
      }
      return sum;
    };
  });
})();
