var app = angular.module('attendanceApp', ['ngMaterial', 'ngAnimate'])

app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('cyan')
    .accentPalette('deep-orange');
  })


/*scope: {
  persons: '=',
  registeredPersons: '=',
  projectsWithPersons: '=',
  projectSitesWithPersons: '='
}*/
app.directive('registered', function() {
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'attendanceTabControllers/registered.html',
    controller: 'AttendanceController'
  }
})

app.directive('checkedin', function() {
  return {
    restrict: 'E',
    scope: true,
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
          if (selectedSite["name"] == 'allSites') {
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

  return function(carpoolSite, project) {
    var defer = $q.defer()

    $mdBottomSheet.show({
      controller: 'SitePickerSheetController',
      templateUrl: 'sitePickerSheetTemplate.html',
      locals: {
        myCarpoolSite: carpoolSite,
        selectedProject: project
      }
    }).then(function(selectedSite) {
      $log.log('selectedSite id' + selectedSite['projectSite_id'])
      defer.resolve(selectedSite['projectSite_id']);
    })

    return defer.promise
  }
}])

app.factory('getActiveSites', ['$http', '$log', function($http, $log) {
  var haveLoadedSites = false;
  var activePlaySites = {};
  var activePlantSites = {};
  var activePaintSites = {};

  return function(carpoolSite, selectedProject) {

    if (haveLoadedSites == false) {
      $http({
        method: "GET",
        url: "appServer/getActiveSites.php",
        params: {carpoolSite: carpoolSite}
      }).then(function mySuccess(response) {
        $log.log('getSites request was sent')

        response.data.forEach(function(currentSite) {
          switch (currentSite["project"]) {
            case "paint":
              activePaintSites[currentSite.projectSite_id] = currentSite;
              break;
            case "plant":
              activePlantSites[currentSite.projectSite_id] = currentSite;
              break;
            case "play":
              activePlaySites[currentSite.projectSite_id] = currentSite;
              break;
            default:
              activePaintSites[currentSite.projectSite_id] = currentSite;
              activePlantSites[currentSite.projectSite_id] = currentSite;
              activePlaySites[currentSite.projectSite_id] = currentSite;
          }

          haveLoadedSites = true;
          $log.log('haveLoadedSites' + haveLoadedSites)
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

app.factory('updateCheckedIn', ['$http', '$log', '$q', function($http, $log, $q) {

  return function(personId, valuesToUpdate) {

    $http({
      method: "GET",
      url: "appServer/updateCheckedIn.php",
      params: valuesToUpdate
    });
  }
}])

app.controller('IndexController', ['$scope', '$http', '$mdSidenav', '$log', 'sitePickerGenerator', function($scope, $http, $mdSidenav, $log, sitePickerGenerator) {

  $scope.tomsTitle = "Mission Impossible"

  //containers for persons
  $scope.persons = {};
  //TODO have active projects and sites dynamically load from logistics report
  $scope.registeredPersons = [];
  $scope.projectsWithPersons = {all: [], paint: [], plant: [], play: []}
  $scope.projectSitesWithPersons = {nwac: [], clarkPark: [], delray: [], hamtramck: []};

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

  //function to get URL params from Chris Coyier on css-tricks.com
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
       switch (currentPerson["preferredProject"]) {
         case "paint":
            currentPerson["projectIcon"] = "paint_icon.svg"
            break
          case "plant":
            currentPerson["projectIcon"] = "plant_icon.svg"
            break
          case "play":
            currentPerson["projectIcon"] = "play_icon.svg"
          default:
            currentPerson["projectIcon"] = "all_projects_icon.svg"
       }
       var myId = currentPerson["person_id"];
       $scope.persons[myId] = currentPerson;
       //TODO put pre-assigned people directly into respective project/site containers; eventually everyone will automatically get put in persons but not necessarily registered
       $scope.registeredPersons.push(myId);

     });
     // MARK debug statement
     //$log.log('mySuccess ran! person 1 is ' + $scope.persons[0].firstName);
   })

}])

app.controller('AttendanceController', ['$scope', '$log', '$q', 'sitePickerGenerator', 'updateCheckedIn', function($scope, $log, $q, sitePickerGenerator, updateCheckedIn) {

    $scope.testAttenCtrlAccess = "I can access AttendanceController!"

    $scope.speedDialIsOpen = false

    $scope.checkInPerson = function(personId, selectedProject) {

      function updateArrays() {
        var deferred = $q.defer();
        var valuesToUpdate = {"id":personId, "carpoolSite":$scope.carpoolSite, "project":selectedProject}

        if (selectedProject == 'all') {
          $scope.projectsWithPersons['all'].push(personId);
          deferred.resolve(valuesToUpdate)
        } else {
          var promise = sitePickerGenerator($scope.carpoolSite, selectedProject)
          promise.then(function(selectedSite) {
            if (selectedSite == 'allSites') {
              $log.log("selectedSite" + selectedSite)
              $scope.projectsWithPersons[selectedProject].push(personId)
              deferred.resolve(valuesToUpdate)
            }
            else {
              $scope.projectSitesWithPersons[selectedSite].push(personId)
              valuesToUpdate["site"] = selectedSite;
              deferred.resolve(valuesToUpdate)
            }
          })

        }

        return deferred.promise
      }

      var promise = updateArrays();
      promise.then(function(valuesToUpdate) {
        $log.log("site to update: " + valuesToUpdate["site"])
        updateCheckedIn(personId, valuesToUpdate)
        $scope.persons[personId].assignedToProject = 'all'
        var personIndex = $scope.registeredPersons.indexOf(personId)
        $scope.registeredPersons.splice(personIndex, 1)
      })
    }


   }])

app.controller('SitePickerSheetController', ['$scope', '$log', '$mdBottomSheet', 'getActiveSites', function($scope, $log, $mdBottomSheet, getActiveSites) {

  //TODO dynamically load available sites
  /*$scope.sites = [
    { name: 'NWAC', id: 'nwac', icon: 'assignment_turned_in' },
    { name: 'Clark Park', id: 'clark', icon: 'headset_mic' },
    { name: 'Delray', id: 'delray', icon: 'headset_mic' },
    { name: 'Hamtramck', id: 'hamtramck', icon: 'assxignment_turned_in' }
  ];*/

  //TODO pass this in somehow
  $scope.sites = getActiveSites("aa", "play")
  $log.log('sites is ' + $scope.sites[0])

  $scope.allSitesDefault = [
    { name: 'allSites', projectSite_id: 'allSites', icon: 'watch_later'}
  ]

  $scope.listItemClick = function(siteId) {
    if (siteId == 'allSites') {
      var selectedSite = $scope.allSitesDefault[0]
      $log.log('$index is ' + selectedSite + '!')
    }
    else {
      var selectedSite = $scope.sites[siteId];
    }

    $log.log('selectedSite is ' + selectedSite["name"])
    $mdBottomSheet.hide(selectedSite);
  };
}])
