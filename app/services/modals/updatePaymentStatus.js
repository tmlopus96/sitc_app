app.factory('updatePaymentStatusModal', ['$q', '$log', '$mdDialog', '$mdToast', function($q, $log, $mdDialog, $mdToast) {

  return function (myPersonId, $scope) {
    return $mdDialog.show({
      templateUrl: "app/modalTemplates/updatePaymentStatusModal.html",
      scope: $scope,
      preserveScope: true,
      clickOutsideToClose: true,
      parent: angular.element(document.body),
      controller: 'UpdatePaymentStatusController',
      locals: {
        personId: myPersonId
      }
    })
  }
}])

app.controller('UpdatePaymentStatusController', ['$scope', '$log', '$mdDialog', '$mdToast', 'personId', 'updatePersonRegInfo', function($scope, $log, $mdDialog, $mdToast, personId, updatePersonRegInfo) {

  $scope.personId = personId

  // set defaults
  $scope.hasPaid = false
  $scope.amountPaid = 40

  $scope.personsCopy = $scope.$parent.persons

  $scope.okay = function () {
    var params = {
      hasPaid: $scope.hasPaid,
      amountPaid: $scope.amountPaid,
      checkNumber: $scope.checkNumber
    }
    $mdDialog.hide(params)
  }

  $scope.cancel = function() {
    $mdDialog.cancel()
  }

}])
