'use strict';

angular.module('aApp')
  .directive('coord', [function () {
    return {
      template: '<div ng-style="{width:size,height:size}"">{{visibleCoord}}</div>',
      scope: {
        coord: '=',
        size: '='
      },

      restrict: 'A',

      link: function (scope,elem) {
        
        if (isNaN(scope.coord)) {
			
          scope.visibleCoord = '';
          
        } else {
          
          scope.visibleCoord = scope.coord + 1;
          
        }
        elem.addClass('webgo-coord');

      },

    };
  }])
  .directive('goboard', function () {

    return {

      templateUrl: 'views/goboard.html',
      restrict: 'E',
      //require: '^stones',
      scope: {
        stones: '=',
        coords: '=',
        stoneSize: '=',
        cbPlay: '&',
        cbHover: '&',
        cbHoverOut: '&'
      },

      link: function (scope) {

        scope.$watch('coords', function (x) {
          scope.boardCoordClass = x ? 'with-coordinates' : 'without-coordinates';
        });
        scope.$watch('stoneSize', function () {
          scope.sSize = scope.stoneSize || 32;
          console.log('stonestize change here',scope.sSize);
          scope.sizeStyle = {width:scope.sSize,height:scope.sSize};

        });
        scope.cellClass = function (row,col) {

          var boardSize = scope.stones.length;
          var classes = [];

          if (row === 0) { classes.push('top'); }
          if (col === 0) { classes.push('left'); }
          if (row === boardSize-1) { classes.push('bottom'); }
          if (col === boardSize-1) { classes.push('right'); }

          return classes;

        };

      },

    };

  });
