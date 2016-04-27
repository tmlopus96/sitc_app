var app = angular.module('attendanceApp', ['ngMaterial', 'ngAnimate'])

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
    controller: ['$scope', '$log', '$q', 'sitePickerGenerator', function($scope, $log, $q, sitePickerGenerator) {

      $scope.checkInPerson = function(personId, selectedProject, arrayLoc) { //arrayLoc = which projectsWithPersons array this person is in
        $log.log('personId is' + personId)
        var promise = sitePickerGenerator()
        promise.then(function(selectedSite) {
          $log.log('received promise with selectedSite ' + selectedSite + ' and selectedProject' + selectedProject + ' and projectsWithPersons is' + $scope.projectsWithPersons["all"])
          if (selectedSite == 'allSites') {
            $log.log('selectedSite is allSites!')
            $scope.projectsWithPersons[selectedProject].push(personId)
            var personIndex = $scope.projectsWithPersons["all"].indexOf(personId)
            $log.log('projectsWithPersons[selectedProject][personIndex]' + personIndex)
            $scope.projectsWithPersons["all"].splice(personIndex, 1)
          }
          else {
            var personIndex = $scope.projectsWithPersons[arrayLoc].indexOf(personId)
            $log.log('projectsWithPersons[arrayLoc][personIndex]' + personIndex)
            $scope.projectsWithPersons[arrayLoc].splice(personIndex, 1)
            $scope.projectSitesWithPersons[selectedSite].push(personId)
          }
        })
      }
    }]
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
    controller: ['$scope', '$log', '$q', 'sitePickerGenerator', function($scope, $log, $q, sitePickerGenerator) {

      $scope.checkInPerson = function(personId, selectedProject) {
        $log.log('personId is' + personId)
        var promise = sitePickerGenerator()
        promise.then(function(selectedSite) {
          $log.log('received promise with selectedSite ' + selectedSite + ' and selectedProject' + selectedProject + ' and projectsWithPersons is' + $scope.projectsWithPersons["all"])
          if (selectedSite == 'allSites') {
            $scope.projectsWithPersons[selectedProject].push(personId)
            delete $scope.projectsWithPersons["all"][personId]
          }
          else {
            $scope.projectSitesWithPersons[selectedSite].push(personId)
            delete $scope.projectsWithPersons[selectedProject][personId]
          }
        })
      }
    }]
  }
})


app.factory('sitePickerGenerator', ['$mdBottomSheet', '$log', '$q', function($mdBottomSheet, $log, $q) {

  return function() {
    var defer = $q.defer()

    $mdBottomSheet.show({
      controller: 'SitePickerSheetController',
      templateUrl: 'sitePickerSheetTemplate.html'
    }).then(function(selectedSite) {
      $log.log('selectedSite id' + selectedSite['id'])
      defer.resolve(selectedSite['id']);
    })

    return defer.promise
  }
}])

app.factory('getActiveSites', ['$http', '$log', function($http, $log) {
  var haveLoadedSites = false;
  var activePlaySites = [];
  var activePlantSites = [];
  var activePaintSites = [];

  return function(carpoolSite, selectedProject) {

    if (haveLoadedSites == false) {
      $http({
        method: "GET",
        url: "appServer/getActiveSites.php",
        params: {carpoolSite: carpoolSite}
      }).then(function mySuccess(response) {
        response.data.forEach(function(currentSite) {
          switch (currentSite["project"]) {
            case "paint":
              activePaintSites.push(currentSite);
              break;
            case "plant":
              activePlantSites.push(currentSite);
              break;
            case "play":
              activePlaySites.push(currentSite);
              break;
            default:
              activePaintSites.push(currentSite);
              activePlantSites.push(currentSite);
              activePlaySites.push(currentSite);
          }
        })
      });
    }

    switch (selectedProject) {
      case "paint":
        return activePaintSites;
        break;
      case "plant":
        return activePlantSites;
        break;
      case "play":
        return activePlaySites;
        break;
      default:
        return null;
    }
  }
}])

