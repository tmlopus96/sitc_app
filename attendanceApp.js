var app = angular.module('attendanceApp', ['ngMaterial', 'ngAnimate', 'ngRoute', 'ui.router'])

app.config(function($stateProvider) {
  $stateProvider
    .state('attendance', {
      url: '/',
      templateUrl: 'attendanceView.html',
      controller: 'AttendanceController',
      data: {requireLogin: true}
    })

    .state('attendance.registered', {
      url: '/registered',
      templateUrl: 'attendanceTabControllers/registered.html',
      controller: 'RegisteredController',
      data: {requireLogin: true}
    })
    .state('attendance.checkedIn', {
      url: '/checkedIn',
      templateUrl: 'attendanceTabControllers/checkedIn.html',
      controller: 'CheckedInController',
      data: {requireLogin: true}
    })
    .state('attendance.assigned', {
      url: '/assigned',
      templateUrl: 'attendanceTabControllers/assigned.html',
      controller: 'AssignedController',
      data: {requireLogin: true}
    })

    .state('goAway', {
      url: '/goAway',
      templateUrl: '<h1>Go Away.</h1><h3>You don\'t even go here.</h3>'
    })

})

app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('cyan')
    .accentPalette('deep-orange');
  })

//authentication logic by Gabe Scholz on brewhouse.io
app.run(function($rootScope) {

  $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
    var requireLogin = toState.data.requireLogin;

    if (requireLogin && typeof $rootScope.currentUser === 'undefined') {
      event.preventDefault();

      loginModal()
        .then(function() {
          return $state.go(toState.name, toParams)
        })
        .catch(function() {
          return $state.go('goAway')
        })
    }
  });

});

app.service('loginModal', function($mdDialog, $rootScope) {
  function assignCurrentUser(user) {
    $rootScope.currentUser = user;
    return user;
  }

  return function() {
    return $mdDialog.show({
      templateUrl: 'modalTemplates/loginModalTemplate.html',
      Controller: 'LoginModalController'
    }).then(assignCurrentUser)
  };
});

app.factory('sitePickerGenerator', ['$mdBottomSheet', '$log', '$q', function($mdBottomSheet, $log, $q) {

  return function(carpoolSite, project) {
    var defer = $q.defer()

    $mdBottomSheet.show({
      templateUrl: 'modalTemplates/sitePickerSheetTemplate.html',
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
      templateUrl: 'modalTemplates/driverPicker.html',
      locals: { myActiveDrivers: activeDrivers },
      controller: ['$scope', 'myActiveDrivers', function($scope, myActiveDrivers) {

        var selectedDriver = ''
        $scope.activeDrivers = myActiveDrivers

        $scope.selectWithDriver = function(selectedDriver) {
          $mdBottomSheet.hide(selectedDriver)
        }

      }]
    })
  }
}])

