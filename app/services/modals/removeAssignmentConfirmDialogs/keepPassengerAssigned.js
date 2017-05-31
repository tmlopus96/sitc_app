app.factory('keepPassengerAssigned', ['$mdDialog', '$log', '$q', function($mdDialog, $log, $q) {

  return function(myPassengerId, $scope) {
    return $mdDialog.show({
      templateUrl: 'app/modalTemplates/removeAssignmentConfirmDialogs/keepPassengerAssigned.html',
      controller: 'KeepPassengerAssignedController',
      scope: $scope,
      preserveScope: true,
      locals: {
        passengerId: myPassengerId
      },
      clickOutsideToClose: true,
      parent: angular.element(document.body)
    })

  }
}])

app.controller('KeepPassengerAssignedController', ['$scope', '$log', '$mdDialog', 'passengerId', function($scope, $log, $mdDialog, passengerId) {

  $scope.passengerId = passengerId

  $scope.changeAssignment = function () {
    $mdDialog.hide('changeAssignment')
  }

  $scope.doNotChangeAssignment = function() {
    $mdDialog.hide('doNotChangeAssignment')
  }

  $scope.cancel = function() {
    $mdDialog.cancel()
  }

}])
