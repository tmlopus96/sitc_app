/*
 * CheckedInController
 * Controls the CheckedIn app tab
 */
app.controller('CheckedInController', ['$scope', '$state', '$log', '$q', '$mdToast', '$mdDialog', '$location', '$anchorScroll', 'sitePickerGenerator', 'updateCheckedIn', 'driverStatus', 'driverPickerGenerator', 'assignToDriver', 'driverControlPanelGenerator', 'getRegistered', 'getTempRegistrations', 'assignTeerCarDriver', 'updateActiveTeerCar', 'updateVan', 'editRegInfo', function($scope, $state, $log, $q, $mdToast, $mdDialog, $location, $anchorScroll, sitePickerGenerator, updateCheckedIn, driverStatus, driverPickerGenerator, assignToDriver, driverControlPanelGenerator, getRegistered, getTempRegistrations, assignTeerCarDriver, updateActiveTeerCar, updateVan, editRegInfo) {

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

     $log.log("personToCheckInFromOtherSite: " + $state.current.data.personToCheckInFromOtherSite)

     var updatePromise = updateCheckedIn(personId, {'carpoolSite': $scope.carpoolSite})

     var registeredDefer = $q.defer()
     if (personId > 0) {
       updatePromise.then(function () {
         getRegistered(null, personId).then(function (response) {registeredDefer.resolve(response)})
       })
     }
     else {
       updatePromise.then(function () {
         getTempRegistrations(null, personId).then(function (response) {registeredDefer.resolve(response)})
       })
     }
     registeredDefer.promise.then(function (personInfo) {
         $log.log("personInfo from updateCheckedIn: " + dump(personInfo, 'none'))
         // personInfo will be array of only one person
         $scope.persons[personId] = personInfo[0]
         $scope.projectsWithPersons['all'].push(personId)
         $scope.persons[personId].assignedToProject = 'all'

         $mdToast.showSimple(`Checked in ${personInfo[0].firstName} ${personInfo[0].lastName}.`)
       })
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
  $scope.checkInPerson = function(personId, selectedProject, arrayLoc, assignLaterOption = true) {

    function updateArrays() {
      var deferred = $q.defer();
      var valuesToUpdate = {"id":personId, "carpoolSite":$scope.carpoolSite, "project":selectedProject}

      var promise = sitePickerGenerator($scope.carpoolSite, selectedProject, $scope.persons, $scope.drivers, assignLaterOption)
      promise.then(function(selectedSite) {
        if (selectedSite == 'allSites') {
          $log.log("selectedSite" + selectedSite)
          $scope.projectsWithPersons[selectedProject].push(personId)
          $scope.persons[personId].assignedToProject = selectedProject
          deferred.resolve(valuesToUpdate)
        } else {
          $log.log('**selectedSite is' + selectedSite)
          $scope.projectSitesWithPersons[selectedSite].push(personId)
          $scope.persons[personId].assignedToProject = selectedProject
          $scope.persons[personId].assignedToSite_id = selectedSite
          valuesToUpdate['project'] = selectedProject
          valuesToUpdate['site'] = selectedSite

          // if this person is a driver, then apply this assignment to all of their passengers
          if ($scope.drivers[personId]) {
            angular.forEach($scope.drivers[personId].passengers, function (passengerId) {
              updateCheckedIn(passengerId, { 'site': selectedSite, 'project': selectedProject}).then(function success() {
                if ($scope.projectsWithPersons[$scope.persons[passengerId].assignedToProject]) {
                  var index = $scope.projectsWithPersons[$scope.persons[passengerId].assignedToProject].indexOf(passengerId)
                  $scope.projectsWithPersons[$scope.persons[passengerId].assignedToProject].splice(index, 1)
                }

                $scope.persons[passengerId].assignedToProject = selectedProject
                $scope.persons[passengerId].assignedToSite_id = selectedSite
                if ($scope.projectSitesWithPersons[selectedSite].indexOf(passengerId) < 0) {
                  $scope.projectSitesWithPersons[selectedSite].push(passengerId)
                }
              }, function serverFail() {
                console.error('Failed to update CheckedIn values for person_id:' + passengerId)
              })
            })
          }

          deferred.resolve(valuesToUpdate)
        }
      })
      return deferred.promise
    }

    var promise = updateArrays();
    promise.then(function(valuesToUpdate) {
      $scope.persons[personId].isCheckedIn = 1
      $log.log("site to update: " + valuesToUpdate["site"])
      updateCheckedIn(personId, valuesToUpdate).then(function(response) {$log.log("updateCheckedIn response: " + dump(response, 'none')) })
      var personIndex = $scope.projectsWithPersons[arrayLoc].indexOf(personId)
      $scope.projectsWithPersons[arrayLoc].splice(personIndex, 1)
    })
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
    // person.drierStatus controlled by switch in checkedIn and assigned directives
    // TODO add a warning about how toggling a driver off will remove their passengers (added Trello card)
    $log.log('calling driverStatus on person ' + personId + 'with isDriver')
    // this is already the new status because it has been set by an md-switch bound to driverStatus
    var newStatus = $scope.persons[personId].driverStatus

    // update status on server, then update $scope arrays
    var driverPromise = driverStatus(personId, newStatus)
    driverPromise.then(function() {
      var driverName = $scope.persons[personId].firstName
      if (newStatus == 'isDriver') {
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

  $scope.assignDriver = function (personId) {
    // construct an array of active drivers (whose cars are not already full) to pass to driverPickerGenerator (because it cannot access the CheckedInController's scope)
    if ($scope.persons[personId].assignedToDriver_id !== null && $scope.persons[personId].assignedToDriver_id !== '') {
      var currentDriver = $scope.persons[personId].assignedToDriver_id
    }
    else {
      var currentDriver = null
    }

    var activeDrivers = new Array()
    for (var id in $scope.persons) {
      if ($scope.persons[id].hasOwnProperty("driverStatus")) {
        if ($scope.persons[id].driverStatus == "isDriver" || $scope.persons[id].driverStatus == "isVanDriver" || $scope.persons[id].driverStatus == "isTeerCarDriver") {

          // -- if this driver's car is full, don't add them to the array
          // only run this check if their numSeatbelts is set; for some volunteer drivers, it is not set, so we have no valid data to check against
          if (parseInt($scope.drivers[id].numSeatbelts) > 0) {
            if (parseInt($scope.drivers[id].passengers.length) >= $scope.drivers[id].numSeatbelts) {
              continue
            }
          }

          // if the person is already assigned to this driver, don't give them the option of re-assigning them to the same driver
          if (id == currentDriver) {
            continue
          }

          var projectSite = ($scope.persons[id].assignedToSite_id != null) ? $scope.persons[id].assignedToSite_id : null
          $log.log('this driver is assigned to site ' + projectSite)
          var projectSiteName = ($scope.projectSites[projectSite] != null) ? $scope.projectSites[projectSite].name : ''
          activeDrivers.push({"id":id, "name":$scope.persons[id].firstName + ' ' + $scope.persons[id].lastName, "project":$scope.persons[id].assignedToProject, "site":projectSiteName})
        }
      }
    }

    var driverPromise = driverPickerGenerator(personId, activeDrivers, $scope)
    driverPromise.then(function(selectedDriver) {

      // if selectedDriver=='', person is being unassigned, so save driver they are being unassigned from for toast message later
      if ($scope.persons[personId].assignedToDriver_id != '' && $scope.persons[personId].assignedToDriver_id != null) {
        var prevDriver = $scope.persons[personId].assignedToDriver_id
      }

      $scope.persons[personId].assignedToDriver_id = selectedDriver

      $log.log('about to call assignToDriver on person ' + personId + ' to driver ' + selectedDriver)

      if ($scope.persons[selectedDriver]) {
        if ($scope.persons[selectedDriver].assignedToSite_id != null && $scope.persons[selectedDriver].assignedToSite_id != '') {
          var siteToPass = $scope.persons[selectedDriver].assignedToSite_id
          var projectToPass = $scope.projectSites[$scope.persons[selectedDriver].assignedToSite_id].project
        }
        else {
          var siteToPass = 'NULL'
          var projectToPass = ($scope.persons[selectedDriver].assignedToProject) ? $scope.persons[selectedDriver].assignedToProject : 'NULL'
          $log.log("siteToPass: " + siteToPass + ", projectToPass: " + projectToPass)
        }
      }

      var assignDriverPromise = assignToDriver(personId, selectedDriver, siteToPass, projectToPass)
      assignDriverPromise.then(function mySuccess() {
        var personName = $scope.persons[personId].firstName

        // if this person was already assigned to a driver, splice them from that driver's passengers arr
        if (prevDriver && $scope.drivers[prevDriver]) {
          var passengerIndex = $scope.drivers[prevDriver].passengers.indexOf(personId)
          $scope.drivers[prevDriver].passengers.splice(passengerIndex, 1)
        }

        if ($scope.drivers[selectedDriver]) {
          // if this person is assigned to a site, splice them from its arr in projectSitesWithPersons
          if ($scope.persons[personId].assignedToSite_id && $scope.projectSitesWithPersons[$scope.persons[personId].assignedToSite_id]) {
            var index = $scope.projectSitesWithPersons[$scope.persons[personId].assignedToSite_id].indexOf(personId)
            $scope.projectSitesWithPersons[$scope.persons[personId].assignedToSite_id].splice(index, 1)
          }
          else if ($scope.persons[personId].assignedToProject && $scope.projectsWithPersons[$scope.persons[personId].assignedToProject]) {
            var index = $scope.projectsWithPersons[$scope.persons[personId].assignedToProject].indexOf(personId)
            $scope.projectsWithPersons[$scope.persons[personId].assignedToProject].splice(index, 1)
          }

          $scope.persons[personId].assignedToProject = $scope.persons[selectedDriver].assignedToProject
          $scope.persons[personId].assignedToSite_id = $scope.persons[selectedDriver].assignedToSite_id
          if ($scope.projectSitesWithPersons[$scope.persons[personId].assignedToSite_id]) {
            $scope.projectSitesWithPersons[$scope.persons[personId].assignedToSite_id].push(personId)
          }
          else if ($scope.projectsWithPersons[$scope.persons[personId].assignedToProject]) {
            $log.log("projectsWithPersons Before: " + dump($scope.projectsWithPersons[$scope.persons[personId].assignedToProject], 'none'))
            $scope.projectsWithPersons[$scope.persons[personId].assignedToProject].push(personId)
            $log.log("projectsWithPersons After: " + dump($scope.projectsWithPersons[$scope.persons[personId].assignedToProject], 'none'))
          }


          $scope.drivers[selectedDriver].passengers.push(personId)
          var toastMessage = `Assigned ${$scope.persons[personId].firstName} to driver ${$scope.persons[selectedDriver].firstName}`
        } else if (prevDriver != '') {
          var toastMessage = `Removed ${$scope.persons[personId].firstName} from ${$scope.persons[prevDriver].firstName}'s car`
        }
        $mdToast.show($mdToast.simple().textContent(toastMessage))
      })
    }, function noDriverSelected() {
      $log.log("The dialog was closed without a driver being selected")
    })
  }

  $scope.driverControlPanel = function(driver) {driverControlPanelGenerator(driver, $scope)}

  /*
   * removeTeerCarDriver(driver, teerCarId) - function in teerCarControlPanel()
   * Description
   * Pre: - driver is currently assigned to a teerCarId
   * Post: - if user opts to keep passengers with driver:
              - driver's driverStatus is set to 'isDriver'
           - if user opts to unassign passengers completely:
              - driver's driverStatus is set to null
              - for each passenger, assignedToDriver is set to null
              - driver is spliced from $scope.drivers
           - teerCar's driver_person_id is set to null
   */
  $scope.teerCarControlPanel = function(driver, teerCarId = null) {
    driverControlPanelGenerator(driver, $scope, teerCarId).then(function furtherActionRequired(action) {

      switch (action) {
        case 'removeDriver':
          removeTeerCarDriver(driver, teerCarId)
          break
      }

      function removeTeerCarDriver(driver, teerCarId) {
        var confirm = $mdDialog.confirm()
                .title(`What should we do with ${$scope.persons[driver].firstName}'s passengers?`)
                .textContent(`We can either keep them assigned as passengers to ${$scope.persons[driver].firstName}, or completely un-assign them and assign them to a new driver.`)
                .ok(`Keep them assigned to ${$scope.persons[driver].firstName}`)
                .cancel('Un-assign them')

        $mdDialog.show(confirm).then(function keep() {
          updateCheckedIn(driver, {'driverStatus': 'isDriver'}).then(function() {
            $scope.persons[driver].driverStatus = 'isDriver'
          })

        }, function unassign() {
          // set driverStatus to null on the server and the scope
          updateCheckedIn(driver, {'driverStatus': 'NULL'}).then(function() {
            $scope.persons[driver].driverStatus = null
          })

          // set passengers' assignedToDriver to null
          angular.forEach($scope.drivers[driver].passengers, function(passenger) {
            updateCheckedIn(passenger, {'assignedToDriver': 'NULL'}).then(function () {
              $scope.persons[passenger].assignedToDriver_id = null
            })
          })

          // delete driver from $scope.drivers
          delete $scope.drivers[driver]

        }).finally(function () {

          // set teerCar's driver to null
          updateActiveTeerCar(teerCarId, {'driver_person_id': 'NULL'}).then(function() {
            $scope.teerCars[teerCarId].driver_person_id = null
          })
        })
      }
    })
  }

  /*
   * vanControlPanel()
   * Calls driverControlPanelGenerator(), a modal dialog to manage several properties of a van driver assignment. The modal returns a promise. If the promise is resolved, the van's driver should be removed. Conditions for removing a driver follow:
   * Pre: - driver is currently assigned to a vanId
   * Post: - driver's driverStatus is set to null
           - for each passenger, assignedToDriver is set to null
           - driver is spliced from $scope.drivers
           - van's driver_person_id is set to null
   */
  $scope.vanControlPanel = function(driver, vanId = null) {
    driverControlPanelGenerator(driver, $scope, null, vanId).then(function removeVanDriver() {
      // driver status
      updateCheckedIn(driver, {'driverStatus': 'NULL', 'numSeatbelts': $scope.persons[driver].numSeatbelts}).then(function () {
        $scope.persons[driver].driverStatus = null
        $scope.persons[driver].numSeatbeltsToday = $scope.persons[driver].numSeatbelts
      })

      // set passengers' assignedToDriver to null
      if ($scope.drivers[driver].passengers) {
        angular.forEach($scope.drivers[driver].passengers, function(passenger) {
          updateCheckedIn(passenger, {'assignedToDriver':'NULL'}).then(function () {
            $scope.persons[passenger].assignedToDriver_id = null
          })
        })
      }

      // splice driver from $scope[drivers]
      delete $scope.drivers[driver]

      // set teerCar's driver to null
      updateVan(vanId, {'driver_person_id': 'NULL'}).then(function() {
        $scope.vans[vanId].driver_person_id = null
      })
    })
  }

  /*
   * assignTeerCarDriver
   * Calls for a modal dialog of available drivers, asks the user to select one, and runs the corresponding logic
   * Pre: - teerCarId is an active teerCar, assigned to this carpool site
          - the selected driver is checked in
          - the selected driver is a driver/has a car
          - the selected driver is not alredy a teerCar driver
          - warn user if:
              - the selectedDriver is a van driver
              - the selected driver is a passenger in someone else's car
              - the selected driver has fewer seatbelts than the teerCar is slated for
   * Post: - the driver is checked in
           - the driver's driverStatus is 'isTeerCarDriver'
           - the driver is added to $scope.drivers, if they were not there already
           - the driver's numSeatbelts is set to the teerCar's numSeatbelts, if they have that many seatbelts
           - the driver's assignedToSite & assignedToProject are set to the teerCar's
           - if the driver already had a site or project assignment, they were spliced from the appropriate xWithPersons array
           - the driver has been pushed to the appropriate xWithPersons array
           - if the driver has pasengers:
              - set their assignedToSite and assignedToProject
              - if necessary, splice them from the xWithPersons array corresponding to their current assignment
              - push them to the xWithPersons array corresponding to their new assignment
          - if the driver is a passenger in someone else's car, they have been spliced from that driver's passengers arr

   */
  $scope.assignTeerCarDriver = function (teerCarId, assignedToSite) {
    assignTeerCarDriver(assignedToSite, $scope).then(function (selectedDriverId) {
      $log.log("assignTeerCarDriver resolved with driver: " + selectedDriverId)

      if ($scope.persons[selectedDriverId].numSeatbelts != 0 && (parseInt($scope.persons[selectedDriverId].numSeatbelts) < parseInt($scope.teerCars[teerCarId].assignedNumPassengers))) {
        $log.log("Going to show the confirm dialog!")

        var confirmPromise = $mdDialog.show({
          templateUrl: 'app/views/modals/notEnoughSeatbelts.html',
          parent: angular.element(document.body),
          clickOutsideToClose:true,
          locals: {
            myTeerCarId: teerCarId,
            mySelectedDriverId: selectedDriverId,
            myPersons: $scope.persons,
            myDrivers: $scope.drivers,
            myTeerCars: $scope.teerCars
          },
          controller: ['$scope', 'myTeerCarId', 'mySelectedDriverId', 'myPersons', 'myDrivers', 'myTeerCars', function($scope, myTeerCarId, mySelectedDriverId, myPersons, myDrivers, myTeerCars) {
            $scope.teerCarId = myTeerCarId
            $scope.selectedDriverId = mySelectedDriverId
            $scope.persons = myPersons
            $scope.drivers = myDrivers
            $scope.teerCars = myTeerCars

            $scope.assignAnyway = function() {
              $mdDialog.hide()
            }

            $scope.cancel = function() {
              $mdDialog.cancel()
            }

            $scope.hasEnoughSeatbelts = function () {
              $mdDialog.hide('hasEnoughSeatbelts')
            }
          }]
        })
      }
      else {
        var confirm = $q.defer()
        var confirmPromise = confirm.promise
        confirm.resolve()
      }

      confirmPromise.then(function(seatbeltsMessage) {

        // update selectedDriverId's info in scope.persons and scope.drivers
        var paramsToPass = {
          'driverStatus': 'isTeerCarDriver',
          'site': assignedToSite,
          'project': $scope.projectSites[assignedToSite].project,
          'numSeatbeltsToday': (seatbeltsMessage == 'hasEnoughSeatbelts') ? $scope.teerCars[teerCarId].assignedNumPassengers : null,
          'assignedToDriver': 'NULL'
        }
        updateCheckedIn(selectedDriverId, paramsToPass).then(function success() {
          // if this person has already been assigned to a site, remove them from that site's array
          if ($scope.persons[selectedDriverId].assignedToSite_id != null && $scope.persons[selectedDriverId].assignedToSite_id != '') {
            var index = $scope.projectSitesWithPersons[$scope.persons[selectedDriverId].assignedToSite_id].indexOf(selectedDriverId)
            if (index > -1) {
              $scope.projectSitesWithPersons[$scope.persons[selectedDriverId].assignedToSite_id].splice(index, 1)
            }
          }
          else if ($scope.persons[selectedDriverId].assignedToProject != null && $scope.persons[selectedDriverId].assignedToProject != '') {
            var index = $scope.projectsWithPersons[$scope.persons[selectedDriverId].assignedToProject].indexOf(selectedDriverId)
            if (index > -1) {
              $scope.projectsWithPersons[$scope.persons[selectedDriverId].assignedToProject].splice(index, 1)
            }
          }

          // update on the scope the values we just updated on the server
          $scope.persons[selectedDriverId].driverStatus = 'isTeerCarDriver'
          $scope.persons[selectedDriverId].assignedToSite_id = assignedToSite
          $scope.persons[selectedDriverId].assignedToProject = $scope.projectSites[assignedToSite].assignedToProject
          if (seatbeltsMessage == 'hasEnoughSeatbelts') {
            $scope.persons[selectedDriverId].numSeatbeltsToday = parseInt($scope.teerCars[teerCarId].assignedNumPassengers)
          }

          // push to appropriate xWithPersons arrays
          if ($scope.persons[selectedDriverId].assignedToSite_id != null && $scope.persons[selectedDriverId].assignedToSite_id) {
            if ($scope.projectSitesWithPersons[assignedToSite]) {
              $scope.projectSitesWithPersons[assignedToSite].push(selectedDriverId)
            }
          }
          else if ($scope.projectsWithPersons[$scope.selectedDriverId.assignedToProject]) {
            $scope.projectsWithPersons[$scope.selectedDriverId.assignedToProject].push(selectedDriverId)
          }

          // if this person is already a driver
          if ($scope.drivers[selectedDriverId]) {
            // set num seatbelts if necessary
            if (seatbeltsMessage == 'hasEnoughSeatbelts') {
              $scope.drivers[selectedDriverId].numSeatbelts = $scope.teerCars[teerCarId].assignedNumPassengers
            }

            // assign their passengers to the proper site
            if ($scope.drivers[selectedDriverId].passengers && $scope.drivers[selectedDriverId].passengers.length > 0) {
              if (seatbeltsMessage == 'hasEnoughSeatbelts') {
                $scope.drivers[selectedDriverId].numSeatbelts = $scope.drivers[selectedDriverId]
              }

              angular.forEach($scope.drivers[selectedDriverId].passengers, function(passengerId) {
                var paramsToPass = {
                  'site': assignedToSite,
                  'project': $scope.projectSites[assignedToSite].project,
                  'assignedToDriver': selectedDriverId
                }
                updateCheckedIn(passengerId, paramsToPass).then(function success () {
                  if ($scope.persons[passengerId].assignedToSite_id != null && $scope.persons[passengerId].assignedToSite_id != '') {
                    var index = $scope.projectSitesWithPersons[$scope.persons[passengerId].assignedToSite_id].indexOf(passengerId)
                    if (index > -1) {
                      $scope.projectSitesWithPersons[$scope.persons[passengerId].assignedToSite_id].splice(index, 1)
                    }
                  }
                  else if ($scope.persons[passengerId].assignedToProject != null && $scope.persons[passengerId].assignedToProject != '' && $scope.projectsWithPersons[$scope.persons[passengerId].assignedToProject]) {
                    var index = $scope.projectSitesWithPersons[$scope.persons[passengerId].assignedToSite_id].indexOf(passengerId)
                    if (index > -1) {
                      $scope.projectSitesWithPersons[$scope.persons[passengerId].assignedToSite_id].splice(index, 1)
                    }
                  }

                  $scope.persons[passengerId].assignedToSite_id = assignedToSite
                  $scope.projectSitesWithPersons[assignedToSite].push(passengerId)
                })
              })
            }
          }
          else { // if this person is not yet a driver
            // if this person is a passenger in someone else's car, splice them from that driver's passengers arr, and set assignedToDriver_id=null
            if ($scope.persons[selectedDriverId].assignedToDriver_id != null && $scope.persons[selectedDriverId].assignedToDriver_id != '') {
              if ($scope.drivers[$scope.persons[selectedDriverId].assignedToDriver_id]) {
                var index = $scope.drivers[$scope.persons[selectedDriverId].assignedToDriver_id].passengers.indexOf(selectedDriverId)
                $scope.drivers[$scope.persons[selectedDriverId].assignedToDriver_id].passengers.splice(index, 1)
              }
              $scope.persons[selectedDriverId].assignedToDriver_id = null
            }

            $scope.drivers[selectedDriverId] = {
              "numSeatbelts": $scope.persons[selectedDriverId].numSeatbeltsToday,
              "passengers": [],
              "carMake": $scope.persons[selectedDriverId].carMake,
            }
          }

          // update this teerCar's info
          var paramsToPass = {
            'driver_person_id': selectedDriverId,
            'assignedNumPassengers': $scope.persons[selectedDriverId].numSeatbeltsToday
          }

          updateActiveTeerCar(teerCarId, paramsToPass).then(function success () {
            $scope.teerCars[teerCarId].driver_person_id = selectedDriverId
            $log.log("updateActiveTeerCar resolved!")
          })
        })
      }, function cancelAssignment() {
        $log.log("Assignment cancelled.")
      })
    })
  }

  /*
   * assignVanDriver(vanId, assignedToSite)
   * Calls for a modal dialog of available drivers, asks the user to select one, and runs the corresponding logic
   * Pre: - vanId is an active van, assigned to this carpool site
          - the selected driver is a crew member
          - the selected driver is checked in
          - warn user if:
              - the selectedDriver is a teerCar driver
              - the selected driver is a passenger in someone else's car
   * Post: - the driver is checked in
           - the driver's driverStatus is 'isVanDriver'
           - the driver is added to $scope.drivers, if they were not there already
           - the driver's numSeatbelts is set to the van's numSeatbelts
           - the driver's assignedToSite & assignedToProject are set to the van's
           - if the driver already had a site or project assignment, they were spliced from the appropriate xWithPersons array
           - the driver has been pushed to the appropriate xWithPersons array
           - if the driver has pasengers:
              - set their assignedToSite and assignedToProject
              - if necessary, splice them from the xWithPersons array corresponding to their current assignment
              - push them to the xWithPersons array corresponding to their new assignment
          - if the driver is a passenger in someone else's car, they have been spliced from that driver's passengers arr
   */
  $scope.assignVanDriver = function (vanId, assignedToSite) {
    // assignTeerCarDriver modal works for vans too
    assignTeerCarDriver(assignedToSite, $scope, true).then(function (selectedDriverId) {
      $log.log("assignVanDriver resolved with driver: " + selectedDriverId)
      // update selectedDriverId's info in scope.persons and scope.drivers
      var paramsToPass = {
        'driverStatus': 'isVanDriver',
        'site': assignedToSite,
        'project': ($scope.projectSites[assignedToSite]) ? $scope.projectSites[assignedToSite].project : '',
        'assignedToDriver': null,
        'numSeatbeltsToday': $scope.vans[vanId].numSeatbelts
      }
      updateCheckedIn(selectedDriverId, paramsToPass).then(function success() {
        // if this person has already been assigned to a site, remove them from that site's array
        if ($scope.persons[selectedDriverId].assignedToSite_id != null && $scope.persons[selectedDriverId].assignedToSite_id != '') {
          var index = $scope.projectSitesWithPersons[$scope.persons[selectedDriverId].assignedToSite_id].indexOf(selectedDriverId)
          if (index > -1) {
            $scope.projectSitesWithPersons[$scope.persons[selectedDriverId].assignedToSite_id].splice(index, 1)
          }
        }
        else if ($scope.persons[selectedDriverId].assignedToProject != null && $scope.persons[selectedDriverId].assignedToProject != '') {
            var index = $scope.projectsWithPersons[$scope.persons[selectedDriverId].assignedToProject].indexOf(selectedDriverId)
            if (index > -1) {
              $scope.projectsWithPersons[$scope.persons[selectedDriverId].assignedToProject].splice(index, 1)
            }
          }

        $scope.persons[selectedDriverId].driverStatus = 'isVanDriver'
        $scope.persons[selectedDriverId].assignedToSite_id = assignedToSite
        $scope.persons[selectedDriverId].assignedToProject = $scope.projectSites[assignedToSite].assignedToProject

        // push to appropriate xWithPersons arrays
        if ($scope.persons[selectedDriverId].assignedToSite_id != null && $scope.persons[selectedDriverId].assignedToSite_id) {
          if ($scope.projectSitesWithPersons[assignedToSite]) {
            $scope.projectSitesWithPersons[assignedToSite].push(selectedDriverId)
          }
        }
        else if ($scope.projectsWithPersons[$scope.selectedDriverId.assignedToProject]) {
          $scope.projectsWithPersons[$scope.selectedDriverId.assignedToProject].push(selectedDriverId)
        }

      // if this person is already a driver
      if ($scope.drivers[selectedDriverId]) {
        // assign them the van's numSeatbelts
        $scope.drivers[selectedDriverId].numSeatbelts = $scope.vans[vanId].numSeatbelts

        // assign their passengers to the proper site
        if ($scope.drivers[selectedDriverId].passengers && $scope.drivers[selectedDriverId].passengers.length > 0) {
          angular.forEach($scope.drivers[selectedDriverId].passengers, function(passengerId) {
            var paramsToPass = {
              'site': assignedToSite,
              'project': $scope.projectSites[assignedToSite].project,
              'assignedToDriver': selectedDriverId
            }
            updateCheckedIn(passengerId, paramsToPass).then(function success () {
              if ($scope.persons[passengerId].assignedToSite_id != null && $scope.persons[passengerId].assignedToSite_id != '') {
                var index = $scope.projectSitesWithPersons[$scope.persons[passengerId].assignedToSite_id].indexOf(passengerId)
                if (index > -1) {
                  $scope.projectSitesWithPersons[$scope.persons[passengerId].assignedToSite_id].splice(index, 1)
                }
              }
              else if ($scope.persons[passengerId].assignedToProject != null && $scope.persons[passengerId].assignedToProject != '' && $scope.projectsWithPersons[$scope.persons[passengerId].assignedToProject]) {
                var index = $scope.projectSitesWithPersons[$scope.persons[passengerId].assignedToSite_id].indexOf(passengerId)
                if (index > -1) {
                  $scope.projectSitesWithPersons[$scope.persons[passengerId].assignedToSite_id].splice(index, 1)
                }
              }

              $scope.persons[passengerId].assignedToSite_id = assignedToSite
              $scope.projectSitesWithPersons[assignedToSite].push(passengerId)
            })


          })
        }
      }
      else {
        // if this person is a passenger in someone else's car, splice them from that driver's passengers arr, and set assignedToDriver_id=null
        if ($scope.persons[selectedDriverId].assignedToDriver_id != null && $scope.persons[selectedDriverId].assignedToDriver_id != '') {
          if ($scope.drivers[$scope.persons[selectedDriverId].assignedToDriver_id]) {
            var index = $scope.drivers[$scope.persons[selectedDriverId].assignedToDriver_id].passengers.indexOf(selectedDriverId)
            $scope.drivers[$scope.persons[selectedDriverId].assignedToDriver_id].passengers.splice(index, 1)
          }
          $scope.persons[selectedDriverId].assignedToDriver_id = null
        }

        $scope.drivers[selectedDriverId] = {
          "numSeatbelts": $scope.vans[vanId].numSeatbelts,
          "passengers": [],
          "carMake": $scope.persons[selectedDriverId].carMake,
        }
      }

      // update this teerCar's info
      updateVan(vanId, {'driver_person_id': selectedDriverId}).then(function success () {
        $scope.vans[vanId].driver_person_id = selectedDriverId
      })
    })
  })
}

$scope.regInfoEdit = function (personId) {
  editRegInfo(personId, $scope).then(function resolved () {
    $log.log("editRegInfo resolved")
  }, function cancelled () {
    $log.log("editRegInfo rejected")
  })
}

$scope.getVanDrivenBy = function (driver) {
  $log.log("Driver: " + driver)
  $log.log("Vans: " + dump($scope.vans, 'none'))
  var keys = Object.keys($scope.vans)
  $log.log("Keys: " + dump(keys, 'none'))
  var vanId = null
  for (var i=0; i < keys.length; i++) {
    $log.log("i: " + i + "; parseInt(keys[i]): " + parseInt(keys[i]))
    if ($scope.vans[parseInt(keys[i])].driver_person_id == driver) {
      vanId = $scope.vans[keys[i]].van_id
      break
    }
  }
  return vanId
}

$scope.getTeerCarDrivenBy = function (driver) {
  $log.log("Driver: " + driver)
  var keys = Object.keys($scope.teerCars)
  var teerCarId = null
  for (var i=0; i < keys.length; i++) {
    if ($scope.teerCars[keys[i]].driver_person_id == driver) {
      teerCarId = $scope.teerCars[keys[i]].teerCar_id
      break
    }
  }
  return teerCarId
}
}])
