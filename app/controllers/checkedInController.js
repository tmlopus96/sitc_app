/*
 * CheckedInController
 * Controls the CheckedIn app tab
 */
app.controller('CheckedInController', ['$scope', '$rootScope', '$state', '$log', '$q', '$mdToast', '$mdDialog', '$location', '$anchorScroll', 'sitePickerGenerator', 'updateCheckedIn', 'driverStatus', 'driverPickerGenerator', 'assignToDriver', 'driverControlPanelGenerator', 'getRegistered', 'getTempRegistrations', 'assignTeerCarDriver', 'updateActiveTeerCar', 'updateVan', 'editRegInfo', 'getActiveSites', 'deleteFromCheckedIn', function($scope, $rootScope, $state, $log, $q, $mdToast, $mdDialog, $location, $anchorScroll, sitePickerGenerator, updateCheckedIn, driverStatus, driverPickerGenerator, assignToDriver, driverControlPanelGenerator, getRegistered, getTempRegistrations, assignTeerCarDriver, updateActiveTeerCar, updateVan, editRegInfo, getActiveSites, deleteFromCheckedIn) {

  function hideSpeedDialButtons(){
      var speedDialButton_first = angular.element(document.querySelectorAll('#speedDialActionButton_first')).parent()
      var speedDialButton_second = angular.element(document.querySelectorAll('#speedDialActionButton_second')).parent()
      var speedDialButton_third = angular.element(document.querySelectorAll('#speedDialActionButton_third')).parent()

      speedDialButton_first.css({'transform':'translate(52px)', 'z-index':'-21'})
      speedDialButton_second.css({'transform':'translate(104px)', 'z-index':'-22'})
      speedDialButton_third.css({'transform':'translate(156px)', 'z-index':'-23'})
    }

  $scope.$on('$stateChangeSuccess', function(event, toState) {
    // $log.log('stateChangeSuccess func ran! with toState ' + toState.name)

    if (toState.name == 'attendance.registered' || toState.name == 'attendance.checkedIn' || toState.name == 'attendance.assigned') {
      setTimeout(function(){hideSpeedDialButtons()}, 0)
      }
    })

 $scope.$on('$stateChangeSuccess', function(event, toState, fromState) {
   if ($state.current.data.personToCheckInFromOtherSite) {
     var personId = $state.current.data.personToCheckInFromOtherSite

     $log.log("personToCheckInFromOtherSite: " + personId)

     var updatePromise = updateCheckedIn(personId, {'carpoolSite': $scope.carpoolSite})

     var registeredDefer = $q.defer()
     if (personId > 0) { // personToCheckIn is from other carpoolSite
       updatePromise.then(function () {
         getRegistered(null, personId).then(function (response) {registeredDefer.resolve(response)})
       })
     }
     else {
       updatePromise.then(function () { // personToCheckIn is tempRegistration, so they have a negative person_id
         getTempRegistrations(null, personId).then(function (response) {registeredDefer.resolve(response)})
       })
     }
     registeredDefer.promise.then(function (personInfo) {
        //  $log.log("personInfo from updateCheckedIn: " + dump(personInfo, 'none'))
         // personInfo will be array of only one person
         $scope.persons[personId] = personInfo[0]
         $scope.projectsWithPersons['all'].push(personId)
         $scope.persons[personId].assignedToProject = 'all'

         $mdToast.showSimple(`Checked in ${personInfo[0].firstName} ${personInfo[0].lastName}.`)
       })
   }
 })

 var checkActivePaintSitesPromise = getActiveSites($rootScope.myCarpoolSite, 'paint')
 checkActivePaintSitesPromise.then(function(activeSites) {
   $log.log("checkActivePaintSites: " + dump(activeSites, 'none'))
   if (Object.keys(activeSites).length > 0) {
     $scope.activePaintSites = true
   }
   else {
     $scope.activePaintSites = false
   }
 })

 // check if sites are active for each project so that we can conditionally disable the buttons to check people into projects with no active sites
 var checkActivePlantSitesPromise = getActiveSites($rootScope.myCarpoolSite, 'plant')
 checkActivePlantSitesPromise.then(function(activeSites) {
   if (Object.keys(activeSites).length > 0) {
     $log.log("checkActivePlantSites: " + dump(activeSites, 'none'))
     $scope.activePlantSites = true
   }
   else {
     $scope.activePlantSites = false
   }
 })

 var checkActivePlaySitesPromise = getActiveSites($rootScope.myCarpoolSite, 'play')
 checkActivePlaySitesPromise.then(function(activeSites) {
   $log.log("checkActivePlaySites: " + dump(activeSites, 'none'))
   if (Object.keys(activeSites).length > 0) {
     $scope.activePlaySites = true
   }
   else {
     $scope.activePlaySites = false
   }
 })

  // for anchor buttons
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

  // -- Watch the number of elements in the checked-in-persons arrays and update accordingly
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

  /*
   * checkInPerson
   * Updates $scope arrays to reflect changes to persons's checkin status parameters, then updates them on the server.
   * Pre: personId is a valid person; selectedProject is a valid project, and arrayLoc indicates which $scope array the person is currently located in
   * Post: $scope arrays and server have been updated to reflect changes to person's checkin status parameters. corresponding view updates are automatically triggered by changes to $scope arrays (i.e. person is moved to the correct list in the correct tab).
   */
  $scope.checkOutPerson = function(personId) {

    // Appending dialog to document.body to cover sidenav in docs app
    var confirm = $mdDialog.confirm()
          .title('Confirm check-out')
          .textContent(`Do you want to check ${$scope.persons[personId].firstName} ${$scope.persons[personId].lastName} out?`)
          .ariaLabel('Confirm checkout')
          .ok('Yes')
          .cancel('No');

    var confirmDialogPromise = $mdDialog.show(confirm)

    confirmDialogPromise.then(function() {
      deleteFromCheckedIn(personId).then(function() {
        var index = $scope.checkedInPersons.indexOf(personId)
        $scope.checkedInPersons.splice(index, 1)
        $scope.registeredPersons.push(personId)
        $scope.isCheckedIn = 1
      }, function() {
        $mdToast.showSimple(`Oops, something went wrong. Try checking out ${$scope.persons[personId].firstName} again.`)
      })
    }, function() {

    });


  }

  /*
   * updateDriverStatus(personId)
   * Updates a driver's status when it change
   * Pre: - personId is a person who is currently a driver
          - If the driver has passengers, warn the user that this action will cause them to be unassigned and without a driver
   * Post: - the driver's driverStatus is set to null
           - If the driver has passengers, their assignedToDriver_id is set to null
           - The driver is deleted from $scope.drivers
   */
  $scope.updateDriverStatus = function(personId) {

    // TODO add a warning about how toggling a driver off will remove their passengers (added Trello card)
    $log.log('calling driverStatus on person ' + personId + 'with isDriver')

    if ($scope.persons[personId].isDriver == 1 || $scope.persons[personId].isDriver == '1') {
      var newStatus = 0;
      $scope.persons[personId].isDriver = newStatus;
    } else {
      var newStatus = 1;
      $scope.persons[personId].isDriver = newStatus;
    }

    // update status on server, then update $scope arrays
    var driverPromise = driverStatus(personId, newStatus)
    driverPromise.then(function() {
      var driverName = $scope.persons[personId].firstName
      if (newStatus == 1) {
        $scope.drivers[personId] = {
          "numSeatbelts": $scope.persons[personId].numSeatbelts,
          "passengers": [],
          "carMake": $scope.persons[personId].carMake
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

$scope.regInfoEdit = function (personId) {
  editRegInfo(personId, $scope).then(function resolved () {
    $log.log("editRegInfo resolved")
  }, function cancelled () {
    $log.log("editRegInfo rejected")
  })
}

}]);
