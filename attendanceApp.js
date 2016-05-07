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
    controller: ['$scope', '$log', '$q', '$mdToast', 'sitePickerGenerator', 'updateCheckedIn', 'driverStatus', 'driverPickerGenerator', 'assignToDriver', function($scope, $log, $q, $mdToast, sitePickerGenerator, updateCheckedIn, driverStatus, driverPickerGenerator, assignToDriver) {

      $scope.checkInPerson = function(personId, selectedProject, arrayLoc) {

        function updateArrays() {
          var deferred = $q.defer();
          var valuesToUpdate = {"id":personId, "carpoolSite":$scope.carpoolSite, "project":selectedProject}

            var promise = sitePickerGenerator($scope.carpoolSite, selectedProject)
            promise.then(function(selectedSite) {
              if (selectedSite == 'allSites') {
                $log.log("selectedSite" + selectedSite)
                $scope.projectsWithPersons[selectedProject].push(personId)
                $scope.persons[personId].assignedToProject = selectedProject
                deferred.resolve(valuesToUpdate)
              } else {
                $log.log('**selectedSite is' + selectedSite)
                $scope.projectSitesWithPersons[selectedSite].push(personId)
                $scope.persons[personId].assignedToSite_id = selectedSite
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
          var personIndex = $scope.projectsWithPersons[arrayLoc].indexOf(personId)
          $scope.projectsWithPersons[arrayLoc].splice(personIndex, 1)
        })
      }

      //--- Driver business
      $scope.toggleDriver = function(personId) {
        $log.log('toggleDriver ran!!')
        if ($scope.persons[personId].driverStatus == null) {
          $log.log('calling driverStatus on person ' + personId + 'with isDriver')
          $scope.persons[personId].driverStatus = "isDriver"
          var driverPromise = driverStatus(personId, "isDriver")
          driverPromise.then(function() {
            var driverName = $scope.persons[personId].firstName
            $mdToast.showSimple('Added driver: ' + driverName)
          })
        } else {
          $log.log('calling driverStatus on person ' + personId + 'with NULL')
          $scope.persons[personId].driverStatus = null
          var driverPromise = driverStatus(personId, 'NULL')
          driverPromise.then(function() {
            var driverName = $scope.persons[personId].firstName
            $mdToast.show($mdToast.simple().textContent('Removed driver: ' + driverName).theme('accent'))
          })
        }
      }

      $scope.assignDriver = function(personId) {
        var activeDrivers = new Array()
        for (var id in $scope.persons) {
          if ($scope.persons[id].hasOwnProperty("driverStatus")) {
            if ($scope.persons[id].driverStatus == "isDriver")
              activeDrivers.push({"id":id, "name":$scope.persons[id].firstName + ' ' + $scope.persons[id].lastName})
          }
        }

        var driverPromise = driverPickerGenerator(activeDrivers)
        driverPromise.then(function(selectedDriver) {

          $scope.persons[personId].assignedToDriver_id = selectedDriver
          $log.log('about to call assignToDriver on person ' + personId + ' to driver ' + selectedDriver)
          var assignDriverPromise = assignToDriver(personId, selectedDriver)
          assignDriverPromise.then(function mySuccess() {
            var personName = $scope.persons[personId].firstName
            var driverName = $scope.persons[selectedDriver].firstName
            $mdToast.show($mdToast.simple().textContent('Assigned ' + personName + ' to driver ' + driverName))
          })

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

app.factory('driverPickerGenerator', ['$q', '$log', '$mdBottomSheet', function($q, $log, $mdBottomSheet) {

  return function(activeDrivers) {

    return $mdBottomSheet.show({
      templateUrl: 'bottomSheetTemplates/driverPicker.html',
      locals: { myActiveDrivers: activeDrivers },
      controller: ['$scope', 'myActiveDrivers', function($scope, myActiveDrivers) {

        var selectedDriver = ''
        $scope.activeDrivers = myActiveDrivers
        $log.log('activeDrivers test' + $scope.activeDrivers[1].name)

        $scope.selectWithDriver = function(selectedDriver) {
          $mdBottomSheet.hide(selectedDriver)
        }

      }]
    })
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

app.factory('driverStatus', ['$http', '$log', function($http, $log) {

  return function(personId, newStatus) {

    return $http({
      method: "GET",
      url: "appServer/driverStatus.php",
      params: {
        personId: personId,
        status: newStatus
      }
    })

  }

}])

app.factory('assignToDriver', ['$http', '$log', function($http, $log) {

  return function(personId, driverId) {

    return $http({
      method: "GET",
      url: "appServer/assignToDriver.php",
      params: {
        personId: personId,
        driverId: driverId
      }
    })

  }

}])

app.controller('IndexController', ['$scope', '$http', '$mdSidenav', '$log', '$q', 'sitePickerGenerator', 'getActiveSites', function($scope, $http, $mdSidenav, $log, $q, sitePickerGenerator, getActiveSites) {

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
    var defer = $q.defer()
    //Put each site into projectSitesWithPersons obj
    Object.keys(activeSites).forEach(function(id, index, allIds) {
      $scope.projectSitesWithPersons[id] = new Array()
      $log.log('forEach running')
      if (index === allIds.length-1) { //if last iteration, resolve promise
        defer.resolve()
        $log.log('last iteration; returned promise!')
      }
    })
    return defer.promise
  }).then(function() {
    //after sites in place, then load ppl
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
        if ($scope.persons[myId].assignedToSite_id != null) {
          $scope.projectSitesWithPersons[$scope.persons[myId].assignedToSite_id].push(myId)
        } else if ($scope.persons[myId].assignedToProject != null) {
          $scope.projectsWithPersons[$scope.persons[myId].assignedToProject].push(myId)
        } else {
          $scope.registeredPersons.push(myId)
        }

      });
      // MARK debug statement
      //$log.log('mySuccess ran! person 1 is ' + $scope.persons[0].firstName);
    })
  })


   $scope.toggleLeftMenu = function () {
     $mdSidenav('left').toggle();
   }

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
