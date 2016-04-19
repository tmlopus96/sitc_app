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
    controller: 'AttendanceController'
  }
  })

app.controller('IndexController', ['$scope', '$mdSidenav', function($scope, $mdSidenav) {

  $scope.tomsTitle = 'Mission Impossible'

   $scope.toggleLeftMenu = function () {
     $mdSidenav('left').toggle();
   }

}])

app.controller('AttendanceController', ['$scope', '$log', '$mdSidenav', '$mdBottomSheet', function($scope, $log, $mdSidenav, $mdBottomSheet) {

      $scope.topDirections = ['left', 'up']
      $scope.bottomDirections = ['down', 'right']
      $scope.isOpen = false
      $scope.availableModes = ['md-fling', 'md-scale']
      $scope.selectedMode = 'md-fling'
      $scope.availableDirections = ['up', 'down', 'left', 'right']
      $scope.selectedDirection = 'up'

     $scope.title = "Extra Special Guy"

     $scope.alert = ''
     $scope.showSitePicker = function() {
       $scope.alert = ''
       $mdBottomSheet.show({
         controller: 'SitePickerSheetController',
         templateUrl: 'sitePickerSheetTemplate.html'
       }).then(function(selectedSite) {
         alert(selectedSite['name'] + ' clicked!')
       })
     }

   }
])

app.controller('SitePickerSheetController', ['$scope', '$log', '$mdBottomSheet', function($scope, $log, $mdBottomSheet) {
  $log.log('site picker sheet controller is alive')

  $scope.sites = [
    { name: 'NWAC', icon: 'assignment_turned_in' },
    { name: 'Clark Park', icon: 'headset_mic' },
    { name: 'Delray', icon: 'headset_mic' },
    { name: 'Hamtramck', icon: 'assignment_turned_in' }
  ];
  $scope.listItemClick = function($index) {
    var selectedSite = $scope.sites[$index];
    $mdBottomSheet.hide(selectedSite);
  };
}])
