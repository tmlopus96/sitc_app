var app = angular.module('attendanceApp', ['ngMaterial'])

app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('cyan')
    .accentPalette('deep-orange');
  })

app.directive('registered', function() {
  return {
    restrict: 'E',
    templateUrl: 'attendanceTabControllers/registered.html',
    controller: 'AttendanceController'
  }
})

app.directive('checkedin', function() {
  return {
    restrict: 'E',
    templateUrl: 'attendanceTabControllers/checkedIn.html',
    controller: 'AttendanceController'
  }
})

app.directive('assigned', function() {
  return {
    restrict: 'E',
    templateUrl: 'attendanceTabControllers/assigned.html',
    controller: 'AttendanceController'
  }
})

app.factory('sitePickerGenerator', ['$mdBottomSheet', function($mdBottomSheet) {

  return function() {
    $mdBottomSheet.show({
      controller: 'SitePickerSheetController',
      templateUrl: 'sitePickerSheetTemplate.html'
    }).then(function(selectedSite) {
      alert(selectedSite['name'] + ' clicked!')
    })
  }
}])

app.controller('IndexController', ['$scope', '$mdSidenav', function($scope, $mdSidenav) {

  $scope.tomsTitle = "Mission Impossible"

   $scope.toggleLeftMenu = function () {
     $mdSidenav('left').toggle();
   }

}])

app.controller('AttendanceController', ['$scope', '$log', 'sitePickerGenerator', function($scope, $log, sitePickerGenerator) {

     $scope.title = "Extra Special Guy"

     $scope.showSitePicker = function() {
       sitePickerGenerator()
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
