
app.factory('volunteerCarControlPanel', ['$q', '$log', '$mdDialog', '$mdToast', 'assignToDriver', function($q, $log, $mdDialog, $mdToast, assignToDriver) {

  return function(myTeerCar, $scope) {

    $log.log('ran volunteerCarControlPanel!')

    return $mdDialog.show({
      templateUrl: "app/modalTemplates/volunteerCarControlPanelTemplate.html",
      scope: $scope,
      preserveScope: true,
      parent: angular.element(document.body),
      clickOutsideToClose: true,
      locals: { teerCar: myTeerCar },
      controller: ['scope', 'teerCar', function(scope, teerCar) {
        $log.log('teerCar for control panel is' + $scope.teerCars[teerCar].assignedToSite)

        // create objects representing teerCar on the scope of this modal
        $scope.teerCar = teerCar
        $scope.myPassengers = []

        if ($scope.teerCars[teerCar].passengers) {
          $log.log('passengers alledgedly is defined')
          // push each of teerCar's passengers into array myPassengers on scope of this modal
          $scope.teerCars[teerCar].passengers.forEach(function(currentPassenger) {
            $scope.myPassengers.push(currentPassenger)
          })
          var emptySeats = $scope.teerCars[teerCar].assignedNumPassengers - $scope.teerCars[teerCar].passengers.length
        } else {
          $log.log('else ran')
          var emptySeats = $scope.teerCars[teerCar].assignedNumPassengers
        }

        // for each empty seat, push an empty array element to myPassengers so that empty rows will appear in modal, signifying the open seats to the user
        for (var i=0; i < emptySeats; i++) {
          $scope.myPassengers.push('')
        }
      //
      //   /*
      //    * updateDriverStatus
      //    * Update the status of a teerCar when their switch is toggled
      //    * Pre: personId is a valid person who is a teerCar
      //    * Post: If toggling teerCar to active, teerCar's status is now active; if toggling to inactive, teerCar's status is inactive, teerCar is deleted from $scope.teerCars, and each of teerCar's passengers is update to have no teerCar
      //    */
      //   $scope.updateDriverStatus = function(personId) {
      //     // person.teerCarStatus controlled by switch in checkedIn and assigned directives
      //     $log.log('calling teerCarStatus on person ' + personId + 'with isDriver')
      //     var newStatus = $scope.persons[personId].teerCarStatus
      //     var teerCarPromise = teerCarStatus(personId, newStatus)
      //     teerCarPromise.then(function() {
      //       var teerCarName = $scope.persons[personId].firstName
      //       if (newStatus == 'isDriver') {
      //         $scope.teerCars[personId] = {
      //           "numSeatbelts": $scope.persons[personId].numSeatbelts,
      //           "passengers": [],
      //           "carMake": $scope.persons[personId].carMake,
      //         }
      //         var message = "Added Driver: "
      //       } else {
      //         if ($scope.teerCars.hasOwnProperty(personId)) {
      //           $scope.teerCars[personId].passengers.forEach(function(currentPassenger) {
      //             // set each passenger's teerCar to null on the server and the scope
      //             assignToDriver(currentPassenger, '')
      //             $scope.persons[currentPassenger].assignedToDriver_id = null
      //           })
      //           delete $scope.teerCars[personId]
      //         }
      //         var message = "Removed Driver: "
      //       }
      //       $scope.closeDialog()
      //       $mdToast.showSimple(message + teerCarName)
      //     })
      //   }
      //
      //   /*
      //    * removePassenger
      //    * Remove specified passenger from this teerCar when X is clicked in their teerCar control panel
      //    * Pre: passengerId is a person who is currently assigned to this teerCar
      //    * Post: passengerId's teerCar is set to null, on both the server and the scope, and they are spliced from this teerCar's passengers
      //    */
      //   $scope.removePassenger = function(passengerId) {
      //     // on server
      //     assignToDriver(passengerId, '')
      //     // on scope
      //     $scope.persons[passengerId].assignedToDriver_id = null
      //     var index = $scope.teerCars[$scope.teerCar].passengers.indexOf(passengerId)
      //     $scope.teerCars[$scope.teerCar].passengers.splice(index, 1)
      //     $scope.myPassengers.splice(index, 1)
      //   }
      //
      //   $scope.closeDialog = function() {
      //     $mdDialog.hide()
      //   }
      }]
    })
  }
}])
