/*
 * CheckedInController
 * Controls the CheckedIn app tab
 */
app.controller('CheckedInController', ['$scope', '$state', '$log', '$q', '$mdToast', '$mdDialog', '$location', '$anchorScroll', 'sitePickerGenerator', 'updateCheckedIn', 'driverStatus', 'driverPickerGenerator', 'assignToDriver', 'driverControlPanelGenerator', 'getRegistered', 'getTempRegistrations', 'assignTeerCarDriver', 'updateActiveTeerCar', 'updateVan', function($scope, $state, $log, $q, $mdToast, $mdDialog, $location, $anchorScroll, sitePickerGenerator, updateCheckedIn, driverStatus, driverPickerGenerator, assignToDriver, driverControlPanelGenerator, getRegistered, getTempRegistrations, assignTeerCarDriver, updateActiveTeerCar, updateVan) {

  function hideSpeedDialButtons(){
      var speedDialButton_first = angular.element(document.querySelectorAll('#speedDialActionButton_first')).parent()
      var speedDialButton_second = angular.element(document.querySelectorAll('#speedDialActionButton_second')).parent()
      var speedDialButton_third = angular.element(document.querySelectorAll('#speedDialActionButton_third')).parent()

      speedDialButton_first.css({'transform':'translate(52px)', 'z-index':'-21'})
      speedDialButton_second.css({'transform':'translate(104px)', 'z-index':'-22'})
      speedDialButton_third.css({'transform':'translate(156px)', 'z-index':'-23'})
    }

  $scope.$on('$stateChangeSuccess', function(event, toState) {
    $log.log('stateChangeSuccess func ran! with toState ' + toState.name)

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
          $scope.persons[personId].assignedToProject = selectedProject
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
      updateCheckedIn(personId, valuesToUpdate).then(function(response) {$log.log("updateCheckedIn response: " + dump(response, 'none'))})
      var personIndex = $scope.projectsWithPersons[arrayLoc].indexOf(personId)
      $scope.projectsWithPersons[arrayLoc].splice(personIndex, 1)
    })
  }

  // Driver business
  $scope.updateDriverStatus = function(personId) {
    // person.drierStatus controlled by switch in checkedIn and assigned directives
    // TODO add a warning about how toggling a driver off will remove their passengers (added Trello card)
    $log.log('calling driverStatus on person ' + personId + 'with isDriver')
    var newStatus = $scope.persons[personId].driverStatus
    // update status on server, then update $scope arrays
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
    // array of active drivers to pass to driverPickerGenerator (because it cannot access the CheckedInController's scope)
    var activeDrivers = new Array()
    for (var id in $scope.persons) {
      if ($scope.persons[id].hasOwnProperty("driverStatus")) {
        if ($scope.persons[id].driverStatus == "isDriver" || $scope.persons[id].driverStatus == "isVanDriver" || $scope.persons[id].driverStatus == "isTeerCarDriver") {
          var projectSite = ($scope.persons[id].assignedToSite_id != null) ? $scope.persons[id].assignedToSite_id : null
          $log.log('this driver is assigned to site ' + projectSite)
          var projectSiteName = ($scope.projectSites[projectSite] != null) ? $scope.projectSites[projectSite].name : ''
          activeDrivers.push({"id":id, "name":$scope.persons[id].firstName + ' ' + $scope.persons[id].lastName, "project":$scope.persons[id].assignedToProject, "site":projectSiteName})
        }
      }
    }

    var driverPromise = driverPickerGenerator(activeDrivers)
    driverPromise.then(function(selectedDriver) {
      // if selectedDriver=='', person is being unassigned, so save driver they are being unassigned from for toast message later
      if (selectedDriver == '') {
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

  $scope.teerCarControlPanel = function(driver, teerCarId = null) {
    driverControlPanelGenerator(driver, $scope, teerCarId).then(function furtherActionRequired(action) {

      switch (action) {
        case 'removeDriver':
          removeDriver(driver, teerCarId)
          break
      }

      function removeDriver(driver, teerCarId) {
        var confirm = $mdDialog.confirm()
                .title(`What should we do with ${$scope.persons[driver].firstName}'s passengers?`)
                .textContent(`We can either keep them assigned as passengers to ${$scope.persons[driver].firstName}, or completely un-assign them and assign them to a new driver.`)
                .ok(`Keep them assigned to ${$scope.persons[driver].firstName}`)
                .cancel('Un-assign them')

        $mdDialog.show(confirm).then(function keep() {

        }, function unassign() {
          $log.log("We'll unassign the passengers")
          // driver status
          $scope.persons[driver].driverStatus = null

          // set passengers' assignedToDriver to null
          angular.forEach($scope.drivers[driver].passengers, function(passenger) {
            updateCheckedIn(passenger, {'assignedToDriver':$scope.persons[passenger].assignedToDrassignedToDriver_id}).then(function () {
              $scope.persons[passenger].assignedToDriver_id = null
            })
          })

          // splice driver from $scope[drivers]
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

  $scope.vanControlPanel = function(driver, vanId = null) {
    driverControlPanelGenerator(driver, $scope, null, vanId).then(function success() {

      $log.log("We'll unassign the passengers")
      // driver status
      $scope.persons[driver].driverStatus = null

      // set passengers' assignedToDriver to null
      angular.forEach($scope.drivers[driver].passengers, function(passenger) {
        updateCheckedIn(passenger, {'assignedToDriver':$scope.persons[passenger].assignedToDrassignedToDriver_id}).then(function () {
          $scope.persons[passenger].assignedToDriver_id = null
        })
      })

      // splice driver from $scope[drivers]
      delete $scope.drivers[driver]

      // set teerCar's driver to null
      updateVan(vanId, {'driver_person_id': 'NULL'}).then(function() {
        $scope.vans[vanId].driver_person_id = null
      })
    })
  }

  $scope.assignTeerCarDriver = function (teerCarId, assignedToSite) {
    assignTeerCarDriver(assignedToSite, $scope).then(function (selectedDriverId) {
      $log.log("assignTeerCarDriver resolved with driver: " + selectedDriverId)
      // update selectedDriverId's info in scope.persons and scope.drivers
      var paramsToPass = {
        'driverStatus': 'isTeerCarDriver',
        'site': assignedToSite,
        'project': $scope.projectSites[assignedToSite].project
      }
      updateCheckedIn(selectedDriverId, paramsToPass).then(function success() {
        // if this person has already been assigned to a site, remove them from that site's array
        if ($scope.persons[selectedDriverId].assignedToSite_id != null && $scope.persons[selectedDriverId].assignedToSite_id != '') {
          var index = $scope.projectSitesWithPersons[$scope.persons[selectedDriverId].assignedToSite_id].indexOf(selectedDriverId)
          if (index > -1) {
            $scope.projectSitesWithPersons[$scope.persons[selectedDriverId].assignedToSite_id].splice(index, 1)
          }
        }

        $scope.persons[selectedDriverId].driverStatus = 'isDriver'
        $scope.persons[selectedDriverId].assignedToSite_id = assignedToSite
        $scope.projectSitesWithPersons[assignedToSite].push(selectedDriverId)
      })
      if ($scope.drivers[selectedDriverId]) {
        // this driver is already a driver; assign their passengers to the proper site
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
              $scope.persons[passengerId].assignedToSite_id = assignedToSite
              $scope.projectSitesWithPersons[assignedToSite].push(passengerId)
            })


          })
        }
      }
      else {
        $scope.drivers[selectedDriverId] = {
          "numSeatbelts": $scope.persons[selectedDriverId].numSeatbelts,
          "passengers": [],
          "carMake": $scope.persons[selectedDriverId].carMake,
        }
      }

      // update this teerCar's info
      updateActiveTeerCar(teerCarId, {'driver_person_id': selectedDriverId}).then(function success () {
        $scope.teerCars[teerCarId].driver_person_id = selectedDriverId
      })
    })
  }

  $scope.assignVanDriver = function (vanId, assignedToSite) {
    // assignTeerCarDriver modal works for vans too
    assignTeerCarDriver(assignedToSite, $scope, true).then(function (selectedDriverId) {
      $log.log("assignVanDriver resolved with driver: " + selectedDriverId)
      // update selectedDriverId's info in scope.persons and scope.drivers
      var paramsToPass = {
        'driverStatus': 'isVanDriver',
        'site': assignedToSite,
        'project': $scope.projectSites[assignedToSite].project
      }
      updateCheckedIn(selectedDriverId, paramsToPass).then(function success() {
        // if this person has already been assigned to a site, remove them from that site's array
        if ($scope.persons[selectedDriverId].assignedToSite_id != null && $scope.persons[selectedDriverId].assignedToSite_id != '') {
          var index = $scope.projectSitesWithPersons[$scope.persons[selectedDriverId].assignedToSite_id].indexOf(selectedDriverId)
          if (index > -1) {
            $scope.projectSitesWithPersons[$scope.persons[selectedDriverId].assignedToSite_id].splice(index, 1)
          }
        }

        $scope.persons[selectedDriverId].driverStatus = 'isVanDriver'
        $scope.persons[selectedDriverId].assignedToSite_id = assignedToSite
        $scope.projectSitesWithPersons[assignedToSite].push(selectedDriverId)
      })
      if ($scope.drivers[selectedDriverId]) {
        // this driver is already a driver; assign their passengers to the proper site
        $scope.drivers[selectedDriverId].numSeatbelts = $scope.vans[vanId].numSeatbelts

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
              $scope.persons[passengerId].assignedToSite_id = assignedToSite
              $scope.projectSitesWithPersons[assignedToSite].push(passengerId)
            })


          })
        }
      }
      else {
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
  }

  // $scope.teerCarControlPanel = function(teerCar) {
  //   volunteerCarControlPanel(teerCar, $scope)
  // }
}])