app.factory('driverControlPanelGenerator', ['$q', '$log', '$mdDialog', '$mdToast', 'driverStatus', 'assignToDriver', function($q, $log, $mdDialog, $mdToast, driverStatus, assignToDriver) {

  return function(myDriver, $scope) {

    $log.log('ran driverControlPanelGenerator!')

    return $mdDialog.show({
      templateUrl: "modalTemplates/driverControlPanelTemplate.html",
      scope: $scope,
      preserveScope: true,
      parent: angular.element(document.body),
      locals: { driver: myDriver },
      controller: ['scope', 'driver', function(scope, driver) {
        $log.log('driver for control panel is' + $scope.persons[driver].firstName)

        $scope.driver = driver

        $scope.myPassengers = []
        if ($scope.drivers[driver]) {
          $log.log('passengers alledgedly is defined')
          $scope.drivers[driver].passengers.forEach(function(currentPassenger) {
            $scope.myPassengers.push(currentPassenger)
          })
          var emptySeats = $scope.drivers[driver].numSeatbelts - $scope.drivers[driver].passengers.length
        } else {
          $log.log('else ran')
          var emptySeats = $scope.persons[driver].numSeatbelts
        }

        for (var i=0; i < emptySeats; i++) {
          $scope.myPassengers.push('')
        }

        $scope.updateDriverStatus = function(personId) {
          // person.drierStatus controlled by switch in checkedIn and assigned directives
          //TODO add a warning about how toggling a driver off will remove their passengers
          $log.log('calling driverStatus on person ' + personId + 'with isDriver')
          var newStatus = $scope.persons[personId].driverStatus
          var driverPromise = driverStatus(personId, newStatus)
          driverPromise.then(function() {
            var driverName = $scope.persons[personId].firstName
            if (newStatus == 'isDriver') {
              $scope.drivers[personId] = {
                "numSeatbelts": $scope.persons[personId].numSeatbelts,
                "passengers": [],
                "carMake": $scope.persons[personId].carMake,
              }
              var message = "Added Driver: "
            } else {
              if ($scope.drivers.hasOwnProperty(personId)) {
                $scope.drivers[personId].passengers.forEach(function(currentPassenger) {
                  assignToDriver(currentPassenger, '')
                  $scope.persons[currentPassenger].assignedToDriver_id = null
                })
                delete $scope.drivers[personId]
              }
              var message = "Removed Driver: "
            }
            $scope.closeDialog()
            $mdToast.showSimple(message + driverName)
          })
        }

        $scope.removePassenger = function(passengerId) {
          assignToDriver(passengerId, '')
          $scope.persons[passengerId].assignedToDriver_id = null
          var index = $scope.drivers[$scope.driver].passengers.indexOf(passengerId)
          $scope.drivers[$scope.driver].passengers.splice(index, 1)
          $scope.myPassengers.splice(index, 1)
        }


        $scope.closeDialog = function() {
          $mdDialog.hide()
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

app.controller('IndexController', ['$scope', '$http', '$mdSidenav', '$log', '$q', '$mdMedia', 'sitePickerGenerator', 'getActiveSites', function($scope, $http, $mdSidenav, $log, $q, $mdMedia, sitePickerGenerator, getActiveSites) {

  $scope.screenIsXsmall = $mdMedia('xs')
  $scope.screenIsSmall = $mdMedia('sm')

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
  $scope.drivers = {}
  $scope.projectSites = {}
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
      $scope.projectSites[id] = activeSites[id]
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
        //set up drivers obj
        if (currentPerson["driverStatus"] == 'isDriver') {
          $scope.drivers[myId] = {
            "numSeatbelts": currentPerson.numSeatbelts,
            "passengers": [],
            "carMake": currentPerson.carMake,
          }
        } else if (currentPerson['assignedToDriver_id'] != 0 && currentPerson['assignedToDriver_id'] != null) {
          $log.log('assigned one passenger!')
          $scope.drivers[currentPerson["assignedToDriver_id"]].passengers.push(myId)
        }

        $scope.persons[myId] = currentPerson;
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

app.controller('LoginModalController', ['$scope', '$mdDialog', function($scope, $mdDialog) {
  $scope.cancelDialog = function() {
    $mdDialog.cancel()
  }

  $scope.submit = function(email, password) {
    
  }
}])

app.controller('AttendanceController', ['$scope', '$state', function($scope, $state) {
 $scope.gotoTab = function(destinationTab) {
   $state.go('attendance.'+destinationTab)
 }
}])

app.controller('RegisteredController', ['$scope', '$log', '$q', 'sitePickerGenerator', 'updateCheckedIn', function($scope, $log, $q, sitePickerGenerator, updateCheckedIn) {

    $scope.testAttenCtrlAccess = "I can access RegisteredController!"

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

   app.controller('CheckedInController', ['$scope', '$log', '$q', '$mdToast', '$location', '$anchorScroll', 'sitePickerGenerator', 'updateCheckedIn', 'driverStatus', 'driverPickerGenerator', 'assignToDriver', 'driverControlPanelGenerator', function($scope, $log, $q, $mdToast, $location, $anchorScroll, sitePickerGenerator, updateCheckedIn, driverStatus, driverPickerGenerator, assignToDriver, driverControlPanelGenerator) {

     //for anchor buttons
     $scope.goToSectionHeader = function(sectionId) {
       $log.log('running goToSectionHeader for section ' + sectionId)
       var id = sectionId + "Header"
       $location.hash(id)
       $anchorScroll()
     }

     $scope.numCheckedIn = {
       "all" : $scope.projectsWithPersons['all'].length,
       "paint" : $scope.projectsWithPersons['paint'].length,
       "plant" : $scope.projectsWithPersons['plant'].length,
       "play" : $scope.projectsWithPersons['play'].length,
     }

     //watch the number of elements in the checked-in-persons arrays and update accordingly
     $scope.$watch(
       function() {
         return $scope.projectsWithPersons['all'].length
       },
       function(newValue, oldValue) {
         $scope.numCheckedIn['all'] = newValue
       }
     )

     $scope.$watch(
       function() {
         return $scope.projectsWithPersons['paint'].length
       },
       function(newValue, oldValue) {
         $scope.numCheckedIn['paint'] = newValue
       }
     )

     $scope.$watch(
       function() {
         return $scope.projectsWithPersons['plant'].length
       },
       function(newValue, oldValue) {
         $scope.numCheckedIn['plant'] = newValue
       }
     )

     $scope.$watch(
       function() {
         return $scope.projectsWithPersons['play'].length
       },
       function(newValue, oldValue) {
         $scope.numCheckedIn['play'] = newValue
       }
     )

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
     $scope.updateDriverStatus = function(personId) {
       // person.drierStatus controlled by switch in checkedIn and assigned directives
       //TODO add a warning about how toggling a driver off will remove their passengers
       $log.log('calling driverStatus on person ' + personId + 'with isDriver')
       var newStatus = $scope.persons[personId].driverStatus
       var driverPromise = driverStatus(personId, newStatus)
       driverPromise.then(function() {
         var driverName = $scope.persons[personId].firstName
         if (newStatus == 'isDriver') {
           $scope.drivers[personId] = {
             "numSeatbelts": $scope.persons[personId].numSeatbelts,
             "passengers": [],
             "carMake": $scope.persons[personId].carMake,
           }
           var message = "Added Driver: "
         } else {
           if ($scope.drivers.hasOwnProperty(personId)) {
             $scope.drivers[personId].passengers.forEach(function(currentPassenger) {
               assignToDriver(currentPassenger, '')
               $scope.persons[currentPassenger].assignedToDriver_id = null
             })
             delete $scope.drivers[personId]
           }
           var message = "Removed Driver: "
         }
         $mdToast.showSimple(message + driverName)
       })
     }

     $scope.assignDriver = function(personId) {
       var activeDrivers = new Array()
       for (var id in $scope.persons) {
         if ($scope.persons[id].hasOwnProperty("driverStatus")) {
           if ($scope.persons[id].driverStatus == "isDriver") {
             var projectSite = ($scope.persons[id].assignedToSite_id != null) ? $scope.persons[id].assignedToSite_id : null
             $log.log('this driver is assigned to site ' + projectSite)
             var projectSiteName = ($scope.projectSites[projectSite] != null) ? $scope.projectSites[projectSite].name : ''
             activeDrivers.push({"id":id, "name":$scope.persons[id].firstName + ' ' + $scope.persons[id].lastName, "project":$scope.persons[id].assignedToProject, "site":projectSiteName})
           }
         }
       }

       var driverPromise = driverPickerGenerator(activeDrivers)
       driverPromise.then(function(selectedDriver) {
         if (selectedDriver == '') { //save deleting after server promise returns
           var prevDriver = $scope.persons[personId].assignedToDriver_id
         }

         //in case unassign is called on already-unassigned person
         if (selectedDriver == '' && (prevDriver == '' || prevDriver == null || prevDriver == 0)) {
           return
         }

         $scope.persons[personId].assignedToDriver_id = selectedDriver
         $log.log('about to call assignToDriver on person ' + personId + ' to driver ' + selectedDriver)
         var assignDriverPromise = assignToDriver(personId, selectedDriver)
         assignDriverPromise.then(function mySuccess() {
           var personName = $scope.persons[personId].firstName

           if ($scope.drivers[selectedDriver]) {
             var driverName = $scope.persons[selectedDriver].firstName
             $scope.drivers[selectedDriver].passengers.push(personId)
             $mdToast.show($mdToast.simple().textContent('Assigned ' + personName + ' to driver ' + driverName))
           } else if (prevDriver != '') {
             var driverName = $scope.persons[prevDriver].firstName
             var passengerIndex = $scope.drivers[prevDriver].passengers.indexOf(personId)
             $scope.drivers[prevDriver].passengers.splice(passengerIndex, 1)
             $mdToast.show($mdToast.simple().textContent('Removed ' + personName + ' from ' + driverName + '\'s car'))
           }
         })
       })
     }

     $scope.driverControlPanel = function(driver) {driverControlPanelGenerator(driver, $scope)}
   }])

app.controller('AssignedController', ['$scope', '$log', '$q', '$mdToast', 'sitePickerGenerator', 'updateCheckedIn', 'driverStatus', 'driverPickerGenerator', 'assignToDriver', 'driverControlPanelGenerator', function($scope, $log, $q, $mdToast, sitePickerGenerator, updateCheckedIn, driverStatus, driverPickerGenerator, assignToDriver, driverControlPanelGenerator) {

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

       //--- Driver business
       $scope.updateDriverStatus = function(personId) {
         // person.drierStatus controlled by switch in checkedIn and assigned directives
         //TODO add a warning about how toggling a driver off will remove their passengers
         $log.log('calling driverStatus on person ' + personId + 'with isDriver')
         var newStatus = $scope.persons[personId].driverStatus
         var driverPromise = driverStatus(personId, newStatus)
         driverPromise.then(function() {
           var driverName = $scope.persons[personId].firstName
           if (newStatus == 'isDriver') {
             $scope.drivers[personId] = {
               "numSeatbelts": $scope.persons[personId].numSeatbelts,
               "passengers": [],
               "carMake": $scope.persons[personId].carMake,
             }
             var message = "Added Driver: "
           } else {
             if ($scope.drivers.hasOwnProperty(personId)) {
               $scope.drivers[personId].passengers.forEach(function(currentPassenger) {
                 assignToDriver(currentPassenger, '')
                 $scope.persons[currentPassenger].assignedToDriver_id = null
               })
               delete $scope.drivers[personId]
             }
             var message = "Removed Driver: "
           }
           $mdToast.showSimple(message + driverName)
         })
       }

       $scope.assignDriver = function(personId) {
         var activeDrivers = new Array()
         for (var id in $scope.persons) {
           if ($scope.persons[id].hasOwnProperty("driverStatus")) {
             if ($scope.persons[id].driverStatus == "isDriver") {
               var projectSite = ($scope.persons[id].assignedToSite_id != null) ? $scope.persons[id].assignedToSite_id : null
               $log.log('this driver is assigned to site ' + projectSite)
               var projectSiteName = ($scope.projectSites[projectSite] != null) ? $scope.projectSites[projectSite].name : ''
               activeDrivers.push({"id":id, "name":$scope.persons[id].firstName + ' ' + $scope.persons[id].lastName, "project":$scope.persons[id].assignedToProject, "site":projectSiteName})
             }
           }
         }

         var driverPromise = driverPickerGenerator(activeDrivers)
         driverPromise.then(function(selectedDriver) {
           if (selectedDriver == '') { //save deleting after server promise returns
             var prevDriver = $scope.persons[personId].assignedToDriver_id
           }

           //in case unassign is called on already-unassigned person
           if (selectedDriver == '' && (prevDriver == '' || prevDriver == null || prevDriver == 0)) {
             return
           }

           $scope.persons[personId].assignedToDriver_id = selectedDriver
           $log.log('about to call assignToDriver on person ' + personId + ' to driver ' + selectedDriver)
           var assignDriverPromise = assignToDriver(personId, selectedDriver)
           assignDriverPromise.then(function mySuccess() {
             var personName = $scope.persons[personId].firstName

             if ($scope.drivers[selectedDriver]) {
               var driverName = $scope.persons[selectedDriver].firstName
               $scope.drivers[selectedDriver].passengers.push(personId)
               $mdToast.show($mdToast.simple().textContent('Assigned ' + personName + ' to driver ' + driverName))
             } else if (prevDriver != '') {
               var driverName = $scope.persons[prevDriver].firstName
               var passengerIndex = $scope.drivers[prevDriver].passengers.indexOf(personId)
               $scope.drivers[prevDriver].passengers.splice(passengerIndex, 1)
               $mdToast.show($mdToast.simple().textContent('Removed ' + personName + ' from ' + driverName + '\'s car'))
             }
           })
         })
       }

       $scope.driverControlPanel = function(driver) {driverControlPanelGenerator(driver, $scope)}
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

// filter by jeffjohnson9046 on GitHub
app.filter('titlecase', function() {
    return function (input) {
        var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;

        input = input.toLowerCase();
        return input.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, function(match, index, title) {
            if (index > 0 && index + match.length !== title.length &&
                match.search(smallWords) > -1 && title.charAt(index - 2) !== ":" &&
                (title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-') &&
                title.charAt(index - 1).search(/[^\s-]/) < 0) {
                return match.toLowerCase();
            }

            if (match.substr(1).search(/[A-Z]|\../) > -1) {
                return match;
            }

            return match.charAt(0).toUpperCase() + match.substr(1);
        });
    }
});
