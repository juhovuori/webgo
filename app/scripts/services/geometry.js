'use strict';

angular.module('aApp')
  .service('Geometry', function Geometry($rootScope) {
    // AngularJS will instantiate a singleton by calling "new" on this function

	$(window).resize( function () {$rootScope.$apply(myResize); } );
	myResize();
	
	function myResize() {
		
		var $w = $(window);
		var $c = $(".container");
		var $c = $(".webgo-control-container");


		var w = $w.width();
		var h = $w.height();
		var limit, other;
		
		if (w > h) {
			
			$c.addClass('horizontal')
			  .removeClass('vertical');
			$rootScope.orientation = 'horizontal';
			limit = h;
			other = w;
			
		} else {
			
			$c.removeClass('horizontal')
			  .addClass('vertical');
			$rootScope.orientation = 'vertical';
			limit = w;
			other = h;
			
		}
		
		console.log($rootScope.orientation);
		$c.attr('data-limit',limit);
		$rootScope.boardPixels = limit - 16; // body margin = 8px * 2
		$rootScope.containerPixels = other - limit;

	}

  });