app.controller('IndexController', ['$scope', '$http', '$mdSidenav', '$log', 'sitePickerGenerator', function($scope, $http, $mdSidenav, $log, sitePickerGenerator) {

  $scope.tomsTitle = "Mission Impossible"

  //containers for persons
  $scope.persons = {};
  //TODO have active projects and sites dynamically load from logistics report
  $scope.registeredPersons = {};
  $scope.projectsWithPersons = {all: [], paint: [], plant: [], play: []}
  $scope.projectSitesWithPersons = {nwac: [], clark: [], delray: [], hamtramck: []};

  //TODO make this load from user defaults
  $scope.carpoolSites = [
    { id: 'aa', name: 'Ann Arbor'},
    { id: 'bf', name: 'Bloomfield Hills'},
    { id: 'brk', name: 'Berkley'},
    { id: 'cp', name: 'Clark Park'},
    { id: 'drbn', name: 'Dearborn'},
    { id: 'gp', name: 'Grosse Pointe'},
    { id: 'gro', name: 'Groves'},
    { id: 'nf', name: 'North Farmington'},
    { id: 'nv', name: 'Northville'},
    { id: 'ren', name: 'Renaissance'},
    { id: 'troy', name: 'Troy'}
  ]

  //function from Chris Coyier on css-tricks.com
  function getQueryVariable(variable)
  {
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
  }

  $scope.carpoolSite = getQueryVariable("carpoolSite")

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
       $scope.registeredPersons[myId] = myId;

     });
     // MARK debug statement
     //$log.log('mySuccess ran! person 1 is ' + $scope.persons[0].firstName);
   })

}])

app.controller('AttendanceController', ['$scope', '$log', '$q', 'sitePickerGenerator', function($scope, $log, $q, sitePickerGenerator) {

    $scope.testAttenCtrlAccess = "I can access AttendanceController!"

    $scope.speedDialIsOpen = false

    $scope.checkInPerson = function(personId, selectedProject) {
      //$scope.persons[personId]
      var promise = sitePickerGenerator()
      promise.then(function(selectedSite) {
        $log.log('received promise with selectedSite ' + selectedSite + ' and selectedProject' + selectedProject + ' and projectsWithPersons is' + $scope.projectsWithPersons[selectedProject])
        if (selectedSite == 'allSites') {
          $scope.projectsWithPersons[selectedProject].push(personId)
          delete $scope.registeredPersons[personId]
          $log.log('pushed ' + personId + 'to projectsWithPersons[' + selectedProject + ']')
        }
        else {
          $scope.projectSitesWithPersons[selectedSite].push(personId)
          delete $scope.registeredPersons[personId]
          $log.log('pushed' + personId + 'to projectSitesWithPersons')
        }
      })
    }


   }
])

app.controller('SitePickerSheetController', ['$scope', '$log', '$mdBottomSheet', 'getActiveSites', function($scope, $log, $mdBottomSheet, getActiveSites) {

  //TODO dynamically load available sites
  /*$scope.sites = [
    { name: 'NWAC', id: 'nwac', icon: 'assignment_turned_in' },
    { name: 'Clark Park', id: 'clark', icon: 'headset_mic' },
    { name: 'Delray', id: 'delray', icon: 'headset_mic' },
    { name: 'Hamtramck', id: 'hamtramck', icon: 'assignment_turned_in' }
  ];*/

  //TODO pass this in somehow
  $scope.sites = getActiveSites("aa", "plant")
  $log.log('sites is ' + $scope.sites[0])

  $scope.allSitesDefault = [
    { name: 'allSites', id: 'allSites', icon: 'headset'}
  ]

  $scope.listItemClick = function($index) {
    if ($index == 'allSites') {
      var selectedSite = $scope.allSitesDefault[0]
      $log.log('$index is ' + selectedSite + '!')
    }
    else {
      var selectedSite = $scope.sites[$index];
    }

    $log.log('selectedSite is ' + selectedSite["name"])
    $mdBottomSheet.hide(selectedSite);
  };
}])
