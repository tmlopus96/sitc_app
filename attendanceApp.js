var app = angular.module('attendanceApp', ['ngMaterial'])

app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('cyan')
    .accentPalette('deep-orange');
  })

app.directive('registered', function() {
  return {
    restrict: 'E',
    scope: {
      showSitePicker: '&',
      persons: '='
    },
    templateUrl: 'attendanceTabControllers/registered.html',
    controller: 'AttendanceController'
  }
})

app.directive('checkedin', function() {
  return {
    restrict: 'E',
    scope: {
      showSitePicker: '&',
      persons: '='
    },
    templateUrl: 'attendanceTabControllers/checkedIn.html',
    controller: 'AttendanceController'
  }
})

app.directive('assigned', function() {
  return {
    restrict: 'E',
    scope: {
      showSitePicker: '&',
      persons: '='
    },
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

app.controller('IndexController', ['$scope', '$http', '$mdSidenav', '$log', 'sitePickerGenerator', function($scope, $http, $mdSidenav, $log, sitePickerGenerator) {

  $scope.tomsTitle = "Mission Impossible"

  //TODO make this load from user defaults
  $scope.carpoolSite = "nf";

   $scope.toggleLeftMenu = function () {
     $mdSidenav('left').toggle();
   }

   $scope.showSitePicker = function() {
     sitePickerGenerator()
   }

   $http({
     method: "GET",
     url: "appServer/getRegistered.php",
     params: {carpoolSite: $scope.carpoolSite}
   }).then(function mySuccess(response) {
     $scope.persons = response.data;
     // MARK debug statement
     //$log.log('mySuccess ran! person 1 is ' + $scope.persons[0].firstName);
   })

}])

app.controller('AttendanceController', ['$scope', '$log', 'sitePickerGenerator', function($scope, $log, sitePickerGenerator) {

     $scope.title = "Extra Special Guy"


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
