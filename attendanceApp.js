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
    controller: ['$scope', '$log', '$q', 'sitePickerGenerator', 'updateCheckedIn', function($scope, $log, $q, sitePickerGenerator, updateCheckedIn) {

      $scope.checkInPerson = function(personId, selectedProject, arrayLoc) {

        function updateArrays() {
          var deferred = $q.defer();
          var valuesToUpdate = {"id":personId, "carpoolSite":$scope.carpoolSite, "project":selectedProject}

            var promise = sitePickerGenerator($scope.carpoolSite, selectedProject)
            promise.then(function(selectedSite) {
              if (selectedSite == 'allSites') {
                $log.log("selectedSite" + selectedSite)
                $scope.projectsWithPersons[selectedProject].push(personId)
                deferred.resolve(valuesToUpdate)
              } else {
                $log.log('**selectedSite is' + selectedSite)
                $scope.projectSitesWithPersons[selectedSite].push(personId)
                valuesToUpdate["site"] = selectedSite;
                deferred.resolve(valuesToUpdate)
              }
            })

          return deferred.promise
        }

        var promise = updateArrays();
        promise.then(function(valuesToUpdate) {
          $log.log("site to update: " + valuesToUpdate["site"])
          updateCheckedIn(personId, valuesToUpdate)
          $scope.persons[personId].assignedToProject = 'all'
          var personIndex = $scope.projectsWithPersons[arrayLoc].indexOf(personId)
          $scope.projectsWithPersons[arrayLoc].splice(personIndex, 1)
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
      templateUrl: 'sitePickerSheetTemplate.html',
      controller: 'SitePickerSheetController',
      locals: {
        myCarpoolSite: carpoolSite,
        selectedProject: project
      },
      parent: angular.element(document.body)
    }).then(function(selectedSite) {
      $log.log('selectedSite id' + selectedSite['projectSite_id'])
      defer.resolve(selectedSite['projectSite_id']);
    })

    return defer.promise
  }
}])

app.factory('getActiveSites', ['$http', '$log', '$q', function($http, $log, $q) {
  var haveLoadedSites = false;
  var activePlaySites = {};
  var activePlantSites = {};
  var activePaintSites = {};

  function getSitesPromise(carpoolSite, selectedProject) {
      var deferred = $q.defer()

      return $http({
        method: "GET",
        url: "appServer/getActiveSites.php",
        params: {carpoolSite: carpoolSite}
      }).then(function mySuccess(response) {
        $log.log('getSites request was sent')

        response.data.forEach(function(currentSite) {
          switch (currentSite["project"]) {
            case "paint":
              currentSite["icon"] = "paint_icon.svg"
              activePaintSites[currentSite.projectSite_id] = currentSite;
              break;
            case "plant":
              currentSite["icon"] = "plant_icon.svg"
              activePlantSites[currentSite.projectSite_id] = currentSite;
              break;
            case "play":
              currentSite["icon"] = "play_icon.svg"
              activePlaySites[currentSite.projectSite_id] = currentSite;
              break;
          }
        })
        haveLoadedSites = true;
        $log.log('haveLoadedSites' + haveLoadedSites)
        deferred.resolve('done')
        return deferred.promise
      });
  };

  function returnSites(selectedProject) {
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
        case "all":
          var allSites = {};
          for (var paintSiteId in activePaintSites) {
            if (activePaintSites.hasOwnProperty(paintSiteId)) {
              allSites[paintSiteId] = activePaintSites[paintSiteId];
            }
          }
          for (var plantSiteId in activePlantSites) {
            if (activePlantSites.hasOwnProperty(plantSiteId)) {
              allSites[plantSiteId] = activePlantSites[plantSiteId];
            }
          }
          for (var playSiteId in activePlaySites) {
            if (activePlaySites.hasOwnProperty(playSiteId)) {
              allSites[playSiteId] = activePlaySites[playSiteId];
            }
          }
          return allSites;
          break;
        default:
          return null;
      }
  }

  return function(carpoolSite, selectedProject) {

    if (haveLoadedSites == true) {
      return returnSites(selectedProject)
    } else {
      var defer = $q.defer()
      $log.log('gettingSites!')
      var promise = getSitesPromise(carpoolSite, selectedProject)
      promise.then(function mySuccess() {defer.resolve(returnSites(selectedProject))});
      return defer.promise
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

app.controller('IndexController', ['$scope', '$http', '$mdSidenav', '$log', '$q', 'sitePickerGenerator', 'getActiveSites', function($scope, $http, $mdSidenav, $log, $q, sitePickerGenerator, getActiveSites) {

  $scope.tomsTitle = "Mission Impossible"

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

  //containers for persons
  $scope.persons = {};
  //TODO have active projects and sites dynamically load from logistics report
  $scope.registeredPersons = [];
  $scope.projectsWithPersons = {all: [], paint: [], plant: [], play: []}
  $scope.projectSitesWithPersons = {} //{nwac: [], clarkPark: [], delray: [], hamtramck: []};

  var activeSitesPromise = getActiveSites($scope.carpoolSite, "all")
  activeSitesPromise.then(function mySuccess(activeSites) {
    $log.log('activesite ' + activeSites['mckinstry'].projectSite_id)
    for (var site_id in activeSites) {
      if (activeSites.hasOwnProperty(site_id)) {
        $scope.projectSitesWithPersons[site_id] = new Array()
      }
    }
  })


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
              $log.log('**selectedSite is' + selectedSite)
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

app.controller('SitePickerSheetController', ['$scope', '$log', '$mdBottomSheet', 'getActiveSites', 'myCarpoolSite', 'selectedProject', function($scope, $log, $mdBottomSheet, getActiveSites, myCarpoolSite, selectedProject) {

  //TODO pass this in somehow
  $log.log('calling getActiveSites with carpool site ' + myCarpoolSite + ' and project ' + selectedProject)
  $scope.sites = getActiveSites(myCarpoolSite, selectedProject)

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
