
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
      }]
    })
  }
}])
