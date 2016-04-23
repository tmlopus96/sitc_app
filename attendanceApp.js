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
      persons: '=',
      registeredPersons: '=',
      projectsWithPersons: '=',
      projectSitesWithPersons: '='
    },
    templateUrl: 'attendanceTabControllers/registered.html',
    controller: 'AttendanceController'
  }
})

app.directive('checkedin', function() {
  return {
    restrict: 'E',
    scope: {
      persons: '=',
      registeredPersons: '=',
      projectsWithPersons: '=',
      projectSitesWithPersons: '='
    },
    templateUrl: 'attendanceTabControllers/checkedIn.html',
    controller: 'AttendanceController'
  }
})

app.directive('assigned', function() {
  return {
    restrict: 'E',
    scope: {
      persons: '=',
      registeredPersons: '=',
      projectsWithPersons: '=',
      projectSitesWithPersons: '='
    },
    templateUrl: 'attendanceTabControllers/assigned.html',
    controller: 'AttendanceController'
  }
})

app.factory('sitePickerGenerator', ['$mdBottomSheet', '$log', '$q', function($mdBottomSheet, $log, $q) {

  return function() {
    var defer = $q.defer()

    $mdBottomSheet.show({
      controller: 'SitePickerSheetController',
      templateUrl: 'sitePickerSheetTemplate.html'
    }).then(function(selectedSite) {
      alert(selectedSite['name'] + ' clicked!')
      defer.resolve(selectedSite['name']);
    })

    return defer.promise
  }
}])

app.controller('IndexController', ['$scope', '$http', '$mdSidenav', '$log', 'sitePickerGenerator', function($scope, $http, $mdSidenav, $log, sitePickerGenerator) {

  $scope.tomsTitle = "Mission Impossible"

  //containers for persons
  $scope.persons = {};
  //TODO have active projects and sites dynamically load from logistics report
  $scope.registeredPersons = {};
  $scope.projectsWithPersons = {all: []}
  $scope.projectSitesWithPersons = {};

  //TODO make this load from user defaults
  $scope.carpoolSite = "nf";

   $scope.toggleLeftMenu = function () {
     $mdSidenav('left').toggle();
   }

   $http({
     method: "GET",
     url: "appServer/getRegistered.php",
     params: {carpoolSite: $scope.carpoolSite}
   }).then(function mySuccess(response) {
     //$scope.persons = response.data;
     response.data.forEach(function(currentPerson) {
       var myId = currentPerson["person_id"];
       $scope.persons[myId] = currentPerson;
       //TODO put pre-assigned people directly into respective project/site containers; eventually everyone will automatically get put in persons but not necessarily registered
       $scope.registeredPersons[myId] = currentPerson;

     });
     // MARK debug statement
     //$log.log('mySuccess ran! person 1 is ' + $scope.persons[0].firstName);
   })

}])

app.controller('AttendanceController', ['$scope', '$log', '$q', 'sitePickerGenerator', function($scope, $log, $q, sitePickerGenerator) {

    $scope.testAttenCtrlAccess = "I can access AttendanceController!"


    /*$scope.showSitePicker = function() {
      return function() {
        $log.log('sitePicker function with defer ran')
        var defer = $q.defer()
        sitePickerGenerator(defer)
        return defer.promise
      }
    }*/

    $scope.checkInPerson = function(personId, selectedProject) {
      //$scope.persons[personId]
      var promise = sitePickerGenerator()
      promise.then(function(selectedSite) {
        $log.log('received promise with selectedSite ' + selectedSite + ' and selectedProject' + selectedProject + ' and projectsWithPersons is' + $scope.projectsWithPersons["all"])
        if (selectedSite == 'allSites') {
          $scope.projectsWithPersons[selectedProject].push(personId)
          delete $scope.registeredPersons[personId]
          $log.log('pushed ' + personId + 'to projectsWithPersons')
        }
        else {
          $scope.projectSitesWithPersons[selectedSite].push(personId)
        }
      })
    }


   }
])

app.controller('SitePickerSheetController', ['$scope', '$log', '$mdBottomSheet', function($scope, $log, $mdBottomSheet) {

  //TODO dynamically load available sites
  $scope.sites = [
    { name: 'NWAC', icon: 'assignment_turned_in' },
    { name: 'Clark Park', icon: 'headset_mic' },
    { name: 'Delray', icon: 'headset_mic' },
    { name: 'Hamtramck', icon: 'assignment_turned_in' }
  ];

  $scope.allSitesDefault = [
    { name: 'allSites', icon: 'headset'}
  ]

  $scope.listItemClick = function($index) {
    if ($index == 'allSites') {
      var selectedSite = $scope.allSitesDefault[0]
      $log.log('$index is ' + selectedSite + '!')
    }
    else {
      var selectedSite = $scope.sites[$index];
    }

    $log.log('selectedSite is ' + selectedSite)
    $mdBottomSheet.hide(selectedSite);
  };
}])
