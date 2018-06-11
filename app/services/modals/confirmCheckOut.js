app.factory('confirmCheckOut', ['$mdDialog', '$log', '$q', function($mdDialog, $log, $q) {

  return function(myPassengerId, $scope) {
    return $mdDialog.show({
      templateUrl: 'app/modalTemplates/confirmCheckOut.html',
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

app.controller('ConfirmCheckOutController', ['$scope', '$log', '$mdDialog', 'passengerId', function($scope, $log, $mdDialog, passengerId) {

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
