app.factory('passengersOfDriver', ['$mdDialog', '$log', '$q', function($mdDialog, $log, $q) {

  return function(myDriverId, myDriverIsCheckingOut, $scope) {
    return $mdDialog.show({
      templateUrl: 'app/modalTemplates/removeAssignmentConfirmDialogs/passengersOfDriver.html',
      controller: 'PassengersOfDriverController',
      scope: $scope,
      preserveScope: true,
      locals: {
        driverId: myDriverId,
        driverIsCheckingOut: myDriverIsCheckingOut
      },
      clickOutsideToClose: true,
      parent: angular.element(document.body)
    })

  }
}])

app.controller('PassengersOfDriverController', ['$scope', '$log', '$mdDialog', 'driverId', 'driverIsCheckingOut', function($scope, $log, $mdDialog, driverId, driverIsCheckingOut) {

  $scope.driverId = driverId
  $scope.driverIsCheckingOut = driverIsCheckingOut

  $scope.changePassengers = function () {
    $mdDialog.hide('changePassengers')
  }

  $scope.doNotChangePassengers = function() {
    $mdDialog.hide('doNotChangePassengers')
  }

  $scope.cancel = function() {
    $mdDialog.cancel()
  }

}])
