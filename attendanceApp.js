var app = angular.module('attendanceApp', ['ngMaterial'])

app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('cyan')
    .accentPalette('deep-orange');
  })

app.directive('registered', function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'attendanceTabControllers/registered.html',
    bindToController: true,
    controllerAs: 'ctrl',
    controller: 'AttendanceController'
  }
  })

app.controller('IndexController', ['$scope', '$mdSidenav', function($scope, $mdSidenav) {

  var self = this

   self.toggleLeftMenu = function () {
     $mdSidenav('left').toggle();
   }
}])

app.controller('AttendanceController', ['$scope', '$log', '$mdSidenav', function($scope, $log, $mdSidenav) {
     var self = this

      this.topDirections = ['left', 'up']
      this.bottomDirections = ['down', 'right']
      this.isOpen = false
      this.availableModes = ['md-fling', 'md-scale']
      this.selectedMode = 'md-fling'
      this.availableDirections = ['up', 'down', 'left', 'right']
      this.selectedDirection = 'up'

     self.title = "Extra Special Guy"
   }
])
