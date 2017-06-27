/*
 * IndexController
 * Controller for the highest-level view of the app
 */
app.controller('IndexController', ['$scope', '$rootScope', '$http', '$mdToast', '$mdSidenav', '$log', '$q', '$mdMedia', '$state', 'loginModal', 'logout', 'sitePickerGenerator', 'getActiveSites', 'changePasswordModal', 'getCarpoolSites', 'getTempRegistrations', 'getTeerCars', 'getVans', function($scope, $rootScope, $http, $mdToast, $mdSidenav, $log, $q, $mdMedia, $state, loginModal, logout, sitePickerGenerator, getActiveSites, changePasswordModal, getCarpoolSites, getTempRegistrations, getTeerCars, getVans) {

  $log.log("Hello, World! IndexController is running!")

  // set in AttendanceController, but accessed from here
  $rootScope.currentState

  //--- Controller initialization logic
  $scope.screenIsXsmall = $mdMedia('xs')
  $scope.screenIsSmall = $mdMedia('sm')

  $scope.personsContainersConfig = function() {

    // containers for persons
    $scope.persons = {};
    $scope.drivers = {}
    $scope.projectSites = {}
    // TODO have active projects and sites dynamically load from logistics report
    $scope.registeredPersons = [];
    $scope.projectsWithPersons = {all: [], paint: [], plant: [], play: []}
    $scope.projectSitesWithPersons = {}

    var activeSitesPromise = getActiveSites($rootScope.myCarpoolSite, "all")
    activeSitesPromise.then(function mySuccess(activeSites) {
      var defer = $q.defer()
      // $log.log("activeSites: " + dump(activeSites, 'none'))
      // Put each site into projectSitesWithPersons obj
      Object.keys(activeSites).forEach(function(id, index, allIds) {
        $scope.projectSitesWithPersons[id] = new Array()
        $scope.projectSites[id] = activeSites[id]
        $log.log('forEach running')
        if (index === allIds.length-1) { //if last iteration, resolve promise
          defer.resolve()
          // $log.log('last iteration; returned promise!')
        }
      })
      return defer.promise
    }).then(function () {
      // $log.log("myCarpoolSite before getTeerCars: " + $scope.carpoolSite)
      return getTeerCars($rootScope.myCarpoolSite).then(function (teerCars) {
        $scope.teerCars = teerCars
        // $log.log("Teer Cars: " + dump($scope.teerCars, 'none'))
      })
    }).then(function () {
      return getVans($rootScope.myCarpoolSite).then(function (vans) {
        $scope.vans = vans
        // $log.log("Vans: " + dump(vans, 'none'))
      })
    }).then(function () {
      return getTempRegistrations($rootScope.myCarpoolSite)
    }).then(function (response) {
      // $log.log("TempRegistrations: " + dump(response, 'none'))
      $scope.registrationsResponse = response
    }).then(function() {
      // after sites in place, then load ppl
      // $log.log("myCarpoolSite: " + $rootScope.myCarpoolSite)
      $http({
        method: "GET",
        url: "app/appServer/getRegistered.php",
        params: {carpoolSite: $rootScope.myCarpoolSite}
      }).then(function mySuccess(response) {
        var defer = $q.defer()

        // $log.log('getRegistered response: ' + dump(response, 'none'))
        $scope.registrationsResponse = $scope.registrationsResponse.concat(response.data)

        // $log.log("$scope.registrationsResponse: " + dump($scope.registrationsResponse, 'none'))
        $scope.registrationsResponse.forEach(function(currentPerson, index) {
          if (currentPerson['preferredProject']) {
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
          }
          var myId = currentPerson["person_id"];
          // set up drivers obj
          if (currentPerson["driverStatus"] == 'isDriver' || currentPerson["driverStatus"] == 'isVanDriver' || currentPerson["driverStatus"] == 'isTeerCarDriver') {
            if ($scope.drivers[myId]) {
              $scope.drivers[myId].numSeatbelts = parseInt(currentPerson.numSeatbeltsToday)
              $scope.drivers[myId].carMake = currentPerson.carMake
            } else {
              $scope.drivers[myId] = {
                "numSeatbelts": parseInt(currentPerson.numSeatbeltsToday),
                "passengers": [],
                "carMake": currentPerson.carMake,
              }
            }
          } else if (currentPerson['assignedToDriver_id'] != 0 && currentPerson['assignedToDriver_id'] != null) {
            if ($scope.drivers[currentPerson["assignedToDriver_id"]]) {
              $scope.drivers[currentPerson["assignedToDriver_id"]].passengers.push(myId)
            } else {
              // handles case in which a passenger is loaded before their driver and thus their driver is not in the $scope.drivers array yet
              $scope.drivers[currentPerson["assignedToDriver_id"]] = {"passengers": []}
              $scope.drivers[currentPerson["assignedToDriver_id"]].passengers.push(myId)
            }
          }

          // push person to proper array(s) according to their current assignment status
          $scope.persons[myId] = currentPerson;
          if ($scope.persons[myId].isCheckedIn != 1 && $scope.persons[myId].isCheckedIn != '1') {
            $scope.registeredPersons.push(myId)
          }
          else if ($scope.persons[myId].assignedToSite_id != null && $scope.persons[myId].assignedToSite_id != '') {
            $scope.projectSitesWithPersons[$scope.persons[myId].assignedToSite_id].push(myId)
          }
          else if ($scope.persons[myId].assignedToProject != null && $scope.persons[myId].assignedToProject != '') {
            $scope.projectsWithPersons[$scope.persons[myId].assignedToProject].push(myId)
          }
          else {
            $scope.persons[myId].assignedToProject = 'all'
            $scope.projectsWithPersons['all'].push(myId)
          }

          // if last iteration of forEach, resolve promise
          if (index == $scope.registrationsResponse.length - 1) {
            $log.log("Last iteration of $scope.persons construction")
            defer.resolve()
          }
        });
        return defer.promise
      }).then(function setVanDriverNumSeatbelts() {
        // $log.log("setVanDriverNumSeatbelts running!")
        angular.forEach($scope.vans, function(vanInfo, vanId) {
          if (vanInfo.driver_person_id && $scope.persons[vanInfo.driver_person_id]) {
            $scope.persons[vanInfo.driver_person_id].numSeatbeltsToday = vanInfo.numSeatbelts
            if ($scope.drivers[vanInfo.driver_person_id]) {
              $scope.drivers[vanInfo.driver_person_id].numSeatbelts = vanInfo.numSeatbelts
            }

            // if this person has not already been added to $scope.drivers, add them
            if (!$scope.drivers[vanInfo.driver_person_id]) {
              $scope.drivers[vanInfo.driver_person_id] = {
                numSeatbelts: parseInt(vanInfo.numSeatbelts),
                passengers: [],
                carMake: null
              }
            }
            $scope.persons[vanInfo.driver_person_id].driverStatus = 'isVanDriver'
          }
        })
      })
    })
  }

  // Initialize $rootScope.currentUser object if there is a local storage entry with non-expired login info
  if (localStorage.getItem("user")) {
    var storedUser = JSON.parse(localStorage.getItem("user"))
    var expirationDate = new Date(storedUser.expirationDate)
    var now = new Date()
    if (expirationDate.getTime() > now.getTime()) {
      $rootScope.currentUser = storedUser
      $rootScope.myCarpoolSite = storedUser.site
      $scope.carpoolSite = storedUser.site
      $log.log('lodaded carpool site ' + $scope.myCarpoolSite + ' from storedUser')
      $scope.personsContainersConfig()
    }
  }

  getCarpoolSites().then(function (sites) {
      $scope.carpoolSites = sites
  })
  //---end ctrler init logic

  $scope.$on('congifPersonsContainers', function() {
    $scope.carpoolSite = $rootScope.myCarpoolSite
    $scope.personsContainersConfig()
    $state.go('attendance.registered')
    $rootScope.currentState = 'attendance.registered'
  })

  // conditionally determine whether a clear (X) icon button should be shown in the toolbar
  $scope.$on('$stateChangeSuccess', function(event, toState) {
    $log.log("on(stateChangeSuccess) running!")
    $scope.showNotesProgressBar = false

    if (toState.name == 'notes' || toState.name == 'bugReports' || toState.name == 'attendance.getFromOtherCarpoolSite' || toState.name == 'addNewVolunteer' || toState.name == 'attendance.logistics') {
      $scope.showClearButton = true
    }
    else {
      $scope.showClearButton = false
    }
  })

  //-- Functions for controls to bind to
  $scope.login = function() {
    loginModal()
  }

  $scope.logout = function() {
    logout().then(function() {
      $scope.toggleLeftMenu()
      loginModal()
    })
  }

  $scope.changePassword = function() {
    changePasswordModal($rootScope.currentUser.username)
  }

  $scope.goToLogistics = function () {
    $state.go('attendance.logistics')
    $mdSidenav('left').close()
  }

  $scope.goToGetFromOtherCarpool = function () {
    $state.go('attendance.getFromOtherCarpoolSite')
    $mdSidenav('left').close()
  }

  $scope.goToAddNewTeer = function () {
    $state.go('attendance.addNewVolunteer')
    $mdSidenav('left').close()
  }

  $scope.goToNotes = function() {
    $state.get('notes').data['originState'] = $state.current.name
    $state.go('notes')
    $mdSidenav('left').close()
  }

  $scope.goToBugReports = function() {
    $state.get('bugReports').data['originState'] = $state.current.name
    $state.go('bugReports')
    $mdSidenav('left').close()
  }

  $scope.returnToState = function () {
    var currentState = $state.current.name
    if ($state.get(currentState).data.originState) {
      var destination = $state.get(currentState).data.originState
    }
    else {
      var destination = 'attendance.registered'
    }
    $state.go(destination)
    $mdSidenav('left').close()
  }

  $scope.reconfigPersonsContainers = function() {
    $rootScope.myCarpoolSite = $scope.carpoolSite
    $scope.personsContainersConfig()
    $state.go('attendance.registered')
    $rootScope.currentState = 'attendance.registered'
    $mdToast.showSimple('Loaded carpool site ' + $scope.carpoolSites[$scope.carpoolSite].name)
    $mdSidenav('left').close()
  }

   $scope.toggleLeftMenu = function () {
     $mdSidenav('left').toggle();
   }

}])
